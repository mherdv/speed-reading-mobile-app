import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { formatDuration } from '../../domain/results';
import { useAutoStart, type Difficulty } from '../gameHooks';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { BriefStimulus } from '../../ui/BriefStimulus';
import { FlashChallengeStatus } from '../../ui/FlashChallengeStatus';
import { colors } from '../../theme/colors';
import {
  interleaveBalancedTrials,
  randomIndex,
  type RandomSource,
} from '../../data/randomization';
import {
  FLASH_CHALLENGE_MAX_LEVEL,
  exposureMsForFlashChallengeLevel,
} from '../flashChallenge';
import { useFlashChallenge } from '../useFlashChallenge';

const GAME_ID = 'NumberRecognition';
const CORRECT_TRIALS_TO_ADVANCE = 8;
const MISSES_TO_ROLL_BACK = 3;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  target?: number;
  stream?: number[];
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type NumberRecognitionDigitCount = 1 | 2 | 3 | 4 | 5 | 6;
type NumberRecognitionSimilarity = 'low' | 'medium' | 'high';

export type NumberRecognitionChallenge = {
  durationMs: number;
  digitCount: NumberRecognitionDigitCount;
  distractorSimilarity: NumberRecognitionSimilarity;
  stimulusCount: number;
  displayCadenceMs: number;
  defaultTarget: number;
};

const NUMBER_RECOGNITION_CHALLENGES: Record<
  Difficulty,
  NumberRecognitionChallenge
> = {
  easy: {
    durationMs: 30_000,
    digitCount: 1,
    distractorSimilarity: 'low',
    stimulusCount: 30,
    displayCadenceMs: 1_600,
    defaultTarget: 7,
  },
  medium: {
    durationMs: 30_000,
    digitCount: 2,
    distractorSimilarity: 'medium',
    stimulusCount: 50,
    displayCadenceMs: 1_100,
    defaultTarget: 37,
  },
  hard: {
    durationMs: 30_000,
    digitCount: 3,
    distractorSimilarity: 'high',
    stimulusCount: 70,
    displayCadenceMs: 700,
    defaultTarget: 873,
  },
};

export function getNumberRecognitionChallenge(
  difficulty: Difficulty
): NumberRecognitionChallenge {
  return NUMBER_RECOGNITION_CHALLENGES[difficulty];
}

const SIMILARITY_ORDER: readonly NumberRecognitionSimilarity[] = [
  'low',
  'medium',
  'high',
];

function targetWithDigitCount(
  target: number,
  digitCount: NumberRecognitionDigitCount
): number {
  if (String(Math.abs(target)).length === digitCount) return target;
  if (digitCount === 1) return Math.abs(target) % 10;
  const minimum = 10 ** (digitCount - 1);
  const range = 9 * minimum;
  return minimum + (Math.abs(target) % range);
}

/**
 * Keeps each public difficulty's level-one behavior intact, then increases
 * visual similarity before adding another digit every four flash stages.
 */
export function getNumberRecognitionStageChallenge(
  difficulty: Difficulty,
  level: number
): NumberRecognitionChallenge {
  const base = getNumberRecognitionChallenge(difficulty);
  const roundedLevel = Number.isFinite(level)
    ? Math.round(level)
    : 1;
  const safeLevel = Math.min(
    FLASH_CHALLENGE_MAX_LEVEL,
    Math.max(1, roundedLevel)
  );
  const digitCount = Math.min(
    6,
    base.digitCount + Math.floor((safeLevel - 1) / 4)
  ) as NumberRecognitionDigitCount;
  const baseSimilarityIndex = SIMILARITY_ORDER.indexOf(
    base.distractorSimilarity
  );
  const distractorSimilarity =
    SIMILARITY_ORDER[
      Math.min(
        SIMILARITY_ORDER.length - 1,
        baseSimilarityIndex + Math.floor((safeLevel - 1) / 3)
      )
    ]!;

  return {
    ...base,
    digitCount,
    distractorSimilarity,
    defaultTarget: targetWithDigitCount(base.defaultTarget, digitCount),
  };
}

function randomNumberWithDigits(
  digitCount: NumberRecognitionDigitCount,
  random: RandomSource
): number {
  if (digitCount === 1) return randomIndex(10, random);
  const minimum = 10 ** (digitCount - 1);
  return minimum + randomIndex(9 * minimum, random);
}

