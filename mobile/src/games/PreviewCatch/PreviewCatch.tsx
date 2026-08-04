import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  beginNonCalibratingProgressSession,
  levelToStars,
  updateProgress,
} from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import {
  boundedRandom,
  selectRotatingWindow,
  shuffleAnswerOptions,
  shuffleItems,
  type RandomSource,
} from '../../data/randomization';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { StatsRow } from '../../ui/StatsRow';
import {
  useAutoStart,
  useGameProgress,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';
import type { GameReportPayload } from '../registry';
import {
  findPreviewTargetIndex,
  getPreviewCatchPassages,
  normalizePreviewWord,
  tokenizePreviewPassage,
  type PreviewCatchPassage,
  type PreviewCatchTrial,
} from './previewCatchContent';

const GAME_ID = 'PreviewCatch';
const CONTENT_VERSION = 1;

type Phase =
  | 'idle'
  | 'preview'
  | 'response'
  | 'feedback'
  | 'comprehension'
  | 'ended';

type ResponseMode = 'match' | 'exact';

export type PreviewCatchConfig = {
  exposureMs: number;
  previewOffsetPercent: number;
  rounds: number;
  responseMode: ResponseMode;
  similarity: 'distinct' | 'similar' | 'very-similar';
};

type SessionTrial = PreviewCatchTrial & {
  targetIndex: number;
  targetWord: string;
  previewWord: string;
  isSame: boolean;
  exactOptions: string[];
  exactCorrectIndex: number;
};

type Props = {
  passages?: readonly PreviewCatchPassage[];
  totalRounds?: number;
  exposureMs?: number;
  random?: RandomSource;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

export function getPreviewCatchConfig(
  difficulty: Difficulty
): PreviewCatchConfig {
  if (difficulty === 'easy') {
    return {
      exposureMs: 900,
      previewOffsetPercent: 60,
      rounds: 4,
      responseMode: 'match',
      similarity: 'distinct',
    };
  }
  if (difficulty === 'medium') {
    return {
      exposureMs: 600,
      previewOffsetPercent: 67,
      rounds: 5,
      responseMode: 'match',
      similarity: 'similar',
    };
  }
  return {
    exposureMs: 380,
    previewOffsetPercent: 72,
    rounds: 5,
    responseMode: 'exact',
    similarity: 'very-similar',
  };
}

export function getPreviewCatchStageLayout(
  viewportWidth: number,
  previewOffsetPercent: number
) {
  const compact = viewportWidth < 430;
  const safeOffset = Math.min(
    compact ? 70 : 74,
    Math.max(58, previewOffsetPercent)
  );
  return {
    previewLeft: `${safeOffset}%` as const,
    previewWidth: `${Math.max(22, 96 - safeOffset)}%` as const,
    stageMinHeight: compact ? 190 : 210,
    focusFontSize: compact ? 21 : 24,
    previewFontSize: compact ? 18 : 20,
  };
}

export function buildBalancedMatchFlags(
  count: number,
  random: RandomSource = Math.random
): boolean[] {
  const safeCount = Math.max(0, Math.floor(count));
  const flags = Array.from(
    { length: safeCount },
    (_, index) => index % 2 === 0
  );
  return shuffleItems(flags, random);
}

function makeSessionTrials(
  passage: PreviewCatchPassage,
  count: number,
  random: RandomSource
): SessionTrial[] {
  const selected = shuffleItems(passage.trials, random).slice(0, count);
  const matchFlags = buildBalancedMatchFlags(selected.length, random);
  return selected.map((trial, index) => {
    const isSame = matchFlags[index] ?? true;
    const targetWord = normalizePreviewWord(trial.targetWord);
    const previewWord = normalizePreviewWord(
      isSame ? trial.targetWord : trial.alternateWord
    );
    const shuffled = shuffleAnswerOptions(
      [targetWord, normalizePreviewWord(trial.alternateWord), ...trial.exactDistractors.map(normalizePreviewWord)],
      isSame ? 0 : 1,
      random
    );
    return {
      ...trial,
      targetIndex: findPreviewTargetIndex(passage, trial.targetWord),
      targetWord,
      previewWord,
      isSame,
      exactOptions: shuffled.options,
      exactCorrectIndex: shuffled.correctIndex,
    };
  });
}

export default function PreviewCatch({
  passages: passagesProp,
  totalRounds: totalRoundsProp,
  exposureMs: exposureMsProp,
  random = Math.random,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const { width: viewportWidth } = useWindowDimensions();
  const { reduceMotion, screenReader } = useAccessibilityPreferences();
  const screenReaderRef = useRef(screenReader);
  const sessionManualModeRef = useRef(false);
  screenReaderRef.current = screenReader;
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const config = getPreviewCatchConfig(selectedDifficulty);
  // Keep explicit overrides exact for deterministic tests and calibration
  // tools; production defaults remain within the reviewed range above.
  const exposureMs = Math.max(1, exposureMsProp ?? config.exposureMs);
  const requestedRounds = Math.max(
    1,
    Math.floor(totalRoundsProp ?? config.rounds)
  );
  const sourcePassages = useMemo(
    () => passagesProp ?? getPreviewCatchPassages(selectedDifficulty),
    [passagesProp, selectedDifficulty]
  );
  const layout = getPreviewCatchStageLayout(
    viewportWidth,
    config.previewOffsetPercent
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [comprehensionCorrect, setComprehensionCorrect] = useState<
    boolean | null
  >(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);

  const phaseRef = useRef<Phase>('idle');
  const sessionPassageRef = useRef<PreviewCatchPassage | null>(null);
  const sessionTrialsRef = useRef<SessionTrial[]>([]);
  const questionOptionsRef = useRef<{
    options: string[];
    correctIndex: number;
  }>({ options: [], correctIndex: -1 });
  const sessionOrdinalRef = useRef<number | null>(null);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const startedAtRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(
    () => () => {
      cancelledRef.current = true;
    },
    []
  );

  useAutoStart(autoStart, phase, progressLoaded, start);

  function setCurrentPhase(nextPhase: Phase) {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }

  function showPreview(index: number) {
    clearTrackedTimeouts();
    setRoundIndex(index);
    setCurrentPhase('preview');
    if (sessionManualModeRef.current) return;
    scheduleTimeout(() => {
      if (!cancelledRef.current && phaseRef.current === 'preview') {
        setCurrentPhase('response');
      }
    }, exposureMs);
  }

  function hidePreviewForResponse() {
    if (phaseRef.current !== 'preview') return;
    clearTrackedTimeouts();
    setCurrentPhase('response');
  }

  function start(force = false) {
    if (!force && phaseRef.current !== 'idle' && phaseRef.current !== 'ended') {
      return;
    }
    const availablePassages = sourcePassages;
    if (availablePassages.length === 0) return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    correctRef.current = 0;
    attemptsRef.current = 0;
    sessionManualModeRef.current = screenReaderRef.current;
    setCorrectCount(0);
    setLastCorrect(false);
    setLastResponse('');
    setComprehensionCorrect(null);
    setFinalScore(0);
    setFinalAccuracy(0);

    const ordinal = sessionOrdinalRef.current ?? gameProgress.totalPlays;
    const passage =
      selectRotatingWindow(availablePassages, 1, ordinal)[0] ??
      availablePassages[
        Math.floor(boundedRandom(random) * availablePassages.length)
      ]!;
    sessionOrdinalRef.current = ordinal + 1;
    const sessionCount = Math.min(requestedRounds, passage.trials.length);
    sessionPassageRef.current = passage;
    sessionTrialsRef.current = makeSessionTrials(
      passage,
      sessionCount,
      random
    );
    questionOptionsRef.current = shuffleAnswerOptions(
      passage.question.options,
      passage.question.correctIndex,
      random
    );
    startedAtRef.current = Date.now();
    showPreview(0);
  }

  function answerMatch(answer: boolean) {
    const trial = sessionTrialsRef.current[roundIndex];
    if (phaseRef.current !== 'response' || !trial) return;
    recordPreviewAnswer(answer === trial.isSame, answer ? 'Same' : 'Changed');
  }

  function answerExact(optionIndex: number) {
    const trial = sessionTrialsRef.current[roundIndex];
    if (phaseRef.current !== 'response' || !trial) return;
    const answer = trial.exactOptions[optionIndex] ?? '';
    recordPreviewAnswer(
      optionIndex === trial.exactCorrectIndex,
      answer
    );
  }

  function recordPreviewAnswer(correct: boolean, response: string) {
    attemptsRef.current += 1;
    if (correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    }
    setLastCorrect(correct);
    setLastResponse(response);
    setCurrentPhase('feedback');
    if (sessionManualModeRef.current) {
      const trial = sessionTrialsRef.current[roundIndex];
      AccessibilityInfo.announceForAccessibility(
        `${correct ? 'Correct.' : 'Review.'} Preview ${trial?.previewWord ?? ''}. Actual next word ${trial?.targetWord ?? ''}.`
      );
    }
  }

  function continueSession() {
    if (phaseRef.current !== 'feedback') return;
    const nextRound = roundIndex + 1;
    if (nextRound >= sessionTrialsRef.current.length) {
      setCurrentPhase('comprehension');
    } else {
      showPreview(nextRound);
    }
  }

  function answerComprehension(optionIndex: number) {
    const passage = sessionPassageRef.current;
    if (phaseRef.current !== 'comprehension' || !passage) return;
    const isCorrect = optionIndex === questionOptionsRef.current.correctIndex;
    setComprehensionCorrect(isCorrect);
    finish(isCorrect);
  }

  function finish(isComprehensionCorrect: boolean) {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const finishedAt = Date.now();
    const rounds = sessionTrialsRef.current.length;
    const previewAccuracy =
      attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0;
    const score = Math.round(
      previewAccuracy * 80 + (isComprehensionCorrect ? 20 : 0)
    );
    const sameTrials = sessionTrialsRef.current.filter(
      (trial) => trial.isSame
    ).length;
    const changedTrials = rounds - sameTrials;
    const representativeSample = sameTrials > 0 && changedTrials > 0;
    const adaptiveQualificationEligible =
      !sessionManualModeRef.current &&
      attemptsRef.current === rounds &&
      representativeSample &&
      previewAccuracy >= 0.8 &&
      isComprehensionCorrect;
    const passage = sessionPassageRef.current;

    setFinalScore(score);
    setFinalAccuracy(previewAccuracy);
    setCurrentPhase('ended');
    const endNonCalibratingSession = sessionManualModeRef.current
      ? beginNonCalibratingProgressSession(GAME_ID)
      : undefined;
    const progressUpdate = updateProgress(
      GAME_ID,
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
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(finishedAt).toISOString(),
      elapsedMs: Math.max(1, finishedAt - startedAtRef.current),
      score,
      accuracy: previewAccuracy,
      details: {
        schemaVersion: 1,
        contentVersion: CONTENT_VERSION,
        activityType: 'preview-catch',
        comparisonBand: `preview-catch-${config.responseMode}-${selectedDifficulty}-${sessionManualModeRef.current ? 'manual' : 'timed'}`,
        difficulty: selectedDifficulty,
        passageId: passage?.id,
        trialIds: sessionTrialsRef.current.map((trial) => trial.id),
        rounds,
        attempts: attemptsRef.current,
        previewCorrect: correctRef.current,
        previewAccuracy,
        comprehensionCorrect: isComprehensionCorrect,
        responseMode: config.responseMode,
        exposureMs,
        previewOffsetPercent: config.previewOffsetPercent,
        wordSimilarity: config.similarity,
        sameTrials,
        changedTrials,
        representativeSample,
        adaptiveQualificationEligible,
        exposureMode: sessionManualModeRef.current ? 'manual' : 'timed',
        screenReaderManualMode: sessionManualModeRef.current,
      },
    });
  }

  const passage = sessionPassageRef.current ?? sourcePassages[0];
  const currentTrial = sessionTrialsRef.current[roundIndex];
  const passageWords = passage ? tokenizePreviewPassage(passage.text) : [];
  const targetIndex = currentTrial?.targetIndex ?? 0;
  const previousWord = normalizePreviewWord(
    passageWords[Math.max(0, targetIndex - 1)] ?? ''
  );
  const contextStart = Math.max(0, targetIndex - 7);
  const contextTrail = passageWords
    .slice(contextStart, Math.max(contextStart, targetIndex - 1))
    .join(' ');

  if (!passage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Preview Catch</Text>
        <Text style={styles.body}>No reviewed preview passages are available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Preview Catch</Text>
        <Text style={styles.subtitle}>
          Keep central focus while catching the next word to the right
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          startLabel="Start Preview Catch"
          onStart={() => start()}
        >
          <View style={styles.idleMeta}>
            <Text style={styles.metaText}>
              {config.rounds} previews · {config.exposureMs} ms ·{' '}
              {config.responseMode === 'match' ? 'Same / Changed' : 'Exact word'}
            </Text>
          </View>
        </GameIdlePanel>
      )}

      {(phase === 'preview' || phase === 'response') && currentTrial && (
        <View testID="preview-catch-active" style={styles.active}>
          <StatsRow
            testID="preview-catch-stats"
            items={[
              {
                key: 'round',
                value: `${roundIndex + 1}/${sessionTrialsRef.current.length}`,
                label: 'preview',
              },
              { key: 'correct', value: correctCount, label: 'correct' },
              {
                key: 'exposure',
                value: sessionManualModeRef.current
                  ? 'Manual'
                  : `${exposureMs} ms`,
                label: sessionManualModeRef.current
                  ? 'screen reader'
                  : 'exposure',
              },
            ]}
          />
          <View style={styles.instructionCard}>
            <Text style={styles.eyebrow}>
              {phase === 'preview' ? 'KEEP YOUR EYES AT CENTER' : 'PREVIEW HIDDEN'}
            </Text>
            <Text style={styles.instruction}>
              {phase === 'preview'
                ? 'Catch the right-side word without chasing it.'
                : config.responseMode === 'match'
                  ? 'Did the preview match the word now in focus?'
                  : 'Which exact word appeared in the preview?'}
            </Text>
          </View>

          <ReadingColumn style={styles.readingColumn}>
            <View
              accessibilityLabel={
                sessionManualModeRef.current && phase === 'preview'
                  ? `Current word ${previousWord}. Preview word ${currentTrial.previewWord}.`
                  : undefined
              }
              accessible={sessionManualModeRef.current && phase === 'preview'}
              testID="preview-catch-stage"
              style={[styles.stage, { minHeight: layout.stageMinHeight }]}
            >
              <Text style={styles.contextTrail} numberOfLines={2}>
                {contextTrail}
              </Text>
              <View style={styles.fixationLine} pointerEvents="none" />
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.76}
                numberOfLines={1}
                testID="preview-catch-focus-word"
                style={[styles.focusWord, { fontSize: layout.focusFontSize }]}
              >
                {phase === 'preview' ? previousWord : currentTrial.targetWord}
              </Text>
              {phase === 'preview' && (
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.68}
                  numberOfLines={1}
                  testID="preview-catch-preview-word"
                  style={[
                    styles.previewWord,
                    {
                      left: layout.previewLeft,
                      width: layout.previewWidth,
                      fontSize: layout.previewFontSize,
                    },
                  ]}
                >
                  {currentTrial.previewWord}
                </Text>
              )}
            </View>
          </ReadingColumn>

          {phase === 'preview' && sessionManualModeRef.current && (
            <Button
              testID="preview-catch-manual-continue"
              label="Hide preview and answer"
              onPress={hidePreviewForResponse}
            />
          )}

          {phase === 'response' && config.responseMode === 'match' && (
            <View style={styles.twoChoiceRow}>
              <View style={styles.choiceCell}>
                <Button
                  testID="preview-answer-same"
                  label="Same"
                  onPress={() => answerMatch(true)}
                />
              </View>
              <View style={styles.choiceCell}>
                <Button
                  testID="preview-answer-changed"
                  label="Changed"
                  variant="secondary"
                  onPress={() => answerMatch(false)}
                />
              </View>
            </View>
          )}

          {phase === 'response' && config.responseMode === 'exact' && (
            <View style={styles.exactGrid}>
              {currentTrial.exactOptions.map((option, index) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Preview option ${index + 1}: ${option}`}
                  key={`${currentTrial.id}-${option}`}
                  testID={`preview-exact-${index}`}
                  style={({ pressed }) => [
                    styles.exactOption,
                    pressed &&
                      (reduceMotion ? styles.pressedReduced : styles.pressed),
                  ]}
                  onPress={() => answerExact(index)}
                >
                  <Text style={styles.exactOptionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {phase === 'feedback' && currentTrial && (
        <View testID="preview-catch-feedback" style={styles.center}>
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.feedbackCard,
              lastCorrect ? styles.successCard : styles.reviewCard,
            ]}
          >
            <Text style={styles.eyebrow}>
              {lastCorrect ? 'PREVIEW CAUGHT' : 'REVIEW THE TWO WORDS'}
            </Text>
            <Text style={styles.feedbackTitle}>
              Preview: {currentTrial.previewWord}
            </Text>
            <Text style={styles.feedbackBody}>
              Actual next word: {currentTrial.targetWord}
            </Text>
            <Text style={styles.feedbackNote}>Your answer: {lastResponse}</Text>
          </View>
          <Button
            testID="preview-continue"
            label={
              roundIndex + 1 >= sessionTrialsRef.current.length
                ? 'Read and check meaning'
                : 'Next preview'
            }
            onPress={continueSession}
          />
        </View>
      )}

      {phase === 'comprehension' && (
        <ScrollView
          contentContainerStyle={styles.comprehensionContent}
          showsVerticalScrollIndicator
          testID="preview-catch-comprehension"
        >
          <ReadingColumn>
            <View style={styles.passageCard}>
              <Text style={styles.eyebrow}>MEANING CHECK</Text>
              <Text style={styles.passageTitle}>{passage.title}</Text>
              <Text style={styles.passageText}>
                {passage.text}
              </Text>
            </View>
            <Text style={styles.question}>{passage.question.prompt}</Text>
            <View style={styles.comprehensionOptions}>
              {questionOptionsRef.current.options.map((option, index) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Answer ${index + 1}: ${option}`}
                  key={option}
                  testID={`preview-comprehension-${index}`}
                  style={({ pressed }) => [
                    styles.comprehensionOption,
                    pressed &&
                      (reduceMotion ? styles.pressedReduced : styles.pressed),
                  ]}
                  onPress={() => answerComprehension(index)}
                >
                  <Text style={styles.comprehensionOptionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </ReadingColumn>
        </ScrollView>
      )}

      {phase === 'ended' && (
        <View testID="preview-catch-end" style={styles.center}>
          <View style={styles.feedbackCard}>
            <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
            <Text style={styles.resultMetric}>{finalScore}</Text>
            <Text style={styles.metricLabel}>task score</Text>
            <Text style={styles.resultSummary}>
              {correctRef.current}/{attemptsRef.current} previews ·{' '}
              {Math.round(finalAccuracy * 100)}% accuracy
            </Text>
            <Text style={styles.resultSummary}>
              Meaning check:{' '}
              {comprehensionCorrect ? 'correct' : 'review needed'}
            </Text>
          </View>
          <Button
            testID="preview-play-again"
            label="Try a fresh passage"
            onPress={() => start(true)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  header: { marginBottom: spacing.sm },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 2 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  idleMeta: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoSurface,
  },
  metaText: { color: colors.infoForeground, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  active: { flex: 1, gap: spacing.sm },
  instructionCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.infoSurface,
  },
  eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  instruction: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', lineHeight: 21, marginTop: 3 },
  readingColumn: { flex: 1, justifyContent: 'center' },
  stage: {
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  contextTrail: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  fixationLine: {
    position: 'absolute',
    left: '50%',
    top: '38%',
    bottom: '25%',
    width: 2,
    borderRadius: 2,
    backgroundColor: colors.secondaryLight,
    opacity: 0.55,
  },
  focusWord: {
    position: 'absolute',
    left: '32%',
    width: '36%',
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewWord: {
    position: 'absolute',
    color: colors.primaryDark,
    fontWeight: '700',
    textAlign: 'left',
  },
  twoChoiceRow: { flexDirection: 'row', gap: spacing.sm },
  choiceCell: { flex: 1 },
  exactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  exactOption: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
  },
  exactOptionText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  pressedReduced: { opacity: 0.75 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  feedbackCard: {
    width: '100%',
    maxWidth: 440,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  successCard: { borderColor: colors.successForeground, backgroundColor: colors.successSurface },
  reviewCard: { borderColor: colors.warningForeground, backgroundColor: colors.warningSurface },
  feedbackTitle: { color: colors.textPrimary, fontSize: 21, lineHeight: 28, fontWeight: '800', marginTop: spacing.sm },
  feedbackBody: { color: colors.textPrimary, fontSize: 17, lineHeight: 24, marginTop: spacing.xs },
  feedbackNote: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  comprehensionContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  passageCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
  },
  passageTitle: { color: colors.textPrimary, fontSize: 17, lineHeight: 23, fontWeight: '800', marginTop: 4 },
  passageText: { color: colors.textPrimary, fontSize: 16, lineHeight: 24, marginTop: spacing.sm },
  question: { color: colors.textPrimary, fontSize: 17, lineHeight: 23, fontWeight: '800', marginVertical: spacing.sm },
  comprehensionOptions: { gap: spacing.xs },
  comprehensionOption: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
  },
  comprehensionOptionText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  resultMetric: { color: colors.primary, fontSize: 48, fontWeight: '900', textAlign: 'center', marginTop: spacing.sm },
  metricLabel: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  resultSummary: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm },
});
