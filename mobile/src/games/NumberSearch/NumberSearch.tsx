import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

type Props = {
  durationMs?: number;
  gridSize?: number;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

function randomNum(max: number): number {
  return Math.floor(Math.random() * max);
}

function buildGrid(size: number): { grid: number[][]; target: number; targetPos: { row: number; col: number } } {
  const target = randomNum(100);
  const grid: number[][] = [];
  
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      let num = randomNum(100);
      while (num === target) num = randomNum(100);
      row.push(num);
    }
    grid.push(row);
  }
  
  const targetRow = randomNum(size);
  const targetCol = randomNum(size);
  grid[targetRow][targetCol] = target;
  
  return { grid, target, targetPos: { row: targetRow, col: targetCol } };
}

export default function NumberSearch({ durationMs = 45000, gridSize = 5, autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [gridData, setGridData] = useState(() => buildGrid(gridSize));
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startedAtRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const reportedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'running') return;
    const endAt = startedAtRef.current + durationMs;
    
    const interval = setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setTimeLeftMs(left);
      if (left <= 0) {
        clearInterval(interval);
        finish();
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [phase, durationMs]);

  // Auto-start when autoStart prop is true
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase]);

  function start() {
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    setGridData(buildGrid(gridSize));
    setScore(0);
    setAttempts(0);
    setTimeLeftMs(durationMs);
    setFeedback(null);
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;
    
    const now = Date.now();
    const elapsedMs = now - startedAtRef.current;
    const accuracy = attemptsRef.current > 0 ? scoreRef.current / attemptsRef.current : 0;
    
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { rounds: attemptsRef.current, correct: scoreRef.current },
    });
    
    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function onCellPress(row: number, col: number) {
    if (phase !== 'running') return;
    
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    
    const isCorrect = row === gridData.targetPos.row && col === gridData.targetPos.col;
    
    if (isCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
      
      // Generate new grid with new target only on correct
      
        setFeedback(null);
        setGridData(buildGrid(gridSize));
    } else {
      setFeedback('wrong');
      
      // Clear feedback but keep same grid on wrong
      
        setFeedback(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Number Search</Text>
        <Text style={styles.subtitle}>Find the target number in the grid</Text>
      </View>

      {phase === 'idle' && (
        <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
          <Text style={styles.startBtnText}>Start Game</Text>
        </Pressable>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Found</Text>
            </View>
            <View style={[styles.statBox, styles.timerBox]}>
              <Text style={styles.statValue}>{Math.ceil(timeLeftMs / 1000)}</Text>
              <Text style={styles.statLabel}>Seconds</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{attempts}</Text>
              <Text style={styles.statLabel}>Attempts</Text>
            </View>
          </View>

          <View style={[
            styles.targetCard,
            feedback === 'correct' && styles.targetCorrect,
            feedback === 'wrong' && styles.targetWrong,
          ]}>
            <Text style={styles.targetLabel}>Find this number:</Text>
            <Text style={styles.targetNumber}>{gridData.target}</Text>
          </View>

          <View style={styles.grid}>
            {gridData.grid.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {row.map((num, colIdx) => (
                  <Pressable
                    key={`${rowIdx}-${colIdx}`}
                    testID={`cell-${rowIdx}-${colIdx}`}
                    style={styles.cell}
                    onPress={() => onCellPress(rowIdx, colIdx)}
                  >
                    <Text style={styles.cellText}>{num}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🔢</Text>
          <Text style={styles.endTitle}>Time's Up!</Text>
          <Text style={styles.endScore}>{score} Found</Text>
          <Text style={styles.endMeta}>
            Accuracy: {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%
          </Text>
          <Pressable style={styles.playAgainBtn} onPress={start}>
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
  startBtn: {
    backgroundColor: '#14B8A6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  statBox: { alignItems: 'center', backgroundColor: '#CCFBF1', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  timerBox: { backgroundColor: '#99F6E4' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#0F766E' },
  statLabel: { fontSize: 10, color: '#14B8A6' },
  targetCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#5EEAD4',
  },
  targetCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  targetWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  targetLabel: { fontSize: 12, color: '#0D9488' },
  targetNumber: { fontSize: 28, fontWeight: '800', color: '#134E4A' },
  grid: { backgroundColor: '#F0FDFA', borderRadius: 8, padding: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'center' },
  cell: {
    width: 40,
    height: 40,
    margin: 2,
    backgroundColor: 'white',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  cellText: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 32, fontWeight: '800', color: '#14B8A6', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#14B8A6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
