import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { loadGameProgress, updateProgress, levelToDifficulty, levelToStars, type GameProgress } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'EvenNumbers';

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
  sequence?: number[];
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { maxNumber: 20, durationMs: 30000 };
    case 'medium':
      return { maxNumber: 99, durationMs: 20000 };
    case 'hard':
      return { maxNumber: 999, durationMs: 15000 };
  }
}

export default function EvenNumbers({ 
  sequence, 
  durationMs: durationMsProp, 
  difficulty = 'medium',
  autoStart = false,
  onReportResult 
}: Props) {
  const seq = useMemo(() => sequence ?? [], [sequence]);
  const usesSequence = seq.length > 0;

  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  const [index, setIndex] = useState(0);
  const [randomNumber, setRandomNumber] = useState(() => randomInt(0, 99));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAtRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const currentDurationMs = durationMsProp ?? currentConfig.durationMs;

  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    loadGameProgress(GAME_ID).then((progress) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
      setProgressLoaded(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
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

  const currentNumber = usesSequence ? (seq[index] ?? 0) : randomNumber;

  function start() {
    if (phase !== 'idle') return;
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    correctRef.current = 0;
    setPhase('running');
    setIndex(0);
    setRandomNumber(randomInt(0, currentConfig.maxNumber));
    setScore(0);
    setCombo(0);
    setTimeLeft(currentDurationMs);
    setAttempts(0);
    setCorrectCount(0);
    setFeedback(null);
    startAtRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startAtRef.current;
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
    const elapsedMs = now - startAtRef.current;
    const accuracy = attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0;

    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, scoreRef.current).then(({ progress }) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { 
        attempts: attemptsRef.current, 
        correctCount: correctRef.current,
        difficulty: selectedDifficulty,
      },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function evaluate(isEvenPressed: boolean) {
    if (phase !== 'running') return;

    const n = currentNumber;
    const correct = (n % 2 === 0) === isEvenPressed;

    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);

    if (correct) {
      scoreRef.current += 10;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setCorrectCount(correctRef.current);
      setCombo((c) => c + 1);
      setFeedback('correct');
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 5);
      setScore(scoreRef.current);
      setCombo(0);
      setFeedback('wrong');
    }

    setTimeout(() => setFeedback(null), 200);

    if (usesSequence) {
      setIndex((i) => Math.min(seq.length - 1, i + 1));
    } else {
      setRandomNumber(randomInt(0, currentConfig.maxNumber));
    }
  }

  function playAgain() {
    start();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Even Numbers</Text>
        <Text style={styles.subtitle}>Classify numbers as even or odd</Text>
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
              <Text testID="score" style={styles.statValue}>Score: {score}</Text>
            </View>
            <View style={[styles.statBox, styles.timerBox]}>
              <Text style={styles.statValue}>{(timeLeft / 1000).toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text testID="combo" style={[styles.statValue, combo > 2 && styles.comboHigh]}>Combo: {combo}</Text>
            </View>
          </View>

          <View style={[
            styles.numberCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <Text testID="current-number" style={styles.number}>{currentNumber}</Text>
          </View>

          <View style={styles.buttonsRow}>
            <Pressable testID="button-even" style={[styles.choiceBtn, styles.evenBtn]} onPress={() => evaluate(true)}>
              <Text style={styles.choiceBtnText}>EVEN</Text>
            </Pressable>
            <Pressable testID="button-odd" style={[styles.choiceBtn, styles.oddBtn]} onPress={() => evaluate(false)}>
              <Text style={styles.choiceBtnText}>ODD</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text testID="score" style={styles.hiddenScore}>Score: {score}</Text>
          <Text style={styles.endEmoji}>🎯</Text>
          <Text style={styles.endTitle}>Time's Up!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            Accuracy: {attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0}%
          </Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable style={styles.playAgainBtn} onPress={playAgain}>
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
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#DBEAFE', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: '#BFDBFE' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1E40AF' },
  comboHigh: { color: '#DC2626' },
  statLabel: { fontSize: 10, color: '#3B82F6' },
  numberCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  number: { fontSize: 48, fontWeight: '800', color: '#1E3A8A' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  choiceBtn: { flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  evenBtn: { backgroundColor: '#10B981' },
  oddBtn: { backgroundColor: '#F59E0B' },
  choiceBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#3B82F6', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
  hiddenScore: { position: 'absolute', opacity: 0, height: 0 },
});
