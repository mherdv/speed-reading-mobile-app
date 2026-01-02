import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'EyeMovementTraining';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

type Props = {
  positions?: number;
  rounds?: number;
  intervalMs?: number;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = 3; // 3x3 grid of dots
const TOTAL_DOTS = GRID_SIZE * GRID_SIZE;

export default function EyeMovementTraining({ positions = TOTAL_DOTS, rounds = 12, intervalMs = 700, autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentRound, setCurrentRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const roundRef = useRef(0);
  const lastPositionRef = useRef(-1);

  // Get random position that's different from the last one
  function getRandomPosition() {
    let newPos = Math.floor(Math.random() * positions);
    // Avoid repeating the same position
    while (newPos === lastPositionRef.current && positions > 1) {
      newPos = Math.floor(Math.random() * positions);
    }
    lastPositionRef.current = newPos;
    return newPos;
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
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
    reportedRef.current = false;
    roundRef.current = 0;
    lastPositionRef.current = -1;
    setPhase('running');
    setCurrentRound(0);
    setScore(0);
    setElapsed(0);
    setPosition(getRandomPosition());
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);

    roundTimerRef.current = setInterval(() => {
      roundRef.current += 1;
      if (roundRef.current >= rounds) {
        if (roundTimerRef.current) clearInterval(roundTimerRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      } else {
        setCurrentRound(roundRef.current);
        setPosition(getRandomPosition());
      }
    }, intervalMs);
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: rounds * 10,
      accuracy: 1,
      details: { rounds, positions },
    });

    setPhase('ended');
  }

  function playAgain() {
    start();
  }

  const dots = Array.from({ length: positions }, (_, i) => i);
  const dotSize = Math.min((SCREEN_WIDTH - 80) / GRID_SIZE, 60);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eye Movement Training</Text>
        <Text style={styles.subtitle}>Follow the moving dot with your eyes</Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Start Training</Text>
          </Pressable>
        </View>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentRound + 1}/{rounds}</Text>
              <Text style={styles.statLabel}>Round</Text>
            </View>
            <View style={[styles.statBox, styles.timerBox]}>
              <Text style={styles.statValue}>{(elapsed / 1000).toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>

          <View style={styles.trackArea}>
            <View testID="dot-track" style={[styles.track, { width: (dotSize + 24) * GRID_SIZE }]}>
              {dots.map((i) => (
                <View
                  key={i}
                  testID={`dot-${i}`}
                  style={[
                    styles.dot, 
                    { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
                    position === i && styles.activeDot
                  ]}
                />
              ))}
            </View>
          </View>

          <Text style={styles.instruction}>Focus on the highlighted dot</Text>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end-screen" style={styles.endCard}>
          <Text style={styles.endEmoji}>👁️</Text>
          <Text style={styles.endTitle}>Training Complete!</Text>
          <Text style={styles.endScore}>{rounds * 10}</Text>
          <Text style={styles.endMeta}>{rounds} movements in {(elapsed / 1000).toFixed(1)}s</Text>
          <Pressable testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Train Again</Text>
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
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  startBtn: { backgroundColor: '#7C3AED', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statBox: { alignItems: 'center', backgroundColor: '#EDE9FE', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: '#DDD6FE' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#5B21B6' },
  statLabel: { fontSize: 10, color: '#6D28D9' },
  trackArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  track: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
  },
  dot: {
    margin: 12,
    backgroundColor: '#DDD6FE',
    borderWidth: 3,
    borderColor: '#A78BFA',
  },
  activeDot: {
    backgroundColor: '#7C3AED',
    borderColor: '#5B21B6',
    transform: [{ scale: 1.3 }],
  },
  instruction: { textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 16 },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#7C3AED', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#7C3AED', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