function similarNumber(
  target: number,
  random: RandomSource,
  maximumDigitDelta: 1 | 2
): number {
  const digits = String(target).split('');
  const index = randomIndex(digits.length, random);
  const original = Number(digits[index]);
  const direction = randomIndex(2, random) === 0 ? 1 : -1;
  const magnitude = 1 + randomIndex(maximumDigitDelta, random);
  let replacement =
    (original + direction * magnitude + 10) % 10;

  if (index === 0 && digits.length > 1 && replacement === 0) {
    replacement =
      (original - direction * magnitude + 10) % 10;
  }

  digits[index] = String(replacement);
  return Number(digits.join(''));
}

function randomDistractor(
  target: number,
  challenge: NumberRecognitionChallenge,
  random: RandomSource
): number {
  if (challenge.distractorSimilarity === 'high') {
    return similarNumber(target, random, 1);
  }
  if (challenge.distractorSimilarity === 'medium') {
    return similarNumber(target, random, 2);
  }

  const candidate = randomNumberWithDigits(challenge.digitCount, random);
  if (candidate !== target) return candidate;

  const minimum = challenge.digitCount === 1
    ? 0
    : 10 ** (challenge.digitCount - 1);
  const maximum = 10 ** challenge.digitCount - 1;
  return candidate === maximum ? minimum : candidate + 1;
}

export function generateNumberRecognitionStream(
  target: number,
  challenge: NumberRecognitionChallenge,
  random: RandomSource = Math.random
): number[] {
  if (challenge.stimulusCount % 2 !== 0) {
    throw new RangeError(
      'Number Recognition requires an even stimulus count for a balanced stream'
    );
  }

  const trialCount = challenge.stimulusCount / 2;
  return interleaveBalancedTrials(
    Array.from({ length: trialCount }, () => target),
    Array.from({ length: trialCount }, () =>
      randomDistractor(target, challenge, random)
    ),
    random
  );
}

