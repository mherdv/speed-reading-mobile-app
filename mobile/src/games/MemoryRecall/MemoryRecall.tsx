import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { useAutoStart, useTrackedTimeouts, type Difficulty } from '../gameHooks';
import { BriefStimulus } from '../../ui/BriefStimulus';
import { FlashChallengeStatus } from '../../ui/FlashChallengeStatus';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { colors } from '../../theme/colors';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import { exposureMsForFlashChallengeLevel } from '../flashChallenge';
import { useFlashChallenge } from '../useFlashChallenge';

const GAME_ID = 'MemoryRecall';
const FAILURE_PENALTY = 10;
const MAX_CONSECUTIVE_FAILURES = 3;
const MIN_SEQUENCE_LENGTH = 1;
const CORRECT_SEQUENCES_TO_ADVANCE = 2;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  startingLength?: number;
  displayMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'show' | 'recall' | 'feedback' | 'ended';

type MemoryReview = {
  submitted: number[];
  expected: number[];
  correct: boolean;
  nextSequenceLength: number;
  shouldFinish: boolean;
};

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

export function getMemorySequenceLength(
  baseLength: number,
  challengeLevel: number,
  fixedLength = false
): number {
  const safeBaseLength = Math.max(
    MIN_SEQUENCE_LENGTH,
    Math.round(baseLength)
  );
  if (fixedLength) return safeBaseLength;
  return safeBaseLength + Math.max(0, Math.round(challengeLevel) - 1);
}

