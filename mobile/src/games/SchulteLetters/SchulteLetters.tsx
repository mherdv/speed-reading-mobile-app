import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { updateProgress, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { formatDuration } from '../../domain/results';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';
import { SchulteGridModeControl } from '../SchulteGridModeControl';
import {
  measuredElapsedMs,
  monotonicNowMs,
  reshuffleSchulteGrid,
  shuffleSchulteGrid,
  type SchulteClock,
  type SchulteGridMode,
} from '../schulteShared';

const GAME_ID = 'SchulteLetters';

const CELL_GAP = 4;
const GRID_PADDING = 4;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  gridSize?: number;
  defaultGridMode?: SchulteGridMode;
  random?: () => number;
  clock?: SchulteClock;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 3 };
    case 'medium':
      return { gridSize: 4 };
    case 'hard':
      return { gridSize: 5 };
  }
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function generateGrid(size: number, random: () => number): string[] {
  const total = size * size;
  const letters = LETTERS.slice(0, total);
  return shuffleSchulteGrid(letters, random);
}

export default function SchulteLetters({ 
  gridSize: gridSizeProp,
  defaultGridMode = 'stable',
  random = Math.random,
  clock = monotonicNowMs,
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
  const [grid, setGrid] = useState<string[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedGridMode, setSelectedGridMode] =
    useState<SchulteGridMode>(defaultGridMode);
  const [sessionGridMode, setSessionGridMode] =
    useState<SchulteGridMode>(defaultGridMode);

  const startedAtRef = useRef<number>(0);
  const startedAtIsoRef = useRef<string>('');
  const reshuffleCountRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  // Cleanup on unmount - prevent reporting results after back button
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const gridSize = Math.min(
    Math.floor(LETTERS.length ** 0.5),
    Math.max(2, Math.floor(gridSizeProp ?? currentConfig.gridSize))
  );
  const total = gridSize * gridSize;
  const sequence = LETTERS.slice(0, total);

  // Use dynamic dimensions for responsive layout
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Calculate available space for the grid dynamically
  const headerHeight = 50;
  const statsHeight = 60;
  const containerPadding = 24;
  const backButtonArea = 80;
  const availableHeight = screenHeight - headerHeight - statsHeight - containerPadding - backButtonArea;
  const availableWidth = screenWidth - containerPadding - 32;

  // Calculate cell size - ensure square cells that fit within available space
  const cellGap = CELL_GAP;
  const gridPadding = GRID_PADDING;
  const maxGridWidth = availableWidth - gridPadding * 2;
  const maxGridHeight = availableHeight - gridPadding * 2;
  const cellSize = Math.floor(Math.min(
    (maxGridWidth - cellGap * (gridSize - 1)) / gridSize,
    (maxGridHeight - cellGap * (gridSize - 1)) / gridSize
  ));
  const actualGridSize = cellSize * gridSize + cellGap * (gridSize - 1) + gridPadding * 2;

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start() {
    cancelledRef.current = false;
    reportedRef.current = false;
    setGrid(generateGrid(gridSize, random));
    setNextIndex(0);
    setMistakes(0);
    setTapped(new Set());
    setElapsedMs(0);
    setSessionGridMode(selectedGridMode);
    reshuffleCountRef.current = 0;
    startedAtRef.current = clock();
    startedAtIsoRef.current = new Date().toISOString();
    setPhase('running');
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    
    const completedElapsedMs = measuredElapsedMs(startedAtRef.current, clock);
    const finishedAtIso = new Date().toISOString();
    setElapsedMs(completedElapsedMs);
    const attempts = total + mistakes;
    const accuracy = attempts > 0 ? total / attempts : 1;
    const itemsPerMinute = Math.round(
      (total / Math.max(completedElapsedMs, 1)) * 60000 * accuracy
    );
    
    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(
      GAME_ID,
      success,
      itemsPerMinute,
      selectedDifficulty
    ).then(({ progress }) => {
      if (cancelledRef.current) return;
      setGameProgress(progress);
    });

    onReportResult?.({
      startedAtIso: startedAtIsoRef.current,
      finishedAtIso,
      elapsedMs: completedElapsedMs,
      score: itemsPerMinute,
      accuracy,
      details: {
        gridSize,
        mistakes,
        itemsPerMinute,
        timePenaltyMs: 0,
        gridMode: sessionGridMode,
        reshuffleCount: reshuffleCountRef.current,
        timingMethod: 'monotonic-elapsed',
        difficulty: selectedDifficulty,
      },
    });
    setPhase('ended');
  }

  function onTap(letter: string) {
    if (phase !== 'running') return;
    
    const expected = sequence[nextIndex];
    if (letter === expected) {
      setTapped(prev => new Set(prev).add(letter));
      if (nextIndex === total - 1) {
        finish();
      } else {
        if (sessionGridMode === 'reshuffle') {
          reshuffleCountRef.current += 1;
          setGrid((current) => reshuffleSchulteGrid(current, random));
        }
        setNextIndex(nextIndex + 1);
      }
    } else {
      setMistakes(m => m + 1);
    }
  }

  const nextLetter = sequence[nextIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schulte Letters</Text>
        <Text style={styles.subtitle}>
          {phase === 'running' && sessionGridMode === 'reshuffle'
            ? 'Moving grid · completed cells stay uncolored'
            : `Tap letters A to ${sequence[total - 1]} in order`}
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          startLabel="Start letter search"
          containerStyle={styles.idleContent}
        >
          <SchulteGridModeControl
            value={selectedGridMode}
            onChange={setSelectedGridMode}
          />
        </GameIdlePanel>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'next',
                value: nextLetter,
                label: 'Next',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'progress',
                value: `${tapped.size}/${total}`,
                label: 'Progress',
                containerStyle: [styles.statBox, styles.progressBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'errors',
                value: mistakes,
                label: 'Errors',
                containerStyle: styles.statBox,
                valueStyle: [styles.statValue, mistakes > 0 && styles.errorValue],
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={styles.gridContainer}>
            <View
              testID="schulte-letters-grid"
              style={[styles.grid, { width: actualGridSize, height: actualGridSize, padding: GRID_PADDING }]}
            >
              {Array.from({ length: gridSize }, (_, rowIndex) => (
                <View
                  key={rowIndex}
                  testID={`schulte-letters-row-${rowIndex}`}
                  style={[styles.gridRow, rowIndex < gridSize - 1 && { marginBottom: cellGap }]}
                >
                  {Array.from({ length: gridSize }, (_, colIndex) => {
                    const cellIndex = rowIndex * gridSize + colIndex;
                    const letter = grid[cellIndex];
                    const isDone = tapped.has(letter);
                    const showDone = isDone && sessionGridMode === 'stable';
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          letter === nextLetter
                            ? `Letter ${letter}, next target`
                            : `Letter ${letter}`
                        }
                        accessibilityState={{ disabled: isDone }}
                        key={colIndex}
                        testID={`cell-${letter}`}
                        style={[
                          styles.cell,
                          { 
                            width: cellSize, 
                            height: cellSize,
                            marginRight: colIndex < gridSize - 1 ? cellGap : 0,
                          },
                          showDone && styles.cellDone,
                        ]}
                        onPress={() => onTap(letter)}
                        disabled={isDone}
                      >
                        <Text style={[styles.cellText, { fontSize: cellSize * 0.4 }, showDone && styles.cellTextDone]}>
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
          <Text style={styles.endEmoji}>ABC</Text>
          <Text style={styles.endTitle}>Completed!</Text>
          <Text style={styles.endTime}>
            {formatDuration(elapsedMs)}
          </Text>
          <Text style={styles.endMeta}>
            {mistakes === 0 ? 'Perfect! No mistakes' : `${mistakes} mistake${mistakes > 1 ? 's' : ''}`}
          </Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <Text style={styles.endMode}>
            Grid: {sessionGridMode === 'reshuffle' ? 'shuffle after tap' : 'stable'}
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
  statsRow: { gap: spacing.sm, marginBottom: spacing.sm },
  statBox: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceTonal,
  },
  progressBox: { backgroundColor: colors.cardBackground },
  statValue: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },
  errorValue: { color: colors.error },
  statLabel: { color: colors.textSecondary, fontSize: 10, marginTop: 1 },
  gridContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceTonal,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  cellDone: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  cellText: { color: colors.textPrimary, fontWeight: '800' },
  cellTextDone: { color: colors.white },
  endCard: {
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  endEmoji: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  endTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  endTime: {
    color: colors.primary,
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
  endMode: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
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
