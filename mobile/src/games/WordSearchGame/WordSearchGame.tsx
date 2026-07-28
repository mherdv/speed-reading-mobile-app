import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { updateProgress, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { formatDuration } from '../../domain/results';
import {
  createVariedSequence,
  getFlashWordPool,
  uniqueStrings,
} from '../../data/flashPracticeContent';
import { WORD_PAIRS } from '../../data/vocabulary';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';

const GAME_ID = 'WordSearchGame';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

const INITIAL_WORD = 'READ';

type Direction = readonly [rowDelta: number, columnDelta: number];

const FORWARD_DIRECTIONS: readonly Direction[] = [
  [0, 1],
  [1, 0],
];
const ORTHOGONAL_DIRECTIONS: readonly Direction[] = [
  ...FORWARD_DIRECTIONS,
  [0, -1],
  [-1, 0],
];
const ALL_DIRECTIONS: readonly Direction[] = [
  ...ORTHOGONAL_DIRECTIONS,
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 4, durationMs: 90000, directions: FORWARD_DIRECTIONS };
    case 'medium':
      return { gridSize: 5, durationMs: 60000, directions: ORTHOGONAL_DIRECTIONS };
    case 'hard':
      return { gridSize: 6, durationMs: 45000, directions: ALL_DIRECTIONS };
  }
}

export function getWordSearchPool(difficulty: Difficulty): string[] {
  const gridSize = getDifficultyConfig(difficulty).gridSize;
  const levels: Difficulty[] =
    difficulty === 'easy'
      ? ['easy']
      : difficulty === 'medium'
        ? ['easy', 'medium']
        : ['medium', 'hard'];
  const reviewedPairWords = WORD_PAIRS.slice(
    0,
    difficulty === 'easy' ? 40 : difficulty === 'medium' ? 80 : undefined
  ).flat();
  return uniqueStrings(
    [
      ...reviewedPairWords,
      ...levels.flatMap((level) => getFlashWordPool(level)),
    ]
  )
    .filter(
      (word) =>
        /^[a-z]+$/i.test(word) &&
        word.length >= 4 &&
        word.length <= gridSize
    )
    .map((word) => word.toLocaleUpperCase());
}

function randomLetter(): string {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

function buildGrid(
  size: number,
  word: string,
  directions: readonly Direction[]
): { grid: string[][]; wordPositions: string[] } {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => randomLetter())
  );

  const validPlacements: Array<{
    row: number;
    col: number;
    direction: Direction;
  }> = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      for (const direction of directions) {
        const [rowDelta, columnDelta] = direction;
        const endRow = row + rowDelta * (word.length - 1);
        const endCol = col + columnDelta * (word.length - 1);
        if (
          endRow >= 0 &&
          endRow < size &&
          endCol >= 0 &&
          endCol < size
        ) {
          validPlacements.push({ row, col, direction });
        }
      }
    }
  }

  const placement =
    validPlacements[Math.floor(Math.random() * validPlacements.length)];
  const [rowDelta, columnDelta] = placement.direction;
  const wordPositions: string[] = [];

  for (let i = 0; i < word.length; i++) {
    const row = placement.row + rowDelta * i;
    const col = placement.col + columnDelta * i;
    grid[row][col] = word[i];
    wordPositions.push(`${row}-${col}`);
  }

  return { grid, wordPositions };
}

