import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAutoStart, type Difficulty } from '../gameHooks';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';

const GAME_ID = 'SymbolRecognition';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  target?: string;
  stream?: string[];
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type SymbolRecognitionChallenge = {
  durationMs: number;
  symbols: readonly string[];
  distractorSimilarity: 'low' | 'medium' | 'high';
  stimulusCount: number;
  displayCadenceMs: number;
  defaultTarget: string;
};

const SYMBOL_RECOGNITION_CHALLENGES: Record<
  Difficulty,
  SymbolRecognitionChallenge
> = {
  easy: {
    durationMs: 30_000,
    symbols: ['★', '@', '+', '%'],
    distractorSimilarity: 'low',
    stimulusCount: 30,
    displayCadenceMs: 1_600,
    defaultTarget: '★',
  },
  medium: {
    durationMs: 30_000,
    symbols: ['!', '@', '#', '$', '%', '^', '&', '*', '+', '='],
    distractorSimilarity: 'medium',
    stimulusCount: 50,
    displayCadenceMs: 1_100,
    defaultTarget: '@',
  },
  hard: {
    durationMs: 30_000,
    symbols: ['●', '○', '◉', '◎', '◌', '⊙'],
    distractorSimilarity: 'high',
    stimulusCount: 70,
    displayCadenceMs: 700,
    defaultTarget: '◉',
  },
};

export function getSymbolRecognitionChallenge(
  difficulty: Difficulty
): SymbolRecognitionChallenge {
  return SYMBOL_RECOGNITION_CHALLENGES[difficulty];
}

function generateStream(
  target: string,
  challenge: SymbolRecognitionChallenge
): string[] {
  const distractors = challenge.symbols.filter((symbol) => symbol !== target);
  return Array.from({ length: challenge.stimulusCount }, (_, index) => {
    if (index % 5 === 1) return target;
    return distractors[Math.floor(Math.random() * distractors.length)] ?? target;
  });
}

export default function SymbolRecognition({
  target: targetProp,
  stream,
  durationMs: durationMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const challenge = getSymbolRecognitionChallenge(difficulty);
  const target = targetProp ?? challenge.defaultTarget;
  const durationMs = durationMsProp ?? challenge.durationMs;
  const [phase, setPhase] = useState<Phase>('idle');
  const [seq, setSeq] = useState<string[]>(() =>
    stream ?? generateStream(target, challenge)
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

  const current = seq[Math.min(index, seq.length - 1)] ?? '';

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
    // Generate fresh stream
    setSeq(stream ?? generateStream(target, challenge));
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

    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current).catch(
      () => undefined
    );
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        target,
        total: seq.length,
        attempts: attemptsRef.current,
        timedOut: timedOutRef.current,
        difficulty,
        symbolSetSize: challenge.symbols.length,
        distractorSimilarity: challenge.distractorSimilarity,
        displayCadenceMs: challenge.displayCadenceMs,
      },
    });
  }

  function evaluate(isMatchPressed: boolean) {
    if (phase !== 'running') return;
    const isMatch = current === target;
    const correct = isMatchPressed ? isMatch : !isMatch;

    attemptsRef.current += 1;
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
    attemptsRef.current += 1;
    timedOutRef.current += 1;
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
        <Text style={styles.title}>Symbol Recognition</Text>
        <Text style={styles.subtitle}>Find target symbol: <Text style={styles.targetHighlight}>{target}</Text></Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
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
                value: `${(timeLeft / 1000).toFixed(1)}s`,
                label: 'Time',
                containerStyle: [styles.statBox, styles.timerBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'target',
                value: target,
                label: 'Target',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={[
            styles.symbolCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <Text testID="symbol" style={styles.symbol}>{current}</Text>
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
          <Text style={styles.endEmoji}>⚡</Text>
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
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  targetHighlight: { color: '#EC4899', fontWeight: '700' },
  startBtn: { backgroundColor: '#EC4899', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#FCE7F3', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: '#FBCFE8' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#9D174D' },
  statLabel: { fontSize: 10, color: '#BE185D' },
  symbolCard: {
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F9A8D4',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  symbol: { fontSize: 64, fontWeight: '800', color: '#9D174D' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  choiceBtn: { flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  matchBtn: { backgroundColor: '#10B981' },
  noBtn: { backgroundColor: '#EF4444' },
  choiceBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#EC4899', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#EC4899', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
  hiddenText: { position: 'absolute', opacity: 0 },
});
