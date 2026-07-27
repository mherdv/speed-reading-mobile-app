import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { updateProgress, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, useTrackedTimeouts, type Difficulty } from '../gameHooks';
import { colors } from '../../theme/colors';

const GAME_ID = 'EvenNumbers';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

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
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
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
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const currentDurationMs = durationMsProp ?? currentConfig.durationMs;

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  const currentNumber = usesSequence ? (seq[index] ?? 0) : randomNumber;

  function start() {
    clearTrackedTimeouts();
    cancelledRef.current = false;
    if (phase !== 'idle' && phase !== 'ended') return;
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
    clearTrackedTimeouts();

    const now = Date.now();
    const elapsedMs = now - startAtRef.current;
    const accuracy = attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0;

    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, scoreRef.current).then(({ progress }) => {
      setGameProgress(progress);
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
    setPhase('ended');
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

    clearTrackedTimeouts();
    scheduleTimeout(() => setFeedback(null), 200);

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
                key: 'score',
                value: `Score: ${score}`,
                label: '',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: `${(timeLeft / 1000).toFixed(1)}s`,
                label: 'Time',
                containerStyle: [styles.statBox, styles.timerBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'combo',
                value: `Combo: ${combo}`,
                label: '',
                containerStyle: styles.statBox,
                valueStyle: [styles.statValue, combo > 2 && styles.comboHigh],
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={[
            styles.numberCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <Text testID="current-number" style={styles.number}>{currentNumber}</Text>
          </View>

          <View style={styles.buttonsRow}>
            <Pressable accessibilityRole="button" testID="button-even" style={[styles.choiceBtn, styles.evenBtn]} onPress={() => evaluate(true)}>
              <Text style={styles.choiceBtnText}>EVEN</Text>
            </Pressable>
            <Pressable accessibilityRole="button" testID="button-odd" style={[styles.choiceBtn, styles.oddBtn]} onPress={() => evaluate(false)}>
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
  oddBtn: { backgroundColor: colors.warningForeground },
  choiceBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#3B82F6', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: colors.warningForeground },
  playAgainBtn: { marginTop: 16, backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
  hiddenScore: { position: 'absolute', opacity: 0, height: 0 },
});
