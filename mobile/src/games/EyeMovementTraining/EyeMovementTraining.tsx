import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { loadGameProgress, updateProgress, levelToDifficulty, levelToStars, type GameProgress } from '../../data/progressStore';

const GAME_ID = 'EyeMovementTraining';

export type Difficulty = 'easy' | 'medium' | 'hard';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 3, rounds: 10, intervalMs: 900 }; // 3x3 grid, slower
    case 'medium':
      return { gridSize: 3, rounds: 15, intervalMs: 700 }; // 3x3 grid, medium speed
    case 'hard':
      return { gridSize: 4, rounds: 20, intervalMs: 500 }; // 4x4 grid, faster
  }
}

type Props = {
  positions?: number;
  rounds?: number;
  intervalMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EyeMovementTraining({ positions: positionsProp, rounds: roundsProp, intervalMs: intervalMsProp, difficulty = 'medium', autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  const [currentRound, setCurrentRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const config = getDifficultyConfig(selectedDifficulty);
  const gridSize = config.gridSize;
  const positions = positionsProp ?? gridSize * gridSize;
  const rounds = roundsProp ?? config.rounds;
  const intervalMs = intervalMsProp ?? config.intervalMs;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const roundRef = useRef(0);
  const lastPositionRef = useRef(-1);

  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    loadGameProgress(GAME_ID).then((progress) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
      setProgressLoaded(true);
    });
  }, []);

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
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);

  // Auto-start when autoStart prop is true
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (progressLoaded && autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase, progressLoaded]);

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
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;

    // Update progress
    const success = true; // Eye training is always successful if completed
    updateProgress(GAME_ID, success, rounds * 10).then(({ progress }) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: rounds * 10,
      accuracy: 1,
      details: { rounds, positions, difficulty: selectedDifficulty },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function playAgain() {
    setPhase('idle');
    setTimeout(start, 50);
  }

  const dots = Array.from({ length: positions }, (_, i) => i);
  const dotSize = Math.min((SCREEN_WIDTH - 80) / gridSize, 60);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eye Movement Training</Text>
        <Text style={styles.subtitle}>Follow the moving dot with your eyes</Text>
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
            <Text style={styles.difficultyInfo}>
              {selectedDifficulty === 'easy' ? '🟢 Slow pace' : selectedDifficulty === 'medium' ? '🟡 Medium pace' : '🔴 Fast pace'}
            </Text>
          </View>
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
            <View testID="dot-track" style={[styles.track, { width: (dotSize + 24) * gridSize }]}>
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
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
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
  difficultyInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
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
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#7C3AED', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
