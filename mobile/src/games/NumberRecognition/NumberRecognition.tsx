import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { formatDuration } from '../../domain/results';
import { useAutoStart, type Difficulty } from '../gameHooks';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { colors } from '../../theme/colors';
import {
  interleaveBalancedTrials,
  randomIndex,
  type RandomSource,
} from '../../data/randomization';

const GAME_ID = 'NumberRecognition';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  target?: number;
  stream?: number[];
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type NumberRecognitionChallenge = {
  durationMs: number;
  digitCount: 1 | 2 | 3;
  distractorSimilarity: 'low' | 'medium' | 'high';
  stimulusCount: number;
  displayCadenceMs: number;
  defaultTarget: number;
};

const NUMBER_RECOGNITION_CHALLENGES: Record<
  Difficulty,
  NumberRecognitionChallenge
> = {
  easy: {
    durationMs: 30_000,
    digitCount: 1,
    distractorSimilarity: 'low',
    stimulusCount: 30,
    displayCadenceMs: 1_600,
    defaultTarget: 7,
  },
  medium: {
    durationMs: 30_000,
    digitCount: 2,
    distractorSimilarity: 'medium',
    stimulusCount: 50,
    displayCadenceMs: 1_100,
    defaultTarget: 37,
  },
  hard: {
    durationMs: 30_000,
    digitCount: 3,
    distractorSimilarity: 'high',
    stimulusCount: 70,
    displayCadenceMs: 700,
    defaultTarget: 873,
  },
};

export function getNumberRecognitionChallenge(
  difficulty: Difficulty
): NumberRecognitionChallenge {
  return NUMBER_RECOGNITION_CHALLENGES[difficulty];
}

function randomNumberWithDigits(
  digitCount: number,
  random: RandomSource
): number {
  if (digitCount === 1) return randomIndex(10, random);
  const minimum = 10 ** (digitCount - 1);
  return minimum + randomIndex(9 * minimum, random);
}

function similarNumber(target: number, random: RandomSource): number {
  const digits = String(target).split('');
  const index = randomIndex(digits.length, random);
  const original = Number(digits[index]);
  const direction = randomIndex(2, random) === 0 ? 1 : -1;
  let replacement = (original + direction + 10) % 10;

  // Keep multi-digit distractors at the configured length.
  if (index === 0 && digits.length > 1 && replacement === 0) {
    replacement = (original - direction + 10) % 10;
  }

  digits[index] = String(replacement);
  return Number(digits.join(''));
}

function randomDistractor(
  target: number,
  challenge: NumberRecognitionChallenge,
  random: RandomSource
): number {
  if (challenge.distractorSimilarity === 'high') {
    return similarNumber(target, random);
  }

  const candidate = randomNumberWithDigits(challenge.digitCount, random);
  if (candidate !== target) return candidate;

  const minimum = challenge.digitCount === 1
    ? 0
    : 10 ** (challenge.digitCount - 1);
  const maximum = 10 ** challenge.digitCount - 1;
  return candidate === maximum ? minimum : candidate + 1;
}

export function generateNumberRecognitionStream(
  target: number,
  challenge: NumberRecognitionChallenge,
  random: RandomSource = Math.random
): number[] {
  if (challenge.stimulusCount % 2 !== 0) {
    throw new RangeError(
      'Number Recognition requires an even stimulus count for a balanced stream'
    );
  }

  const trialCount = challenge.stimulusCount / 2;
  return interleaveBalancedTrials(
    Array.from({ length: trialCount }, () => target),
    Array.from({ length: trialCount }, () =>
      randomDistractor(target, challenge, random)
    ),
    random
  );
}

