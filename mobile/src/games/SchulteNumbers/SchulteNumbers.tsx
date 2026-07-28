import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { updateProgress, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { formatDuration } from '../../domain/results';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';

const GAME_ID = 'SchulteNumbers';

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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGrid(size: number): number[] {
  const total = size * size;
  const nums = Array.from({ length: total }, (_, i) => i + 1);
  return shuffleArray(nums);
}

export default function SchulteNumbers({
  gridSize: gridSizeProp,
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
  const [grid, setGrid] = useState<number[]>([]);
  const [activeGridSize, setActiveGridSize] = useState<number>(5); // Track actual grid size being played
  const [nextNumber, setNextNumber] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [elapsedMs, setElapsedMs] = useState(0);

  const startedAtRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  // Use activeGridSize during game, currentConfig for idle screen
  const gridSize = phase === 'running' || phase === 'ended'
    ? activeGridSize
    : (gridSizeProp ?? currentConfig.gridSize);
  const total = gridSize * gridSize;

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
  const cellGap = CELL_GAP; // Gap between cells
  const gridPadding = GRID_PADDING; // Padding inside grid container
  const maxGridWidth = availableWidth - gridPadding * 2;
  const maxGridHeight = availableHeight - gridPadding * 2;
  const cellSize = Math.floor(Math.min(
    (maxGridWidth - cellGap * (gridSize - 1)) / gridSize,
    (maxGridHeight - cellGap * (gridSize - 1)) / gridSize
  ));
  const actualGridSize = cellSize * gridSize + cellGap * (gridSize - 1) + gridPadding * 2;

  // Cleanup on unmount - prevent reporting results after back button
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start() {
    cancelledRef.current = false;
    // Reset all state completely for fresh restart
    reportedRef.current = false;
    const currentGridSize = gridSizeProp ?? getDifficultyConfig(selectedDifficulty).gridSize;
    const newGrid = generateGrid(currentGridSize);
    setActiveGridSize(currentGridSize); // Track the actual grid size being used
    setGrid(newGrid);
    setNextNumber(1);
    setMistakes(0);
    setTapped(new Set());
    setElapsedMs(0);
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startedAtRef.current;
    setElapsedMs(elapsedMs);
    const attempts = total + mistakes;
    const accuracy = attempts > 0 ? total / attempts : 1;
    const itemsPerMinute = Math.round(
      (total / Math.max(elapsedMs, 1)) * 60000 * accuracy
    );

    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, itemsPerMinute).then(({ progress }) => {
      if (cancelledRef.current) return;
      setGameProgress(progress);
    });

    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: itemsPerMinute,
      accuracy,
      details: {
        gridSize,
        mistakes,
        itemsPerMinute,
        difficulty: selectedDifficulty,
      },
    });

    // Only show ended phase if no onReportResult (standalone mode)
    // Otherwise, navigation will handle showing results
    setPhase('ended');
  }

  function onTap(num: number) {
    if (phase !== 'running') return;

    if (num === nextNumber) {
      setTapped(prev => new Set(prev).add(num));
      if (num === total) {
        finish();
      } else {
        setNextNumber(num + 1);
      }
    } else {
      setMistakes(m => m + 1);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schulte Numbers</Text>
        <Text style={styles.subtitle}>Tap numbers 1 to {total} in order</Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          startLabel="Start number search"
          containerStyle={styles.idleContent}
        />
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'next',
                value: nextNumber,
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
              testID="schulte-numbers-grid"
              style={[styles.grid, { width: actualGridSize, height: actualGridSize, padding: GRID_PADDING }]}
            >
              {Array.from({ length: gridSize }, (_, rowIndex) => (
                <View
                  key={rowIndex}
                  testID={`schulte-numbers-row-${rowIndex}`}
                  style={[styles.gridRow, rowIndex < gridSize - 1 && { marginBottom: cellGap }]}
                >
                  {Array.from({ length: gridSize }, (_, colIndex) => {
                    const cellIndex = rowIndex * gridSize + colIndex;
                    const num = grid[cellIndex];
                    const isDone = tapped.has(num);
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          num === nextNumber
                            ? `Number ${num}, next target`
                            : `Number ${num}`
                        }
                        accessibilityState={{ disabled: isDone }}
                        key={colIndex}
                        testID={`cell-${num}`}
                        style={[
                          styles.cell,
                          {
                            width: cellSize,
                            height: cellSize,
                            marginRight: colIndex < gridSize - 1 ? cellGap : 0,
                          },
                          isDone && styles.cellDone,
                        ]}
                        onPress={() => onTap(num)}
                        disabled={isDone}
                      >
                        <Text style={[styles.cellText, { fontSize: cellSize * 0.4 }, isDone && styles.cellTextDone]}>
                          {num}
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
          <Text style={styles.endEmoji}>123</Text>
          <Text style={styles.endTitle}>Completed!</Text>
          <Text style={styles.endTime}>
            {formatDuration(elapsedMs)}
          </Text>
          <Text style={styles.endMeta}>
            {mistakes === 0 ? 'Perfect! No mistakes' : `${mistakes} mistake${mistakes > 1 ? 's' : ''}`}
          </Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
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
    borderColor: colors.info,
    backgroundColor: colors.info,
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
    color: colors.info,
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
    color: colors.info,
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
