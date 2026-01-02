import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { loadGameProgress, updateProgress, levelToDifficulty, levelToStars, type GameProgress } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'PatternScanning';

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
  gridSize?: number;
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

export default function PatternScanning({ 
  gridSize: gridSizeProp, 
  targetPattern: targetPatternProp, 
  durationMs: durationMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult 
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  // Auto-select a random pattern - user no longer needs to select manually
  const [selectedPattern, setSelectedPattern] = useState<string>(
    targetPatternProp ?? PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
  );
  
  const config = getDifficultyConfig(selectedDifficulty);
  const gridSize = gridSizeProp ?? config.gridSize;
  const durationMs = durationMsProp ?? config.durationMs;
  const targetPattern = selectedPattern;
  
  const { grid, targetPositions } = useMemo(
    () => generateGrid(gridSize, targetPattern, config.targetDensity), 
    [gridSize, targetPattern, config.targetDensity, phase]
  );
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [feedback, setFeedback] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const scoreRef = useRef(0);
  const foundRef = useRef<string[]>([]);

  useEffect(() => {
    loadGameProgress(GAME_ID).then((progress) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-start when autoStart prop is true
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase]);

  function start() {
    if (phase !== 'idle') return;
    // Auto-select a random pattern each game
    setSelectedPattern(PATTERNS[Math.floor(Math.random() * PATTERNS.length)]);
    reportedRef.current = false;
    scoreRef.current = 0;
    foundRef.current = [];
    setPhase('running');
    setScore(0);
    setFound([]);
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
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = targetPositions.length > 0 ? foundRef.current.length / targetPositions.length : 0;

    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, scoreRef.current).then(({ progress }) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { totalTargets: targetPositions.length, found: foundRef.current.length },
    });

    setPhase('ended');
  }

  function tapCell(r: number, c: number) {
    if (phase !== 'running') return;
    const key = `${r}-${c}`;
    if (found.includes(key)) return;

    const isTarget = targetPositions.some(([tr, tc]) => tr === r && tc === c);

    if (isTarget) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foundRef.current = [...foundRef.current, key];
      setFound([...foundRef.current]);
      setFeedback(key);
      setTimeout(() => setFeedback(null), 200);

      if (foundRef.current.length === targetPositions.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      }
    }
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
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <View style={styles.progressInfo}>
            <Text style={styles.levelLabel}>Level {gameProgress.level}</Text>
            <Text style={styles.starsDisplay}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Start Game</Text>
          </Pressable>
        </View>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{found.length}/{targetPositions.length}</Text>
              <Text style={styles.statLabel}>Found</Text>
            </View>
            <View style={[styles.statBox, styles.timerBox]}>
              <Text style={styles.statValue}>{(timeLeft / 1000).toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
          </View>

          <View testID="grid" style={styles.gridContainer}>
            {grid.map((row, r) => (
              <View key={r} style={styles.gridRow}>
                {row.map((cell, c) => {
                  const key = `${r}-${c}`;
                  const isFound = found.includes(key);
                  const isFeedback = feedback === key;
                  return (
                    <Pressable
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
          <Text style={styles.endTitle}>{found.length === targetPositions.length ? 'All Found!' : 'Time Up!'}</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>Found {found.length} of {targetPositions.length}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
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
  targetHighlight: { color: '#EA580C', fontWeight: '700', fontSize: 16 },
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
  startBtn: { backgroundColor: '#EA580C', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#FFEDD5', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: '#FED7AA' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#9A3412' },
  statLabel: { fontSize: 10, color: '#C2410C' },
  gridContainer: { alignItems: 'center', gap: 4 },
  gridRow: { flexDirection: 'row', gap: 4 },
  cell: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDBA74',
  },
  cellFound: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cellFeedback: { backgroundColor: '#10B981' },
  cellText: { fontSize: 24 },
  cellTextFound: { opacity: 0.5 },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#EA580C', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#EA580C', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
