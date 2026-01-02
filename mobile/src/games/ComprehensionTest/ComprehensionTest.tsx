import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'ComprehensionTest';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
};

type Props = {
  passage?: string;
  questions?: Question[];
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'reading' | 'questions' | 'ended';

const DEFAULT_PASSAGE = `Speed reading is a collection of reading methods that attempt to increase rates of reading without greatly reducing comprehension. Methods include chunking and minimizing subvocalization. The average reading speed is about 200 to 250 words per minute. Speed readers claim to read over 1000 words per minute.`;

const DEFAULT_QUESTIONS: Question[] = [
  {
    question: 'What is the average reading speed?',
    options: ['100-150 WPM', '200-250 WPM', '500-600 WPM', '1000+ WPM'],
    correctIndex: 1,
  },
  {
    question: 'What do speed readers claim to read?',
    options: ['Under 200 WPM', '500 WPM', 'Over 1000 WPM', 'Same as average'],
    correctIndex: 2,
  },
];

export default function ComprehensionTest({ passage = DEFAULT_PASSAGE, questions = DEFAULT_QUESTIONS, autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startRef = useRef<number>(0);
  const readStartRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const scoreRef = useRef(0);
  const answersRef = useRef<number[]>([]);

  // Auto-start when autoStart prop is true
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase]);

  function start(force = false) {
    if (!force && phase !== 'idle') return;
    reportedRef.current = false;
    scoreRef.current = 0;
    answersRef.current = [];
    setPhase('reading');
    setQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setFeedback(null);
    startRef.current = Date.now();
    readStartRef.current = Date.now();
  }

  function doneReading() {
    setPhase('questions');
  }

  function selectAnswer(index: number) {
    if (phase !== 'questions' || feedback !== null) return;
    setSelectedAnswer(index);

    const currentQ = questions[questionIndex];
    const correct = index === currentQ.correctIndex;

    if (correct) {
      scoreRef.current += 25;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    answersRef.current.push(index);
    setAnswers([...answersRef.current]);

    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);

      if (questionIndex + 1 >= questions.length) {
        finish();
      } else {
        setQuestionIndex(questionIndex + 1);
      }
    }, 1000);
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const correctCount = answersRef.current.filter((a, i) => a === questions[i].correctIndex).length;
    const accuracy = questions.length > 0 ? correctCount / questions.length : 0;

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { questionsTotal: questions.length, correctCount },
    });

    setPhase('ended');
  }

  function playAgain() {
    start(true);
  }

  const currentQ = questions[questionIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comprehension Test</Text>
        <Text style={styles.subtitle}>Read carefully, then answer questions</Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <Pressable testID="start-button" style={styles.startBtn} onPress={() => start()}>
            <Text style={styles.startBtnText}>Start Test</Text>
          </Pressable>
        </View>
      )}

      {phase === 'reading' && (
        <View style={styles.gameArea}>
          <ScrollView style={styles.passageBox}>
            <Text testID="passage" style={styles.passage}>{passage}</Text>
          </ScrollView>

          <Pressable testID="done-reading" style={styles.doneBtn} onPress={doneReading}>
            <Text style={styles.doneBtnText}>Done Reading</Text>
          </Pressable>
        </View>
      )}

      {phase === 'questions' && currentQ && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.questionBox]}>
              <Text style={styles.statValue}>{questionIndex + 1}/{questions.length}</Text>
              <Text style={styles.statLabel}>Question</Text>
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text testID="question-text" style={styles.questionText}>{currentQ.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, i) => (
              <Pressable
                key={i}
                testID={`option-${i}`}
                style={[
                  styles.optionBtn,
                  selectedAnswer === i && feedback === 'correct' && styles.optionCorrect,
                  selectedAnswer === i && feedback === 'wrong' && styles.optionWrong,
                  feedback === 'wrong' && i === currentQ.correctIndex && styles.optionCorrect,
                ]}
                onPress={() => selectAnswer(i)}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>📚</Text>
          <Text style={styles.endTitle}>Test Complete!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            {answers.filter((a, i) => a === questions[i].correctIndex).length}/{questions.length} correct
          </Text>
          <Pressable style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Try Again</Text>
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
  idleContent: { flex: 1, justifyContent: 'center' },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  startBtn: { backgroundColor: '#059669', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  passageBox: { flex: 1, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: '#6EE7B7' },
  passage: { fontSize: 16, color: '#065F46', lineHeight: 24 },
  doneBtn: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  doneBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#D1FAE5', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  questionBox: { backgroundColor: '#A7F3D0' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#065F46' },
  statLabel: { fontSize: 10, color: '#047857' },
  questionCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  questionText: { fontSize: 16, fontWeight: '600', color: '#065F46' },
  optionsContainer: { gap: 8 },
  optionBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  optionCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  optionWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  optionText: { fontSize: 14, color: '#065F46', textAlign: 'center' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#059669', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
