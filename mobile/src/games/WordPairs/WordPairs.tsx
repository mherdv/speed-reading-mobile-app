import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WORD_PAIRS as VOCABULARY_WORD_PAIRS } from '../../data/vocabulary';

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
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

// Use the extensive word pairs from vocabulary database
const WORD_PAIRS = VOCABULARY_WORD_PAIRS;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(): { word: string; options: string[]; correctIndex: number } {
  const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  const word = pair[0];
  const correct = pair[1];
  
  const distractors = WORD_PAIRS
    .filter(p => p[1] !== correct)
    .map(p => p[1])
    .slice(0, 3);
  
  const options = shuffle([correct, ...distractors.slice(0, 3)]);
  const correctIndex = options.indexOf(correct);
  
  return { word, options, correctIndex };
}

export default function WordPairs({ durationMs = 30000, autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(() => buildRound());
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
    setScore(0);
    setAttempts(0);
    setTimeLeftMs(durationMs);
    setRound(buildRound());
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

  function onSelect(index: number) {
    if (phase !== 'running') return;
    
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    
    if (index === round.correctIndex) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    
    
      setFeedback(null);
      setRound(buildRound());
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Pairs</Text>
        <Text style={styles.subtitle}>Match the word with its opposite</Text>
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
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.ceil(timeLeftMs / 1000)}</Text>
              <Text style={styles.statLabel}>Seconds</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{attempts}</Text>
              <Text style={styles.statLabel}>Rounds</Text>
            </View>
          </View>

          <View style={[styles.wordCard, feedback === 'correct' && styles.cardCorrect, feedback === 'wrong' && styles.cardWrong]}>
            <Text style={styles.wordLabel}>Find the opposite of:</Text>
            <Text style={styles.word}>{round.word}</Text>
          </View>

          <View style={styles.optionsGrid}>
            {round.options.map((opt, idx) => (
              <Pressable
                key={`${opt}-${idx}`}
                testID={`option-${idx}`}
                style={styles.optionBtn}
                onPress={() => onSelect(idx)}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🎯</Text>
          <Text style={styles.endTitle}>Game Over!</Text>
          <Text style={styles.endScore}>Score: {score}</Text>
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
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280' },
  wordCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  wordLabel: { fontSize: 12, color: '#6366F1', marginBottom: 4 },
  word: { fontSize: 24, fontWeight: '700', color: '#312E81' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  optionBtn: {
    width: '48%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 32, fontWeight: '800', color: '#6366F1', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
