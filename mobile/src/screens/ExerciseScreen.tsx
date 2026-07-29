import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { TextSample } from '../domain/types';
import { countWords, computeWpm } from '../domain/wpm';
import {
  assessReadingMeasurement,
  formatDuration,
} from '../domain/results';
import { formatReadingEstimate } from '../domain/readingPlan';
import {
  createQuestionOutcomes,
  type StoredQuestionOutcome,
} from '../domain/comprehensionDiagnostics';
import { BackButton } from '../ui/BackButton';
import { Button } from '../ui/Button';
import { ReadingColumn, ResponsiveShell } from '../ui/ResponsiveShell';
import { useReadingDisplay } from '../ui/ReadingDisplayPreferences';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../theme/colors';

type Props = {
  sample: TextSample;
  onFinish: (payload: {
    startedAtIso: string;
    finishedAtIso: string;
    elapsedMs: number;
    wordCount: number;
    wpm: number;
    comprehensionCorrect: boolean;
    details: {
      schemaVersion: 1;
      activityType: 'measured-reading';
      contentId: string;
      contentVersion: number;
      comparisonBand: string;
      measurementValid: boolean;
      qualityFlag?: 'too-short' | 'implausible-speed';
      comprehensionCorrectCount: number;
      comprehensionQuestionCount: number;
      questionOutcomes: StoredQuestionOutcome[];
    };
  }) => void;
  onCancel: () => void;
};

type Phase = 'idle' | 'reading' | 'question';

