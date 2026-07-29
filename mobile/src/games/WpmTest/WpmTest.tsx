import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import {
  getBaselineReadingPool,
  type WpmQuestion,
} from '../../data/wpmTestContent';
import { assessReadingMeasurement, formatDuration } from '../../domain/results';
import { createQuestionOutcomes } from '../../domain/comprehensionDiagnostics';
import type { TextSample } from '../../domain/types';
import { computeWpm, countWords } from '../../domain/wpm';
import { colors } from '../../theme/colors';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import type { Difficulty } from '../gameHooks';
import { useAutoStart } from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'WpmTest';

type Props = {
  sample?: TextSample;
  questions?: readonly WpmQuestion[];
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'reading' | 'questions' | 'ended';

function questionsFromSample(
  sample: TextSample,
  difficulty: Difficulty
): readonly WpmQuestion[] {
  const authored = sample.questions?.slice(0, 3);
  if (authored && authored.length > 0) return authored;
  return [
    {
      id: `${sample.id}-question`,
      prompt: sample.question.prompt,
      choices: sample.question.choices,
      correctIndex: sample.question.correctIndex,
      type: sample.question.type ?? 'main-idea',
      rationale:
        sample.question.rationale ??
        'The keyed answer follows from the connected passage.',
      answerDependency: 'passage-required',
    },
  ];
}

export default function WpmTest({
  sample: sampleProp,
  questions: questionsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const pool = useMemo(() => getBaselineReadingPool(difficulty), [difficulty]);
  const initialItem = pool[0]!;
  const [activeSample, setActiveSample] = useState<TextSample>(
    sampleProp ?? initialItem.sample
  );
  const [activeQuestions, setActiveQuestions] = useState<readonly WpmQuestion[]>(
    questionsProp && questionsProp.length > 0
      ? questionsProp
      :
      (sampleProp
        ? questionsFromSample(sampleProp, difficulty)
        : initialItem.questions)
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{
    wpm: number;
    wordCount: number;
    correct: number;
    questionCount: number;
    qualityFlag?: 'too-short' | 'implausible-speed';
  } | null>(null);

  const startedAtRef = useRef(0);
  const readingFinishedAtRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const previousSampleIdRef = useRef('');

  useEffect(() => {
    if (phase !== 'reading') return;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 50);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
    },
    []
  );

  function chooseItem() {
    if (sampleProp) {
      return {
        sample: sampleProp,
        questions:
          questionsProp && questionsProp.length > 0
            ? questionsProp
            : questionsFromSample(sampleProp, difficulty),
      };
    }
    const eligible = pool.filter(
      (item) => item.sample.id !== previousSampleIdRef.current
    );
    return eligible[Math.floor(Math.random() * eligible.length)] ?? initialItem;
  }

  function start() {
    if (phase !== 'idle' && phase !== 'ended') return;
    const item = chooseItem();
    previousSampleIdRef.current = item.sample.id;
    setActiveSample(item.sample);
    setActiveQuestions(item.questions);
    setAnswers({});
    setResult(null);
    setElapsedMs(0);
    reportedRef.current = false;
    cancelledRef.current = false;
    startedAtRef.current = Date.now();
    readingFinishedAtRef.current = 0;
    setPhase('reading');
  }

  useAutoStart(autoStart, phase, true, start);

  function finishReading() {
    if (phase !== 'reading') return;
    readingFinishedAtRef.current = Date.now();
    setElapsedMs(
      Math.max(1, readingFinishedAtRef.current - startedAtRef.current)
    );
    setPhase('questions');
  }

  function submitQuestions() {
    if (
      phase !== 'questions' ||
      Object.keys(answers).length !== activeQuestions.length ||
      reportedRef.current ||
      cancelledRef.current
    ) {
      return;
    }
    reportedRef.current = true;
    const readingElapsedMs = Math.max(
      1,
      readingFinishedAtRef.current - startedAtRef.current
    );
    const wordCount = countWords(activeSample.text);
    const wpm = computeWpm(wordCount, readingElapsedMs);
    const correct = activeQuestions.reduce(
      (total, question, index) =>
        total + (answers[index] === question.correctIndex ? 1 : 0),
      0
    );
    const accuracy = correct / activeQuestions.length;
    const quality = assessReadingMeasurement(wordCount, readingElapsedMs);
    const questionOutcomes = createQuestionOutcomes(activeQuestions, answers);
    setResult({
      wpm,
      wordCount,
      correct,
      questionCount: activeQuestions.length,
      qualityFlag: quality.reason,
    });
    setPhase('ended');
    void updateProgress(
      GAME_ID,
      accuracy >= 0.8 && quality.valid,
      wpm,
      difficulty
    ).catch(() => undefined);
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(readingFinishedAtRef.current).toISOString(),
      elapsedMs: readingElapsedMs,
      score: correct,
      accuracy,
      details: {
        schemaVersion: 1,
        activityType: 'measured-reading',
        contentId: activeSample.id,
        contentVersion: activeSample.version ?? 1,
        comparisonBand: activeSample.comparisonBand,
        wordCount,
        wpm,
        comprehensionCorrect: correct === activeQuestions.length,
        comprehensionCorrectCount: correct,
        comprehensionQuestionCount: activeQuestions.length,
        questionOutcomes,
        measurementValid: quality.valid,
        qualityFlag: quality.reason,
        difficulty,
        source: 'TEXT_SAMPLES',
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Baseline Reading</Text>
      <Text style={styles.subtitle}>
        Read one fresh passage toward your three-reading personal estimate
      </Text>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          containerStyle={styles.idle}
          buttonStyle={styles.primaryButton}
          buttonTextStyle={styles.primaryButtonText}
        />
      )}

      {phase === 'reading' && (
        <ScrollView testID="wpm-reading" contentContainerStyle={styles.scrollContent}>
          <View style={styles.timerRow}>
            <Text style={styles.timerText}>
              {formatDuration(elapsedMs)}
            </Text>
            <Text style={styles.wordCount}>{countWords(activeSample.text)} words</Text>
          </View>
          <ReadingColumn style={readingDisplay.column}>
            <View style={[styles.passageCard, readingDisplay.surface]}>
              <Text style={[styles.passageTitle, readingDisplay.title]}>
                {activeSample.title}
              </Text>
              <Text
                testID="wpm-passage"
                style={[styles.passageText, readingDisplay.text]}
              >
                {activeSample.text}
              </Text>
            </View>
          </ReadingColumn>
          <Pressable
            accessibilityRole="button"
            testID="finish-wpm-reading"
            onPress={finishReading}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>I’m done reading</Text>
          </Pressable>
          <Text style={styles.hint}>Reading time stops before the questions.</Text>
        </ScrollView>
      )}

      {phase === 'questions' && (
        <ScrollView testID="wpm-questions" contentContainerStyle={styles.scrollContent}>
          <Text style={styles.questionHeading}>What did you retain?</Text>
          {activeQuestions.map((question, questionIndex) => (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionText}>{question.prompt}</Text>
              {question.choices.map((choice, choiceIndex) => {
                const selected = answers[questionIndex] === choiceIndex;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={`${question.id}-${choiceIndex}`}
                    testID={`wpm-question-${questionIndex}-option-${choiceIndex}`}
                    onPress={() =>
                      setAnswers((current) => ({
                        ...current,
                        [questionIndex]: choiceIndex,
                      }))
                    }
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {choice}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: Object.keys(answers).length !== activeQuestions.length,
            }}
            disabled={Object.keys(answers).length !== activeQuestions.length}
            testID="submit-wpm-questions"
            onPress={submitQuestions}
            style={[
              styles.primaryButton,
              Object.keys(answers).length !== activeQuestions.length &&
                styles.disabledButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>See result</Text>
          </Pressable>
        </ScrollView>
      )}

      {phase === 'ended' && result && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>Baseline reading complete</Text>
          <Text testID="wpm-result" style={styles.endWpm}>{result.wpm} WPM</Text>
          <Text style={styles.endMeta}>
            {result.correct}/{result.questionCount} questions correct · {result.wordCount} words
          </Text>
          {result.qualityFlag && (
            <Text testID="quality-flag" style={styles.qualityWarning}>
              {result.qualityFlag === 'too-short'
                ? 'Too brief for a stable personal estimate'
                : 'Rate is above the personal-estimate quality range'}
            </Text>
          )}
          {!result.qualityFlag && !sampleProp && (
            <Text testID="baseline-valid" style={styles.validMessage}>
              Valid baseline passage · complete three different passages for
              your personal estimate
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            onPress={start}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Read Another Passage</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 2 },
  idle: { flex: 1 },
  scrollContent: { gap: 14, paddingBottom: 20, paddingTop: 14 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timerText: { color: colors.interactivePrimary, fontSize: 18, fontWeight: '800' },
  wordCount: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  passageCard: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  passageTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  passageText: { color: colors.textPrimary, fontSize: 18, lineHeight: 29 },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  questionHeading: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  questionCard: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  questionText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', lineHeight: 23 },
  option: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionSelected: { backgroundColor: colors.infoSurface, borderColor: colors.interactiveInfo },
  optionText: { color: colors.textSecondary, fontSize: 14 },
  optionTextSelected: { color: colors.infoForeground, fontWeight: '700' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: colors.onInteractive, fontSize: 16, fontWeight: '700' },
  disabledButton: { backgroundColor: colors.disabledForeground, opacity: 0.65 },
  endCard: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  endTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  endWpm: { color: colors.interactivePrimary, fontSize: 42, fontWeight: '800' },
  endMeta: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  qualityWarning: {
    backgroundColor: colors.warningSurface,
    borderRadius: 10,
    color: colors.warningForeground,
    fontSize: 13,
    marginVertical: 8,
    padding: 10,
    textAlign: 'center',
  },
  validMessage: {
    backgroundColor: colors.successSurface,
    borderRadius: 10,
    color: colors.successForeground,
    fontSize: 13,
    marginVertical: 8,
    padding: 10,
    textAlign: 'center',
  },
});
