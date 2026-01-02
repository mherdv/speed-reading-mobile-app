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
  target?: string;
  stream?: string[];
  durationMs?: number;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

const SYMBOLS = ['!', '@', '#', '$', '%', '^', '&', '*', '+', '='];

function generateStream(): string[] {
  return Array.from({ length: 50 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

export default function SymbolRecognition({ target = '@', stream, durationMs = 20000, autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [seq, setSeq] = useState<string[]>(() => stream ?? generateStream());
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);

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

  const current = seq[Math.min(index, seq.length - 1)] ?? '';

  function start() {
    if (phase !== 'idle') return;
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    // Generate fresh stream
    setSeq(stream ?? generateStream());
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
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = attemptsRef.current > 0 ? Math.min(1, scoreRef.current / (10 * attemptsRef.current)) : 0;

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { target, total: seq.length, attempts: attemptsRef.current },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
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

    setTimeout(() => setFeedback(null), 200);
    setIndex((i) => Math.min(seq.length - 1, i + 1));
  }

  function playAgain() {
    setPhase('idle');
    setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Symbol Recognition</Text>
        <Text style={styles.subtitle}>Find target symbol: <Text style={styles.targetHighlight}>{target}</Text></Text>
      </View>

      {phase === 'idle' && (
        <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
          <Text style={styles.startBtnText}>Start Game</Text>
        </Pressable>
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
              <Text style={styles.statValue}>{(timeLeft / 1000).toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{target}</Text>
              <Text style={styles.statLabel}>Target</Text>
            </View>
          </View>

          <View style={[
            styles.symbolCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <Text testID="symbol" style={styles.symbol}>{current}</Text>
          </View>

          <View style={styles.buttonsRow}>
            <Pressable testID="match" style={[styles.choiceBtn, styles.matchBtn]} onPress={() => evaluate(true)}>
              <Text style={styles.choiceBtnText}>MATCH ✓</Text>
            </Pressable>
            <Pressable testID="no" style={[styles.choiceBtn, styles.noBtn]} onPress={() => evaluate(false)}>
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
