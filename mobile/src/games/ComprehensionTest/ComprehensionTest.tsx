import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  COMPREHENSION_PASSAGES,
  COMPREHENSION_PASSAGE_POOLS,
  type ComprehensionPassage,
  type ComprehensionQuestion,
} from '../../data/comprehensionPassages';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { borderRadius, colors, spacing } from '../../theme/colors';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, type Difficulty } from '../gameHooks';

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
  targetWpm?: number;
  chunkSize?: number;
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
  targetWpm: targetWpmProp,
  chunkSize: chunkSizeProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const pool = COMPREHENSION_PASSAGE_POOLS[difficulty];
  const fallback = getComprehensionChallenge(difficulty);
  const [challenge, setChallenge] = useState<ComprehensionPassage>(fallback);
  const [phase, setPhase] = useState<Phase>('idle');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isPacing, setIsPacing] = useState(true);

  const passage = passageProp ?? challenge.text;
  const questions = questionsProp ?? challenge.questions;
  const targetWpm = targetWpmProp ?? challenge.targetWpm;
  const chunkSize = chunkSizeProp ?? challenge.chunkSize;
  const chunks = useMemo(() => {
    const words = passage.split(/\s+/).filter(Boolean);
    return Array.from(
      { length: Math.ceil(words.length / chunkSize) },
      (_, index) => words.slice(index * chunkSize, (index + 1) * chunkSize).join(' ')
    );
  }, [chunkSize, passage]);

  const startRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const answersRef = useRef<number[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousContentIdRef = useRef('');

  useEffect(() => {
    if (phase !== 'reading' || !isPacing || chunks.length <= 1) return;
    const intervalMs = Math.max(
      180,
      Math.round((chunkSize * 60_000) / targetWpm)
    );
    const interval = setInterval(() => {
      setChunkIndex((current) => {
        if (current >= chunks.length - 1) {
          setIsPacing(false);
          return current;
        }
        return current + 1;
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [chunkSize, chunks.length, isPacing, phase, targetWpm]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    []
  );

  useAutoStart(autoStart, phase, true, start);

  function chooseChallenge(): ComprehensionPassage {
    if (passageProp) return fallback;
    const eligible = pool.filter(
      (item) => item.id !== previousContentIdRef.current
    );
    return eligible[Math.floor(Math.random() * eligible.length)] ?? fallback;
  }

  function start(force = false) {
    if (!force && phase !== 'idle') return;
    const nextChallenge = chooseChallenge();
    previousContentIdRef.current = nextChallenge.id;
    setChallenge(nextChallenge);
    cancelledRef.current = false;
    reportedRef.current = false;
    scoreRef.current = 0;
    answersRef.current = [];
    setQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setFeedback(null);
    setChunkIndex(0);
    setIsPacing(true);
    startRef.current = Date.now();
    setPhase('reading');
  }

  function doneReading() {
    if (phase !== 'reading') return;
    setIsPacing(false);
    setPhase('questions');
  }

  function selectAnswer(index: number) {
    if (phase !== 'questions' || feedback !== null) return;
    const currentQuestion = questions[questionIndex];
    if (!currentQuestion) return;
    const correct = index === currentQuestion.correctIndex;
    setSelectedAnswer(index);
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    answersRef.current.push(index);
    setAnswers([...answersRef.current]);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setFeedback(null);
      setSelectedAnswer(null);
      if (questionIndex + 1 >= questions.length) finish();
      else setQuestionIndex((current) => current + 1);
    }, 1_000);
  }

  function finish() {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    const now = Date.now();
    const correctCount = answersRef.current.filter(
      (answer, index) => answer === questions[index]?.correctIndex
    ).length;
    const accuracy = questions.length > 0 ? correctCount / questions.length : 0;
    const scorePercent = Math.round(accuracy * 100);
    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, scorePercent).catch(
      () => undefined
    );
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs: Math.max(0, now - startRef.current),
      score: scorePercent,
      accuracy,
      details: {
        activityType: 'paced-comprehension',
        contentId: passageProp ? 'custom' : challenge.sampleId,
        pacedChallengeId: passageProp ? 'custom' : challenge.id,
        challenge: passageProp ? 'custom' : challenge.challenge,
        questionsTotal: questions.length,
        correctCount,
        difficulty,
        targetWpm,
        configuredPaceOnly: true,
        chunkSize,
        wordCount: 0,
        wpm: 0,
        comprehensionCorrect: correctCount === questions.length,
        contentPoolSize: pool.length,
      },
    });
  }

  const currentQuestion = questions[questionIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comprehension</Text>
      <Text style={styles.subtitle}>
        Follow a {targetWpm} WPM guide, then answer without the passage
      </Text>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={() => start()}
          startLabel="Start paced reading"
          containerStyle={styles.idle}
          buttonStyle={styles.primaryButton}
          buttonTextStyle={styles.primaryButtonText}
        />
      )}

      {phase === 'reading' && (
        <View style={styles.gameArea}>
          <StatsRow
            items={[
              { key: 'pace', value: targetWpm, label: 'Target WPM' },
              {
                key: 'progress',
                value: `${Math.min(chunkIndex + 1, chunks.length)}/${chunks.length}`,
                label: 'Chunk',
              },
            ]}
          />
          <ReadingColumn
            style={[styles.readingArea, readingDisplay.column]}
          >
            <ScrollView style={[styles.passageBox, readingDisplay.surface]}>
              <Text
                testID="passage"
                style={[styles.passage, readingDisplay.text]}
              >
                {chunks.map((chunk, index) => (
                  <Text
                    key={`${index}-${chunk}`}
                    testID={`paced-chunk-${index}`}
                    style={index === chunkIndex ? styles.activeChunk : undefined}
                  >
                    {chunk}{index < chunks.length - 1 ? ' ' : ''}
                  </Text>
                ))}
              </Text>
            </ScrollView>
          </ReadingColumn>
          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              testID="toggle-pacing"
              onPress={() => setIsPacing((current) => !current)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {isPacing ? 'Pause guide' : 'Resume guide'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              testID="done-reading"
              style={styles.primaryButton}
              onPress={doneReading}
            >
              <Text style={styles.primaryButtonText}>Finish reading safely</Text>
            </Pressable>
          </View>
          <Text style={styles.paceNote}>
            {targetWpm} WPM is the configured guide, not a measured reading result.
          </Text>
        </View>
      )}

      {phase === 'questions' && currentQuestion && (
        <View style={styles.gameArea}>
          <StatsRow
            items={[
              { key: 'score', value: score, label: 'Correct' },
              {
                key: 'question',
                value: `${questionIndex + 1}/${questions.length}`,
                label: 'Question',
              },
            ]}
          />
          <View style={styles.questionCard}>
            <Text testID="question-text" style={styles.questionText}>
              {currentQuestion.question}
            </Text>
          </View>
          <View style={styles.options}>
            {currentQuestion.options.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                key={option}
                testID={`option-${index}`}
                onPress={() => selectAnswer(index)}
                style={[
                  styles.option,
                  selectedAnswer === index &&
                    feedback === 'correct' &&
                    styles.correctOption,
                  selectedAnswer === index &&
                    feedback === 'wrong' &&
                    styles.wrongOption,
                  feedback === 'wrong' &&
                    index === currentQuestion.correctIndex &&
                    styles.correctOption,
                ]}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>Comprehension complete</Text>
          <Text style={styles.endScore}>
            {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
          </Text>
          <Text style={styles.endMeta}>
            {answers.filter((answer, index) => answer === questions[index]?.correctIndex).length}/{questions.length} correct
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            onPress={() => start(true)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.sm },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 2 },
  idle: { flex: 1 },
  gameArea: { flex: 1, gap: 12, paddingTop: 12 },
  readingArea: { flex: 1 },
  passageBox: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  passage: { color: colors.textPrimary, fontSize: 18, lineHeight: 30 },
  activeChunk: {
    backgroundColor: colors.warningSurface,
    color: colors.warningForeground,
    fontWeight: '800',
  },
  controls: { flexDirection: 'row', gap: 8 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: borderRadius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  primaryButtonText: { color: colors.onInteractive, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    borderRadius: borderRadius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  secondaryButtonText: { color: colors.interactivePrimary, fontSize: 14, fontWeight: '700' },
  paceNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  questionCard: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  questionText: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', lineHeight: 25 },
  options: { gap: 8 },
  option: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    padding: 14,
  },
  correctOption: { backgroundColor: colors.successSurface, borderColor: colors.successForeground },
  wrongOption: { backgroundColor: colors.errorSurface, borderColor: colors.errorForeground },
  optionText: { color: colors.textPrimary, fontSize: 14, textAlign: 'center' },
  endCard: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  endTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  endScore: { color: colors.interactivePrimary, fontSize: 48, fontWeight: '800' },
  endMeta: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
});
