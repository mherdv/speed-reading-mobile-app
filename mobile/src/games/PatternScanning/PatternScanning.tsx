import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { updateProgress, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { formatDuration } from '../../domain/results';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';
import { colors } from '../../theme/colors';

const GAME_ID = 'PatternScanning';

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
  grid?: readonly (readonly string[])[];
  targetPattern?: string;
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

// 15 distinct pattern variations for visual variety
const PATTERNS = [
  '▲', '●', '■', '◆', '★',
  '♦', '♠', '♣', '♥', '▼',
  '◀', '▶', '○', '□', '◇',
];

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 4, durationMs: 45000, targetDensity: 0.12 };
    case 'medium':
      return { gridSize: 5, durationMs: 35000, targetDensity: 0.15 };
    case 'hard':
      return { gridSize: 6, durationMs: 30000, targetDensity: 0.18 };
  }
}

function generateGrid(size: number, target: string, targetDensity: number): { grid: string[][]; targetPositions: [number, number][] } {
  const grid: string[][] = [];
  const targetPositions: [number, number][] = [];
  
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      const isTarget = Math.random() < targetDensity;
      const symbol = isTarget ? target : PATTERNS.filter(p => p !== target)[Math.floor(Math.random() * (PATTERNS.length - 1))];
      row.push(symbol);
      if (isTarget) {
        targetPositions.push([r, c]);
      }
    }
    grid.push(row);
  }

  if (targetPositions.length === 0) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    grid[r][c] = target;
    targetPositions.push([r, c]);
  }

  return { grid, targetPositions };
}

function prepareGrid(
  size: number,
  target: string,
  targetDensity: number,
  providedGrid?: readonly (readonly string[])[]
): { grid: string[][]; targetPositions: [number, number][] } {
  if (!providedGrid) return generateGrid(size, target, targetDensity);
  const grid = providedGrid.map((row) => [...row]);
  const targetPositions: [number, number][] = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell === target) targetPositions.push([rowIndex, columnIndex]);
    });
  });
  return { grid, targetPositions };
}

export function calculatePatternAccuracy(
  correctSelections: number,
  totalTargets: number,
  incorrectSelections: number
): number {
  const denominator =
    Math.max(0, totalTargets) + Math.max(0, incorrectSelections);
  if (denominator === 0) return 0;
  return Math.min(1, Math.max(0, correctSelections) / denominator);
}

