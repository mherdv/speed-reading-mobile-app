import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { useAutoStart, type Difficulty } from '../gameHooks';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import {
  COMPREHENSION_PASSAGES,
  type ComprehensionQuestion,
} from '../../data/comprehensionPassages';

const GAME_ID = 'ComprehensionTest';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  passage?: string;
  questions?: ComprehensionQuestion[];
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'reading' | 'questions' | 'ended';

export function getComprehensionChallenge(difficulty: Difficulty) {
  return COMPREHENSION_PASSAGES[difficulty];
}

export default function ComprehensionTest({
  passage: passageProp,
  questions: questionsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const challenge = getComprehensionChallenge(difficulty);
  const passage = passageProp ?? challenge.text;
  const questions = questionsProp ?? challenge.questions;
  const [phase, setPhase] = useState<Phase>('idle');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const answersRef = useRef<number[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount - prevent reporting results after back button
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, true, start);

  function start(force = false) {
    cancelledRef.current = false;
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
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    answersRef.current.push(index);
    setAnswers([...answersRef.current]);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
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
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const correctCount = answersRef.current.filter((a, i) => a === questions[i].correctIndex).length;
    const accuracy = questions.length > 0 ? correctCount / questions.length : 0;
    const scorePercent = Math.round(accuracy * 100);

    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, scorePercent).catch(
      () => undefined
    );
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scorePercent,
      accuracy,
      details: {
        activityType: 'comprehension',
        contentId: passageProp ? 'custom' : challenge.id,
        challenge: passageProp ? 'custom' : challenge.challenge,
        questionsTotal: questions.length,
        correctCount,
        difficulty,
      },
    });
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
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={() => start()}
          startLabel="Start Test"
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        />
      )}

      {phase === 'reading' && (
        <View style={styles.gameArea}>
          <ReadingColumn
            testID="comprehension-reading-column"
            style={styles.readingArea}
          >
            <ScrollView style={styles.passageBox}>
              <Text testID="passage" style={styles.passage}>{passage}</Text>
            </ScrollView>
          </ReadingColumn>

          <Pressable accessibilityRole="button" testID="done-reading" style={styles.doneBtn} onPress={doneReading}>
            <Text style={styles.doneBtnText}>Done Reading</Text>
          </Pressable>
        </View>
      )}

      {phase === 'questions' && currentQ && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'score',
                value: score,
                label: 'Correct',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'question',
                value: `${questionIndex + 1}/${questions.length}`,
                label: 'Question',
                containerStyle: [styles.statBox, styles.questionBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={styles.questionCard}>
            <Text testID="question-text" style={styles.questionText}>{currentQ.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt, i) => (
              <Pressable accessibilityRole="button"
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
          <Text style={styles.endScore}>
            {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
          </Text>
          <Text style={styles.endMeta}>
            {answers.filter((a, i) => a === questions[i].correctIndex).length}/{questions.length} correct
          </Text>
          <Pressable accessibilityRole="button" testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Try Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.sm },
  header: { marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  idleContent: { flex: 1, justifyContent: 'center' },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  startBtn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: borderRadius.md, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  passageBox: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readingArea: { flex: 1 },
  passage: { fontSize: 18, color: colors.textPrimary, lineHeight: 30 },
  doneBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' },
  doneBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: colors.surfaceTonal, paddingVertical: 6, paddingHorizontal: 14, borderRadius: borderRadius.md },
  questionBox: { backgroundColor: '#FCEDE5' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.primaryDark },
  statLabel: { fontSize: 10, color: colors.textSecondary },
  questionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  questionText: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, lineHeight: 25 },
  optionsContainer: { gap: 8 },
  optionBtn: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionCorrect: { backgroundColor: '#EAF8F2', borderColor: colors.success },
  optionWrong: { backgroundColor: '#FCECEF', borderColor: colors.error },
  optionText: { fontSize: 14, color: colors.textPrimary, textAlign: 'center' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  endScore: { fontSize: 48, fontWeight: '800', color: colors.primary, marginVertical: 8 },
  endMeta: { fontSize: 14, color: colors.textSecondary },
  playAgainBtn: { marginTop: 16, backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: borderRadius.md },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
