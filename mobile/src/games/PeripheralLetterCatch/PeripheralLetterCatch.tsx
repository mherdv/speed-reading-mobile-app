import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  createPersistentVariedDeckState,
  takeNextPersistentVariedItem,
  uniqueStrings,
  type RandomSource,
} from '../../data/flashPracticeContent';
import { boundedRandom } from '../../data/randomization';
import { levelToStars, updateProgress } from '../../data/progressStore';
import {
  measuredElapsedMs,
  monotonicNowMs,
  type MillisecondClock,
} from '../../domain/timing';
import { colors } from '../../theme/colors';
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences';
import { ChoiceAnswerFeedback } from '../../ui/ChoiceAnswerFeedback';
import { FlashChallengeStatus } from '../../ui/FlashChallengeStatus';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import {
  exposureMsForFlashChallengeLevel,
  getFlashChallengeProfile,
} from '../flashChallenge';
import {
  useAutoStart,
  useGameProgress,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import type { GameReportPayload } from '../registry';
import { useFlashChallenge } from '../useFlashChallenge';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'PeripheralLetterCatch';
const CORRECT_ANSWERS_TO_ADVANCE = 4;
const MAX_CONSECUTIVE_FAILURES = 3;
const LETTER_TARGET_WIDTH = 92;
const FIXATION_VISIBLE_HALF_WIDTH = 18;
const FIXATION_TARGET_GAP = 10;
const BOARD_EDGE_GAP = 8;
const CONTAINER_HORIZONTAL_PADDING = 24;
const FIXATION_CUE_MS = 600;

export type PeripheralSide = 'left' | 'right';

export type PeripheralLetterConfig = {
  baseExposureMs: number;
  minimumExposureMs: number;
  baseOffset: number;
  fontSize: number;
  letterSpacing: number;
  totalRounds: number;
};

const CONFIGS: Record<Difficulty, PeripheralLetterConfig> = {
  easy: {
    baseExposureMs: 900,
    minimumExposureMs: 520,
    baseOffset: 74,
    fontSize: 32,
    letterSpacing: 5,
    totalRounds: 10,
  },
  medium: {
    baseExposureMs: 700,
    minimumExposureMs: 360,
    baseOffset: 82,
    fontSize: 30,
    letterSpacing: 2,
    totalRounds: 12,
  },
  hard: {
    baseExposureMs: 520,
    minimumExposureMs: 240,
    baseOffset: 104,
    fontSize: 28,
    letterSpacing: 0,
    totalRounds: 14,
  },
};

const LETTERS_BY_TIER = {
  1: 'AEKMRSTU',
  2: 'ABEFHJKLMNPRSTUVXY',
  3: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  // Advanced rounds emphasize shapes that are easier to confuse at a glance.
  4: 'BDPQCGOQIJLTMNRSUVWXYZ',
} as const;

type Props = {
  trigrams?: readonly string[];
  displayMs?: number;
  fixationMs?: number;
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: RandomSource;
  clock?: MillisecondClock;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'fixate' | 'show' | 'recall' | 'feedback' | 'ended';
type FinishReason = 'round-limit' | 'three-misses';
type AnswerReview = {
  submitted: string;
  correct: boolean;
};

export function getPeripheralLetterConfig(
  difficulty: Difficulty
): PeripheralLetterConfig {
  return CONFIGS[difficulty];
}

export function getPeripheralLetterExposureMs(
  difficulty: Difficulty,
  challengeLevel: number
): number {
  const config = getPeripheralLetterConfig(difficulty);
  return exposureMsForFlashChallengeLevel(
    config.baseExposureMs,
    challengeLevel,
    config.minimumExposureMs
  );
}

/**
 * Returns a conservative pixel offset that still keeps the complete stimulus
 * inside a narrow phone viewport. It is deliberately described as an offset,
 * not visual angle, because the app has no physical screen calibration.
 */
export function getPeripheralLetterOffset(
  difficulty: Difficulty,
  challengeLevel: number,
  viewportWidth: number
): number {
  const config = getPeripheralLetterConfig(difficulty);
  const desired = config.baseOffset + (Math.max(1, challengeLevel) - 1) * 2;
  const availableHalf = Math.max(
    70,
    (viewportWidth - CONTAINER_HORIZONTAL_PADDING) / 2
  );
  const minimumWithoutFixationOverlap =
    LETTER_TARGET_WIDTH / 2 +
    FIXATION_VISIBLE_HALF_WIDTH +
    FIXATION_TARGET_GAP;
  const maximumThatFits = Math.max(
    minimumWithoutFixationOverlap,
    availableHalf - LETTER_TARGET_WIDTH / 2 - BOARD_EDGE_GAP
  );
  return Math.round(
    Math.max(
      minimumWithoutFixationOverlap,
      Math.min(desired, maximumThatFits)
    )
  );
}

function effectiveLetterTier(
  difficulty: Difficulty,
  challengeLevel: number
): 1 | 2 | 3 | 4 {
  const baseTier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  return Math.max(
    baseTier,
    getFlashChallengeProfile(challengeLevel).contentTier
  ) as 1 | 2 | 3 | 4;
}

/** Generates a large deterministic pool; presentation order is randomized. */
export function createPeripheralTrigramPool(
  difficulty: Difficulty,
  challengeLevel: number
): string[] {
  const letters = Array.from(
    new Set(LETTERS_BY_TIER[effectiveLetterTier(difficulty, challengeLevel)])
  );
  const result: string[] = [];

  for (const first of letters) {
    for (const second of letters) {
      for (const third of letters) {
        if (first === second || second === third || first === third) continue;
        result.push(`${first}${second}${third}`);
        if (result.length >= 360) return result;
      }
    }
  }
  return result;
}

export function normalizePeripheralTrigramPool(
  values: readonly string[]
): string[] {
  return uniqueStrings(values)
    .map((value) => value.toLocaleUpperCase('en'))
    .filter((value) => /^[A-Z]{3}$/u.test(value));
}

export function validatePeripheralTrigramPool(
  values: readonly string[]
): string[] {
  const errors: string[] = [];
  const normalized = values.map((value) => value.toLocaleUpperCase('en'));
  if (new Set(normalized).size !== values.length) {
    errors.push('Trigrams must be unique');
  }
  values.forEach((value, index) => {
    if (!/^[A-Z]{3}$/u.test(value)) {
      errors.push(`Trigram ${index + 1} must contain exactly three A-Z letters`);
    }
  });
  return errors;
}

function oppositeSide(side: PeripheralSide): PeripheralSide {
  return side === 'left' ? 'right' : 'left';
}

export default function PeripheralLetterCatch({
  trigrams: trigramsProp,
  displayMs: displayMsProp,
  fixationMs = FIXATION_CUE_MS,
  totalRounds: totalRoundsProp,
  difficulty = 'easy',
  autoStart = false,
  random = Math.random,
  clock = monotonicNowMs,
  onReportResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const flashChallenge = useFlashChallenge(
    GAME_ID,
    selectedDifficulty,
    CORRECT_ANSWERS_TO_ADVANCE,
    MAX_CONSECUTIVE_FAILURES,
    { masteryEligible: trigramsProp == null && displayMsProp == null }
  );
  const { width: viewportWidth } = useWindowDimensions();
  const { reduceMotion, screenReader } = useAccessibilityPreferences();
  const screenReaderRef = useRef(screenReader);
  screenReaderRef.current = screenReader;
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();
  const config = getPeripheralLetterConfig(selectedDifficulty);
  const totalRounds = totalRoundsProp ?? config.totalRounds;

  const [trigram, setTrigram] = useState('');
  const [side, setSide] = useState<PeripheralSide>('right');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [review, setReview] = useState<AnswerReview | null>(null);
  const [finishReason, setFinishReason] =
    useState<FinishReason>('round-limit');

  const cancelledRef = useRef(false);
  const reportedRef = useRef(false);
  const answerLockedRef = useRef(false);
  const feedbackManualRef = useRef(false);
  const sessionUsedManualFeedbackRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const missStreakRef = useRef(0);
  const trigramRef = useRef('');
  const nextSideRef = useRef<PeripheralSide>('right');
  const leftTrialsRef = useRef(0);
  const rightTrialsRef = useRef(0);
  const startedAtRef = useRef(0);
  const startedAtIsoRef = useRef('');
  const initialChallengeLevelRef = useRef(1);
  const highestChallengeLevelRef = useRef(1);
  const initialExposureMsRef = useRef(0);
  const minimumExposureMsRef = useRef(Number.POSITIVE_INFINITY);
  const initialOffsetRef = useRef(0);
  const maximumOffsetRef = useRef(0);
  const deckStatesRef = useRef(
    new Map<string, ReturnType<typeof createPersistentVariedDeckState>>()
  );

  useEffect(
    () => () => {
      cancelledRef.current = true;
      clearTrackedTimeouts();
    },
    [clearTrackedTimeouts]
  );

  useAutoStart(
    autoStart,
    phase,
    progressLoaded && flashChallenge.loaded,
    start
  );

  function poolForLevel(challengeLevel: number): string[] {
    const custom = normalizePeripheralTrigramPool(trigramsProp ?? []);
    return custom.length > 0
      ? custom
      : createPeripheralTrigramPool(selectedDifficulty, challengeLevel);
  }

  function takeNextTrigram(challengeLevel: number): string {
    const key = `${selectedDifficulty}:${challengeLevel}:${trigramsProp == null ? 'built-in' : 'custom'}`;
    let deckState = deckStatesRef.current.get(key);
    if (!deckState) {
      deckState = createPersistentVariedDeckState();
      deckState.previous = trigramRef.current;
      deckStatesRef.current.set(key, deckState);
    }
    const pool = poolForLevel(challengeLevel);
    return (
      takeNextPersistentVariedItem(deckState, pool, random) ??
      pool[0] ??
      'ARK'
    );
  }

  function showRound() {
    const challengeLevel = flashChallenge.getCurrentLevel();
    const nextTrigram = takeNextTrigram(challengeLevel);
    const nextSide = nextSideRef.current;
    const exposureMs =
      displayMsProp ??
      getPeripheralLetterExposureMs(selectedDifficulty, challengeLevel);
    const offset = getPeripheralLetterOffset(
      selectedDifficulty,
      challengeLevel,
      viewportWidth
    );

    if (initialExposureMsRef.current === 0) {
      initialExposureMsRef.current = exposureMs;
      initialOffsetRef.current = offset;
    }
    minimumExposureMsRef.current = Math.min(
      minimumExposureMsRef.current,
      exposureMs
    );
    maximumOffsetRef.current = Math.max(maximumOffsetRef.current, offset);
    if (nextSide === 'left') leftTrialsRef.current += 1;
    else rightTrialsRef.current += 1;

    nextSideRef.current = oppositeSide(nextSide);
    trigramRef.current = nextTrigram;
    answerLockedRef.current = false;
    feedbackManualRef.current = false;
    sessionUsedManualFeedbackRef.current = false;
    setTrigram(nextTrigram);
    setSide(nextSide);
    setAnswer('');
    setReview(null);
    setPhase('fixate');
    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      setPhase('show');
      scheduleTimeout(() => {
        if (!cancelledRef.current) setPhase('recall');
      }, exposureMs);
    }, Math.max(0, fixationMs));
  }

  function start() {
    if (
      !flashChallenge.loaded ||
      (phase !== 'idle' && phase !== 'ended')
    ) {
      return;
    }
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    answerLockedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    correctRef.current = 0;
    missStreakRef.current = 0;
    leftTrialsRef.current = 0;
    rightTrialsRef.current = 0;
    initialExposureMsRef.current = 0;
    minimumExposureMsRef.current = Number.POSITIVE_INFINITY;
    initialOffsetRef.current = 0;
    maximumOffsetRef.current = 0;
    nextSideRef.current = boundedRandom(random) < 0.5 ? 'left' : 'right';
    const initialLevel = flashChallenge.beginSession();
    initialChallengeLevelRef.current = initialLevel;
    highestChallengeLevelRef.current = initialLevel;
    startedAtRef.current = clock();
    startedAtIsoRef.current = new Date().toISOString();
    setScore(0);
    setRound(0);
    setReview(null);
    setFinishReason('round-limit');
    showRound();
  }

  function submitAnswer() {
    if (
      phase !== 'recall' ||
      answerLockedRef.current ||
      answer.length !== 3
    ) {
      return;
    }
    answerLockedRef.current = true;
    const submitted = answer.toLocaleUpperCase('en');
    const correct = submitted === trigramRef.current;
    attemptsRef.current += 1;
    if (correct) {
      correctRef.current += 1;
      scoreRef.current += 10;
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 5);
    }
    const outcome = flashChallenge.recordOutcome(correct);
    missStreakRef.current = outcome.state.missStreak;
    highestChallengeLevelRef.current = Math.max(
      highestChallengeLevelRef.current,
      outcome.state.level
    );
    setRound(attemptsRef.current);
    setScore(scoreRef.current);
    setReview({ submitted: submitted || 'No answer', correct });
    setPhase('feedback');
    feedbackManualRef.current = screenReaderRef.current;
    if (feedbackManualRef.current) {
      sessionUsedManualFeedbackRef.current = true;
      AccessibilityInfo.announceForAccessibility(
        correct
          ? `Correct. Letters ${trigramRef.current}.`
          : `Review. You entered ${submitted || 'no answer'}. Correct letters ${trigramRef.current}.`
      );
      return;
    }
    scheduleTimeout(
      advanceAfterFeedback,
      getRecallFeedbackDurationMs(trigramRef.current, correct)
    );
  }

  function advanceAfterFeedback() {
    if (cancelledRef.current || !answerLockedRef.current) return;
    answerLockedRef.current = false;
    clearTrackedTimeouts();
    if (missStreakRef.current >= MAX_CONSECUTIVE_FAILURES) {
      finish('three-misses');
    } else if (attemptsRef.current >= totalRounds) {
      finish('round-limit');
    } else {
      showRound();
    }
  }

  function finish(reason: FinishReason) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const elapsedMs = measuredElapsedMs(startedAtRef.current, clock);
    const finishedAtIso = new Date().toISOString();
    const accuracy =
      attemptsRef.current > 0
        ? correctRef.current / attemptsRef.current
        : 0;
    const adaptiveQualificationEligible =
      reason === 'round-limit' &&
      attemptsRef.current >= totalRounds &&
      accuracy >= 0.75;
    setFinishReason(reason);
    setPhase('ended');
    void updateProgress(
      GAME_ID,
      adaptiveQualificationEligible,
      scoreRef.current,
      selectedDifficulty
    )
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);
    onReportResult?.({
      startedAtIso: startedAtIsoRef.current,
      finishedAtIso,
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        activityType: 'peripheral-trigram-recall',
        difficulty: selectedDifficulty,
        rounds: attemptsRef.current,
        correct: correctRef.current,
        adaptiveQualificationEligible,
        finishReason: reason,
        endingFailureStreak: missStreakRef.current,
        consecutiveMissLimit: MAX_CONSECUTIVE_FAILURES,
        correctAnswersToAdvance: CORRECT_ANSWERS_TO_ADVANCE,
        leftTrials: leftTrialsRef.current,
        rightTrials: rightTrialsRef.current,
        initialExposureMs: initialExposureMsRef.current,
        minimumExposureMs: minimumExposureMsRef.current,
        initialOffsetPx: initialOffsetRef.current,
        maximumOffsetPx: maximumOffsetRef.current,
        initialChallengeLevel: initialChallengeLevelRef.current,
        finalChallengeLevel: flashChallenge.getCurrentLevel(),
        highestChallengeLevel: highestChallengeLevelRef.current,
        savedBestChallengeLevel: flashChallenge.getHighestLevel(),
        screenReaderManualFeedback: sessionUsedManualFeedbackRef.current,
        timingMethod: 'monotonic-elapsed',
      },
    });
  }

  function playAgain() {
    clearTrackedTimeouts();
    setPhase('idle');
    scheduleTimeout(start, 50);
  }

  const challengeLevel = flashChallenge.level;
  const exposureMs =
    displayMsProp ??
    getPeripheralLetterExposureMs(selectedDifficulty, challengeLevel);
  const offset = getPeripheralLetterOffset(
    selectedDifficulty,
    challengeLevel,
    viewportWidth
  );
  const targetMarginLeft =
    (side === 'left' ? -offset : offset) - LETTER_TARGET_WIDTH / 2;

  const stats = (
    <StatsRow
      style={styles.statsRow}
      items={[
        {
          key: 'score',
          value: score,
          label: 'Score',
          containerStyle: styles.statBox,
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
        {
          key: 'round',
          value: `${round}/${totalRounds}`,
          label: 'Caught',
          containerStyle: styles.statBox,
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
        {
          key: 'exposure',
          value: `${exposureMs} ms`,
          label: 'Flash',
          containerStyle: styles.statBox,
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Peripheral Letter Catch
        </Text>
        <Text style={styles.subtitle}>
          Hold the center and catch three letters beside it
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          startDisabled={!flashChallenge.loaded}
          startLabel="Start letter catch"
          containerStyle={styles.idleContent}
        >
          <Text style={styles.sessionHint}>
            4 correct in a row raise the challenge · 3 misses in a row end it
          </Text>
          <FlashChallengeStatus
            level={flashChallenge.resumeLevel}
            highestLevel={flashChallenge.highestLevel}
          />
        </GameIdlePanel>
      )}

      {(phase === 'fixate' || phase === 'show' || phase === 'recall') && (
        <View style={styles.gameArea}>
          {stats}
          <FlashChallengeStatus
            compact
            level={flashChallenge.level}
            highestLevel={flashChallenge.highestLevel}
          />
          {(phase === 'fixate' || phase === 'show') && (
            <View testID="peripheral-letter-board" style={styles.board}>
              <View testID="peripheral-letter-fixation" style={styles.fixation}>
                <Text style={styles.fixationMark}>
                  +
                </Text>
                <Text style={styles.fixationLabel}>
                  FOCUS
                </Text>
              </View>
              {phase === 'show' && (
                <View
                  testID="peripheral-letter-target-slot"
                  style={[
                    styles.targetSlot,
                    { marginLeft: targetMarginLeft },
                  ]}
                >
                  <Text
                    accessibilityLabel={`Three-letter group ${trigram}`}
                    testID="peripheral-letter-target"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.targetText,
                      {
                        fontSize: config.fontSize,
                        letterSpacing: config.letterSpacing,
                      },
                    ]}
                  >
                    {trigram}
                  </Text>
                </View>
              )}
            </View>
          )}

          {phase === 'fixate' && (
            <Text style={styles.instruction}>
              Keep your eyes on the plus
            </Text>
          )}
          {phase === 'show' && (
            <Text style={styles.instruction}>
              Keep looking at the plus
            </Text>
          )}
          {phase === 'recall' && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.recallKeyboardArea}
            >
              <ScrollView
                contentContainerStyle={styles.recallArea}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                style={styles.recallScroll}
                testID="peripheral-letter-recall-scroll"
              >
                <Text style={styles.recallTitle}>
                  Type the three letters in order
                </Text>
                <TextInput
                  accessibilityLabel="Three-letter answer"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={3}
                  onChangeText={(value) =>
                    setAnswer(
                      value
                        .replace(/[^a-z]/giu, '')
                        .slice(0, 3)
                        .toLocaleUpperCase('en')
                    )
                  }
                  onSubmitEditing={submitAnswer}
                  returnKeyType="done"
                  selectTextOnFocus={false}
                  style={styles.input}
                  testID="peripheral-letter-input"
                  value={answer}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Check letter answer"
                  accessibilityState={{ disabled: answer.length !== 3 }}
                  disabled={answer.length !== 3}
                  onPress={submitAnswer}
                  style={({ pressed }) => [
                    styles.submitButton,
                    answer.length !== 3 && styles.disabledButton,
                    pressed &&
                      answer.length === 3 &&
                      (reduceMotion
                        ? styles.pressedButtonReducedMotion
                        : styles.pressedButton),
                  ]}
                  testID="peripheral-letter-submit"
                >
                  <Text style={styles.submitButtonText}>
                    Check answer
                  </Text>
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      )}

      {phase === 'feedback' && review && (
        <View style={styles.gameArea}>
          {stats}
          <ChoiceAnswerFeedback
            correct={review.correct}
            selectedAnswer={review.submitted}
            correctAnswer={trigramRef.current}
            answerLabel="Correct letters"
            testID="peripheral-letter-feedback"
          />
          {feedbackManualRef.current && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue after letter feedback"
              onPress={advanceAfterFeedback}
              style={({ pressed }) => [
                styles.submitButton,
                pressed &&
                  (reduceMotion
                    ? styles.pressedButtonReducedMotion
                    : styles.pressedButton),
              ]}
              testID="peripheral-letter-feedback-continue"
            >
              <Text style={styles.submitButtonText}>Continue</Text>
            </Pressable>
          )}
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>
            {finishReason === 'three-misses'
              ? 'Three misses — session complete'
              : 'Letter set complete'}
          </Text>
          <Text style={styles.endScore}>
            {scoreRef.current}
          </Text>
          <Text style={styles.endMeta}>
            {correctRef.current}/{attemptsRef.current} exact catches
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play Peripheral Letter Catch again"
            onPress={playAgain}
            style={({ pressed }) => [
              styles.playAgainButton,
              pressed &&
                (reduceMotion
                  ? styles.pressedButtonReducedMotion
                  : styles.pressedButton),
            ]}
            testID="play-again"
          >
            <Text style={styles.playAgainText}>
              Play again
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  header: { marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  idleContent: { flex: 1 },
  sessionHint: {
    color: colors.infoForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  gameArea: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    borderRadius: 12,
    flexBasis: '31%',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 6,
  },
  statValue: { color: colors.primaryDark, fontSize: 16, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 10 },
  board: {
    alignSelf: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 220,
    justifyContent: 'center',
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  fixation: {
    alignItems: 'center',
    left: '50%',
    marginLeft: -28,
    marginTop: -30,
    position: 'absolute',
    top: '50%',
    width: 56,
    zIndex: 2,
  },
  fixationMark: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  fixationLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  targetSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    left: '50%',
    marginTop: -30,
    minHeight: 60,
    position: 'absolute',
    top: '50%',
    width: LETTER_TARGET_WIDTH,
  },
  targetText: {
    color: colors.textPrimary,
    fontWeight: '800',
    lineHeight: 39,
    textAlign: 'center',
    width: '100%',
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  recallKeyboardArea: { flex: 1 },
  recallScroll: { flex: 1 },
  recallArea: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 14,
  },
  recallTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '800',
    minHeight: 52,
    letterSpacing: 7,
    maxWidth: 220,
    paddingHorizontal: 18,
    paddingVertical: 8,
    textAlign: 'center',
    width: '70%',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 26,
  },
  submitButtonText: {
    color: colors.onInteractive,
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: { backgroundColor: colors.disabledSurface, opacity: 0.72 },
  pressedButton: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  pressedButtonReducedMotion: { opacity: 0.78 },
  endCard: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 34 },
  endTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  endScore: {
    color: colors.primaryDark,
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 10,
  },
  endMeta: { color: colors.textSecondary, fontSize: 14 },
  playAgainButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 48,
    paddingHorizontal: 26,
  },
  playAgainText: { color: colors.onInteractive, fontSize: 15, fontWeight: '700' },
});
