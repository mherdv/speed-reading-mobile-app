import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  beginNonCalibratingProgressSession,
  levelToStars,
  updateProgress,
} from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import {
  buildRotatingDeck,
  shuffleAnswerOptions,
  shuffleItems,
  type RandomSource,
} from '../../data/randomization';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import {
  useAutoStart,
  useGameProgress,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';
import type { GameReportPayload } from '../registry';
import {
  PAGE_GLIMPSE_ITEMS,
  type PageGlimpseItem,
  type PageGlimpseQuestionKind,
} from './pageGlimpseContent';

export const PAGE_GLIMPSE_GAME_ID = 'PageGlimpse';
const QUESTION_KIND_ORDER: readonly PageGlimpseQuestionKind[] = [
  'missing-phrase',
  'detail',
  'main-idea',
];

const QUESTION_KIND_LABELS: Record<PageGlimpseQuestionKind, string> = {
  'missing-phrase': 'MISSING PHRASE',
  detail: 'DETAIL',
  'main-idea': 'MAIN IDEA',
};

export type PageGlimpseConfig = {
  lineCount: 1 | 2 | 4;
  exposureMs: number;
  roundCount: number;
  complexity: 'direct' | 'connected' | 'dense';
  distractorSimilarity: 'broad' | 'related' | 'close';
};

export type PageGlimpseProps = {
  items?: readonly PageGlimpseItem[];
  roundCount?: number;
  exposureMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: RandomSource;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'glimpse' | 'question' | 'feedback' | 'ended';

export function getPageGlimpseConfig(
  difficulty: Difficulty
): PageGlimpseConfig {
  if (difficulty === 'easy') {
    return {
      lineCount: 1,
      exposureMs: 2_600,
      roundCount: 3,
      complexity: 'direct',
      distractorSimilarity: 'broad',
    };
  }
  if (difficulty === 'medium') {
    return {
      lineCount: 2,
      exposureMs: 2_100,
      roundCount: 4,
      complexity: 'connected',
      distractorSimilarity: 'related',
    };
  }
  return {
    lineCount: 4,
    exposureMs: 1_700,
    roundCount: 5,
    complexity: 'dense',
    distractorSimilarity: 'close',
  };
}

export function preparePageGlimpseItem(
  item: PageGlimpseItem,
  random: RandomSource = Math.random
): PageGlimpseItem {
  const shuffled = shuffleAnswerOptions(
    item.options,
    item.correctIndex,
    random
  );
  return {
    ...item,
    options: shuffled.options as [string, string, string, string],
    correctIndex: shuffled.correctIndex,
  };
}

/**
 * Selects without replacement and reserves one item of every available
 * question kind before filling the rest of the session.
 */
export function buildPageGlimpseSession(
  items: readonly PageGlimpseItem[],
  difficulty: Difficulty,
  count: number,
  sessionOrdinal: number,
  random: RandomSource = Math.random,
  avoidFirstId = ''
): PageGlimpseItem[] {
  const matchingItems = items.filter(
    (item) => item.difficulty === difficulty
  );
  const pool = matchingItems.length > 0 ? matchingItems : [...items];
  const safeCount = Math.min(
    pool.length,
    Math.max(0, Math.floor(count))
  );
  if (safeCount === 0) return [];

  const safeOrdinal = Math.max(0, Math.floor(sessionOrdinal));
  const required: PageGlimpseItem[] = [];
  for (const kind of QUESTION_KIND_ORDER) {
    if (required.length >= safeCount) break;
    const kindItems = pool.filter((item) => item.questionKind === kind);
    if (kindItems.length === 0) continue;
    required.push(kindItems[safeOrdinal % kindItems.length]!);
  }

  const requiredIds = new Set(required.map((item) => item.id));
  const remainingPool = pool.filter((item) => !requiredIds.has(item.id));
  const fillers = buildRotatingDeck(
    remainingPool,
    safeCount - required.length,
    safeOrdinal,
    random
  );
  const selected = shuffleItems([...required, ...fillers], random);

  if (
    selected.length > 1 &&
    selected[0]?.id === avoidFirstId
  ) {
    const replacementIndex = selected.findIndex(
      (item) => item.id !== avoidFirstId
    );
    if (replacementIndex > 0) {
      [selected[0], selected[replacementIndex]] = [
        selected[replacementIndex]!,
        selected[0]!,
      ];
    }
  }

  return selected.map((item) => preparePageGlimpseItem(item, random));
}

export default function PageGlimpse({
  items = PAGE_GLIMPSE_ITEMS,
  roundCount,
  exposureMs,
  difficulty = 'easy',
  autoStart = false,
  random = Math.random,
  onReportResult,
}: PageGlimpseProps) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const { screenReader } = useAccessibilityPreferences();
  const screenReaderRef = useRef(screenReader);
  const sessionManualModeRef = useRef(false);
  screenReaderRef.current = screenReader;
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(PAGE_GLIMPSE_GAME_ID, difficulty);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const phaseRef = useRef<Phase>('idle');
  const sessionItemsRef = useRef<PageGlimpseItem[]>([]);
  const sessionStartedAtRef = useRef(0);
  const sessionExposureMsRef = useRef(0);
  const sessionConfigRef = useRef<PageGlimpseConfig>(
    getPageGlimpseConfig(difficulty)
  );
  const correctCountRef = useRef(0);
  const completedRoundsRef = useRef(0);
  const glimpsesShownRef = useRef(0);
  const roundLockedRef = useRef(false);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const sessionOrdinalRef = useRef<number | null>(null);
  const previousContentIdRef = useRef('');

  function setCurrentPhase(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (progressLoaded && sessionOrdinalRef.current === null) {
      sessionOrdinalRef.current = gameProgress.totalPlays;
    }
  }, [gameProgress.totalPlays, progressLoaded]);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function beginGlimpse(index: number) {
    clearTrackedTimeouts();
    setRoundIndex(index);
    setSelectedOption(null);
    setLastAnswerCorrect(false);
    roundLockedRef.current = false;
    glimpsesShownRef.current += 1;
    setCurrentPhase('glimpse');
    if (sessionManualModeRef.current) return;
    scheduleTimeout(() => {
      if (cancelledRef.current || phaseRef.current !== 'glimpse') return;
      setCurrentPhase('question');
    }, sessionExposureMsRef.current);
  }

  function hideGlimpseForRecall() {
    if (phaseRef.current !== 'glimpse') return;
    clearTrackedTimeouts();
    setCurrentPhase('question');
  }

  function start(force = false) {
    if (
      !force &&
      phaseRef.current !== 'idle' &&
      phaseRef.current !== 'ended'
    ) {
      return;
    }
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    roundLockedRef.current = false;
    correctCountRef.current = 0;
    completedRoundsRef.current = 0;
    glimpsesShownRef.current = 0;
    sessionManualModeRef.current = screenReaderRef.current;
    setCorrectCount(0);

    const config = getPageGlimpseConfig(selectedDifficulty);
    const configuredRounds = Math.max(1, roundCount ?? config.roundCount);
    const sessionOrdinal =
      sessionOrdinalRef.current ?? gameProgress.totalPlays;
    sessionOrdinalRef.current = sessionOrdinal + 1;
    sessionConfigRef.current = config;
    sessionExposureMsRef.current = Math.max(
      100,
      exposureMs ?? config.exposureMs
    );
    sessionItemsRef.current = buildPageGlimpseSession(
      items,
      selectedDifficulty,
      configuredRounds,
      sessionOrdinal,
      random,
      previousContentIdRef.current
    );

    if (sessionItemsRef.current.length === 0) {
      setCurrentPhase('idle');
      return;
    }
    sessionStartedAtRef.current = Date.now();
    beginGlimpse(0);
  }

  function checkAnswer() {
    if (
      phaseRef.current !== 'question' ||
      selectedOption === null ||
      roundLockedRef.current
    ) {
      return;
    }
    const current = sessionItemsRef.current[roundIndex];
    if (!current) return;
    roundLockedRef.current = true;
    const correct = selectedOption === current.correctIndex;
    if (correct) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
    }
    completedRoundsRef.current += 1;
    setLastAnswerCorrect(correct);
    setCurrentPhase('feedback');
  }

  function continueAfterFeedback() {
    if (phaseRef.current !== 'feedback') return;
    const nextIndex = roundIndex + 1;
    if (nextIndex >= sessionItemsRef.current.length) {
      finish();
      return;
    }
    beginGlimpse(nextIndex);
  }

  function finish() {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const finishedAt = Date.now();
    const total = sessionItemsRef.current.length;
    const accuracy = total > 0 ? correctCountRef.current / total : 0;
    const score = Math.round(accuracy * 100);
    const adaptiveQualificationEligible =
      !sessionManualModeRef.current &&
      completedRoundsRef.current === total &&
      accuracy >= 0.7;
    const contentIds = sessionItemsRef.current.map((item) => item.id);
    const questionKindCounts = sessionItemsRef.current.reduce<
      Record<PageGlimpseQuestionKind, number>
    >(
      (counts, item) => ({
        ...counts,
        [item.questionKind]: counts[item.questionKind] + 1,
      }),
      { 'missing-phrase': 0, detail: 0, 'main-idea': 0 }
    );
    previousContentIdRef.current = contentIds[contentIds.length - 1] ?? '';

    setCurrentPhase('ended');
    const endNonCalibratingSession = sessionManualModeRef.current
      ? beginNonCalibratingProgressSession(PAGE_GLIMPSE_GAME_ID)
      : undefined;
    const progressUpdate = updateProgress(
      PAGE_GLIMPSE_GAME_ID,
      adaptiveQualificationEligible,
      score,
      selectedDifficulty
    );
    // updateProgress captures this guard synchronously before queueing storage.
    endNonCalibratingSession?.();
    void progressUpdate
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(sessionStartedAtRef.current).toISOString(),
      finishedAtIso: new Date(finishedAt).toISOString(),
      elapsedMs: Math.max(1, finishedAt - sessionStartedAtRef.current),
      score,
      accuracy,
      details: {
        schemaVersion: 1,
        activityType: 'brief-connected-text-retrieval',
        comparisonBand: `page-glimpse-${selectedDifficulty}-${sessionManualModeRef.current ? 'manual' : 'timed'}`,
        contentLanguage: 'en',
        contentIds,
        questionsTotal: total,
        correctCount: correctCountRef.current,
        completedRounds: completedRoundsRef.current,
        configuredRounds: total,
        glimpsesShown: glimpsesShownRef.current,
        exposureMs: sessionExposureMsRef.current,
        lineCount: sessionConfigRef.current.lineCount,
        complexity: sessionConfigRef.current.complexity,
        distractorSimilarity:
          sessionConfigRef.current.distractorSimilarity,
        questionKindCounts,
        difficulty: selectedDifficulty,
        exposureMode: sessionManualModeRef.current ? 'manual' : 'timed',
        screenReaderManualMode: sessionManualModeRef.current,
        adaptiveQualificationEligible,
        wpm: 0,
      },
    });
  }

  const config = getPageGlimpseConfig(selectedDifficulty);
  const eligibleCount =
    items.filter((item) => item.difficulty === selectedDifficulty).length ||
    items.length;
  const configuredRoundCount = Math.min(
    eligibleCount,
    Math.max(1, roundCount ?? config.roundCount)
  );
  const activeExposureMs = Math.max(100, exposureMs ?? config.exposureMs);
  const currentItem =
    sessionItemsRef.current[roundIndex] ??
    items.find((item) => item.difficulty === selectedDifficulty) ??
    items[0];
  const totalRounds =
    sessionItemsRef.current.length || configuredRoundCount;

  if (!currentItem) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.stageTitle}>No glimpses available</Text>
          <Text style={styles.bodyText}>Add at least one valid item to begin.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Page Glimpse</Text>
        <Text style={styles.subtitle}>
          Catch connected text, then retrieve its meaning
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[PAGE_GLIMPSE_GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          startLabel="Start Page Glimpse"
          startDisabled={!progressLoaded || eligibleCount === 0}
          onStart={() => start()}
        >
          <View style={styles.idleMeta}>
            <Text style={styles.idleMetaText}>
              {configuredRoundCount} rounds · {config.lineCount}{' '}
              {config.lineCount === 1 ? 'line' : 'lines'} ·{' '}
              {(activeExposureMs / 1_000).toFixed(1)} s
            </Text>
          </View>
          <Text style={styles.safetyText}>
            Read for meaning rather than guessing from word shape. This is a
            brief-retrieval drill, not a measured reading-speed test.
          </Text>
        </GameIdlePanel>
      )}

      {phase === 'glimpse' && (
        <View testID="page-glimpse-stage" style={styles.stage}>
          <View style={styles.stageHeader}>
            <View>
              <Text style={styles.eyebrow}>
                GLIMPSE {roundIndex + 1} OF {totalRounds}
              </Text>
              <Text style={styles.stageTitle}>Read the whole glimpse</Text>
            </View>
            <View style={styles.exposurePill}>
              <Text style={styles.exposureValue}>
                {sessionManualModeRef.current
                  ? 'Manual'
                  : `${(sessionExposureMsRef.current / 1_000).toFixed(1)} s`}
              </Text>
              <Text style={styles.exposureLabel}>
                {sessionManualModeRef.current ? 'screen reader' : 'exposure'}
              </Text>
            </View>
          </View>

          <ReadingColumn
            style={[styles.readingColumn, readingDisplay.column]}
            testID="page-glimpse-reading-column"
          >
            <View
              accessibilityLabel={currentItem.lines.join(' ')}
              accessible
              style={[
                styles.glimpseCard,
                readingDisplay.surface,
                { minHeight: 108 + currentItem.lines.length * 34 },
              ]}
              testID="page-glimpse-card"
            >
              <Text style={[styles.glimpseTitle, readingDisplay.title]}>
                {currentItem.title}
              </Text>
              <View style={styles.lineStack}>
                {currentItem.lines.map((line, index) => (
                  <Text
                    key={`${currentItem.id}-line-${index + 1}`}
                    style={[readingDisplay.text, styles.glimpseLine]}
                    testID={`page-glimpse-line-${index + 1}`}
                  >
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          </ReadingColumn>

          <Text style={styles.glimpseHint}>
            {sessionManualModeRef.current
              ? 'Take the time you need, then continue to answer from memory.'
              : 'Keep the idea and one exact detail. The text will hide automatically.'}
          </Text>
          {sessionManualModeRef.current && (
            <Button
              label="Hide glimpse and answer"
              onPress={hideGlimpseForRecall}
              testID="page-glimpse-manual-continue"
            />
          )}
        </View>
      )}

      {phase === 'question' && (
        <ScrollView
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator
          testID="page-glimpse-question"
        >
          <View style={styles.questionHeader}>
            <Text style={styles.eyebrow}>
              {QUESTION_KIND_LABELS[currentItem.questionKind]}
            </Text>
            <Text style={styles.questionTitle}>{currentItem.prompt}</Text>
            <Text style={styles.questionHint}>
              Answer from memory—the glimpse remains hidden.
            </Text>
          </View>

          <View accessibilityRole="radiogroup" style={styles.options}>
            {currentItem.options.map((option, index) => {
              const selected = selectedOption === index;
              return (
                <Pressable
                  accessibilityLabel={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={`${currentItem.id}-option-${index}`}
                  onPress={() => setSelectedOption(index)}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                  testID={`page-glimpse-option-${index}`}
                >
                  <View
                    style={[
                      styles.radio,
                      selected && styles.radioSelected,
                    ]}
                  >
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            disabled={selectedOption === null}
            label="Check answer"
            onPress={checkAnswer}
            testID="check-page-glimpse"
          />
        </ScrollView>
      )}

      {phase === 'feedback' && (
        <ScrollView
          contentContainerStyle={styles.feedbackContent}
          showsVerticalScrollIndicator
          testID="page-glimpse-feedback"
        >
          <View
            style={[
              styles.feedbackCard,
              lastAnswerCorrect
                ? styles.feedbackCorrect
                : styles.feedbackReview,
            ]}
          >
            <Text
              style={[
                styles.feedbackTitle,
                lastAnswerCorrect
                  ? styles.feedbackCorrectText
                  : styles.feedbackReviewText,
              ]}
            >
              {lastAnswerCorrect ? 'Captured accurately' : 'Review the glimpse'}
            </Text>
            {!lastAnswerCorrect && (
              <Text testID="page-glimpse-correct-answer" style={styles.correctAnswer}>
                Correct answer: {currentItem.options[currentItem.correctIndex]}
              </Text>
            )}
            <Text style={styles.feedbackBody}>{currentItem.explanation}</Text>
          </View>
          <Button
            label={
              roundIndex + 1 >= totalRounds
                ? 'Finish session'
                : 'Next glimpse'
            }
            onPress={continueAfterFeedback}
            testID="continue-page-glimpse"
          />
        </ScrollView>
      )}

      {phase === 'ended' && (
        <View style={styles.endStage} testID="end">
          <View style={styles.endCard}>
            <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
            <Text style={styles.bigMetric}>
              {correctCount}/{totalRounds}
            </Text>
            <Text style={styles.metricLabel}>glimpses retrieved accurately</Text>
            <Text style={styles.feedbackBody}>
              Accuracy matters more than shortening the exposure. Build a stable
              result before moving to denser glimpses.
            </Text>
          </View>
          <Button
            label="Practice again"
            onPress={() => start(true)}
            testID="play-again"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  idleMeta: {
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTonal,
  },
  idleMetaText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  safetyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stage: {
    flex: 1,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  stageHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  stageTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  exposurePill: {
    minWidth: 64,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceTonal,
  },
  exposureValue: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  exposureLabel: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  readingColumn: {
    width: '100%',
    alignSelf: 'center',
  },
  glimpseCard: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    ...shadows.small,
  },
  glimpseTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  lineStack: {
    width: '100%',
    gap: 4,
  },
  glimpseLine: {
    flexShrink: 1,
    width: '100%',
    textAlign: 'left',
  },
  glimpseHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  questionContent: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingBottom: spacing.lg,
  },
  questionHeader: {
    marginBottom: spacing.md,
  },
  questionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
    marginTop: 4,
  },
  questionHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  options: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  option: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
  },
  optionSelected: {
    borderColor: colors.interactivePrimary,
    backgroundColor: colors.infoSurface,
  },
  radio: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textMuted,
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: colors.interactivePrimary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.interactivePrimary,
  },
  optionText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  optionTextSelected: {
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.78,
  },
  feedbackContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  feedbackCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
  },
  feedbackCorrect: {
    borderColor: colors.successForeground,
    backgroundColor: colors.successSurface,
  },
  feedbackReview: {
    borderColor: colors.warningForeground,
    backgroundColor: colors.warningSurface,
  },
  feedbackTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  feedbackCorrectText: {
    color: colors.successForeground,
  },
  feedbackReviewText: {
    color: colors.warningForeground,
  },
  correctAnswer: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  feedbackBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  endStage: {
    flex: 1,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  endCard: {
    alignItems: 'center',
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  bigMetric: {
    color: colors.primaryDark,
    fontSize: 38,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackground,
  },
});
