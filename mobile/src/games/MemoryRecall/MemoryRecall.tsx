import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'MemoryRecall';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

type Props = {
  startingLength?: number;
  displayMs?: number;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'show' | 'recall' | 'ended';

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

export default function MemoryRecall({ startingLength = 3, displayMs = 1500, autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(startingLength);
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const scoreRef = useRef(0);
  const levelRef = useRef(startingLength);
  const sequenceRef = useRef<number[]>([]);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
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
    scoreRef.current = 0;
    levelRef.current = startingLength;
    setPhase('show');
    setLevel(startingLength);
    setScore(0);
    setInput([]);
    setFeedback(null);
    startRef.current = Date.now();

    const seq = generateSequence(startingLength);
    sequenceRef.current = seq;
    setSequence(seq);

    showTimeoutRef.current = setTimeout(() => {
      setPhase('recall');
    }, displayMs);
  }

  function pressDigit(digit: number) {
    if (phase !== 'recall') return;

    const newInput = [...input, digit];
    setInput(newInput);

    if (newInput.length === sequenceRef.current.length) {
      const correct = newInput.every((d, i) => d === sequenceRef.current[i]);

      if (correct) {
        scoreRef.current += levelRef.current * 10;
        setScore(scoreRef.current);
        setFeedback('correct');

        
          setFeedback(null);
          levelRef.current += 1;
          setLevel(levelRef.current);
          setInput([]);

          const seq = generateSequence(levelRef.current);
          sequenceRef.current = seq;
          setSequence(seq);
          setPhase('show');

          showTimeoutRef.current = setTimeout(() => {
            setPhase('recall');
          }, displayMs);
      } else {
        setFeedback('wrong');
        
          finish();
      }
    }
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
      score: scoreRef.current,
      accuracy: 1,
      details: { maxLevel: levelRef.current },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function playAgain() {
    setPhase('idle');
    setTimeout(start, 50);
  }

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Recall</Text>
        <Text style={styles.subtitle}>Remember and repeat the sequence</Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Start Game</Text>
          </Pressable>
        </View>
      )}

      {phase === 'show' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.levelBox]}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>

          <View testID="sequence-display" style={styles.sequenceCard}>
            <Text testID="sequence" style={styles.sequence}>{sequence.join(' ')}</Text>
          </View>

          <Text style={styles.instruction}>Memorize this sequence!</Text>
        </View>
      )}

      {phase === 'recall' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.levelBox]}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>

          <View style={[
            styles.inputCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <Text testID="input-display" style={styles.inputDisplay}>
              {input.length > 0 ? input.join(' ') : 'Tap digits...'}
            </Text>
          </View>

          <View testID="digit-keypad" style={styles.keypad}>
            {digits.map((d) => (
              <Pressable
                key={d}
                testID={`digit-${d}`}
                style={styles.digitBtn}
                onPress={() => pressDigit(d)}
              >
                <Text style={styles.digitText}>{d}</Text>
              </Pressable>
            ))}
            <Pressable testID="submit-btn" style={styles.submitKeyBtn} onPress={() => {}}>
              <Text style={styles.digitText}>✓</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🧠</Text>
          <Text style={styles.endTitle}>Game Over!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>Max Level: {level} digits</Text>
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
  startBtn: { backgroundColor: '#8B5CF6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#EDE9FE', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  levelBox: { backgroundColor: '#DDD6FE' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#5B21B6' },
  statLabel: { fontSize: 10, color: '#6D28D9' },
  sequenceCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  sequence: { fontSize: 32, fontWeight: '800', color: '#5B21B6', letterSpacing: 8 },
  instruction: { textAlign: 'center', color: '#6B7280', fontSize: 12 },
  inputCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#A78BFA',
    minHeight: 60,
    justifyContent: 'center',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  inputDisplay: { fontSize: 24, fontWeight: '700', color: '#5B21B6', textAlign: 'center', letterSpacing: 4 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  digitBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitKeyBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: { color: 'white', fontSize: 24, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#8B5CF6', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#8B5CF6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
