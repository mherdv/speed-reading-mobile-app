import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { loadGameProgress, updateProgress, levelToDifficulty, levelToStars, type GameProgress } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'LetterRecognition';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

type Props = {
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type LetterCell = {
  id: number;
  letter: string;
  isTarget: boolean;
};

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 4, targetCount: 3, durationMs: 30000 };
    case 'medium':
      return { gridSize: 5, targetCount: 5, durationMs: 25000 };
    case 'hard':
      return { gridSize: 6, targetCount: 8, durationMs: 20000 };
  }
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGrid(gridSize: number, targetCount: number): { cells: LetterCell[]; target: string; targetPositions: Set<number> } {
  const total = gridSize * gridSize;
  const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  
  // Create cells with some targets scattered
  const targetPositions = new Set<number>();
  while (targetPositions.size < targetCount) {
    targetPositions.add(Math.floor(Math.random() * total));
  }
  
  const cells: LetterCell[] = [];
  for (let i = 0; i < total; i++) {
    const isTarget = targetPositions.has(i);
    const letter = isTarget 
      ? target 
      : LETTERS.filter(l => l !== target)[Math.floor(Math.random() * 25)];
    cells.push({ id: i, letter, isTarget });
  }
  
  return { cells, target, targetPositions };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LetterRecognition({ 
  durationMs: durationMsProp, 
  difficulty = 'medium',
  autoStart = false,
  onReportResult 
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [grid, setGrid] = useState<LetterCell[]>([]);
  const [target, setTarget] = useState('A');
  const [targetPositions, setTargetPositions] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const roundsRef = useRef(0);
  const correctRef = useRef(0);
  const phaseRef = useRef<Phase>('idle');
  const startingRef = useRef(false);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const gridSize = currentConfig.gridSize;
  const currentDurationMs = durationMsProp ?? currentConfig.durationMs;

  // Calculate cell size - cells use margin:2 on each side, so cellMargin=4 per cell
  const cellMargin = 4;
  const cellSize = Math.min(
    (SCREEN_WIDTH - 48 - cellMargin * gridSize) / gridSize,
    (SCREEN_HEIGHT - 350 - cellMargin * gridSize) / gridSize
  );

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const [progressLoaded, setProgressLoaded] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    loadGameProgress(GAME_ID).then((progress) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
      setProgressLoaded(true);
    });
  }, []);

  // Auto-start when autoStart prop is true (e.g., from Play Again)
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (progressLoaded && autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startGame();
    }
  }, [autoStart, phase, progressLoaded]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startGame() {
    // Use ref to check phase to avoid stale closure issues
    if (phaseRef.current !== 'idle') return;
    // Prevent double execution
    if (startingRef.current) return;
    startingRef.current = true;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    reportedRef.current = false;
    scoreRef.current = 0;
    roundsRef.current = 0;
    correctRef.current = 0;
    
    // Capture current config values to avoid stale closures
    const currentGridSize = gridSize;
    const currentTargetCount = currentConfig.targetCount;
    
    const { cells, target: t, targetPositions: tp } = buildGrid(currentGridSize, currentTargetCount);
    setGrid(cells);
    setTarget(t);
    setTargetPositions(tp);
    setSelected(new Set());
    setScore(0);
    setRounds(0);
    setTimeLeft(currentDurationMs);
    setPhase('running');
    phaseRef.current = 'running';
    startRef.current = Date.now();
    startingRef.current = false;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, currentDurationMs - elapsed);
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
    const totalAttempts = roundsRef.current * currentConfig.targetCount;
    const accuracy = totalAttempts > 0 ? correctRef.current / totalAttempts : 0;

    // Update progress - consider it a success if accuracy >= 70%
    const isSuccess = accuracy >= 0.7;
    updateProgress(GAME_ID, isSuccess, scoreRef.current).then(({ progress }) => {
      setGameProgress(progress);
      // Update difficulty for next game based on new level
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy: Math.min(1, accuracy),
      details: { 
        rounds: roundsRef.current, 
        correct: correctRef.current,
        difficulty: selectedDifficulty,
      },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function onCellPress(cellId: number) {
    if (phase !== 'running') return;
    
    const newSelected = new Set(selected);
    if (newSelected.has(cellId)) {
      newSelected.delete(cellId);
    } else {
      newSelected.add(cellId);
    }
    setSelected(newSelected);

    // Auto-submit: Check if all target letters selected with no wrong selections
    let correctCount = 0;
    let hasWrongSelection = false;
    for (const id of newSelected) {
      if (targetPositions.has(id)) {
        correctCount++;
      } else {
        hasWrongSelection = true;
      }
    }

    // Auto-submit when all targets found and no wrong cells selected
    if (correctCount === targetPositions.size && !hasWrongSelection) {
      
        submitRoundInternal(newSelected);
    }
  }

  function submitRoundInternal(selectedSet: Set<number>) {
    if (phase !== 'running') return;

    // Count correct selections
    let correctCount = 0;
    for (const id of selectedSet) {
      if (targetPositions.has(id)) {
        correctCount++;
      }
    }
    
    // Penalize wrong selections and missed targets
    const wrongSelections = selectedSet.size - correctCount;
    const missed = targetPositions.size - correctCount;
    const roundScore = Math.max(0, (correctCount * 10) - (wrongSelections * 5) - (missed * 5));
    
    scoreRef.current += roundScore;
    correctRef.current += correctCount;
    roundsRef.current += 1;
    setScore(scoreRef.current);
    setRounds(roundsRef.current);

    // New round
    const { cells, target: t, targetPositions: tp } = buildGrid(gridSize, currentConfig.targetCount);
    setGrid(cells);
    setTarget(t);
    setTargetPositions(tp);
    setSelected(new Set());
  }

  function submitRound() {
    submitRoundInternal(selected);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Letter Recognition</Text>
        <Text style={styles.subtitle}>Select all cells with the target letter</Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <View style={styles.progressInfo}>
            <Text style={styles.levelLabel}>Level {gameProgress.level}</Text>
            <Text style={styles.starsDisplay}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable testID="start-button" style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>Start Game</Text>
          </Pressable>
        </View>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <Text testID="score" style={styles.hiddenText}>Score: {score}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.timerBox]}>
              <Text style={styles.statValue}>{(timeLeft / 1000).toFixed(0)}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{rounds}</Text>
              <Text style={styles.statLabel}>Rounds</Text>
            </View>
          </View>

          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Find letter:</Text>
            <Text style={styles.targetLetter}>{target}</Text>
            <Text style={styles.targetHint}>({targetPositions.size} in grid)</Text>
          </View>

          <View style={styles.gridContainer}>
            <View style={[styles.grid, { width: (cellSize + cellMargin) * gridSize + 8 }]}>
              {grid.map((cell) => {
                const isSelected = selected.has(cell.id);
                return (
                  <Pressable
                    key={cell.id}
                    testID={`cell-${cell.id}`}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      isSelected && styles.cellSelected,
                    ]}
                    onPress={() => onCellPress(cell.id)}
                  >
                    <Text style={[
                      styles.cellText, 
                      { fontSize: cellSize * 0.5 },
                      isSelected && styles.cellTextSelected
                    ]}>
                      {cell.letter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable style={styles.submitBtn} onPress={submitRound}>
            <Text style={styles.submitBtnText}>Submit ({selected.size} selected)</Text>
          </Pressable>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🔤</Text>
          <Text style={styles.endTitle}>Time's Up!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>Points in {rounds} rounds</Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable style={styles.playAgainBtn} onPress={() => { 
            setPhase('idle'); 
            phaseRef.current = 'idle';
            // Use setTimeout to ensure state is updated before starting
            setTimeout(() => startGame(), 0);
          }}>
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
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  hiddenText: { position: 'absolute', opacity: 0, height: 0 },
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
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
    color: '#374151',
    marginBottom: 8,
  },
  starsDisplay: {
    fontSize: 24,
    letterSpacing: 4,
  },
  startBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  statBox: { alignItems: 'center', backgroundColor: '#EDE9FE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  timerBox: { backgroundColor: '#DDD6FE' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#5B21B6' },
  statLabel: { fontSize: 10, color: '#7C3AED' },
  targetCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  targetLabel: { fontSize: 12, color: '#7C3AED' },
  targetLetter: { fontSize: 36, fontWeight: '800', color: '#5B21B6' },
  targetHint: { fontSize: 10, color: '#A78BFA' },
  gridContainer: { alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'center',
  },
  cell: {
    margin: 2,
    backgroundColor: 'white',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cellSelected: { 
    backgroundColor: '#8B5CF6', 
    borderColor: '#8B5CF6',
  },
  cellText: { fontWeight: '700', color: '#374151' },
  cellTextSelected: { color: 'white' },
  submitBtn: {
    marginTop: 10,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#8B5CF6', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#8B5CF6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