export default function NumberRecognition({
  target: targetProp,
  stream,
  durationMs: durationMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const baseChallenge = getNumberRecognitionChallenge(difficulty);
  const progressionEnabled = targetProp == null && stream == null;
  const defaultTarget = targetProp ?? baseChallenge.defaultTarget;
  const durationMs = durationMsProp ?? baseChallenge.durationMs;
  const flashChallenge = useFlashChallenge(
    GAME_ID,
    difficulty,
    CORRECT_TRIALS_TO_ADVANCE,
    MISSES_TO_ROLL_BACK,
    { masteryEligible: progressionEnabled }
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [activeChallenge, setActiveChallenge] =
    useState<NumberRecognitionChallenge>(baseChallenge);
  const [currentTarget, setCurrentTarget] = useState(defaultTarget);
  const [seq, setSeq] = useState<number[]>(() =>
    stream ??
    generateNumberRecognitionStream(defaultTarget, baseChallenge)
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const timedOutRef = useRef(0);
  const targetTrialsRef = useRef(0);
  const nonTargetTrialsRef = useRef(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cadenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialChallengeLevelRef = useRef(1);
  const maxChallengeLevelRef = useRef(1);
  const activeChallengeRef =
    useRef<NumberRecognitionChallenge>(baseChallenge);
  const initialStageChallengeRef =
    useRef<NumberRecognitionChallenge>(baseChallenge);
  const initialDisplayCadenceMsRef = useRef(
    baseChallenge.displayCadenceMs
  );
  const maxDigitCountRef =
    useRef<NumberRecognitionDigitCount>(baseChallenge.digitCount);
  const currentTargetRef = useRef(defaultTarget);
  const sequenceRef = useRef(seq);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
      if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, flashChallenge.loaded, start);

  const current = seq[Math.min(index, seq.length - 1)] ?? 0;
  const stimulusBackground =
    feedback === 'correct'
      ? '#D1FAE5'
      : feedback === 'wrong'
        ? '#FEE2E2'
        : '#FFFBEB';
  const liveCadenceMs = exposureMsForFlashChallengeLevel(
    baseChallenge.displayCadenceMs,
    flashChallenge.level,
    250
  );

  useEffect(() => {
    if (phase !== 'running') return;
    if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
    cadenceTimeoutRef.current = setTimeout(
      handleStimulusTimeout,
      liveCadenceMs
    );
    return () => {
      if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
    };
  }, [index, liveCadenceMs, phase]);

  function buildStageSession(
    level: number,
    useStageDefaultTarget: boolean
  ) {
    const stageChallenge = progressionEnabled
      ? getNumberRecognitionStageChallenge(difficulty, level)
      : baseChallenge;
    const stageTarget =
      targetProp ??
      (progressionEnabled && !useStageDefaultTarget
        ? randomNumberWithDigits(stageChallenge.digitCount, Math.random)
        : stageChallenge.defaultTarget);
    const stageSequence =
      stream ??
      generateNumberRecognitionStream(stageTarget, stageChallenge);
    return {
      challenge: stageChallenge,
      sequence: stageSequence,
      target: stageTarget,
    };
  }

  function applyStageSession(
    stage: ReturnType<typeof buildStageSession>
  ) {
    activeChallengeRef.current = stage.challenge;
    maxDigitCountRef.current = Math.max(
      maxDigitCountRef.current,
      stage.challenge.digitCount
    ) as NumberRecognitionDigitCount;
    currentTargetRef.current = stage.target;
    sequenceRef.current = stage.sequence;
    setActiveChallenge(stage.challenge);
    setCurrentTarget(stage.target);
    setSeq(stage.sequence);
    setIndex(0);
  }

  function advanceAfterOutcome(
    nextChallengeLevel: number
  ) {
    if (progressionEnabled) {
      const nextChallenge = getNumberRecognitionStageChallenge(
        difficulty,
        nextChallengeLevel
      );
      const currentChallenge = activeChallengeRef.current;
      const contentChanged =
        nextChallenge.digitCount !== currentChallenge.digitCount ||
        nextChallenge.distractorSimilarity !==
          currentChallenge.distractorSimilarity;

      if (contentChanged) {
        applyStageSession(
          buildStageSession(nextChallengeLevel, false)
        );
        return;
      }
    }

    setIndex(
      (currentIndex) =>
        (currentIndex + 1) %
        Math.max(1, sequenceRef.current.length)
    );
  }

  function start() {
    if (
      !flashChallenge.loaded ||
      (phase !== 'idle' && phase !== 'ended')
    ) {
      return;
    }
    cancelledRef.current = false;
    reportedRef.current = false;
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
    scoreRef.current = 0;
    attemptsRef.current = 0;
    timedOutRef.current = 0;
    targetTrialsRef.current = 0;
    nonTargetTrialsRef.current = 0;
    const initialChallengeLevel = flashChallenge.beginSession();
    initialChallengeLevelRef.current = initialChallengeLevel;
    maxChallengeLevelRef.current = initialChallengeLevel;
    const initialStage = buildStageSession(
      initialChallengeLevel,
      true
    );
    initialStageChallengeRef.current = initialStage.challenge;
    initialDisplayCadenceMsRef.current =
      exposureMsForFlashChallengeLevel(
        baseChallenge.displayCadenceMs,
        initialChallengeLevel,
        250
      );
    maxDigitCountRef.current = initialStage.challenge.digitCount;
    applyStageSession(initialStage);
    setPhase('running');
    setScore(0);
    setAttempts(0);
    setTimeLeft(durationMs);
    setFeedback(null);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      }
    }, 100);
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    if (cadenceTimeoutRef.current) clearTimeout(cadenceTimeoutRef.current);

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = attemptsRef.current > 0 ? Math.min(1, scoreRef.current / (10 * attemptsRef.current)) : 0;
    const calibrationEligible =
      attemptsRef.current >= 4 &&
      targetTrialsRef.current >= 2 &&
      nonTargetTrialsRef.current >= 2;
    const initialStageChallenge = initialStageChallengeRef.current;
    const finalStageChallenge = activeChallengeRef.current;

    setPhase('ended');
    if (calibrationEligible) {
      void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current).catch(
        () => undefined
      );
    }
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        target: currentTargetRef.current,
        total: sequenceRef.current.length,
        targetTrials: targetTrialsRef.current,
        nonTargetTrials: nonTargetTrialsRef.current,
        calibrationEligible,
        attempts: attemptsRef.current,
        timedOut: timedOutRef.current,
        difficulty,
        digitCount: finalStageChallenge.digitCount,
        distractorSimilarity:
          finalStageChallenge.distractorSimilarity,
        initialDigitCount: initialStageChallenge.digitCount,
        finalDigitCount: finalStageChallenge.digitCount,
        maximumDigitCount: maxDigitCountRef.current,
        initialDistractorSimilarity:
          initialStageChallenge.distractorSimilarity,
        finalDistractorSimilarity:
          finalStageChallenge.distractorSimilarity,
        baseDisplayCadenceMs: baseChallenge.displayCadenceMs,
        displayCadenceMs: initialDisplayCadenceMsRef.current,
        initialDisplayCadenceMs: initialDisplayCadenceMsRef.current,
        finalDisplayCadenceMs: exposureMsForFlashChallengeLevel(
          baseChallenge.displayCadenceMs,
          flashChallenge.getCurrentLevel(),
          250
        ),
        initialChallengeLevel: initialChallengeLevelRef.current,
        finalChallengeLevel: flashChallenge.getCurrentLevel(),
        highestChallengeLevel: maxChallengeLevelRef.current,
        savedBestChallengeLevel: flashChallenge.getHighestLevel(),
      },
    });
  }

  function evaluate(isMatchPressed: boolean) {
    if (phase !== 'running') return;
    const isMatch = current === currentTarget;
    const correct = isMatchPressed ? isMatch : !isMatch;

    attemptsRef.current += 1;
    if (isMatch) targetTrialsRef.current += 1;
    else nonTargetTrialsRef.current += 1;
    setAttempts(attemptsRef.current);

    if (correct) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    const challengeOutcome = flashChallenge.recordOutcome(correct);
    maxChallengeLevelRef.current = Math.max(
      maxChallengeLevelRef.current,
      challengeOutcome.state.level
    );

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 200);
    advanceAfterOutcome(challengeOutcome.state.level);
  }

  function handleStimulusTimeout() {
    if (phase !== 'running') return;
    const isMatch = current === currentTarget;
    attemptsRef.current += 1;
    timedOutRef.current += 1;
    if (isMatch) targetTrialsRef.current += 1;
    else nonTargetTrialsRef.current += 1;
    setAttempts(attemptsRef.current);
    const challengeOutcome = flashChallenge.recordOutcome(false);
    maxChallengeLevelRef.current = Math.max(
      maxChallengeLevelRef.current,
      challengeOutcome.state.level
    );
    setFeedback('wrong');
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 200);
    advanceAfterOutcome(challengeOutcome.state.level);
  }

  function playAgain() {
    setPhase('idle');
    replayTimeoutRef.current = setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Number Recognition</Text>
        <Text style={styles.subtitle}>Find target number: <Text style={styles.targetHighlight}>{currentTarget}</Text></Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          startDisabled={!flashChallenge.loaded}
          containerStyle={styles.endCard}
          descriptionStyle={styles.endTitle}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        >
          <FlashChallengeStatus
            level={flashChallenge.resumeLevel}
            highestLevel={flashChallenge.highestLevel}
          />
        </SimpleIdlePanel>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <FlashChallengeStatus
            compact
            level={flashChallenge.level}
            highestLevel={flashChallenge.highestLevel}
          />
          <Text testID="score" style={styles.hiddenText}>Score: {score}</Text>
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
                key: 'time',
                value: formatDuration(timeLeft),
                label: 'Time',
                containerStyle: [styles.statBox, styles.timerBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'target',
                value: currentTarget,
                label: `Target · ${activeChallenge.digitCount}d`,
                testID: 'recognition-target',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={[
            styles.numberCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <BriefStimulus
              value={String(current)}
              difficulty={difficulty}
              testID="current-number"
              color="#92400E"
              backgroundColor={stimulusBackground}
              maxFontSize={68}
              minFontSize={18}
              maskFraction={flashChallenge.profile.maskFraction}
            />
          </View>

          <View style={styles.buttonsRow}>
            <Pressable accessibilityRole="button" testID="match" style={[styles.choiceBtn, styles.matchBtn]} onPress={() => evaluate(true)}>
              <Text style={styles.choiceBtnText}>MATCH ✓</Text>
            </Pressable>
            <Pressable accessibilityRole="button" testID="no" style={[styles.choiceBtn, styles.noBtn]} onPress={() => evaluate(false)}>
              <Text style={styles.choiceBtnText}>NO ✗</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🔢</Text>
          <Text style={styles.endTitle}>Time's Up!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            Accuracy: {attempts > 0 ? Math.round((score / (10 * attempts)) * 100) : 0}%
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
  targetHighlight: { color: colors.warningForeground, fontWeight: '700' },
  startBtn: { backgroundColor: colors.warningForeground, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#FEF3C7', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: '#FDE68A' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#92400E' },
  statLabel: { fontSize: 10, color: '#B45309' },
  numberCard: {
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    borderWidth: 0,
    justifyContent: 'center',
    margin: 0,
    minHeight: 150,
    padding: 0,
  },
  cardCorrect: { backgroundColor: '#D1FAE5' },
  cardWrong: { backgroundColor: '#FEE2E2' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  choiceBtn: { flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  matchBtn: { backgroundColor: '#10B981' },
  noBtn: { backgroundColor: '#EF4444' },
  choiceBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: colors.warningForeground, marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: colors.warningForeground, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
  hiddenText: { position: 'absolute', opacity: 0 },
});