export function ExerciseScreen({ sample, onFinish, onCancel }: Props) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const startedAtRef = useRef<number | null>(null);
  const readingFinishedAtRef = useRef<number | null>(null);

  const wordCount = useMemo(() => countWords(sample.text), [sample.text]);
  const questions = useMemo(
    () => sample.questions ?? [{
      id: `${sample.id}-legacy-question`,
      ...sample.question,
      type: 'main-idea' as const,
      rationale: 'Review the passage for the keyed answer.',
      answerDependency: 'passage-required' as const,
    }],
    [sample]
  );

  useEffect(() => {
    if (phase !== 'reading' || startedAtRef.current === null) return;

    const timer = setInterval(() => {
      setElapsedMs(Date.now() - (startedAtRef.current ?? Date.now()));
    }, 50);
    return () => clearInterval(timer);
  }, [phase]);

  function start() {
    const now = Date.now();
    startedAtRef.current = now;
    readingFinishedAtRef.current = null;
    setElapsedMs(0);
    setSelectedAnswers({});
    setPhase('reading');
  }

  function finishReading() {
    if (startedAtRef.current === null) return;
    const finishedAt = Date.now();
    readingFinishedAtRef.current = finishedAt;
    setElapsedMs(finishedAt - startedAtRef.current);
    setPhase('question');
  }

  function submitAnswer() {
    const startedAt = startedAtRef.current;
    const finishedAt = readingFinishedAtRef.current;
    if (
      startedAt === null ||
      finishedAt === null ||
      Object.keys(selectedAnswers).length !== questions.length
    ) {
      return;
    }

    const readingElapsedMs = Math.max(1, finishedAt - startedAt);
    const quality = assessReadingMeasurement(wordCount, readingElapsedMs);
    const correctCount = questions.reduce(
      (total, question, index) =>
        total + (selectedAnswers[index] === question.correctIndex ? 1 : 0),
      0
    );
    const questionOutcomes = createQuestionOutcomes(
      questions,
      selectedAnswers
    );
    onFinish({
      startedAtIso: new Date(startedAt).toISOString(),
      finishedAtIso: new Date(finishedAt).toISOString(),
      elapsedMs: readingElapsedMs,
      wordCount,
      wpm: computeWpm(wordCount, readingElapsedMs),
      comprehensionCorrect: correctCount === questions.length,
      details: {
        schemaVersion: 1,
        activityType: 'measured-reading',
        contentId: sample.id,
        contentVersion: sample.version ?? 1,
        comparisonBand: sample.comparisonBand,
        measurementValid: quality.valid,
        qualityFlag: quality.reason,
        comprehensionCorrectCount: correctCount,
        comprehensionQuestionCount: questions.length,
        questionOutcomes,
      },
    });
  }

  function handleCancel() {
    onCancel();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ResponsiveShell>
      <View style={styles.header}>
        <BackButton onPress={handleCancel} />
        <Text style={styles.headerTitle}>Measured reading</Text>
        <View style={styles.headerSpacer} />
      </View>

      {phase === 'idle' && (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Text style={styles.heroIconText}>Aa</Text>
            </View>
            <Text style={styles.eyebrow}>READ • RECALL • IMPROVE</Text>
            <Text style={styles.title}>{sample.title}</Text>
            <Text style={styles.description}>
              The timer starts only when the passage appears. Read at a sustainable
              pace, then answer {questions.length}{' '}
              {questions.length === 1 ? 'question' : 'questions'} without looking
              back.
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{wordCount}</Text>
                <Text style={styles.metaLabel}>words</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>
                  {formatReadingEstimate(sample)}
                </Text>
                <Text style={styles.metaLabel}>reading</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{questions.length}</Text>
                <Text style={styles.metaLabel}>
                  {questions.length === 1 ? 'question' : 'questions'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>◎</Text>
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Train useful speed</Text>
              <Text style={styles.tipText}>
                Faster is only better when you can still explain the main idea.
              </Text>
            </View>
          </View>

          <Button testID="start-reading" label="Begin measured read" onPress={start} />
        </>
      )}

      {phase === 'reading' && (
        <>
          <View style={styles.readerHeader}>
            <View style={styles.timerPill}>
              <Text style={styles.timerLabel}>TIME</Text>
              <Text style={styles.timerValue}>{formatDuration(elapsedMs)}</Text>
            </View>
            <View style={styles.wordPill}>
              <Text style={styles.wordPillValue}>{wordCount}</Text>
              <Text style={styles.wordPillLabel}>words</Text>
            </View>
          </View>

          <ReadingColumn
            testID="measured-reading-column"
            style={readingDisplay.column}
          >
            <View style={[styles.readerCard, readingDisplay.surface]}>
              <Text style={[styles.readerTitle, readingDisplay.title]}>
                {sample.title}
              </Text>
              <Text
                style={[styles.readerText, readingDisplay.text]}
              >
                {sample.text}
              </Text>
            </View>
          </ReadingColumn>

          <Button
            testID="finish-reading"
            label="I’m done reading"
            onPress={finishReading}
          />
          <Text style={styles.finishHint}>
            Your reading time stops before the comprehension question.
          </Text>
        </>
      )}

      {phase === 'question' && (
        <>
          <View style={styles.questionHeader}>
            <Text style={styles.eyebrow}>COMPREHENSION CHECK</Text>
            <Text style={styles.questionTitle}>What did you retain?</Text>
            <Text style={styles.questionMeta}>
              Reading time: {formatDuration(elapsedMs)}
            </Text>
          </View>

          <View style={styles.questionCard}>
            {questions.map((question, questionIndex) => (
              <View key={question.id} style={styles.questionBlock}>
                <Text style={styles.question}>
                  {questionIndex + 1}. {question.prompt}
                </Text>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel={`Question ${questionIndex + 1}`}
                >
                  {question.choices.map((choice, choiceIndex) => {
                    const selected =
                      selectedAnswers[questionIndex] === choiceIndex;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={choice}
                        key={`${choice}-${choiceIndex}`}
                        testID={
                          questionIndex === 0
                            ? `choice-${choiceIndex}`
                            : `choice-${questionIndex}-${choiceIndex}`
                        }
                        style={({ pressed }) => [
                          styles.choice,
                          selected && styles.choiceSelected,
                          pressed && styles.choicePressed,
                        ]}
                        onPress={() =>
                          setSelectedAnswers((answers) => ({
                            ...answers,
                            [questionIndex]: choiceIndex,
                          }))
                        }
                      >
                        <View style={[styles.radio, selected && styles.radioSelected]}>
                          {selected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                          {choice}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <Button
            testID="submit-answer"
            label="See my result"
            disabled={Object.keys(selectedAnswers).length !== questions.length}
            onPress={submitAnswer}
          />
        </>
      )}
      </ResponsiveShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    userSelect: 'none',
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  heroCard: {
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  heroIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderRadius: 24,
    backgroundColor: colors.surfaceTonal,
  },
  heroIconText: {
    color: colors.primaryDark,
    fontSize: 25,
    fontWeight: '800',
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    ...typography.h1,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  metaRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceTonal,
  },
  tipIcon: {
    color: colors.primaryDark,
    fontSize: 24,
  },
  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  readerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timerPill: {
    minWidth: 104,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  timerValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  wordPill: {
    minWidth: 88,
    minHeight: 54,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
  },
  wordPillValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  wordPillLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  readerCard: {
    width: '100%',
    alignSelf: 'center',
    marginBottom: spacing.md,
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  readerTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  readerText: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 30,
    letterSpacing: 0.1,
  },
  finishHint: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  questionHeader: {
    marginBottom: spacing.md,
  },
  questionTitle: {
    ...typography.h1,
    marginTop: spacing.xs,
  },
  questionMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  questionCard: {
    marginBottom: spacing.md,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  questionBlock: {
    marginBottom: spacing.md,
  },
  question: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
    marginBottom: spacing.md,
  },
  choice: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceTonal,
  },
  choicePressed: {
    opacity: 0.75,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textMuted,
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  choiceText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    marginLeft: 12,
  },
  choiceTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