export default function MemoryRecall({
  startingLength: startingLengthProp,
  displayMs: displayMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const startingLength =
    startingLengthProp ?? (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5);
  const displayMs =
    displayMsProp ?? (difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 1100 : 800);
  const flashChallenge = useFlashChallenge(
    GAME_ID,
    difficulty,
    CORRECT_SEQUENCES_TO_ADVANCE,
    MAX_CONSECUTIVE_FAILURES,
    {
      masteryEligible:
        startingLengthProp == null && displayMsProp == null,
    }
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(startingLength);
  const [sequence, setSequence] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [failureStreak, setFailureStreak] = useState(0);
  const [review, setReview] = useState<MemoryReview | null>(null);

  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const correctSequencesRef = useRef(0);
  const failuresRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const levelRef = useRef(startingLength);
  const maxLevelRef = useRef(startingLength);
  const initialChallengeLevelRef = useRef(1);
  const maxChallengeLevelRef = useRef(1);
  const initialDisplayMsRef = useRef(0);
  const finalDisplayMsRef = useRef(0);
  const minimumDisplayMsRef = useRef(Number.POSITIVE_INFINITY);
  const sequenceRef = useRef<number[]>([]);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, flashChallenge.loaded, start);

  function sequenceLengthForChallenge(challengeLevel: number): number {
    return getMemorySequenceLength(
      startingLength,
      challengeLevel,
      startingLengthProp != null
    );
  }

  function showSequence(nextSequenceLength: number) {
    levelRef.current = nextSequenceLength;
    maxLevelRef.current = Math.max(
      maxLevelRef.current,
      nextSequenceLength
    );
    setLevel(nextSequenceLength);
    setInput([]);
    setFeedback(null);
    setReview(null);

    const nextSequence = generateSequence(nextSequenceLength);
    sequenceRef.current = nextSequence;
    setSequence(nextSequence);
    setPhase('show');

    const roundDisplayMs =
      displayMsProp ??
      exposureMsForFlashChallengeLevel(
        displayMs,
        flashChallenge.getCurrentLevel(),
        350
      );
    if (initialDisplayMsRef.current === 0) {
      initialDisplayMsRef.current = roundDisplayMs;
    }
    finalDisplayMsRef.current = roundDisplayMs;
    minimumDisplayMsRef.current = Math.min(
      minimumDisplayMsRef.current,
      roundDisplayMs
    );
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
      setPhase('recall');
    }, roundDisplayMs);
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
    scoreRef.current = 0;
    correctSequencesRef.current = 0;
    failuresRef.current = 0;
    consecutiveFailuresRef.current = 0;
    const initialChallengeLevel = flashChallenge.beginSession();
    const challengeStartingLength = sequenceLengthForChallenge(
      initialChallengeLevel
    );
    initialChallengeLevelRef.current = initialChallengeLevel;
    maxChallengeLevelRef.current = initialChallengeLevel;
    initialDisplayMsRef.current = 0;
    finalDisplayMsRef.current = 0;
    minimumDisplayMsRef.current = Number.POSITIVE_INFINITY;
    levelRef.current = challengeStartingLength;
    maxLevelRef.current = challengeStartingLength;
    setScore(0);
    setFailureStreak(0);
    setReview(null);
    startRef.current = Date.now();

    showSequence(challengeStartingLength);
  }

  function pressDigit(digit: number) {
    if (phase !== 'recall') return;

    const newInput = [...input, digit];
    setInput(newInput);

    if (newInput.length === sequenceRef.current.length) {
      const correct = newInput.every((d, i) => d === sequenceRef.current[i]);
      const expected = [...sequenceRef.current];
      let shouldFinish = false;

      if (correct) {
        correctSequencesRef.current += 1;
        consecutiveFailuresRef.current = 0;
        setFailureStreak(0);
        scoreRef.current += levelRef.current * 10;
        setScore(scoreRef.current);
      } else {
        failuresRef.current += 1;
        consecutiveFailuresRef.current += 1;
        setFailureStreak(consecutiveFailuresRef.current);
        scoreRef.current = Math.max(0, scoreRef.current - FAILURE_PENALTY);
        setScore(scoreRef.current);

        shouldFinish =
          consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES;
      }

      const challengeOutcome =
        flashChallenge.recordOutcome(correct);
      maxChallengeLevelRef.current = Math.max(
        maxChallengeLevelRef.current,
        challengeOutcome.state.level
      );
      const nextSequenceLength = sequenceLengthForChallenge(
        challengeOutcome.state.level
      );
      levelRef.current = nextSequenceLength;
      maxLevelRef.current = Math.max(
        maxLevelRef.current,
        nextSequenceLength
      );
      setLevel(nextSequenceLength);
      setFeedback(correct ? 'correct' : 'wrong');
      setReview({
        submitted: newInput,
        expected,
        correct,
        nextSequenceLength,
        shouldFinish,
      });
      setPhase('feedback');

      scheduleTimeout(() => {
        if (cancelledRef.current) return;
        if (shouldFinish) {
          finish();
          return;
        }
        showSequence(nextSequenceLength);
      }, getRecallFeedbackDurationMs(expected.join(' '), correct));
    }
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const attempts = correctSequencesRef.current + failuresRef.current;
    const accuracy =
      attempts > 0 ? correctSequencesRef.current / attempts : 0;

    void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current);

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        maxLevel: maxLevelRef.current,
        finalLevel: levelRef.current,
        maxSequenceLength: maxLevelRef.current,
        finalSequenceLength: levelRef.current,
        correctSequences: correctSequencesRef.current,
        failures: failuresRef.current,
        endingFailureStreak: consecutiveFailuresRef.current,
        failurePenalty: FAILURE_PENALTY,
        difficulty,
        baseDisplayMs: displayMs,
        displayMs: finalDisplayMsRef.current,
        initialDisplayMs: initialDisplayMsRef.current,
        finalDisplayMs: finalDisplayMsRef.current,
        minimumDisplayMs:
          minimumDisplayMsRef.current === Number.POSITIVE_INFINITY
            ? displayMs
            : minimumDisplayMsRef.current,
        fixedSequenceLength: startingLengthProp != null,
        fixedDisplayMs: displayMsProp != null,
        initialChallengeLevel: initialChallengeLevelRef.current,
        finalChallengeLevel: flashChallenge.getCurrentLevel(),
        highestChallengeLevel: maxChallengeLevelRef.current,
        savedBestChallengeLevel: flashChallenge.getHighestLevel(),
      },
    });
    setPhase('ended');
  }

  function playAgain() {
    clearTrackedTimeouts();
    setPhase('idle');
    scheduleTimeout(start, 50);
  }

  const digitRows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Recall</Text>
        <Text style={styles.subtitle}>Remember and repeat the sequence</Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          startDisabled={!flashChallenge.loaded}
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        >
          <FlashChallengeStatus
            level={flashChallenge.resumeLevel}
            highestLevel={flashChallenge.highestLevel}
          />
        </SimpleIdlePanel>
      )}

      {phase === 'show' && (
        <View style={styles.gameArea}>
          <FlashChallengeStatus
            compact
            level={flashChallenge.level}
            highestLevel={flashChallenge.highestLevel}
          />
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'score',
                value: score,
                label: 'Score',
                testID: 'memory-score',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'level',
                value: level,
                label: 'Digits',
                testID: 'memory-level',
                containerStyle: [styles.statBox, styles.levelBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'strikes',
                value: `${failureStreak}/${MAX_CONSECUTIVE_FAILURES}`,
                label: 'Strikes',
                testID: 'memory-strikes',
                containerStyle: [styles.statBox, styles.strikeBox],
                valueStyle: [styles.statValue, styles.strikeValue],
                labelStyle: [styles.statLabel, styles.strikeLabel],
              },
            ]}
          />

          <View testID="sequence-display" style={styles.sequenceCard}>
            <BriefStimulus
              value={sequence.join(' ')}
              difficulty={difficulty}
              testID="sequence"
              color="#0E4979"
              backgroundColor={colors.background}
              maxFontSize={40}
              minFontSize={9}
              letterSpacing={5}
              maskFraction={flashChallenge.profile.maskFraction}
            />
          </View>

          <Text style={styles.instruction}>Memorize this sequence!</Text>
        </View>
      )}

      {phase === 'recall' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'score',
                value: score,
                label: 'Score',
                testID: 'memory-score',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'level',
                value: level,
                label: 'Digits',
                testID: 'memory-level',
                containerStyle: [styles.statBox, styles.levelBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'strikes',
                value: `${failureStreak}/${MAX_CONSECUTIVE_FAILURES}`,
                label: 'Strikes',
                testID: 'memory-strikes',
                containerStyle: [styles.statBox, styles.strikeBox],
                valueStyle: [styles.statValue, styles.strikeValue],
                labelStyle: [styles.statLabel, styles.strikeLabel],
              },
            ]}
          />

          <View style={[
            styles.inputCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <Text testID="input-display" style={styles.inputDisplay}>
              {input.length > 0 ? input.join(' ') : 'Tap digits...'}
            </Text>
          </View>

          <View testID="digit-keypad" style={styles.keypad}>
            {digitRows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                testID={`keypad-row-${rowIndex + 1}`}
                style={styles.keypadRow}
              >
                {row.map((digit) => (
                  <Pressable
                    accessibilityRole="button"
                    key={digit}
                    testID={`digit-${digit}`}
                    accessibilityLabel={`Digit ${digit}`}
                    style={({ pressed }) => [
                      styles.digitBtn,
                      pressed && styles.digitBtnPressed,
                    ]}
                    onPress={() => pressDigit(digit)}
                  >
                    {({ pressed }) => (
                      <Text
                        style={[
                          styles.digitText,
                          pressed && styles.digitTextPressed,
                        ]}
                      >
                        {digit}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
            <View testID="keypad-row-4" style={styles.keypadRow}>
              <View testID="keypad-spacer" style={styles.keypadSpacer} />
              <Pressable
                accessibilityRole="button"
                testID="digit-0"
                accessibilityLabel="Digit 0"
                style={({ pressed }) => [
                  styles.digitBtn,
                  pressed && styles.digitBtnPressed,
                ]}
                onPress={() => pressDigit(0)}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.digitText,
                      pressed && styles.digitTextPressed,
                    ]}
                  >
                    0
                  </Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="delete-btn"
                accessibilityLabel="Delete last digit"
                accessibilityState={{ disabled: input.length === 0 }}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  input.length === 0 && styles.deleteBtnDisabled,
                  pressed && input.length > 0 && styles.digitBtnPressed,
                ]}
                onPress={() => setInput((current) => current.slice(0, -1))}
                disabled={input.length === 0}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.deleteText,
                      pressed && input.length > 0 && styles.digitTextPressed,
                    ]}
                  >
                    ⌫
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {phase === 'feedback' && review && (
        <View testID="memory-feedback" style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'score',
                value: score,
                label: 'Score',
                testID: 'memory-score',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'level',
                value: level,
                label: 'Next digits',
                testID: 'memory-level',
                containerStyle: [styles.statBox, styles.levelBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'strikes',
                value: `${failureStreak}/${MAX_CONSECUTIVE_FAILURES}`,
                label: 'Strikes',
                testID: 'memory-strikes',
                containerStyle: [styles.statBox, styles.strikeBox],
                valueStyle: [styles.statValue, styles.strikeValue],
                labelStyle: [styles.statLabel, styles.strikeLabel],
              },
            ]}
          />
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
              {review.correct ? 'Correct' : 'Review the number sequence'}
            </Text>
            {!review.correct && (
              <>
                <Text style={styles.reviewLabel}>Your answer</Text>
                <Text testID="memory-user-answer" style={styles.reviewSequence}>
                  {review.submitted.join(' ')}
                </Text>
                <Text style={styles.reviewLabel}>Correct sequence</Text>
                <Text
                  testID="memory-correct-answer"
                  style={styles.reviewSequence}
                >
                  {review.expected.join(' ')}
                </Text>
                <Text style={styles.reviewHint}>
                  −{FAILURE_PENALTY} points ·{' '}
                  {review.nextSequenceLength < review.expected.length
                    ? 'difficulty reduced by one'
                    : 'difficulty remains at the minimum'}
                  {review.shouldFinish
                    ? ' · session ends after this review'
                    : ''}
                </Text>
              </>
            )}
            {review.correct && (
              <Text style={styles.reviewHint}>
                {review.nextSequenceLength > review.expected.length
                  ? 'Span mastered · next sequence is one digit longer'
                  : startingLengthProp != null
                    ? 'Correct · fixed-length practice continues'
                    : 'Correct · repeat this span to confirm mastery'}
              </Text>
            )}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🧠</Text>
          <Text style={styles.endTitle}>Game Over!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            Widest span: {maxLevelRef.current} digits
          </Text>
          <Pressable accessibilityRole="button" testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
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
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  startBtn: { backgroundColor: colors.interactivePrimary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#E7F5FB', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  levelBox: { backgroundColor: '#CDEAF5' },
  strikeBox: { backgroundColor: colors.warningSurface },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0E4979' },
  statLabel: { fontSize: 10, color: '#0B628F' },
  strikeValue: { color: colors.warningForeground },
  strikeLabel: { color: colors.warningForeground },
  sequenceCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 0,
    margin: 0,
    padding: 0,
  },
  instruction: { textAlign: 'center', color: '#6B7280', fontSize: 12 },
  inputCard: {
    backgroundColor: '#F3FAFD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0B628F',
    minHeight: 60,
    justifyContent: 'center',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  inputDisplay: { fontSize: 24, fontWeight: '700', color: '#0E4979', textAlign: 'center', letterSpacing: 4 },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
    padding: 20,
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
  reviewLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  reviewSequence: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  reviewHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  keypadRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  digitBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceTonal,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBtnPressed: {
    backgroundColor: colors.interactivePrimary,
  },
  keypadSpacer: {
    width: 68,
    height: 68,
  },
  deleteBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceTonal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.35,
  },
  digitText: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
  },
  deleteText: {
    color: colors.primaryDark,
    fontSize: 25,
    fontWeight: '700',
  },
  digitTextPressed: {
    color: colors.onInteractive,
  },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: colors.interactivePrimary, marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: colors.interactivePrimary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
