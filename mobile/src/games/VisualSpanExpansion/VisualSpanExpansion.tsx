import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { levelToStars, updateProgress } from '../../data/progressStore';
import { colors } from '../../theme/colors';
import { BriefStimulus } from '../../ui/BriefStimulus';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import {
  useAutoStart,
  useGameProgress,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import {
  createVisualSpanTrial,
  getVisualSpanConfig,
  VISUAL_SPAN_FIXATION_CUE_MS,
  type VisualSpanPositionId,
  type VisualSpanSpread,
  type VisualSpanTrial,
} from './visualSpanContent';

const GAME_ID = 'VisualSpanExpansion';
const FAILURE_PENALTY = 5;
const MAX_CONSECUTIVE_FAILURES = 3;
const CORRECT_RUN_TO_RESTORE_SPAN = 3;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  itemCount?: number;
  displayMs?: number;
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: () => number;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase =
  | 'idle'
  | 'fixate'
  | 'show'
  | 'recall'
  | 'feedback'
  | 'ended';
type FinishReason = 'round-limit' | 'three-misses';

type Review = {
  selectedWord: string;
  correctWord: string;
  positionLabel: string;
  correct: boolean;
  shouldFinish: boolean;
  previousSpan: number;
  nextSpan: number;
};

const POSITION_STYLES: Record<VisualSpanPositionId, ViewStyle> = {
  'upper-left': { left: 0, top: 20 },
  'upper-center': { left: '39%', top: 0 },
  'upper-right': { right: 0, top: 20 },
  'center-left': { left: 0, top: '42%' },
  'center-right': { right: 0, top: '42%' },
  'lower-left': { bottom: 20, left: 0 },
  'lower-center': { bottom: 0, left: '39%' },
  'lower-right': { bottom: 20, right: 0 },
};

function boardStyleForSpread(spread: VisualSpanSpread): ViewStyle {
  switch (spread) {
    case 'compact':
      return { height: 220, width: '78%' };
    case 'standard':
      return { height: 250, width: '90%' };
    case 'wide':
      return { height: 280, width: '100%' };
  }
}

type SpatialBoardProps = {
  trial: VisualSpanTrial;
  spread: VisualSpanSpread;
  revealWords: boolean;
  difficulty: Difficulty;
  showTarget?: boolean;
  testID?: string;
};

function SpatialBoard({
  trial,
  spread,
  revealWords,
  difficulty,
  showTarget = false,
  testID,
}: SpatialBoardProps) {
  return (
    <View
      testID={testID ?? (revealWords ? 'span-board' : 'span-recall-board')}
      style={[styles.spatialBoard, boardStyleForSpread(spread)]}
    >
      {trial.items.map((item) => {
        const isTarget = showTarget && item.positionId === trial.targetPositionId;
        return (
          <View
            key={item.positionId}
            testID={`span-position-${item.positionId}`}
            style={[
              styles.positionSlot,
              POSITION_STYLES[item.positionId],
              isTarget && styles.targetSlot,
            ]}
          >
            {revealWords ? (
              <BriefStimulus
                value={item.word}
                difficulty={difficulty}
                testID={`span-item-${item.positionId}`}
                color={colors.infoForeground}
                backgroundColor={colors.infoSurface}
                maxFontSize={18}
                minFontSize={7}
                availableWidth={66}
                style={styles.positionText}
              />
            ) : (
              <Text
                style={[
                  styles.positionText,
                  styles.hiddenPositionText,
                  isTarget && styles.targetPositionText,
                ]}
              >
                {isTarget ? '?' : '•'}
              </Text>
            )}
          </View>
        );
      })}
      <View testID="span-fixation" style={styles.fixation}>
        <Text style={styles.fixationMark}>+</Text>
        <Text style={styles.fixationLabel}>FOCUS</Text>
      </View>
    </View>
  );
}

export default function VisualSpanExpansion({
  itemCount: itemCountProp,
  displayMs: displayMsProp,
  totalRounds: totalRoundsProp,
  difficulty = 'easy',
  autoStart = false,
  random = Math.random,
  onReportResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const initialConfig = getVisualSpanConfig(difficulty);
  const [trial, setTrial] = useState<VisualSpanTrial>(() =>
    createVisualSpanTrial(difficulty, itemCountProp, random)
  );
  const [spanSize, setSpanSize] = useState(
    itemCountProp ?? initialConfig.spanSize
  );
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [failureStreak, setFailureStreak] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [finishReason, setFinishReason] =
    useState<FinishReason>('round-limit');

  const startRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const failuresRef = useRef(0);
  const correctStreakRef = useRef(0);
  const failureStreakRef = useRef(0);
  const spanRef = useRef(itemCountProp ?? initialConfig.spanSize);
  const maxSpanRef = useRef(itemCountProp ?? initialConfig.spanSize);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  const config = getVisualSpanConfig(selectedDifficulty);
  const maximumSpan = Math.max(
    config.minimumSpan,
    Math.min(config.spanSize, itemCountProp ?? config.spanSize)
  );
  const displayMs = displayMsProp ?? config.displayMs;
  const totalRounds = totalRoundsProp ?? config.totalRounds;

  useEffect(
    () => () => {
      cancelledRef.current = true;
      clearTrackedTimeouts();
    },
    // Cleanup belongs to unmount, not helper identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useAutoStart(autoStart, phase, progressLoaded, start);

  function showRound(nextSpan: number) {
    const nextTrial = createVisualSpanTrial(
      selectedDifficulty,
      nextSpan,
      random
    );
    setTrial(nextTrial);
    setReview(null);
    setPhase('fixate');
    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      setPhase('show');
      scheduleTimeout(() => {
        if (!cancelledRef.current) setPhase('recall');
      }, displayMs);
    }, VISUAL_SPAN_FIXATION_CUE_MS);
  }

  function start() {
    if (phase !== 'idle' && phase !== 'ended') return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    correctRef.current = 0;
    failuresRef.current = 0;
    correctStreakRef.current = 0;
    failureStreakRef.current = 0;
    spanRef.current = maximumSpan;
    maxSpanRef.current = maximumSpan;
    setScore(0);
    setRound(0);
    setCorrectStreak(0);
    setFailureStreak(0);
    setSpanSize(maximumSpan);
    setReview(null);
    startRef.current = Date.now();
    showRound(maximumSpan);
  }

  function chooseAnswer(selectedWord: string) {
    if (phase !== 'recall') return;

    const isCorrect = selectedWord === trial.correctWord;
    attemptsRef.current += 1;
    setRound(attemptsRef.current);
    const previousSpan = spanRef.current;
    let nextSpan = spanRef.current;

    if (isCorrect) {
      correctRef.current += 1;
      correctStreakRef.current += 1;
      failureStreakRef.current = 0;
      scoreRef.current += spanRef.current * 10;
      if (
        correctStreakRef.current >= CORRECT_RUN_TO_RESTORE_SPAN &&
        nextSpan < maximumSpan
      ) {
        nextSpan += 1;
        correctStreakRef.current = 0;
      }
    } else {
      failuresRef.current += 1;
      correctStreakRef.current = 0;
      failureStreakRef.current += 1;
      scoreRef.current = Math.max(0, scoreRef.current - FAILURE_PENALTY);
      nextSpan = Math.max(config.minimumSpan, nextSpan - 1);
    }

    spanRef.current = nextSpan;
    maxSpanRef.current = Math.max(maxSpanRef.current, nextSpan);
    setSpanSize(nextSpan);
    setScore(scoreRef.current);
    setCorrectStreak(correctStreakRef.current);
    setFailureStreak(failureStreakRef.current);

    const reachedRoundLimit = attemptsRef.current >= totalRounds;
    const reachedFailureLimit =
      failureStreakRef.current >= MAX_CONSECUTIVE_FAILURES;
    const shouldFinish = reachedRoundLimit || reachedFailureLimit;
    setReview({
      selectedWord,
      correctWord: trial.correctWord,
      positionLabel: trial.targetPositionLabel,
      correct: isCorrect,
      shouldFinish,
      previousSpan,
      nextSpan,
    });
    setPhase('feedback');

    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      if (shouldFinish) {
        finish(reachedFailureLimit ? 'three-misses' : 'round-limit');
      } else {
        showRound(nextSpan);
      }
    }, getRecallFeedbackDurationMs(trial.correctWord, isCorrect));
  }

  function finish(reason: FinishReason) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();

    const now = Date.now();
    const elapsedMs = Math.max(0, now - startRef.current);
    const accuracy =
      attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0;
    setFinishReason(reason);
    setPhase('ended');

    void updateProgress(
      GAME_ID,
      accuracy >= 0.7,
      scoreRef.current,
      selectedDifficulty
    )
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        activityType: 'spatial-word-position-recall',
        correct: correctRef.current,
        attempts: attemptsRef.current,
        failures: failuresRef.current,
        endingFailureStreak: failureStreakRef.current,
        maximumConfiguredSpan: maximumSpan,
        maxSpan: maxSpanRef.current,
        finalSpan: spanRef.current,
        displayMs,
        optionCount: config.optionCount,
        fixationCueMs: VISUAL_SPAN_FIXATION_CUE_MS,
        finishReason: reason,
        difficulty: selectedDifficulty,
      },
    });
  }

  function playAgain() {
    clearTrackedTimeouts();
    setPhase('idle');
    scheduleTimeout(start, 50);
  }

  const stats = (
    <StatsRow
      style={styles.statsRow}
      items={[
        {
          key: 'score',
          value: score,
          label: 'Score',
          testID: 'span-score',
          containerStyle: styles.statBox,
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
        {
          key: 'span',
          value: spanSize,
          label: 'Positions',
          testID: 'span-size',
          containerStyle: [styles.statBox, styles.levelBox],
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
        {
          key: 'misses',
          value: `${failureStreak}/${MAX_CONSECUTIVE_FAILURES}`,
          label: 'Misses',
          testID: 'span-misses',
          containerStyle: [styles.statBox, styles.missBox],
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visual Span</Text>
        <Text style={styles.subtitle}>
          Hold the center while words appear around it
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          startLabel="Start Training"
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
          progressInfoStyle={styles.progressInfo}
          levelLabelStyle={styles.levelLabel}
          starsStyle={styles.starsDisplay}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        />
      )}

      {phase === 'show' && (
        <View style={styles.gameArea}>
          {stats}
          <Text style={styles.roundLabel}>
            Glance {Math.min(round + 1, totalRounds)} of {totalRounds}
          </Text>
          <Text style={styles.instruction}>
            Keep your eyes near the + and notice the surrounding words.
          </Text>
          <SpatialBoard
            trial={trial}
            spread={config.spread}
            revealWords
            difficulty={selectedDifficulty}
          />
        </View>
      )}

      {phase === 'fixate' && (
        <View style={styles.gameArea}>
          {stats}
          <Text style={styles.roundLabel}>
            Glance {Math.min(round + 1, totalRounds)} of {totalRounds}
          </Text>
          <Text style={styles.question}>Set your eyes on the center +</Text>
          <Text style={styles.instruction}>
            Keep them there when the surrounding words appear.
          </Text>
          <SpatialBoard
            trial={trial}
            spread={config.spread}
            revealWords={false}
            difficulty={selectedDifficulty}
            testID="span-fixation-cue"
          />
        </View>
      )}

      {phase === 'recall' && (
        <View testID="span-recall" style={styles.gameArea}>
          {stats}
          <Text style={styles.roundLabel}>
            Glance {Math.min(round + 1, totalRounds)} of {totalRounds}
          </Text>
          <Text style={styles.question}>
            Which word was at {trial.targetPositionLabel}?
          </Text>
          <SpatialBoard
            trial={trial}
            spread={config.spread}
            revealWords={false}
            difficulty={selectedDifficulty}
            showTarget
          />
          <View testID="span-options" style={styles.options}>
            {trial.options.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Answer ${option}`}
                key={option}
                testID={`span-option-${index}`}
                onPress={() => chooseAnswer(option)}
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'feedback' && review && (
        <View testID="visual-span-feedback" style={styles.gameArea}>
          {stats}
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.reviewCard,
              review.correct ? styles.cardCorrect : styles.cardWrong,
            ]}
          >
            <Text
              style={
                review.correct
                  ? styles.reviewCorrectTitle
                  : styles.reviewWrongTitle
              }
            >
              {review.correct ? 'Correct position recall' : 'Review this position'}
            </Text>
            <Text style={styles.reviewPosition}>
              Position: {review.positionLabel}
            </Text>
            <Text style={styles.reviewLabel}>Your answer</Text>
            <Text testID="visual-span-user-answer" style={styles.reviewWord}>
              {review.selectedWord}
            </Text>
            <Text style={styles.reviewLabel}>Correct word</Text>
            <Text
              testID="visual-span-correct-answer"
              style={styles.reviewWord}
            >
              {review.correctWord}
            </Text>
            {!review.correct && (
              <Text style={styles.reviewHint}>
                −{FAILURE_PENALTY} points · next glance uses {spanSize}{' '}
                positions
                {review.shouldFinish
                  ? ' · session ends after this review'
                  : ''}
              </Text>
            )}
            {review.correct && !review.shouldFinish && (
              <Text style={styles.reviewHint}>
                {review.nextSpan > review.previousSpan
                  ? `One position restored · next glance uses ${review.nextSpan}`
                  : review.nextSpan < maximumSpan
                    ? `${correctStreak}/${CORRECT_RUN_TO_RESTORE_SPAN} correct toward restoring one position`
                    : `Selected ${maximumSpan}-position span held`}
              </Text>
            )}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>◎</Text>
          <Text style={styles.endTitle}>
            {finishReason === 'three-misses'
              ? 'Three misses — session complete'
              : 'Visual span set complete'}
          </Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            {correctRef.current}/{attemptsRef.current} positions correct
          </Text>
          <Text style={styles.endMeta}>
            Widest glance: {maxSpanRef.current} positions
          </Text>
          <Text style={styles.endDifficulty}>
            Difficulty: {selectedDifficulty}
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            style={styles.playAgainBtn}
            onPress={playAgain}
          >
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
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  idleContent: { flex: 1 },
  descriptionText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  progressInfo: { alignItems: 'center', marginBottom: 24 },
  levelLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  starsDisplay: { fontSize: 24, letterSpacing: 4 },
  startBtn: {
    alignItems: 'center',
    backgroundColor: colors.interactiveTeal,
    borderRadius: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  startBtnText: { color: colors.onInteractive, fontSize: 16, fontWeight: '700' },
  gameArea: { alignItems: 'center', flex: 1 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.infoSurface,
    borderRadius: 10,
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  levelBox: { backgroundColor: colors.surfaceTonal },
  missBox: { backgroundColor: colors.warningSurface },
  statValue: {
    color: colors.infoForeground,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: { color: colors.textSecondary, fontSize: 10 },
  roundLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  spatialBoard: {
    alignSelf: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginVertical: 6,
    maxWidth: 360,
    position: 'relative',
  },
  positionSlot: {
    alignItems: 'center',
    backgroundColor: colors.infoSurface,
    borderColor: colors.info,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 70,
    overflow: 'hidden',
    paddingHorizontal: 2,
    position: 'absolute',
  },
  targetSlot: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningForeground,
    borderWidth: 2,
  },
  positionText: {
    fontWeight: '800',
  },
  hiddenPositionText: {
    color: colors.textMuted,
    fontSize: 18,
  },
  targetPositionText: {
    color: colors.warningForeground,
    fontSize: 24,
  },
  fixation: {
    alignItems: 'center',
    justifyContent: 'center',
    left: '43%',
    position: 'absolute',
    top: '39%',
  },
  fixationMark: {
    color: colors.interactivePrimary,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 36,
  },
  fixationLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  question: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 2,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 360,
    width: '100%',
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 96,
    paddingHorizontal: 16,
  },
  optionButtonPressed: {
    backgroundColor: colors.infoSurface,
    borderColor: colors.infoForeground,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardCorrect: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successForeground,
  },
  cardWrong: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.errorForeground,
  },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 2,
    gap: 6,
    marginTop: 12,
    maxWidth: 360,
    padding: 20,
    width: '100%',
  },
  reviewCorrectTitle: {
    color: colors.successForeground,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  reviewWrongTitle: {
    color: colors.errorForeground,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  reviewPosition: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  reviewLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  reviewWord: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  reviewHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  endCard: { alignItems: 'center', flex: 1, paddingVertical: 20 },
  endEmoji: {
    color: colors.interactiveTeal,
    fontSize: 44,
    marginBottom: 8,
  },
  endTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  endScore: {
    color: colors.interactiveTeal,
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 8,
  },
  endMeta: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  endDifficulty: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  levelText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  starsText: { color: colors.warningForeground, fontSize: 16 },
  playAgainBtn: {
    backgroundColor: colors.interactiveTeal,
    borderRadius: 10,
    marginTop: 16,
    minHeight: 48,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainText: {
    color: colors.onInteractive,
    fontSize: 14,
    fontWeight: '700',
  },
});