export default function WordSearch({ 
  durationMs: durationMsProp, 
  difficulty = 'medium',
  autoStart = false,
  onReportResult 
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const [targetWord, setTargetWord] = useState(INITIAL_WORD);
  const [gridData, setGridData] = useState(() =>
    buildGrid(6, INITIAL_WORD, FORWARD_DIRECTIONS)
  );
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [wordsFound, setWordsFound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  const startedAtRef = useRef<number>(0);
  const wordsFoundRef = useRef(0);
  const correctTapsRef = useRef(0);
  const mistakesRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const wordDeckRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);
  const previousWordRef = useRef('');

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const gridSize = currentConfig.gridSize;
  const currentDurationMs = durationMsProp ?? currentConfig.durationMs;
  const availableWords = getWordSearchPool(selectedDifficulty);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    if (phase !== 'running') return;
    const endAt = startedAtRef.current + currentDurationMs;
    
    const interval = setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setTimeLeftMs(left);
      if (left <= 0) {
        clearInterval(interval);
        finish();
      }
    }, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [phase, currentDurationMs]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function takeNextWord(): string {
    if (wordIndexRef.current >= wordDeckRef.current.length) {
      wordDeckRef.current = createVariedSequence(
        availableWords,
        Math.max(availableWords.length, 40),
        previousWordRef.current
      );
      wordIndexRef.current = 0;
    }
    const word =
      wordDeckRef.current[wordIndexRef.current] ??
      availableWords[0] ??
      INITIAL_WORD;
    wordIndexRef.current += 1;
    previousWordRef.current = word;
    return word;
  }

  function start() {
    cancelledRef.current = false;
    reportedRef.current = false;
    wordsFoundRef.current = 0;
    correctTapsRef.current = 0;
    mistakesRef.current = 0;
    wordDeckRef.current = createVariedSequence(
      availableWords,
      Math.max(availableWords.length, 40),
      previousWordRef.current
    );
    wordIndexRef.current = 0;
    const word = takeNextWord();
    setTargetWord(word);
    setGridData(buildGrid(gridSize, word, currentConfig.directions));
    setSelectedCells(new Set());
    setWordsFound(0);
    setMistakes(0);
    setTimeLeftMs(currentDurationMs);
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    
    const now = Date.now();
    const elapsedMs = now - startedAtRef.current;
    const totalTaps = correctTapsRef.current + mistakesRef.current;
    const accuracy =
      totalTaps > 0 ? correctTapsRef.current / totalTaps : 0;
    const success = wordsFoundRef.current > 0 && accuracy >= 0.7;

    updateProgress(GAME_ID, success, wordsFoundRef.current).then(({ progress }) => {
      if (!cancelledRef.current) setGameProgress(progress);
    });
    
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: wordsFoundRef.current,
      accuracy,
      details: { 
        wordsFound: wordsFoundRef.current,
        correctTaps: correctTapsRef.current,
        mistakes: mistakesRef.current,
        difficulty: selectedDifficulty,
        gridSize,
        availableWordCount: availableWords.length,
      },
    });
    setPhase('ended');
  }

  function onCellPress(row: number, col: number) {
    if (phase !== 'running') return;
    
    const key = `${row}-${col}`;
    const expectedKey = gridData.wordPositions[selectedCells.size];

    if (key === expectedKey) {
      correctTapsRef.current += 1;
      const nextSelectedCells = new Set(selectedCells).add(key);

      if (nextSelectedCells.size === targetWord.length) {
        wordsFoundRef.current += 1;
        setWordsFound(wordsFoundRef.current);

        const word = takeNextWord();
        setTargetWord(word);
        setGridData(buildGrid(gridSize, word, currentConfig.directions));
        setSelectedCells(new Set());
      } else {
        setSelectedCells(nextSelectedCells);
      }
    } else {
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      setSelectedCells(new Set());
    }
  }

  const availableGridWidth = screenWidth - 24;
  const availableGridHeight = screenHeight - 360;
  const cellSize = Math.max(
    44,
    Math.floor(
      Math.min(
        (availableGridWidth - 8) / gridSize - 2,
        (availableGridHeight - 8) / gridSize - 2,
        48
      )
    )
  );
  const renderedGridSize = (cellSize + 2) * gridSize + 8;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Search</Text>
        <Text style={styles.subtitle}>
          Trace every letter in order · words may run in any direction
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          startLabel="Start word search"
          containerStyle={styles.idleContent}
        />
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'found',
                value: wordsFound,
                label: 'Words',
                testID: 'words-found-value',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: formatDuration(timeLeftMs),
                label: 'Left',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'errors',
                value: mistakes,
                label: 'Errors',
                containerStyle: styles.statBox,
                valueStyle: [
                  styles.statValue,
                  mistakes > 0 && styles.errorValue,
                ],
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Find and trace</Text>
            <Text testID="target-word" style={styles.targetWord}>
              {targetWord}
            </Text>
            <Text style={styles.targetProgress}>
              {selectedCells.size}/{targetWord.length} letters selected
            </Text>
          </View>

          <View style={styles.gridContainer}>
            <View
              testID="word-search-grid"
              style={[
                styles.grid,
                { width: renderedGridSize, height: renderedGridSize },
              ]}
            >
              {gridData.grid.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map((letter, colIdx) => {
                    const key = `${rowIdx}-${colIdx}`;
                    const isSelected = selectedCells.has(key);

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Row ${rowIdx + 1}, column ${colIdx + 1}, letter ${letter}`}
                        accessibilityState={{ selected: isSelected }}
                        key={key}
                        testID={`cell-${rowIdx}-${colIdx}`}
                        style={[
                          styles.cell,
                          { width: cellSize, height: cellSize },
                          isSelected && styles.cellSelected,
                        ]}
                        onPress={() => onCellPress(rowIdx, colIdx)}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            { fontSize: cellSize * 0.42 },
                            isSelected && styles.cellTextSelected,
                          ]}
                        >
                          {letter}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>⌕</Text>
          <Text style={styles.endTitle}>Search complete</Text>
          <Text style={styles.endScore}>
            {wordsFound} {wordsFound === 1 ? 'word' : 'words'}
          </Text>
          <Text style={styles.endMeta}>
            {mistakes === 0
              ? 'No incorrect taps'
              : `${mistakes} incorrect ${mistakes === 1 ? 'tap' : 'taps'}`}
          </Text>
          <Text style={styles.endDifficulty}>
            Difficulty: {selectedDifficulty}
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            style={({ pressed }) => [
              styles.playAgainBtn,
              pressed && styles.pressed,
            ]}
            onPress={start}
          >
            <Text style={styles.playAgainText}>Play again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { marginBottom: spacing.sm },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  idleContent: { flex: 1 },
  gameArea: { flex: 1 },
  statsRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statBox: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceTonal,
  },
  statValue: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },
  errorValue: { color: colors.error },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  targetCard: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  targetLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  targetWord: {
    color: colors.primaryDark,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 2,
  },
  targetProgress: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  gridContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    justifyContent: 'center',
    padding: 4,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceTonal,
  },
  gridRow: { flexDirection: 'row', justifyContent: 'center' },
  cell: {
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  cellSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  cellText: { color: colors.textPrimary, fontWeight: '700' },
  cellTextSelected: { color: colors.white },
  endCard: {
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  endEmoji: { color: colors.primary, fontSize: 44, marginBottom: 4 },
  endTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  endScore: {
    color: colors.primaryDark,
    fontSize: 32,
    fontWeight: '800',
    marginVertical: spacing.sm,
  },
  endMeta: { color: colors.textSecondary, fontSize: 14 },
  endDifficulty: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  levelText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  starsText: { color: colors.starActive, fontSize: 16 },
  playAgainBtn: {
    minWidth: 160,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  playAgainText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