export default function PatternScanning({ 
  gridSize: gridSizeProp, 
  grid: providedGrid,
  targetPattern: targetPatternProp, 
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
  // Auto-select a random pattern - user no longer needs to select manually
  const [selectedPattern, setSelectedPattern] = useState<string>(
    targetPatternProp ?? PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
  );
  
  const [roundNumber, setRoundNumber] = useState(1);
  
  const config = getDifficultyConfig(selectedDifficulty);
  const gridSize = gridSizeProp ?? config.gridSize;
  const durationMs = durationMsProp ?? config.durationMs;
  const targetPattern = selectedPattern;
  
  const [gridData, setGridData] = useState(() =>
    prepareGrid(
      gridSize,
      targetPattern,
      config.targetDensity,
      providedGrid
    )
  );
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [totalFound, setTotalFound] = useState(0);
  const [incorrect, setIncorrect] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const foundRef = useRef<string[]>([]);
  const totalFoundRef = useRef(0);
  const totalTargetsRef = useRef(0);
  const incorrectRef = useRef(0);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start() {
    cancelledRef.current = false;
    if (phase !== 'idle' && phase !== 'ended') return;
    // Auto-select a random pattern each game
    const nextPattern =
      targetPatternProp ??
      PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const nextGrid = prepareGrid(
      gridSize,
      nextPattern,
      config.targetDensity,
      providedGrid
    );
    setSelectedPattern(nextPattern);
    setGridData(nextGrid);
    reportedRef.current = false;
    scoreRef.current = 0;
    foundRef.current = [];
    totalFoundRef.current = 0;
    totalTargetsRef.current = nextGrid.targetPositions.length;
    incorrectRef.current = 0;
    setPhase('running');
    setScore(0);
    setFound([]);
    setTotalFound(0);
    setIncorrect(0);
    setRoundNumber(1);
    setTimeLeft(durationMs);
    setFeedback(null);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      }
    }, 100);
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = calculatePatternAccuracy(
      totalFoundRef.current,
      totalTargetsRef.current,
      incorrectRef.current
    );
    const missed = Math.max(
      0,
      totalTargetsRef.current - totalFoundRef.current
    );

    updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current)
      .then(({ progress }) => {
        if (cancelledRef.current) return;
        setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        totalTargets: totalTargetsRef.current,
        found: totalFoundRef.current,
        missed,
        errors: incorrectRef.current,
        accuracyFormula: 'found / (total targets + errors)',
        difficulty: selectedDifficulty,
      },
    });
    setPhase('ended');
  }

  function startNextRound() {
    // Start a new round with a new pattern
    const nextPattern =
      targetPatternProp ??
      PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    const nextGrid = prepareGrid(
      gridSize,
      nextPattern,
      config.targetDensity,
      providedGrid
    );
    setSelectedPattern(nextPattern);
    setGridData(nextGrid);
    foundRef.current = [];
    setFound([]);
    setRoundNumber(r => r + 1);
    totalTargetsRef.current += nextGrid.targetPositions.length;
    setFeedback(null);
  }

  function tapCell(r: number, c: number) {
    if (phase !== 'running') return;
    const key = `${r}-${c}`;
    if (found.includes(key)) return;

    const isTarget = gridData.targetPositions.some(
      ([tr, tc]) => tr === r && tc === c
    );

    if (isTarget) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foundRef.current = [...foundRef.current, key];
      setFound([...foundRef.current]);
      totalFoundRef.current += 1;
      setTotalFound(totalFoundRef.current);
      setFeedback(key);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 200);

      // When all patterns found in current round, start a new round instead of finishing
      if (foundRef.current.length === gridData.targetPositions.length) {
        if (nextRoundTimerRef.current) {
          clearTimeout(nextRoundTimerRef.current);
        }
        nextRoundTimerRef.current = setTimeout(() => startNextRound(), 300);
      }
      return;
    }

    incorrectRef.current += 1;
    setIncorrect(incorrectRef.current);
    setFeedback(key);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 200);
  }

  function playAgain() {
    start();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pattern Scanning</Text>
        <Text testID="target-display" style={styles.subtitle}>Find all: <Text style={styles.targetHighlight}>{targetPattern}</Text></Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
          progressInfoStyle={styles.progressInfo}
          levelLabelStyle={styles.levelLabel}
          starsStyle={styles.starsDisplay}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        />
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'found',
                value: `${found.length}/${gridData.targetPositions.length}`,
                label: 'Found',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: formatDuration(timeLeft),
                label: 'Time',
                containerStyle: [styles.statBox, styles.timerBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'score',
                value: score,
                label: 'Score',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'errors',
                value: incorrect,
                label: 'Errors',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View testID="grid" style={styles.gridContainer}>
            {gridData.grid.map((row, r) => (
              <View key={r} style={styles.gridRow}>
                {row.map((cell, c) => {
                  const key = `${r}-${c}`;
                  const isFound = found.includes(key);
                  const isFeedback = feedback === key;
                  return (
                    <Pressable accessibilityRole="button"
                      key={c}
                      testID={`cell-${r}-${c}`}
                      style={[
                        styles.cell,
                        isFound && styles.cellFound,
                        isFeedback && styles.cellFeedback,
                      ]}
                      onPress={() => tapCell(r, c)}
                    >
                      <Text style={[styles.cellText, isFound && styles.cellTextFound]}>{cell}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end-screen" style={styles.endCard}>
          <Text style={styles.endEmoji}>🎯</Text>
          <Text style={styles.endTitle}>Time Up!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>Found {totalFound} patterns in {roundNumber} rounds</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable accessibilityRole="button" testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  targetHighlight: { color: colors.interactiveWarm, fontWeight: '700', fontSize: 16 },
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  starsDisplay: {
    fontSize: 24,
    letterSpacing: 4,
  },
  startBtn: { backgroundColor: colors.interactiveWarm, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  startBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: colors.warningSurface, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: colors.warningSurface },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.interactiveWarm },
  statLabel: { fontSize: 10, color: colors.interactiveWarm },
  gridContainer: { alignItems: 'center', gap: 4 },
  gridRow: { flexDirection: 'row', gap: 4 },
  cell: {
    width: 48,
    height: 48,
    backgroundColor: colors.warningSurface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.warning,
  },
  cellFound: { backgroundColor: colors.successSurface, borderColor: colors.success },
  cellFeedback: { backgroundColor: colors.interactiveTeal },
  cellText: { fontSize: 24 },
  cellTextFound: { opacity: 0.5 },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  endScore: { fontSize: 48, fontWeight: '800', color: colors.interactiveWarm, marginVertical: 8 },
  endMeta: { fontSize: 14, color: colors.textSecondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  starsText: { fontSize: 16, color: colors.warningForeground },
  playAgainBtn: { marginTop: 16, backgroundColor: colors.interactiveWarm, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
