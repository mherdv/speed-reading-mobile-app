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
  phrases?: string[];
  displayMs?: number;
  totalRounds?: number;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'show' | 'choose' | 'ended';

const DEFAULT_PHRASES = [
  'The quick brown fox',
  'Speed reading skills',
  'Practice makes perfect',
  'Focus and concentrate',
  'Visual span training',
  'Read between the lines',
  'Knowledge is power',
  'Time flies quickly',
  'Actions speak louder',
  'Better late than never',
  'First things first',
  'Keep moving forward',
  'Learn from mistakes',
  'Stay calm and read',
  'Words have meaning',
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function TimedPhraseRecognition({ phrases = DEFAULT_PHRASES, displayMs = 500, totalRounds = 5, autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const phraseRef = useRef('');
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
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

  function pickPhrase(): { phrase: string; options: string[] } {
    const shuffled = shuffle(phrases);
    const phrase = shuffled[0];
    const distractors = shuffled.slice(1, 4);
    const opts = shuffle([phrase, ...distractors]);
    return { phrase, options: opts };
  }

  function start() {
    if (phase !== 'idle') return;
    reportedRef.current = false;
    scoreRef.current = 0;
    correctRef.current = 0;
    roundRef.current = 0;
    setPhase('show');
    setRound(0);
    setScore(0);
    setFeedback(null);
    setSelectedIndex(null);
    startRef.current = Date.now();

    const { phrase, options } = pickPhrase();
    phraseRef.current = phrase;
    setCurrentPhrase(phrase);
    setOptions(options);

    showTimeoutRef.current = setTimeout(() => {
      setPhase('choose');
    }, displayMs);
  }

  function choose(index: number) {
    if (phase !== 'choose') return;
    setSelectedIndex(index);

    const correct = options[index] === phraseRef.current;

    if (correct) {
      scoreRef.current += 20;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    
      setFeedback(null);
      setSelectedIndex(null);
      roundRef.current += 1;
      setRound(roundRef.current);

      if (roundRef.current >= totalRounds) {
        finish();
      } else {
        const { phrase, options } = pickPhrase();
        phraseRef.current = phrase;
        setCurrentPhrase(phrase);
        setOptions(options);
        setPhase('show');

        showTimeoutRef.current = setTimeout(() => {
          setPhase('choose');
        }, displayMs);
      }
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = totalRounds > 0 ? correctRef.current / totalRounds : 0;

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { rounds: totalRounds, correct: correctRef.current },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function playAgain() {
    setPhase('idle');
    setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timed Phrase Recognition</Text>
        <Text style={styles.subtitle}>Remember the phrase, then select it</Text>
      </View>

      {phase === 'idle' && (
        <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
          <Text style={styles.startBtnText}>Start Game</Text>
        </Pressable>
      )}

      {phase === 'show' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.roundBox]}>
              <Text style={styles.statValue}>{round + 1}/{totalRounds}</Text>
              <Text style={styles.statLabel}>Round</Text>
            </View>
          </View>

          <View testID="phrase-flash" style={styles.phraseCard}>
            <Text testID="phrase" style={styles.phrase}>{currentPhrase}</Text>
          </View>

          <Text style={styles.instruction}>Memorize this phrase!</Text>
        </View>
      )}

      {phase === 'choose' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.roundBox]}>
              <Text style={styles.statValue}>{round + 1}/{totalRounds}</Text>
              <Text style={styles.statLabel}>Round</Text>
            </View>
          </View>

          <Text style={styles.chooseTitle}>Which phrase did you see?</Text>

          <View testID="options-container" style={styles.optionsContainer}>
            {options.map((opt, i) => (
              <Pressable
                key={i}
                testID={`option-${i}`}
                style={[
                  styles.optionBtn,
                  selectedIndex === i && feedback === 'correct' && styles.optionCorrect,
                  selectedIndex === i && feedback === 'wrong' && styles.optionWrong,
                  feedback === 'wrong' && opt === phraseRef.current && styles.optionCorrect,
                ]}
                onPress={() => choose(i)}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>📖</Text>
          <Text style={styles.endTitle}>Complete!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            {correctRef.current}/{totalRounds} correct ({Math.round((correctRef.current / totalRounds) * 100)}%)
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
  startBtn: { backgroundColor: '#0284C7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#E0F2FE', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  roundBox: { backgroundColor: '#BAE6FD' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0369A1' },
  statLabel: { fontSize: 10, color: '#0284C7' },
  phraseCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  phrase: { fontSize: 20, fontWeight: '700', color: '#0369A1', textAlign: 'center' },
  instruction: { textAlign: 'center', color: '#6B7280', fontSize: 12 },
  chooseTitle: { fontSize: 16, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 16 },
  optionsContainer: { gap: 10 },
  optionBtn: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  optionCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  optionWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  optionText: { fontSize: 14, color: '#0369A1', textAlign: 'center' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#0284C7', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#0284C7', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