export default function NumberRecognition({
  target: targetProp,
  stream,
  durationMs: durationMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const challenge = getNumberRecognitionChallenge(difficulty);
  const currentTarget = targetProp ?? challenge.defaultTarget;
  const durationMs = durationMsProp ?? challenge.durationMs;
  const [phase, setPhase] = useState<Phase>('idle');
  const [seq, setSeq] = useState<number[]>(() =>
    stream ?? generateNumberRecognitionStream(currentTarget, challenge)
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const timedOutRef = useRef(0);
  const targetTrialsRef = useRef(0);
  const nonTargetTrialsRef = useRef(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cadenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
      if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, true, start);

  const current = seq[Math.min(index, seq.length - 1)] ?? 0;

  useEffect(() => {
    if (phase !== 'running') return;
    if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
    cadenceTimeoutRef.current = setTimeout(
      handleStimulusTimeout,
      challenge.displayCadenceMs
    );
    return () => {
      if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
    };
  }, [challenge.displayCadenceMs, index, phase]);

  function start() {
    cancelledRef.current = false;
    if (phase !== 'idle' && phase !== 'ended') return;
    reportedRef.current = false;
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
    scoreRef.current = 0;
    attemptsRef.current = 0;
    timedOutRef.current = 0;
    targetTrialsRef.current = 0;
    nonTargetTrialsRef.current = 0;
    // Generate fresh stream
    setSeq(
      stream ?? generateNumberRecognitionStream(currentTarget, challenge)
    );
    setPhase('running');
    setScore(0);
    setIndex(0);
    setAttempts(0);
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
    if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = attemptsRef.current > 0 ? Math.min(1, scoreRef.current / (10 * attemptsRef.current)) : 0;
    const calibrationEligible =
      attemptsRef.current >= 4 &&
      targetTrialsRef.current >= 2 &&
      nonTargetTrialsRef.current >= 2;

    setPhase('ended');
    if (calibrationEligible) {
      void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current).catch(
        () => undefined
      );
    }
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        target: currentTarget,
        total: seq.length,
        targetTrials: targetTrialsRef.current,
        nonTargetTrials: nonTargetTrialsRef.current,
        calibrationEligible,
        attempts: attemptsRef.current,
        timedOut: timedOutRef.current,
        difficulty,
        digitCount: challenge.digitCount,
        distractorSimilarity: challenge.distractorSimilarity,
        displayCadenceMs: challenge.displayCadenceMs,
      },
    });
  }

  function evaluate(isMatchPressed: boolean) {
    if (phase !== 'running') return;
    const isMatch = current === currentTarget;
    const correct = isMatchPressed ? isMatch : !isMatch;

    attemptsRef.current += 1;
    if (isMatch) targetTrialsRef.current += 1;
    else nonTargetTrialsRef.current += 1;
    setAttempts(attemptsRef.current);

    if (correct) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 200);
    setIndex((i) => (i + 1) % Math.max(1, seq.length));
  }

  function handleStimulusTimeout() {
    if (phase !== 'running') return;
    const isMatch = current === currentTarget;
    attemptsRef.current += 1;
    timedOutRef.current += 1;
    if (isMatch) targetTrialsRef.current += 1;
    else nonTargetTrialsRef.current += 1;
    setAttempts(attemptsRef.current);
    setFeedback('wrong');
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 200);
    setIndex((i) => (i + 1) % Math.max(1, seq.length));
  }

  function playAgain() {
    setPhase('idle');
    replayTimeoutRef.current = setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Number Recognition</Text>
        <Text style={styles.subtitle}>Find target number: <Text style={styles.targetHighlight}>{currentTarget}</Text></Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          containerStyle={styles.endCard}
          descriptionStyle={styles.endTitle}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        />
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <Text testID="score" style={styles.hiddenText}>Score: {score}</Text>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'score',
                value: score,
                label: 'Score',
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
                key: 'target',
                value: currentTarget,
                label: 'Target',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={[
            styles.numberCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <Text testID="current-number" style={styles.number}>{current}</Text>
          </View>

          <View style={styles.buttonsRow}>
            <Pressable accessibilityRole="button" testID="match" style={[styles.choiceBtn, styles.matchBtn]} onPress={() => evaluate(true)}>
              <Text style={styles.choiceBtnText}>MATCH ✓</Text>
            </Pressable>
            <Pressable accessibilityRole="button" testID="no" style={[styles.choiceBtn, styles.noBtn]} onPress={() => evaluate(false)}>
              <Text style={styles.choiceBtnText}>NO ✗</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🔢</Text>
          <Text style={styles.endTitle}>Time's Up!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            Accuracy: {attempts > 0 ? Math.round((score / (10 * attempts)) * 100) : 0}%
          </Text>
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
  targetHighlight: { color: colors.warningForeground, fontWeight: '700' },
  startBtn: { backgroundColor: colors.warningForeground, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#FEF3C7', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: '#FDE68A' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#92400E' },
  statLabel: { fontSize: 10, color: '#B45309' },
  numberCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  number: { fontSize: 64, fontWeight: '800', color: '#92400E' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  choiceBtn: { flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  matchBtn: { backgroundColor: '#10B981' },
  noBtn: { backgroundColor: '#EF4444' },
  choiceBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: colors.warningForeground, marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: colors.warningForeground, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
  hiddenText: { position: 'absolute', opacity: 0 },
});
