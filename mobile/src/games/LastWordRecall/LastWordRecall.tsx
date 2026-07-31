import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  createPersistentVariedDeckState,
  createRecognitionOptions,
  getFlashWordPool,
  takeNextPersistentVariedItem,
  uniqueStrings,
  type RandomSource,
} from '../../data/flashPracticeContent';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { colors } from '../../theme/colors';
import { BriefStimulus } from '../../ui/BriefStimulus';
import { ChoiceAnswerFeedback } from '../../ui/ChoiceAnswerFeedback';
import { FlashPaceControl } from '../../ui/FlashPaceControl';
import { FlashChallengeStatus } from '../../ui/FlashChallengeStatus';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import {
  useAutoStart,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';
import {
  createFlashPaceState,
  displayDurationForWpm,
  MAX_CONSECUTIVE_FLASH_FAILURES,
  RAPID_FLASH_MAX_WPM,
  updateFlashPace,
  wpmForDisplayDuration,
  type FlashPaceBounds,
  type FlashPaceState,
} from '../flashPacing';
import {
  getFlashChallengeStreamRange,
  getProgressiveFlashContent,
  resumeWpmForFlashChallenge,
} from '../flashChallenge';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import { useFlashChallenge } from '../useFlashChallenge';

const GAME_ID = 'LastWordRecall';
const CORRECT_ANSWERS_TO_INCREASE = 4;
const MIN_STREAM_WORDS = 3;
const MAX_STREAM_WORDS = 10;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  words?: string[];
  wordDisplayMs?: number;
  totalRounds?: number;
  sequenceLength?: number;
  random?: RandomSource;
  contentRandom?: RandomSource;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'flashing' | 'choose' | 'feedback' | 'ended';
type FinishReason = 'three-misses' | 'manual' | 'round-limit';
type AnswerReview = { selectedAnswer: string; correct: boolean } | null;

function getConfig(
  difficulty: Difficulty
): FlashPaceBounds & { baseWpm: number } {
  switch (difficulty) {
    case 'easy':
      return {
        baseWpm: 180,
        minWpm: 120,
        maxWpm: RAPID_FLASH_MAX_WPM,
      };
    case 'medium':
      return {
        baseWpm: 280,
        minWpm: 180,
        maxWpm: RAPID_FLASH_MAX_WPM,
      };
    case 'hard':
      return {
        baseWpm: 380,
        minWpm: 260,
        maxWpm: RAPID_FLASH_MAX_WPM,
      };
  }
}

function clampStreamLength(length: number): number {
  if (!Number.isFinite(length)) return MIN_STREAM_WORDS;
  return Math.min(
    MAX_STREAM_WORDS,
    Math.max(MIN_STREAM_WORDS, Math.round(length))
  );
}

function createRandomStreamLength(
  random: RandomSource,
  min = MIN_STREAM_WORDS,
  max = MAX_STREAM_WORDS
): number {
  const sample = random();
  const value = Number.isFinite(sample)
    ? Math.min(0.999999999, Math.max(0, sample))
    : 0;
  return (
    min + Math.floor(value * (max - min + 1))
  );
}

export default function LastWordRecall({
  words: wordsProp,
  wordDisplayMs,
  totalRounds,
  sequenceLength: sequenceLengthProp,
  random = Math.random,
  contentRandom = Math.random,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const config = getConfig(difficulty);
  const flashChallenge = useFlashChallenge(
    GAME_ID,
    difficulty,
    CORRECT_ANSWERS_TO_INCREASE,
    MAX_CONSECUTIVE_FLASH_FAILURES,
    {
      masteryEligible:
        wordsProp == null &&
        wordDisplayMs == null &&
        sequenceLengthProp == null,
    }
  );
  const fixedSequenceLength =
    sequenceLengthProp == null
      ? null
      : clampStreamLength(sequenceLengthProp);
  const defaultPool = useMemo(
    () => getFlashWordPool(difficulty),
    [difficulty]
  );
  const masterWordPool = useMemo(() => {
    const customPool = uniqueStrings(wordsProp ?? []);
    return customPool.length > 0 ? customPool : defaultPool;
  }, [defaultPool, wordsProp]);
  const optionPool = useMemo(
    () => uniqueStrings([...masterWordPool, ...defaultPool]),
    [defaultPool, masterWordPool]
  );
  const defaultWpm =
    wordDisplayMs == null
      ? config.baseWpm
      : wpmForDisplayDuration(wordDisplayMs);
  const [phase, setPhase] = useState<Phase>('idle');
  const [startingWpm, setStartingWpm] = useState(defaultWpm);
  const [liveWpm, setLiveWpm] = useState(defaultWpm);
  const [round, setRound] = useState(0);
  const [shownIndex, setShownIndex] = useState(0);
  const [shownWord, setShownWord] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [missStreak, setMissStreak] = useState(0);
  const [answerReview, setAnswerReview] = useState<AnswerReview>(null);
  const [finishReason, setFinishReason] =
    useState<FinishReason>('three-misses');

  const startRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const sequenceRef = useRef<string[]>([]);
  const shownIndexRef = useRef(0);
  const answerRef = useRef('');
  const deckStatesRef = useRef(
    new Map<number, ReturnType<typeof createPersistentVariedDeckState>>()
  );
  const streamLengthsRef = useRef<number[]>([]);
  const paceRef = useRef<FlashPaceState>(
    createFlashPaceState(defaultWpm)
  );
  const initialWpmRef = useRef(defaultWpm);
  const initialChallengeLevelRef = useRef(1);
  const maxChallengeLevelRef = useRef(1);
  const startingWpmRef = useRef(defaultWpm);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(() => {
    const nextConfig = getConfig(difficulty);
    const nextWpm =
      wordDisplayMs == null
        ? nextConfig.baseWpm
        : wpmForDisplayDuration(wordDisplayMs);
    startingWpmRef.current = nextWpm;
    setStartingWpm(nextWpm);
    setLiveWpm(nextWpm);
  }, [difficulty, wordDisplayMs]);

  useEffect(() => {
    if (
      wordDisplayMs == null &&
      flashChallenge.loaded
    ) {
      const nextWpm = resumeWpmForFlashChallenge(
        config.baseWpm,
        flashChallenge.resumeLevel,
        flashChallenge.resumeWpm,
        config.maxWpm
      );
      startingWpmRef.current = nextWpm;
      setStartingWpm(nextWpm);
    }
  }, [
    config.baseWpm,
    config.maxWpm,
    flashChallenge.loaded,
    flashChallenge.resumeLevel,
    flashChallenge.resumeWpm,
    wordDisplayMs,
  ]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function createLastWordOptions(sequence: readonly string[]): string[] {
    const answer =
      sequence[sequence.length - 1] ?? masterWordPool[0] ?? 'focus';
    return createRecognitionOptions(
      answer,
      uniqueStrings([...sequence.slice(0, -1), ...optionPool]),
      4,
      contentRandom
    );
  }

  function revealNextWord() {
    if (cancelledRef.current) return;
    if (shownIndexRef.current >= sequenceRef.current.length - 1) {
      setPhase('choose');
      return;
    }

    shownIndexRef.current += 1;
    setShownIndex(shownIndexRef.current);
    setShownWord(sequenceRef.current[shownIndexRef.current]);
    scheduleTimeout(
      revealNextWord,
      wordDisplayMs ?? displayDurationForWpm(paceRef.current.wpm)
    );
  }

  function startRound() {
    const challengeLevel = flashChallenge.getCurrentLevel();
    const streamRange = getFlashChallengeStreamRange(challengeLevel);
    const sequenceLength =
      fixedSequenceLength ??
      createRandomStreamLength(
        random,
        streamRange.min,
        streamRange.max
      );
    const wordPool = getProgressiveFlashContent(
      masterWordPool,
      challengeLevel
    );
    let deckState = deckStatesRef.current.get(challengeLevel);
    if (!deckState) {
      deckState = createPersistentVariedDeckState();
      deckState.previous = answerRef.current;
      deckStatesRef.current.set(challengeLevel, deckState);
    }
    const sequence = Array.from({ length: sequenceLength }, () =>
      takeNextPersistentVariedItem(
        deckState,
        wordPool,
        contentRandom
      ) ?? wordPool[0] ?? 'focus'
    );
    streamLengthsRef.current.push(sequenceLength);
    sequenceRef.current = sequence;
    shownIndexRef.current = 0;
    const answer =
      sequence[sequence.length - 1] ?? wordPool[0] ?? 'focus';
    answerRef.current = answer;
    setOptions(createLastWordOptions(sequence));
    setShownIndex(0);
    setShownWord(sequence[0] ?? answer);
    setAnswerReview(null);
    setPhase('flashing');
    scheduleTimeout(
      revealNextWord,
      wordDisplayMs ?? displayDurationForWpm(paceRef.current.wpm)
    );
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
    correctRef.current = 0;
    roundRef.current = 0;
    streamLengthsRef.current = [];
    const initialChallengeLevel = flashChallenge.beginSession();
    const sessionWpm = startingWpmRef.current;
    initialChallengeLevelRef.current = initialChallengeLevel;
    maxChallengeLevelRef.current = initialChallengeLevel;
    initialWpmRef.current = sessionWpm;
    paceRef.current = createFlashPaceState(sessionWpm);
    setRound(0);
    setScore(0);
    setCorrectStreak(0);
    setMissStreak(0);
    setAnswerReview(null);
    setLiveWpm(sessionWpm);
    startRef.current = Date.now();
    startRound();
  }

  useAutoStart(autoStart, phase, flashChallenge.loaded, start);

  function choose(index: number) {
    if (phase !== 'choose') return;
    const selectedAnswer = options[index] ?? '';
    const correct = selectedAnswer === answerRef.current;
    if (correct) {
      scoreRef.current += 10;
      correctRef.current += 1;
      setScore(scoreRef.current);
    }

    const previousPace = paceRef.current;
    const completedCorrectRun =
      correct &&
      previousPace.correctStreak + 1 >=
        CORRECT_ANSWERS_TO_INCREASE;
    paceRef.current = updateFlashPace(previousPace, correct, {
      ...config,
      step: wordDisplayMs == null ? config.step : 0,
      correctAnswersToIncrease: CORRECT_ANSWERS_TO_INCREASE,
      missesToDecrease: 1,
    });
    const challengeOutcome = flashChallenge.recordOutcome(correct);
    if (wordDisplayMs == null) {
      if (completedCorrectRun) {
        flashChallenge.recordQualifiedWpm(paceRef.current.wpm);
      } else if (
        !correct &&
        paceRef.current.missStreak ===
          MAX_CONSECUTIVE_FLASH_FAILURES
      ) {
        flashChallenge.recordRollbackWpm(paceRef.current.wpm);
      }
    }
    maxChallengeLevelRef.current = Math.max(
      maxChallengeLevelRef.current,
      challengeOutcome.state.level
    );
    setLiveWpm(paceRef.current.wpm);
    setCorrectStreak(paceRef.current.correctStreak);
    setMissStreak(paceRef.current.missStreak);

    roundRef.current += 1;
    setRound(roundRef.current);
    setAnswerReview({ selectedAnswer, correct });
    setPhase('feedback');
    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      if (
        paceRef.current.missStreak >= MAX_CONSECUTIVE_FLASH_FAILURES
      ) {
        finish('three-misses');
      } else if (
        totalRounds != null &&
        roundRef.current >= totalRounds
      ) {
        finish('round-limit');
      } else {
        startRound();
      }
    }, getRecallFeedbackDurationMs(answerRef.current, correct));
  }

  function finish(reason: FinishReason) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const attempts = roundRef.current;
    const accuracy = attempts > 0 ? correctRef.current / attempts : 0;
    const initialStreamRange = getFlashChallengeStreamRange(
      initialChallengeLevelRef.current
    );
    setFinishReason(reason);
    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current).catch(
      () => undefined
    );
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        rounds: attempts,
        roundLimit: totalRounds ?? null,
        correct: correctRef.current,
        endingFailureStreak: paceRef.current.missStreak,
        correctAnswersToIncrease: CORRECT_ANSWERS_TO_INCREASE,
        finishReason: reason,
        difficulty,
        sequenceLength: fixedSequenceLength,
        streamLengths: [...streamLengthsRef.current],
        streamLengthRange: {
          min: fixedSequenceLength ?? initialStreamRange.min,
          max: fixedSequenceLength ?? initialStreamRange.max,
        },
        finalStreamLengthRange:
          fixedSequenceLength == null
            ? getFlashChallengeStreamRange(
                flashChallenge.getCurrentLevel()
              )
            : {
                min: fixedSequenceLength,
                max: fixedSequenceLength,
              },
        initialWpm: initialWpmRef.current,
        finalWpm: paceRef.current.wpm,
        paceChanges: paceRef.current.changes,
        adaptivePacing: wordDisplayMs == null,
        initialChallengeLevel: initialChallengeLevelRef.current,
        finalChallengeLevel: flashChallenge.getCurrentLevel(),
        highestChallengeLevel: maxChallengeLevelRef.current,
        savedBestChallengeLevel: flashChallenge.getHighestLevel(),
        savedResumeWpm: flashChallenge.getResumeWpm() ?? null,
        savedBestWpm: flashChallenge.getHighestWpm() ?? null,
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
          containerStyle: styles.statBox,
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
        {
          key: 'streak',
          value:
            missStreak > 0
              ? `${missStreak}/${MAX_CONSECUTIVE_FLASH_FAILURES}`
              : `${correctStreak}/${CORRECT_ANSWERS_TO_INCREASE}`,
          label: missStreak > 0 ? 'Misses' : 'Correct',
          containerStyle: styles.statBox,
          valueStyle: styles.statValue,
          labelStyle: styles.statLabel,
        },
        {
          key: 'wpm',
          value: liveWpm,
          label: 'WPM',
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
        <Text style={styles.title}>Last Word</Text>
        <Text style={styles.subtitle}>
          Follow the stream and recall the final word
        </Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          startDisabled={!flashChallenge.loaded}
          containerStyle={styles.idleContent}
        >
          <Text style={styles.sequenceHint}>
            {fixedSequenceLength == null
              ? 'Stops unpredictably; the stream grows with your level'
              : `${fixedSequenceLength} words per stream`}{' '}
            · +25 WPM after{' '}
            {CORRECT_ANSWERS_TO_INCREASE} correct · 3 misses end
          </Text>
          <FlashChallengeStatus
            level={flashChallenge.resumeLevel}
            highestLevel={flashChallenge.highestLevel}
          />
          <FlashPaceControl
            wpm={startingWpm}
            minWpm={config.minWpm}
            maxWpm={config.maxWpm}
            disabled={wordDisplayMs != null}
            correctAnswersToIncrease={CORRECT_ANSWERS_TO_INCREASE}
            onChange={(nextWpm) => {
              startingWpmRef.current = nextWpm;
              setStartingWpm(nextWpm);
            }}
          />
        </SimpleIdlePanel>
      )}

      {phase === 'flashing' && (
        <View style={styles.gameArea}>
          {stats}
          <FlashChallengeStatus
            compact
            level={flashChallenge.level}
            highestLevel={flashChallenge.highestLevel}
          />
          <View testID="word-stream" style={styles.wordCard}>
            <Text style={styles.streamCounter}>
              Word {shownIndex + 1}
            </Text>
            <BriefStimulus
              value={shownWord}
              difficulty={difficulty}
              testID="stream-word"
              color={colors.warningForeground}
              backgroundColor={colors.background}
              maxFontSize={46}
              minFontSize={14}
              maskFraction={flashChallenge.profile.maskFraction}
            />
          </View>
          <Text style={styles.instruction}>Keep following—do not tap yet</Text>
        </View>
      )}

      {phase === 'choose' && (
        <View style={styles.gameArea}>
          {stats}
          <Text style={styles.chooseTitle}>Which word appeared last?</Text>
          <View testID="last-word-options" style={styles.optionsContainer}>
            {options.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={option}
                key={`${option}-${index}`}
                testID={`last-word-option-${index}`}
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => choose(index)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
          {round > 0 && (
            <Pressable
              accessibilityRole="button"
              testID="finish-session"
              style={styles.finishButton}
              onPress={() => finish('manual')}
            >
              <Text style={styles.finishButtonText}>Finish session</Text>
            </Pressable>
          )}
        </View>
      )}

      {phase === 'feedback' && answerReview && (
        <View style={styles.gameArea}>
          {stats}
          <ChoiceAnswerFeedback
            correct={answerReview.correct}
            selectedAnswer={answerReview.selectedAnswer}
            correctAnswer={answerRef.current}
            answerLabel="Correct last word"
            testID="last-word-feedback"
          />
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>◎</Text>
          <Text style={styles.endTitle}>
            {finishReason === 'three-misses'
              ? 'Three misses — session complete'
              : 'Stream complete'}
          </Text>
          <Text style={styles.endScore}>{scoreRef.current}</Text>
          <Text style={styles.endMeta}>
            {correctRef.current}/{roundRef.current} final words recalled
          </Text>
          <Text style={styles.endPace}>
            {initialWpmRef.current} → {paceRef.current.wpm} WPM
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            style={styles.playAgainButton}
            onPress={playAgain}
          >
            <Text style={styles.playAgainText}>Play again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  idleContent: { flex: 1 },
  sequenceHint: {
    color: colors.infoForeground,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
  },
  gameArea: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  statBox: {
    minWidth: 78,
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.primaryDark },
  statLabel: { fontSize: 10, color: colors.textSecondary },
  wordCard: {
    minHeight: 205,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 0,
    justifyContent: 'center',
    margin: 0,
    padding: 0,
  },
  streamCounter: {
    position: 'absolute',
    top: 16,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  instruction: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  chooseTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionButton: {
    width: '48%',
    minHeight: 64,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPressed: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.surfaceTonal,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  finishButton: {
    minHeight: 48,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  finishButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  endCard: { alignItems: 'center', paddingVertical: 24 },
  endEmoji: { fontSize: 40, color: colors.primary, marginBottom: 8 },
  endTitle: { fontSize: 21, fontWeight: '800', color: colors.textPrimary },
  endScore: {
    color: colors.primaryDark,
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 8,
  },
  endMeta: { color: colors.textSecondary, fontSize: 14 },
  endPace: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 7,
  },
  playAgainButton: {
    minHeight: 48,
    marginTop: 18,
    backgroundColor: colors.interactivePrimary,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 14,
    justifyContent: 'center',
  },
  playAgainText: {
    color: colors.onInteractive,
    fontSize: 15,
    fontWeight: '700',
  },
});
