import React, { useEffect, useRef, useState } from 'react';
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
  createPersistentVariedDeckState,
  selectSimilarDistractors,
  takeNextPersistentVariedItem,
  uniqueStrings,
  type RandomSource,
} from '../../data/flashPracticeContent';
import { boundedRandom, shuffleItems } from '../../data/randomization';
import { levelToStars, updateProgress } from '../../data/progressStore';
import {
  VOCABULARY_WITH_DEFINITIONS,
  type VocabularyWord,
} from '../../data/vocabulary';
import {
  measuredElapsedMs,
  monotonicNowMs,
  type MillisecondClock,
} from '../../domain/timing';
import { colors } from '../../theme/colors';
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences';
import { BriefStimulus } from '../../ui/BriefStimulus';
import { FlashChallengeStatus } from '../../ui/FlashChallengeStatus';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import {
  exposureMsForFlashChallengeLevel,
  getProgressiveFlashContent,
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

const GAME_ID = 'PeripheralWordCatch';
const CORRECT_ANSWERS_TO_ADVANCE = 4;
const MAX_CONSECUTIVE_FAILURES = 3;
const WORD_TARGET_WIDTH = 138;
const MIN_WORD_TARGET_WIDTH = 72;
const FIXATION_VISIBLE_HALF_WIDTH = 18;
const FIXATION_TARGET_GAP = 10;
const BOARD_EDGE_GAP = 8;
const FIXATION_CUE_MS = 600;

export type PeripheralWordEntry = {
  word: string;
  definition: string;
  category: string;
};

export type PeripheralWordConfig = {
  baseExposureMs: number;
  minimumExposureMs: number;
  baseOffset: number;
  fontSize: number;
  optionCount: number;
  meaningEvery: number;
  totalRounds: number;
};

type PeripheralSide = 'left' | 'right';
type Phase =
  | 'idle'
  | 'fixate'
  | 'show'
  | 'choose'
  | 'meaning'
  | 'feedback'
  | 'ended';
type FinishReason = 'round-limit' | 'three-misses';
type MeaningOption = { id: string; text: string };
type Review = {
  selectedWord: string;
  wordCorrect: boolean;
  selectedMeaning?: string;
  meaningCorrect?: boolean;
};

type Props = {
  entries?: readonly PeripheralWordEntry[];
  displayMs?: number;
  fixationMs?: number;
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: RandomSource;
  clock?: MillisecondClock;
  onReportResult?: (payload: GameReportPayload) => void;
};

const CONFIGS: Record<Difficulty, PeripheralWordConfig> = {
  easy: {
    baseExposureMs: 1_000,
    minimumExposureMs: 560,
    baseOffset: 97,
    fontSize: 29,
    optionCount: 3,
    meaningEvery: 5,
    totalRounds: 10,
  },
  medium: {
    baseExposureMs: 760,
    minimumExposureMs: 390,
    baseOffset: 102,
    fontSize: 27,
    optionCount: 4,
    meaningEvery: 4,
    totalRounds: 12,
  },
  hard: {
    baseExposureMs: 560,
    minimumExposureMs: 260,
    baseOffset: 106,
    fontSize: 25,
    optionCount: 5,
    meaningEvery: 3,
    totalRounds: 14,
  },
};

export function getPeripheralWordConfig(
  difficulty: Difficulty
): PeripheralWordConfig {
  return CONFIGS[difficulty];
}

export function getPeripheralWordExposureMs(
  difficulty: Difficulty,
  challengeLevel: number
): number {
  const config = getPeripheralWordConfig(difficulty);
  return exposureMsForFlashChallengeLevel(
    config.baseExposureMs,
    challengeLevel,
    config.minimumExposureMs
  );
}

export function getPeripheralWordOffset(
  difficulty: Difficulty,
  challengeLevel: number,
  boardWidth: number
): number {
  const config = getPeripheralWordConfig(difficulty);
  const targetWidth = getPeripheralWordTargetWidth(boardWidth);
  const desired = config.baseOffset + (Math.max(1, challengeLevel) - 1) * 1.5;
  const availableHalf = Math.max(82, boardWidth / 2);
  const minimumWithoutFixationOverlap =
    targetWidth / 2 + FIXATION_VISIBLE_HALF_WIDTH + FIXATION_TARGET_GAP;
  const maximumThatFits = Math.max(
    minimumWithoutFixationOverlap,
    availableHalf - targetWidth / 2 - BOARD_EDGE_GAP
  );
  return Math.floor(
    Math.max(
      minimumWithoutFixationOverlap,
      Math.min(desired, maximumThatFits)
    )
  );
}

export function getPeripheralWordTargetWidth(boardWidth: number): number {
  const availableHalf = Math.max(82, boardWidth / 2);
  const availableSideWidth =
    availableHalf -
    BOARD_EDGE_GAP -
    FIXATION_VISIBLE_HALF_WIDTH -
    FIXATION_TARGET_GAP;
  return Math.floor(
    Math.max(
      MIN_WORD_TARGET_WIDTH,
      Math.min(WORD_TARGET_WIDTH, availableSideWidth)
    )
  );
}

function normalizeEntry(entry: VocabularyWord): PeripheralWordEntry | null {
  const word = entry.word.trim().toLocaleLowerCase('en');
  const definition = entry.definition.trim();
  const category = entry.category?.trim().toLocaleLowerCase('en') ?? '';
  if (!/^[a-z]+$/u.test(word) || !definition || !category) return null;
  return { word, definition, category };
}

export function validatePeripheralWordEntries(
  entries: readonly PeripheralWordEntry[]
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  entries.forEach((entry, index) => {
    const word = entry.word.trim().toLocaleLowerCase('en');
    if (!/^[a-z]+$/u.test(word)) {
      errors.push(`Entry ${index + 1} needs one alphabetic word`);
    }
    if (ids.has(word)) errors.push(`Duplicate word: ${word}`);
    ids.add(word);
    if (!entry.definition.trim()) errors.push(`${word}: definition is required`);
    if (!entry.category.trim()) errors.push(`${word}: category is required`);
  });
  return errors;
}

export function getPeripheralWordEntries(
  difficulty: Difficulty
): PeripheralWordEntry[] {
  const seen = new Set<string>();
  return VOCABULARY_WITH_DEFINITIONS.map(normalizeEntry)
    .filter((entry): entry is PeripheralWordEntry => entry != null)
    .filter((entry) => {
      if (seen.has(entry.word)) return false;
      seen.add(entry.word);
      const length = entry.word.length;
      if (difficulty === 'easy') return length >= 4 && length <= 6;
      if (difficulty === 'medium') return length >= 6 && length <= 9;
      return length >= 8;
    });
}

function normalizeCustomEntries(
  entries: readonly PeripheralWordEntry[]
): PeripheralWordEntry[] {
  const seen = new Set<string>();
  const normalized: PeripheralWordEntry[] = [];
  entries.forEach((entry) => {
    const candidate = normalizeEntry(entry);
    if (!candidate || seen.has(candidate.word)) return;
    seen.add(candidate.word);
    normalized.push(candidate);
  });
  return normalized;
}

export function createPeripheralWordOptions(
  answer: string,
  entries: readonly PeripheralWordEntry[],
  difficulty: Difficulty,
  count: number,
  random: RandomSource = Math.random
): string[] {
  const normalizedAnswer = answer.toLocaleLowerCase('en');
  const allCandidates = uniqueStrings(entries.map((entry) => entry.word)).filter(
    (word) => word.toLocaleLowerCase('en') !== normalizedAnswer
  );
  const allowedLengthDifference =
    difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const closeCandidates = allCandidates.filter(
    (word) => Math.abs(word.length - answer.length) <= allowedLengthDifference
  );
  const needed = Math.max(0, count - 1);
  const closeDistractors = selectSimilarDistractors(
    answer,
    closeCandidates,
    needed,
    random
  );
  const fallbackDistractors = selectSimilarDistractors(
    answer,
    allCandidates.filter(
      (word) =>
        !closeDistractors.some(
          (chosen) =>
            chosen.toLocaleLowerCase('en') === word.toLocaleLowerCase('en')
        )
    ),
    needed - closeDistractors.length,
    random
  );
  return shuffleItems(
    [answer, ...closeDistractors, ...fallbackDistractors],
    random
  );
}

export function createPeripheralMeaningOptions(
  answer: PeripheralWordEntry,
  entries: readonly PeripheralWordEntry[],
  count = 4,
  random: RandomSource = Math.random
): MeaningOption[] {
  const sameCategory = entries.filter(
    (entry) =>
      entry.word !== answer.word &&
      entry.category === answer.category &&
      entry.definition !== answer.definition
  );
  const otherEntries = entries.filter(
    (entry) =>
      entry.word !== answer.word &&
      entry.definition !== answer.definition &&
      !sameCategory.some((candidate) => candidate.word === entry.word)
  );
  const distractors = uniqueStrings([
    ...shuffleItems(sameCategory, random).map((entry) => entry.definition),
    ...shuffleItems(otherEntries, random).map((entry) => entry.definition),
  ]).slice(0, Math.max(0, count - 1));
  return shuffleItems(
    [answer.definition, ...distractors].map((text) => ({
      id: text.toLocaleLowerCase('en'),
      text,
    })),
    random
  );
}

function oppositeSide(side: PeripheralSide): PeripheralSide {
  return side === 'left' ? 'right' : 'left';
}

export default function PeripheralWordCatch({
  entries: entriesProp,
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
    { masteryEligible: entriesProp == null && displayMsProp == null }
  );
  const { width: viewportWidth } = useWindowDimensions();
  const { screenReader } = useAccessibilityPreferences();
  const screenReaderRef = useRef(screenReader);
  screenReaderRef.current = screenReader;
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();
  const config = getPeripheralWordConfig(selectedDifficulty);
  const totalRounds = totalRoundsProp ?? config.totalRounds;
  const estimatedBoardWidth = Math.max(220, viewportWidth - 56);
  const [boardWidth, setBoardWidth] = useState(estimatedBoardWidth);
  const boardWidthRef = useRef(estimatedBoardWidth);
  const defaultEntries = getPeripheralWordEntries(selectedDifficulty);
  const customEntries = normalizeCustomEntries(entriesProp ?? []);
  const targetEntries = customEntries.length > 0 ? customEntries : defaultEntries;
  const optionEntries = uniqueEntries([...targetEntries, ...defaultEntries]);

  const [entry, setEntry] = useState<PeripheralWordEntry>(
    targetEntries[0] ?? {
      word: 'focus',
      definition: 'to direct attention toward something',
      category: 'verb',
    }
  );
  const [side, setSide] = useState<PeripheralSide>('right');
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [meaningOptions, setMeaningOptions] = useState<MeaningOption[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [finishReason, setFinishReason] =
    useState<FinishReason>('round-limit');

  const cancelledRef = useRef(false);
  const reportedRef = useRef(false);
  const answerLockedRef = useRef(false);
  const feedbackManualRef = useRef(false);
  const sessionUsedManualFeedbackRef = useRef(false);
  const entryRef = useRef(entry);
  const nextSideRef = useRef<PeripheralSide>('right');
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const meaningAttemptsRef = useRef(0);
  const meaningCorrectRef = useRef(0);
  const missStreakRef = useRef(0);
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

  function progressiveEntries(challengeLevel: number): PeripheralWordEntry[] {
    if (targetEntries.length <= 8) return targetEntries;
    const words = getProgressiveFlashContent(
      targetEntries.map((candidate) => candidate.word),
      challengeLevel
    );
    const allowed = new Set(words);
    return targetEntries.filter((candidate) => allowed.has(candidate.word));
  }

  function takeNextEntry(challengeLevel: number): PeripheralWordEntry {
    const candidates = progressiveEntries(challengeLevel);
    const key = `${selectedDifficulty}:${challengeLevel}:${entriesProp == null ? 'built-in' : 'custom'}`;
    let deckState = deckStatesRef.current.get(key);
    if (!deckState) {
      deckState = createPersistentVariedDeckState();
      deckState.previous = entryRef.current.word;
      deckStatesRef.current.set(key, deckState);
    }
    const word =
      takeNextPersistentVariedItem(
        deckState,
        candidates.map((candidate) => candidate.word),
        random
      ) ?? candidates[0]?.word;
    return (
      candidates.find((candidate) => candidate.word === word) ??
      targetEntries[0] ??
      entryRef.current
    );
  }

  function showRound() {
    const challengeLevel = flashChallenge.getCurrentLevel();
    const nextEntry = takeNextEntry(challengeLevel);
    const nextSide = nextSideRef.current;
    const exposureMs =
      displayMsProp ??
      getPeripheralWordExposureMs(selectedDifficulty, challengeLevel);
    const offset = getPeripheralWordOffset(
      selectedDifficulty,
      challengeLevel,
      boardWidthRef.current
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
    entryRef.current = nextEntry;
    answerLockedRef.current = false;
    feedbackManualRef.current = false;
    sessionUsedManualFeedbackRef.current = false;
    setEntry(nextEntry);
    setSide(nextSide);
    setWordOptions(
      createPeripheralWordOptions(
        nextEntry.word,
        optionEntries,
        selectedDifficulty,
        config.optionCount,
        random
      )
    );
    setMeaningOptions([]);
    setReview(null);
    setPhase('fixate');
    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      setPhase('show');
      scheduleTimeout(() => {
        if (!cancelledRef.current) setPhase('choose');
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
    meaningAttemptsRef.current = 0;
    meaningCorrectRef.current = 0;
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

  function chooseWord(selectedWord: string) {
    if (phase !== 'choose' || answerLockedRef.current) return;
    answerLockedRef.current = true;
    const correct = selectedWord === entryRef.current.word;
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

    const shouldCheckMeaning =
      correct && attemptsRef.current % config.meaningEvery === 0;
    if (shouldCheckMeaning) {
      setMeaningOptions(
        createPeripheralMeaningOptions(entryRef.current, optionEntries, 4, random)
      );
      setReview({ selectedWord, wordCorrect: true });
      answerLockedRef.current = false;
      setPhase('meaning');
      return;
    }

    const nextReview: Review = { selectedWord, wordCorrect: correct };
    setReview(nextReview);
    setPhase('feedback');
    scheduleAfterFeedback(nextReview);
  }

  function chooseMeaning(option: MeaningOption) {
    if (phase !== 'meaning' || answerLockedRef.current) return;
    answerLockedRef.current = true;
    const correct = option.text === entryRef.current.definition;
    meaningAttemptsRef.current += 1;
    if (correct) {
      meaningCorrectRef.current += 1;
      scoreRef.current += 5;
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 2);
    }
    setScore(scoreRef.current);
    const nextReview: Review = {
      selectedWord: entryRef.current.word,
      wordCorrect: true,
      selectedMeaning: option.text,
      meaningCorrect: correct,
    };
    setReview(nextReview);
    setPhase('feedback');
    scheduleAfterFeedback(nextReview);
  }

  function scheduleAfterFeedback(nextReview: Review) {
    const correctForFeedback =
      nextReview.wordCorrect && nextReview.meaningCorrect !== false;
    const reviewText =
      nextReview.meaningCorrect === false
        ? entryRef.current.definition
        : entryRef.current.word;
    feedbackManualRef.current = screenReaderRef.current;
    if (feedbackManualRef.current) {
      sessionUsedManualFeedbackRef.current = true;
      const announcement = !nextReview.wordCorrect
        ? `Review. You chose ${nextReview.selectedWord}. Correct word ${entryRef.current.word}.`
        : nextReview.meaningCorrect === false
          ? `Word caught. Review the meaning. You chose ${nextReview.selectedMeaning ?? 'no meaning'}. Correct meaning ${entryRef.current.definition}.`
          : `Correct. Word ${entryRef.current.word}.`;
      AccessibilityInfo.announceForAccessibility(announcement);
      return;
    }
    scheduleTimeout(
      advanceAfterFeedback,
      getRecallFeedbackDurationMs(reviewText, correctForFeedback)
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
    const meaningAccuracy =
      meaningAttemptsRef.current > 0
        ? meaningCorrectRef.current / meaningAttemptsRef.current
        : null;
    const metMeaningTarget =
      meaningAttemptsRef.current > 0 &&
      meaningAccuracy != null &&
      meaningAccuracy >= 0.65;
    const adaptiveQualificationEligible =
      reason === 'round-limit' &&
      attemptsRef.current >= totalRounds &&
      accuracy >= 0.75 &&
      metMeaningTarget;
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
        activityType: 'peripheral-word-recognition',
        difficulty: selectedDifficulty,
        rounds: attemptsRef.current,
        correct: correctRef.current,
        meaningChecks: meaningAttemptsRef.current,
        meaningCorrect: meaningCorrectRef.current,
        meaningAccuracy,
        meaningQualificationMet: metMeaningTarget,
        adaptiveQualificationEligible,
        finishReason: reason,
        endingFailureStreak: missStreakRef.current,
        consecutiveMissLimit: MAX_CONSECUTIVE_FAILURES,
        correctAnswersToAdvance: CORRECT_ANSWERS_TO_ADVANCE,
        optionCount: config.optionCount,
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

  function measureBoard(width: number) {
    const measuredWidth = Math.floor(width);
    if (measuredWidth <= 0 || measuredWidth === boardWidthRef.current) return;
    boardWidthRef.current = measuredWidth;
    setBoardWidth(measuredWidth);
    if (attemptsRef.current === 0 && initialExposureMsRef.current > 0) {
      const measuredOffset = getPeripheralWordOffset(
        selectedDifficulty,
        flashChallenge.getCurrentLevel(),
        measuredWidth
      );
      initialOffsetRef.current = measuredOffset;
      maximumOffsetRef.current = measuredOffset;
    }
  }

  const challengeLevel = flashChallenge.level;
  const exposureMs =
    displayMsProp ??
    getPeripheralWordExposureMs(selectedDifficulty, challengeLevel);
  const offset = getPeripheralWordOffset(
    selectedDifficulty,
    challengeLevel,
    boardWidth
  );
  const targetWidth = getPeripheralWordTargetWidth(boardWidth);
  const targetMarginLeft =
    (side === 'left' ? -offset : offset) - targetWidth / 2;

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
          Peripheral Word Catch
        </Text>
        <Text style={styles.subtitle}>
          Hold the center, catch the word, then confirm its meaning
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          startDisabled={!flashChallenge.loaded}
          startLabel="Start word catch"
          containerStyle={styles.idleContent}
        >
          <Text style={styles.sessionHint}>
            Close-looking choices · periodic vocabulary check · 3 misses end
          </Text>
          <FlashChallengeStatus
            level={flashChallenge.resumeLevel}
            highestLevel={flashChallenge.highestLevel}
          />
        </GameIdlePanel>
      )}

      {(phase === 'fixate' || phase === 'show') && (
        <View style={styles.gameArea}>
          {stats}
          <FlashChallengeStatus
            compact
            level={flashChallenge.level}
            highestLevel={flashChallenge.highestLevel}
          />
          <View
            onLayout={(event) => measureBoard(event.nativeEvent.layout.width)}
            testID="peripheral-word-board"
            style={styles.board}
          >
            <View testID="peripheral-word-fixation" style={styles.fixation}>
              <Text style={styles.fixationMark}>
                +
              </Text>
              <Text style={styles.fixationLabel}>
                FOCUS
              </Text>
            </View>
            {phase === 'show' && (
              <View
                testID="peripheral-word-target-slot"
                style={[
                  styles.targetSlot,
                  { marginLeft: targetMarginLeft, width: targetWidth },
                ]}
              >
                <BriefStimulus
                  availableWidth={targetWidth}
                  backgroundColor={colors.cardBackground}
                  color={colors.textPrimary}
                  difficulty={selectedDifficulty}
                  maskFraction={0}
                  maxFontSize={config.fontSize}
                  minFontSize={11}
                  testID="peripheral-word-target"
                  value={entry.word}
                />
              </View>
            )}
          </View>
          <Text style={styles.instruction}>
            Keep your eyes on the plus
          </Text>
        </View>
      )}

      {phase === 'choose' && (
        <ScrollView
          contentContainerStyle={styles.phaseScrollContent}
          showsVerticalScrollIndicator
        >
          {stats}
          <Text style={styles.chooseTitle}>
            Which exact word appeared?
          </Text>
          <View testID="peripheral-word-options" style={styles.options}>
            {wordOptions.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={option}
                key={option}
                onPress={() => chooseWord(option)}
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionPressed,
                ]}
                testID={`peripheral-word-option-${index}`}
              >
                <Text style={styles.optionText}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {phase === 'meaning' && (
        <ScrollView
          contentContainerStyle={styles.phaseScrollContent}
          showsVerticalScrollIndicator
        >
          {stats}
          <Text style={styles.meaningEyebrow}>
            WORD CAUGHT · VOCABULARY CHECK
          </Text>
          <Text style={styles.meaningWord}>
            {entry.word}
          </Text>
          <Text style={styles.chooseTitle}>
            Which meaning matches this word?
          </Text>
          <View testID="peripheral-meaning-options" style={styles.options}>
            {meaningOptions.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={option.text}
                key={option.id}
                onPress={() => chooseMeaning(option)}
                style={({ pressed }) => [
                  styles.meaningButton,
                  pressed && styles.optionPressed,
                ]}
                testID={`peripheral-meaning-option-${index}`}
              >
                <Text style={styles.meaningOptionText}>
                  {option.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {phase === 'feedback' && review && (
        <View style={styles.gameArea}>
          {stats}
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.feedbackCard,
              review.wordCorrect && review.meaningCorrect !== false
                ? styles.correctFeedback
                : styles.reviewFeedback,
            ]}
            testID="peripheral-word-feedback"
          >
            <Text style={styles.feedbackTitle}>
              {!review.wordCorrect
                ? 'Review the flashed word'
                : review.meaningCorrect === false
                  ? 'Word caught · review the meaning'
                  : 'Correct'}
            </Text>
            {!review.wordCorrect && (
              <Text
                style={styles.selectedAnswer}
                testID="peripheral-word-feedback-selected"
              >
                You chose: {review.selectedWord}
              </Text>
            )}
            <Text
              style={styles.correctWord}
              testID="peripheral-word-feedback-correct"
            >
              {entry.word}
            </Text>
            {review.meaningCorrect === false && (
              <>
                <Text
                  style={styles.selectedMeaning}
                  testID="peripheral-meaning-feedback-selected"
                >
                  You chose: {review.selectedMeaning}
                </Text>
                <Text
                  style={styles.correctMeaning}
                  testID="peripheral-meaning-feedback-correct"
                >
                  Meaning: {entry.definition}
                </Text>
              </>
            )}
          </View>
          {feedbackManualRef.current && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue after word feedback"
              onPress={advanceAfterFeedback}
              style={({ pressed }) => [
                styles.playAgainButton,
                pressed && styles.optionPressed,
              ]}
              testID="peripheral-word-feedback-continue"
            >
              <Text style={styles.playAgainText}>Continue</Text>
            </Pressable>
          )}
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>
            {finishReason === 'three-misses'
              ? 'Three misses — session complete'
              : 'Word set complete'}
          </Text>
          <Text style={styles.endScore}>
            {scoreRef.current}
          </Text>
          <Text style={styles.endMeta}>
            {correctRef.current}/{attemptsRef.current} words caught
          </Text>
          {meaningAttemptsRef.current > 0 && (
            <Text style={styles.endMeta}>
              {meaningCorrectRef.current}/{meaningAttemptsRef.current} meanings
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play Peripheral Word Catch again"
            onPress={playAgain}
            style={({ pressed }) => [
              styles.playAgainButton,
              pressed && styles.optionPressed,
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

function uniqueEntries(
  entries: readonly PeripheralWordEntry[]
): PeripheralWordEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.word)) return false;
    seen.add(entry.word);
    return true;
  });
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
  phaseScrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
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
    justifyContent: 'center',
    minHeight: 48,
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
    width: WORD_TARGET_WIDTH,
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  chooseTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  options: { gap: 8 },
  optionButton: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionPressed: { backgroundColor: colors.surfaceTonal, opacity: 0.8 },
  optionText: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  meaningEyebrow: {
    color: colors.infoForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  meaningWord: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 5,
    marginTop: 2,
    textAlign: 'center',
  },
  meaningButton: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  meaningOptionText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'left',
  },
  feedbackCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  correctFeedback: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successForeground,
  },
  reviewFeedback: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.errorForeground,
  },
  feedbackTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  selectedAnswer: { color: colors.errorForeground, fontSize: 14 },
  correctWord: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  selectedMeaning: {
    color: colors.errorForeground,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  correctMeaning: {
    color: colors.successForeground,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
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
  endMeta: { color: colors.textSecondary, fontSize: 14, marginTop: 3 },
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
