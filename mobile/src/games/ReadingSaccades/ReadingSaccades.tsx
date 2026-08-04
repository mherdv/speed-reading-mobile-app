import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  getArticlesByDifficulty,
  getRandomArticle,
  type Article,
} from '../../data/articles';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import {
  beginNonCalibratingProgressSession,
  levelToStars,
  updateProgress,
} from '../../data/progressStore';
import {
  epochNowMs,
  measuredElapsedMs,
  monotonicNowMs,
} from '../../domain/timing';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { StatsRow } from '../../ui/StatsRow';
import {
  useAutoStart,
  useGameProgress,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'ReadingSaccades';
const COMPLETION_THRESHOLD = 0.9;
const DEFAULT_READING_FONT_SIZE = 18;
const DEFAULT_READING_COLUMN_WIDTH = 700;
const MIN_GUIDE_WPM = 100;
const MAX_GUIDE_WPM = 800;
const GUIDE_STEP_WPM = 25;
const MIN_VISIBLE_LINES = 5;
const MAX_VISIBLE_LINES = 8;

export type ReadingSaccadesMode = 'flow' | 'line-landing';

export type ReadingSaccadesConfig = {
  anchorWords: number;
  lineWords: number;
  guideWpm: number;
};

export type SaccadeAnchor = {
  id: string;
  startWordIndex: number;
  words: string[];
};

export type SaccadeLine = {
  id: string;
  anchors: SaccadeAnchor[];
};

type GuideStep =
  | { kind: 'anchor'; lineIndex: number; anchorIndex: number }
  | { kind: 'return'; fromLineIndex: number; toLineIndex: number };

type LandingStage = 'none' | 'flash' | 'choice' | 'feedback';
type LandingExposureMode = 'timed' | 'manual';

type LandingPrompt = {
  lineIndex: number;
  target: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  correct: boolean | null;
  exposureMode: LandingExposureMode;
};

type Phase = 'idle' | 'active' | 'question' | 'feedback' | 'ended';

type Props = {
  article?: Article;
  anchorWords?: number;
  lineWords?: number;
  guideWpm?: number;
  tickMs?: number;
  landingExposureMs?: number;
  mode?: ReadingSaccadesMode;
  random?: () => number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

export function getReadingSaccadesConfig(
  difficulty: Difficulty
): ReadingSaccadesConfig {
  if (difficulty === 'easy') {
    return { anchorWords: 2, lineWords: 12, guideWpm: 150 };
  }
  if (difficulty === 'medium') {
    return { anchorWords: 3, lineWords: 14, guideWpm: 230 };
  }
  return { anchorWords: 3, lineWords: 16, guideWpm: 320 };
}

export function getLineLandingConfig(difficulty: Difficulty): {
  exposureMs: number;
  optionCount: number;
  requiredAccuracy: number;
} {
  if (difficulty === 'easy') {
    return { exposureMs: 900, optionCount: 3, requiredAccuracy: 0.67 };
  }
  if (difficulty === 'medium') {
    return { exposureMs: 650, optionCount: 4, requiredAccuracy: 0.72 };
  }
  return { exposureMs: 450, optionCount: 4, requiredAccuracy: 0.75 };
}

export function getReturnSweepCharacterLimit(
  viewportWidth: number,
  fontSize = DEFAULT_READING_FONT_SIZE,
  columnWidth = DEFAULT_READING_COLUMN_WIDTH
): number {
  const safeViewportWidth = Math.max(280, viewportWidth);
  const safeFontSize = Math.max(12, fontSize);
  const safeColumnWidth = Math.max(240, columnWidth);
  const usableLineWidth = Math.max(
    216,
    Math.min(safeViewportWidth - 64, safeColumnWidth - 32)
  );
  const estimatedCharacterWidth = safeFontSize * 0.52;
  return Math.max(
    24,
    Math.min(76, Math.floor(usableLineWidth / estimatedCharacterWidth))
  );
}

export function getReturnSweepWindowLineCount(
  viewportHeight: number,
  fontSize = DEFAULT_READING_FONT_SIZE
): number {
  const safeViewportHeight = Math.max(480, viewportHeight);
  const safeFontSize = Math.max(12, fontSize);
  const availableReadingHeight = Math.max(
    190,
    Math.min(320, safeViewportHeight * 0.38)
  );
  const estimatedLineBox = safeFontSize + 10;
  return Math.max(
    MIN_VISIBLE_LINES,
    Math.min(
      MAX_VISIBLE_LINES,
      Math.floor(availableReadingHeight / estimatedLineBox)
    )
  );
}

function clampGuideWpm(value: number): number {
  return Math.min(MAX_GUIDE_WPM, Math.max(MIN_GUIDE_WPM, value));
}

export function buildSaccadeLines(
  text: string,
  lineWords: number,
  anchorWords: number,
  maxCharacters?: number
): SaccadeLine[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const safeLineWords = Math.max(1, Math.floor(lineWords));
  const safeAnchorWords = Math.max(1, Math.floor(anchorWords));
  const defaultCharacterLimit = Math.min(30, safeLineWords * 4);
  const safeCharacterLimit = Math.max(
    18,
    Math.floor(maxCharacters ?? defaultCharacterLimit)
  );
  const lines: SaccadeLine[] = [];
  let lineSlice: string[] = [];
  let lineStart = 0;

  function appendLine() {
    if (lineSlice.length === 0) return;
    const anchors: SaccadeAnchor[] = [];
    const groupCount = Math.ceil(lineSlice.length / safeAnchorWords);
    const baseGroupSize = Math.floor(lineSlice.length / groupCount);
    const largerGroupCount = lineSlice.length % groupCount;
    let anchorStart = 0;
    for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
      const groupSize = baseGroupSize + (groupIndex < largerGroupCount ? 1 : 0);
      anchors.push({
        id: `${lineStart}-${anchorStart}`,
        startWordIndex: lineStart + anchorStart,
        words: lineSlice.slice(anchorStart, anchorStart + groupSize),
      });
      anchorStart += groupSize;
    }
    lines.push({ id: `line-${lineStart}`, anchors });
    lineSlice = [];
  }

  for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
    const word = words[wordIndex]!;
    const candidate = [...lineSlice, word].join(' ');
    if (
      lineSlice.length > 0 &&
      (lineSlice.length >= safeLineWords ||
        candidate.length > safeCharacterLimit)
    ) {
      appendLine();
      lineStart = wordIndex;
    }
    lineSlice.push(word);
  }
  appendLine();

  return lines;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(
      Math.min(0.999999, Math.max(0, random())) * (index + 1)
    );
    [next[index], next[randomIndex]] = [next[randomIndex]!, next[index]!];
  }
  return next;
}

export function buildLineLandingOptions(
  lines: readonly SaccadeLine[],
  targetLineIndex: number,
  optionCount: number,
  random: () => number
): { options: string[]; correctIndex: number } {
  const target = lines[targetLineIndex]?.anchors[0]?.words.join(' ') ?? '';
  const safeOptionCount = Math.max(2, Math.floor(optionCount));
  const candidates = Array.from(
    new Set(
      lines
        .flatMap((line) => line.anchors)
        .map((anchor) => anchor.words.join(' '))
        .filter((candidate) => candidate.length > 0 && candidate !== target)
    )
  ).sort((first, second) => {
    const lengthDifference =
      Math.abs(first.length - target.length) -
      Math.abs(second.length - target.length);
    return lengthDifference || first.localeCompare(second);
  });
  const closeCandidatePool = candidates.slice(
    0,
    Math.min(
      candidates.length,
      Math.max(safeOptionCount - 1, (safeOptionCount - 1) * 2)
    )
  );
  const distractors = shuffled(closeCandidatePool, random).slice(
    0,
    safeOptionCount - 1
  );
  const options = shuffled([target, ...distractors], random);
  return {
    options,
    correctIndex: Math.max(0, options.indexOf(target)),
  };
}

function clampRandomArticle(
  difficulty: Difficulty,
  random: () => number
): Article {
  const selected = getRandomArticle(difficulty, undefined, random);
  if (!selected) {
    throw new Error(`No bundled article is available for ${difficulty}.`);
  }
  return selected;
}

export default function ReadingSaccades({
  article: articleProp,
  anchorWords: anchorWordsProp,
  lineWords: lineWordsProp,
  guideWpm: guideWpmProp,
  tickMs,
  landingExposureMs: landingExposureMsProp,
  mode: modeProp,
  random = Math.random,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const { height: viewportHeight, width: viewportWidth } =
    useWindowDimensions();
  const { screenReader } = useAccessibilityPreferences();
  const screenReaderRef = useRef(screenReader);
  screenReaderRef.current = screenReader;
  const { tokens: readingDisplay } = useReadingDisplay();
  const readingFontSize =
    typeof readingDisplay.text.fontSize === 'number'
      ? readingDisplay.text.fontSize
      : DEFAULT_READING_FONT_SIZE;
  const readingColumnWidth =
    typeof readingDisplay.column.maxWidth === 'number'
      ? readingDisplay.column.maxWidth
      : DEFAULT_READING_COLUMN_WIDTH;
  const lineCharacterLimit = getReturnSweepCharacterLimit(
    viewportWidth,
    readingFontSize,
    readingColumnWidth
  );
  const readingLineHeight =
    typeof readingDisplay.text.lineHeight === 'number'
      ? readingDisplay.text.lineHeight
      : readingFontSize + 12;
  const visibleLineCount = getReturnSweepWindowLineCount(
    viewportHeight,
    readingFontSize
  );
  const lineWindowMinHeight = visibleLineCount * readingLineHeight;
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const difficultyConfig = getReadingSaccadesConfig(selectedDifficulty);
  const initialGuideWpm = clampGuideWpm(
    guideWpmProp ?? difficultyConfig.guideWpm
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [guideStep, setGuideStep] = useState<GuideStep>({
    kind: 'anchor',
    lineIndex: 0,
    anchorIndex: 0,
  });
  const [paused, setPaused] = useState(false);
  const [guideWpm, setGuideWpm] = useState(initialGuideWpm);
  const [selectedMode, setSelectedMode] = useState<ReadingSaccadesMode>(
    modeProp ?? 'flow'
  );
  const [landingStage, setLandingStage] = useState<LandingStage>('none');
  const [landingPrompt, setLandingPrompt] = useState<LandingPrompt | null>(
    null
  );
  const [landingAttempts, setLandingAttempts] = useState(0);
  const [landingCorrect, setLandingCorrect] = useState(0);
  const [wordsPresented, setWordsPresented] = useState(0);
  const [linesPresented, setLinesPresented] = useState(0);
  const [returnSweepsCompleted, setReturnSweepsCompleted] = useState(0);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sessionArticle, setSessionArticle] = useState<Article>(() =>
    articleProp ?? clampRandomArticle(difficulty, () => 0)
  );
  const [sessionLines, setSessionLines] = useState<SaccadeLine[]>(() => {
    const config = getReadingSaccadesConfig(difficulty);
    const initialArticle = articleProp ?? clampRandomArticle(difficulty, () => 0);
    return buildSaccadeLines(
      initialArticle.text,
      lineWordsProp ?? config.lineWords,
      anchorWordsProp ?? config.anchorWords,
      lineCharacterLimit
    );
  });

  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();
  const phaseRef = useRef<Phase>('idle');
  const pausedRef = useRef(false);
  const guideStepRef = useRef<GuideStep>(guideStep);
  const linesRef = useRef<SaccadeLine[]>(sessionLines);
  const articleRef = useRef<Article>(sessionArticle);
  const presentedWordIndexesRef = useRef<Set<number>>(new Set());
  const presentedLineIndexesRef = useRef<Set<number>>(new Set());
  const returnSweepsRef = useRef(0);
  const sessionModeRef = useRef<ReadingSaccadesMode>(modeProp ?? 'flow');
  const landingStageRef = useRef<LandingStage>('none');
  const landingPromptRef = useRef<LandingPrompt | null>(null);
  const landingAttemptsRef = useRef(0);
  const landingCorrectRef = useRef(0);
  const requiredLandingLineIndexesRef = useRef<Set<number>>(new Set());
  const answeredLandingLineIndexesRef = useRef<Set<number>>(new Set());
  const landingExposureMsRef = useRef(0);
  const sessionLandingExposureModeRef = useRef<
    LandingExposureMode | 'mixed' | null
  >(null);
  const sessionScreenReaderAtStartRef = useRef(false);
  const sessionAnchorWordsRef = useRef(1);
  const sessionLineWordsRef = useRef(1);
  const sessionGuideWpmRef = useRef(initialGuideWpm);
  const sessionInitialGuideWpmRef = useRef(initialGuideWpm);
  const sessionTickMsRef = useRef<number | undefined>(undefined);
  const startedEpochRef = useRef(0);
  const activeSegmentStartedRef = useRef<number | null>(null);
  const activeElapsedMsRef = useRef(0);
  const pauseCountRef = useRef(0);
  const backCountRef = useRef(0);
  const lastArticleIdRef = useRef<string | null>(null);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(
    () => () => {
      cancelledRef.current = true;
    },
    []
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' || phaseRef.current !== 'active') return;

      clearTrackedTimeouts();
      if (!pausedRef.current) {
        pauseCountRef.current += 1;
      }
      pausedRef.current = true;
      setPaused(true);
      stopActiveClock();

      // If the app disappears during the brief glimpse, replay the complete
      // return step after Resume instead of letting a hidden timer consume it.
      if (landingStageRef.current === 'flash') {
        setCurrentLandingStage('none');
        setCurrentLandingPrompt(null);
      }
    });
    return () => subscription.remove();
  }, [clearTrackedTimeouts]);

  useEffect(() => {
    if (phaseRef.current !== 'idle') return;
    sessionGuideWpmRef.current = initialGuideWpm;
    setGuideWpm(initialGuideWpm);
  }, [initialGuideWpm]);

  useEffect(() => {
    if (phaseRef.current !== 'idle' || modeProp == null) return;
    setSelectedMode(modeProp);
  }, [modeProp]);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function setCurrentPhase(nextPhase: Phase) {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }

  function setCurrentLandingStage(nextStage: LandingStage) {
    landingStageRef.current = nextStage;
    setLandingStage(nextStage);
  }

  function setCurrentLandingPrompt(nextPrompt: LandingPrompt | null) {
    landingPromptRef.current = nextPrompt;
    setLandingPrompt(nextPrompt);
  }

  function startActiveClock() {
    activeSegmentStartedRef.current = monotonicNowMs();
  }

  function stopActiveClock() {
    const startedAt = activeSegmentStartedRef.current;
    if (startedAt === null) return;
    activeElapsedMsRef.current += measuredElapsedMs(startedAt);
    activeSegmentStartedRef.current = null;
  }

  function chooseNextArticle(): Article {
    if (articleProp) return articleProp;
    const levelArticles = getArticlesByDifficulty(selectedDifficulty);
    const freshArticles = levelArticles.filter(
      (candidate) => candidate.id !== lastArticleIdRef.current
    );
    const pool = freshArticles.length > 0 ? freshArticles : levelArticles;
    if (pool.length === 0) {
      return clampRandomArticle(selectedDifficulty, random);
    }
    const value = Math.min(0.999999, Math.max(0, random()));
    return pool[Math.floor(value * pool.length)]!;
  }

  function stepDurationMs(step: GuideStep): number {
    if (sessionTickMsRef.current !== undefined) {
      return Math.max(1, sessionTickMsRef.current);
    }
    const wordCount =
      step.kind === 'anchor'
        ? (linesRef.current[step.lineIndex]?.anchors[step.anchorIndex]?.words
            .length ?? sessionAnchorWordsRef.current)
        : sessionAnchorWordsRef.current;
    return Math.max(
      140,
      Math.round((wordCount * 60_000) / sessionGuideWpmRef.current)
    );
  }

  function scheduleNextStep(step: GuideStep) {
    clearTrackedTimeouts();
    scheduleTimeout(() => advanceGuide(), stepDurationMs(step));
  }

  function showAnchor(lineIndex: number, anchorIndex: number) {
    const anchor = linesRef.current[lineIndex]?.anchors[anchorIndex];
    if (!anchor) return;

    const nextStep: GuideStep = { kind: 'anchor', lineIndex, anchorIndex };
    guideStepRef.current = nextStep;
    setGuideStep(nextStep);

    const nextWordIndexes = new Set(presentedWordIndexesRef.current);
    anchor.words.forEach((_, wordOffset) => {
      nextWordIndexes.add(anchor.startWordIndex + wordOffset);
    });
    presentedWordIndexesRef.current = nextWordIndexes;
    setWordsPresented(nextWordIndexes.size);

    const nextLineIndexes = new Set(presentedLineIndexesRef.current);
    nextLineIndexes.add(lineIndex);
    presentedLineIndexesRef.current = nextLineIndexes;
    setLinesPresented(nextLineIndexes.size);
  }

  function beginQuestion() {
    if (phaseRef.current !== 'active') return;
    clearTrackedTimeouts();
    pausedRef.current = false;
    setPaused(false);
    setCurrentLandingStage('none');
    setCurrentLandingPrompt(null);
    stopActiveClock();
    setCurrentPhase('question');
  }

  function revealLandingChoices() {
    if (
      cancelledRef.current ||
      phaseRef.current !== 'active' ||
      landingStageRef.current !== 'flash'
    ) {
      return;
    }
    stopActiveClock();
    setCurrentLandingStage('choice');
  }

  function beginLandingPrompt(toLineIndex: number) {
    const target = linesRef.current[toLineIndex]?.anchors[0]?.words.join(' ');
    if (!target) {
      showAnchor(toLineIndex, 0);
      scheduleNextStep(guideStepRef.current);
      return;
    }
    const config = getLineLandingConfig(selectedDifficulty);
    const { options, correctIndex } = buildLineLandingOptions(
      linesRef.current,
      toLineIndex,
      config.optionCount,
      random
    );
    const exposureMode: LandingExposureMode = screenReaderRef.current
      ? 'manual'
      : 'timed';
    const priorExposureMode = sessionLandingExposureModeRef.current;
    sessionLandingExposureModeRef.current =
      priorExposureMode === null || priorExposureMode === exposureMode
        ? exposureMode
        : 'mixed';
    setCurrentLandingPrompt({
      lineIndex: toLineIndex,
      target,
      options,
      correctIndex,
      selectedIndex: null,
      correct: null,
      exposureMode,
    });
    setCurrentLandingStage('flash');
    clearTrackedTimeouts();
    if (exposureMode === 'manual') {
      AccessibilityInfo.announceForAccessibility(
        `Line ${toLineIndex + 1} begins ${target}`
      );
      return;
    }
    scheduleTimeout(revealLandingChoices, landingExposureMsRef.current);
  }

  function answerLanding(optionIndex: number) {
    const prompt = landingPromptRef.current;
    if (
      phaseRef.current !== 'active' ||
      landingStageRef.current !== 'choice' ||
      !prompt
    ) {
      return;
    }
    if (answeredLandingLineIndexesRef.current.has(prompt.lineIndex)) return;
    const correct = optionIndex === prompt.correctIndex;
    answeredLandingLineIndexesRef.current = new Set(
      answeredLandingLineIndexesRef.current
    ).add(prompt.lineIndex);
    landingAttemptsRef.current += 1;
    setLandingAttempts(landingAttemptsRef.current);
    if (correct) {
      landingCorrectRef.current += 1;
      setLandingCorrect(landingCorrectRef.current);
    }
    setCurrentLandingPrompt({
      ...prompt,
      selectedIndex: optionIndex,
      correct,
    });
    setCurrentLandingStage('feedback');
  }

  function continueAfterLanding() {
    const prompt = landingPromptRef.current;
    if (
      phaseRef.current !== 'active' ||
      landingStageRef.current !== 'feedback' ||
      !prompt
    ) {
      return;
    }
    returnSweepsRef.current += 1;
    setReturnSweepsCompleted(returnSweepsRef.current);
    pausedRef.current = false;
    setPaused(false);
    setCurrentLandingStage('none');
    setCurrentLandingPrompt(null);
    showAnchor(prompt.lineIndex, 0);
    startActiveClock();
    scheduleNextStep(guideStepRef.current);
  }

  function advanceGuide() {
    if (
      cancelledRef.current ||
      pausedRef.current ||
      phaseRef.current !== 'active'
    ) {
      return;
    }

    const currentStep = guideStepRef.current;
    if (currentStep.kind === 'return') {
      if (sessionModeRef.current === 'line-landing') {
        if (
          answeredLandingLineIndexesRef.current.has(
            currentStep.toLineIndex
          )
        ) {
          returnSweepsRef.current += 1;
          setReturnSweepsCompleted(returnSweepsRef.current);
          showAnchor(currentStep.toLineIndex, 0);
          scheduleNextStep(guideStepRef.current);
          return;
        }
        beginLandingPrompt(currentStep.toLineIndex);
        return;
      }
      returnSweepsRef.current += 1;
      setReturnSweepsCompleted(returnSweepsRef.current);
      showAnchor(currentStep.toLineIndex, 0);
      scheduleNextStep(guideStepRef.current);
      return;
    }

    const currentLine = linesRef.current[currentStep.lineIndex];
    if (!currentLine) {
      beginQuestion();
      return;
    }

    if (currentStep.anchorIndex + 1 < currentLine.anchors.length) {
      showAnchor(currentStep.lineIndex, currentStep.anchorIndex + 1);
      scheduleNextStep(guideStepRef.current);
      return;
    }

    if (currentStep.lineIndex + 1 < linesRef.current.length) {
      const returnStep: GuideStep = {
        kind: 'return',
        fromLineIndex: currentStep.lineIndex,
        toLineIndex: currentStep.lineIndex + 1,
      };
      if (sessionModeRef.current === 'line-landing') {
        requiredLandingLineIndexesRef.current = new Set(
          requiredLandingLineIndexesRef.current
        ).add(returnStep.toLineIndex);
      }
      guideStepRef.current = returnStep;
      setGuideStep(returnStep);
      scheduleNextStep(returnStep);
      return;
    }

    beginQuestion();
  }

  function start(preserveAdjustedPace = false) {
    if (!preserveAdjustedPace && phaseRef.current !== 'idle') return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    pausedRef.current = false;
    presentedWordIndexesRef.current = new Set();
    presentedLineIndexesRef.current = new Set();
    returnSweepsRef.current = 0;
    landingAttemptsRef.current = 0;
    landingCorrectRef.current = 0;
    requiredLandingLineIndexesRef.current = new Set();
    answeredLandingLineIndexesRef.current = new Set();
    activeElapsedMsRef.current = 0;
    activeSegmentStartedRef.current = null;
    pauseCountRef.current = 0;
    backCountRef.current = 0;

    const config = getReadingSaccadesConfig(selectedDifficulty);
    const configuredAnchorWords = Math.max(
      1,
      Math.floor(anchorWordsProp ?? config.anchorWords)
    );
    const configuredLineWords = Math.max(
      1,
      Math.floor(lineWordsProp ?? config.lineWords)
    );
    const configuredGuideWpm = clampGuideWpm(
      Math.floor(guideWpmProp ?? config.guideWpm)
    );
    const landingConfig = getLineLandingConfig(selectedDifficulty);
    const sessionStartingWpm = preserveAdjustedPace
      ? sessionGuideWpmRef.current
      : configuredGuideWpm;
    const nextArticle = chooseNextArticle();
    const nextLines = buildSaccadeLines(
      nextArticle.text,
      configuredLineWords,
      configuredAnchorWords,
      lineCharacterLimit
    );

    articleRef.current = nextArticle;
    linesRef.current = nextLines;
    sessionAnchorWordsRef.current = configuredAnchorWords;
    sessionLineWordsRef.current = configuredLineWords;
    sessionModeRef.current = selectedMode;
    sessionLandingExposureModeRef.current = null;
    sessionScreenReaderAtStartRef.current = screenReaderRef.current;
    landingExposureMsRef.current = Math.max(
      1,
      Math.floor(landingExposureMsProp ?? landingConfig.exposureMs)
    );
    sessionGuideWpmRef.current = sessionStartingWpm;
    sessionInitialGuideWpmRef.current = sessionStartingWpm;
    sessionTickMsRef.current = tickMs;
    startedEpochRef.current = epochNowMs();
    lastArticleIdRef.current = nextArticle.id;

    setSessionArticle(nextArticle);
    setSessionLines(nextLines);
    setPaused(false);
    setCurrentLandingStage('none');
    setCurrentLandingPrompt(null);
    setLandingAttempts(0);
    setLandingCorrect(0);
    setGuideWpm(sessionStartingWpm);
    setWordsPresented(0);
    setLinesPresented(0);
    setReturnSweepsCompleted(0);
    setAnswerCorrect(null);
    setSelectedOption(null);
    setCurrentPhase('active');
    startActiveClock();

    if (nextLines.length === 0 || nextLines[0]?.anchors.length === 0) {
      beginQuestion();
      return;
    }
    showAnchor(0, 0);
    scheduleNextStep(guideStepRef.current);
  }

  function changePace(delta: number) {
    if (
      phaseRef.current !== 'active' ||
      landingStageRef.current !== 'none'
    ) {
      return;
    }
    const nextGuideWpm = clampGuideWpm(
      sessionGuideWpmRef.current + delta
    );
    if (nextGuideWpm === sessionGuideWpmRef.current) return;
    sessionGuideWpmRef.current = nextGuideWpm;
    setGuideWpm(nextGuideWpm);
    clearTrackedTimeouts();
    if (!pausedRef.current) scheduleNextStep(guideStepRef.current);
  }

  function togglePause() {
    if (
      phaseRef.current !== 'active' ||
      landingStageRef.current !== 'none'
    ) {
      return;
    }
    const nextPaused = !pausedRef.current;
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
    clearTrackedTimeouts();
    if (nextPaused) {
      pauseCountRef.current += 1;
      stopActiveClock();
    } else {
      startActiveClock();
      scheduleNextStep(guideStepRef.current);
    }
  }

  function backOneAnchor() {
    if (
      phaseRef.current !== 'active' ||
      landingStageRef.current !== 'none'
    ) {
      return;
    }
    clearTrackedTimeouts();
    backCountRef.current += 1;
    const currentStep = guideStepRef.current;
    if (currentStep.kind === 'return') {
      const previousLine = linesRef.current[currentStep.fromLineIndex];
      const previousIndex = Math.max(0, (previousLine?.anchors.length ?? 1) - 1);
      showAnchor(currentStep.fromLineIndex, previousIndex);
    } else if (currentStep.anchorIndex > 0) {
      showAnchor(currentStep.lineIndex, currentStep.anchorIndex - 1);
    } else if (currentStep.lineIndex > 0) {
      const previousLineIndex = currentStep.lineIndex - 1;
      const previousLine = linesRef.current[previousLineIndex];
      showAnchor(
        previousLineIndex,
        Math.max(0, (previousLine?.anchors.length ?? 1) - 1)
      );
    }
    if (!pausedRef.current) scheduleNextStep(guideStepRef.current);
  }

  function answerQuestion(optionIndex: number) {
    if (phaseRef.current !== 'question' || reportedRef.current) return;
    const question = articleRef.current.comprehensionQuestions[0];
    const correct = question ? optionIndex === question.correctIndex : false;
    setSelectedOption(optionIndex);
    setAnswerCorrect(correct);
    setCurrentPhase('feedback');
  }

  function finish(comprehensionCorrect: boolean) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const finishedEpoch = epochNowMs();
    stopActiveClock();
    const elapsedMs = Math.max(1, Math.round(activeElapsedMsRef.current));
    const totalWords = articleRef.current.text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const actualWordsPresented = presentedWordIndexesRef.current.size;
    const completionRate =
      totalWords > 0 ? actualWordsPresented / totalWords : 0;
    const comprehensionAccuracy = comprehensionCorrect ? 1 : 0;
    const requiredLandingLines = requiredLandingLineIndexesRef.current.size;
    const answeredLandingLines = answeredLandingLineIndexesRef.current.size;
    const omittedLandingLines = Math.max(
      0,
      requiredLandingLines - answeredLandingLines
    );
    const lineLandingAccuracy =
      answeredLandingLines > 0
        ? landingCorrectRef.current / answeredLandingLines
        : 0;
    const lineLandingConfig = getLineLandingConfig(selectedDifficulty);
    const taskAccuracy =
      sessionModeRef.current === 'line-landing'
        ? (landingCorrectRef.current + comprehensionAccuracy) /
          Math.max(1, requiredLandingLines + 1)
        : comprehensionAccuracy;
    const lineLandingNotApplicable = linesRef.current.length <= 1;
    const lineLandingQualified =
      sessionModeRef.current !== 'line-landing' ||
      lineLandingNotApplicable ||
      (requiredLandingLines > 0 &&
        omittedLandingLines === 0 &&
        lineLandingAccuracy >= lineLandingConfig.requiredAccuracy);
    const completedEnoughForProgress =
      completionRate >= COMPLETION_THRESHOLD &&
      comprehensionCorrect &&
      lineLandingQualified;
    const manualLandingExposure =
      sessionModeRef.current === 'line-landing' &&
      (sessionLandingExposureModeRef.current === 'manual' ||
        sessionLandingExposureModeRef.current === 'mixed');
    const adaptiveQualificationEligible =
      completedEnoughForProgress && !manualLandingExposure;
    const lineLandingExposureMode =
      sessionLandingExposureModeRef.current ??
      (sessionScreenReaderAtStartRef.current ? 'manual' : 'timed');

    setCurrentPhase('ended');
    const endNonCalibratingSession = manualLandingExposure
      ? beginNonCalibratingProgressSession(GAME_ID)
      : undefined;
    const progressUpdate = updateProgress(
      GAME_ID,
      adaptiveQualificationEligible,
      actualWordsPresented,
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
      startedAtIso: new Date(startedEpochRef.current).toISOString(),
      finishedAtIso: new Date(finishedEpoch).toISOString(),
      elapsedMs,
      score: actualWordsPresented,
      accuracy: taskAccuracy,
      details: {
        schemaVersion: 1,
        activityType:
          sessionModeRef.current === 'line-landing'
            ? 'reading-line-landing'
            : 'reading-saccade-guide',
        contentId: articleRef.current.id,
        contentVersion: articleRef.current.version,
        comparisonBand: `reading-saccade-${sessionModeRef.current}-${selectedDifficulty}${sessionModeRef.current === 'line-landing' ? `-${lineLandingExposureMode}` : ''}`,
        difficulty: selectedDifficulty,
        mode: sessionModeRef.current,
        targetWpm: sessionGuideWpmRef.current,
        initialTargetWpm: sessionInitialGuideWpmRef.current,
        finalTargetWpm: sessionGuideWpmRef.current,
        configuredPaceOnly: true,
        anchorWords: sessionAnchorWordsRef.current,
        lineWords: sessionLineWordsRef.current,
        totalWords,
        wordCount: actualWordsPresented,
        wordsPresented: actualWordsPresented,
        completionRate,
        completionThreshold: COMPLETION_THRESHOLD,
        completedEnoughForProgress,
        adaptiveQualificationEligible,
        linesPresented: presentedLineIndexesRef.current.size,
        returnSweepsCompleted: returnSweepsRef.current,
        lineLandingExposureMs: landingExposureMsRef.current,
        lineLandingExposureMode,
        screenReaderManualMode:
          sessionLandingExposureModeRef.current === 'manual' ||
          sessionLandingExposureModeRef.current === 'mixed' ||
          (sessionLandingExposureModeRef.current === null &&
            sessionScreenReaderAtStartRef.current),
        lineLandingAttempts: landingAttemptsRef.current,
        lineLandingCorrect: landingCorrectRef.current,
        lineLandingAccuracy,
        lineLandingRequired: requiredLandingLines,
        lineLandingAnswered: answeredLandingLines,
        lineLandingOmitted: omittedLandingLines,
        lineLandingNotApplicable,
        lineLandingRequiredAccuracy: lineLandingConfig.requiredAccuracy,
        lineLandingQualified,
        pauseCount: pauseCountRef.current,
        backCount: backCountRef.current,
        timingMethod: 'monotonic-active-elapsed',
        questionsTotal: 1,
        correctCount: comprehensionCorrect ? 1 : 0,
        comprehensionCorrect,
        comprehensionAccuracy,
        wpm: 0,
      },
    });
  }

  const activeLineIndex =
    guideStep.kind === 'anchor'
      ? guideStep.lineIndex
      : guideStep.toLineIndex;
  const preferredWindowStart =
    guideStep.kind === 'return'
      ? guideStep.fromLineIndex
      : Math.floor(activeLineIndex / visibleLineCount) * visibleLineCount;
  const windowStart = Math.max(
    0,
    Math.min(
      preferredWindowStart,
      Math.max(0, sessionLines.length - visibleLineCount)
    )
  );
  const visibleLines = sessionLines.slice(
    windowStart,
    windowStart + visibleLineCount
  );
  const question = sessionArticle.comprehensionQuestions[0];
  const activeAnchor =
    guideStep.kind === 'anchor'
      ? sessionLines[guideStep.lineIndex]?.anchors[guideStep.anchorIndex]
      : undefined;
  const activeGuideLabel =
    guideStep.kind === 'return'
      ? sessionModeRef.current === 'line-landing' && landingStage === 'flash'
        ? `Line ${guideStep.toLineIndex + 1} begins ${landingPrompt?.target ?? ''}`
        : sessionModeRef.current === 'line-landing' && landingStage === 'choice'
          ? `Choose the beginning of line ${guideStep.toLineIndex + 1}`
          : `Return to line ${guideStep.toLineIndex + 1}`
      : `Current phrase: ${activeAnchor?.words.join(' ') ?? ''}`;
  const landingControlsLocked = landingStage !== 'none';
  const completionProgress =
    sessionArticle.wordCount > 0
      ? Math.min(1, wordsPresented / sessionArticle.wordCount)
      : 0;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Return-Sweep Flow</Text>
      <Text style={styles.subtitle}>
        Follow the guide; its pace is configured, not measured reading speed.
      </Text>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={() => start()}
          startLabel={
            selectedMode === 'line-landing'
              ? 'Start line catching'
              : 'Start line guide'
          }
        >
          <View style={styles.modeSelector} testID="saccades-mode-selector">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: selectedMode === 'flow' }}
              onPress={() => setSelectedMode('flow')}
              style={({ pressed }) => [
                styles.modeButton,
                selectedMode === 'flow' && styles.modeButtonSelected,
                pressed && styles.pressed,
              ]}
              testID="saccades-mode-flow"
            >
              <Text
                style={[
                  styles.modeButtonText,
                  selectedMode === 'flow' && styles.modeButtonTextSelected,
                ]}
              >
                Guided flow
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: selectedMode === 'line-landing',
              }}
              onPress={() => setSelectedMode('line-landing')}
              style={({ pressed }) => [
                styles.modeButton,
                selectedMode === 'line-landing' && styles.modeButtonSelected,
                pressed && styles.pressed,
              ]}
              testID="saccades-mode-line-landing"
            >
              <Text
                style={[
                  styles.modeButtonText,
                  selectedMode === 'line-landing' &&
                    styles.modeButtonTextSelected,
                ]}
              >
                Line-Landing
              </Text>
            </Pressable>
          </View>
          <View
            accessible
            accessibilityLabel="Example: read across each line, then return down and left to the next line"
            style={styles.idleDemo}
          >
            {selectedMode === 'flow' ? (
              <>
                <Text style={styles.demoLine}>
                  Read <Text style={styles.demoAnchor}>short groups</Text>{' '}
                  across
                </Text>
                <Text style={styles.demoLine}>begin the next line here</Text>
                <Text style={styles.demoLineMuted}>and continue smoothly</Text>
              </>
            ) : (
              <>
                <Text style={styles.demoLine}>finish this book-like line</Text>
                <Text style={styles.demoLine}>
                  <Text style={styles.demoAnchor}>catch its next beginning</Text>{' '}
                  before it hides
                </Text>
                <Text style={styles.demoLineMuted}>
                  then identify the phrase and keep reading
                </Text>
              </>
            )}
          </View>
          <Text style={styles.safetyNote}>
            Stop immediately if the movement feels uncomfortable.
          </Text>
        </GameIdlePanel>
      )}

      {phase === 'active' && (
        <ScrollView
          contentContainerStyle={styles.gameArea}
          showsVerticalScrollIndicator
          testID="saccades-active"
        >
          <StatsRow
            style={styles.statsRow}
            testID="saccades-stats"
            items={[
              {
                key: 'pace',
                value: guideWpm,
                label: 'guide WPM',
                containerStyle: styles.stat,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'progress',
                value: `${wordsPresented}/${sessionArticle.wordCount}`,
                label: 'words shown',
                containerStyle: styles.stat,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'returns',
                value: returnSweepsCompleted,
                label: 'returns',
                containerStyle: styles.stat,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionProgress * 100}%` },
              ]}
              testID="saccades-progress-fill"
            />
          </View>
          <ReadingColumn
            style={[
              styles.readingCard,
              readingDisplay.column,
              readingDisplay.surface,
              { minHeight: lineWindowMinHeight + 84 },
            ]}
          >
            <Text style={[styles.articleTitle, readingDisplay.title]}>
              {sessionArticle.title}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusMeta}>
                {paused && (
                  <View style={styles.pausedPill} testID="saccades-paused-pill">
                    <Text style={styles.pausedText}>PAUSED</Text>
                  </View>
                )}
                <Text style={[styles.lineCounter, readingDisplay.title]}>
                  Line {activeLineIndex + 1} of {sessionLines.length}
                </Text>
              </View>
            </View>
            <Text
              accessibilityLiveRegion="polite"
              style={styles.accessibilityAnnouncement}
              testID="saccades-current-announcement"
            >
              {activeGuideLabel}
            </Text>
            <View
              style={[styles.lineWindow, { minHeight: lineWindowMinHeight }]}
              testID="saccades-line-window"
            >
              {visibleLines.map((line, visibleLineIndex) => {
                const lineIndex = windowStart + visibleLineIndex;
                const returnTarget =
                  guideStep.kind === 'return' &&
                  guideStep.toLineIndex === lineIndex;
                const currentLine = lineIndex === activeLineIndex;
                const isLastPassageLine =
                  lineIndex === sessionLines.length - 1;
                return (
                  <View
                    accessible={false}
                    key={line.id}
                    style={[
                      styles.line,
                      { minHeight: readingLineHeight },
                      !currentLine && styles.contextLine,
                      currentLine && styles.currentLine,
                      returnTarget && styles.returnTargetLine,
                      isLastPassageLine && styles.lastLine,
                    ]}
                    testID={`saccades-line-${lineIndex}`}
                  >
                    {line.anchors.map((anchor, anchorIndex) => {
                      const active =
                        guideStep.kind === 'anchor' &&
                        guideStep.lineIndex === lineIndex &&
                        guideStep.anchorIndex === anchorIndex;
                      const landingTarget =
                        sessionModeRef.current === 'line-landing' &&
                        guideStep.kind === 'return' &&
                        guideStep.toLineIndex === lineIndex &&
                        anchorIndex === 0;
                      const lineStartAlreadyPresented =
                        presentedWordIndexesRef.current.has(
                          anchor.startWordIndex
                        );
                      const concealedLineStart =
                        sessionModeRef.current === 'line-landing' &&
                        anchorIndex === 0 &&
                        !lineStartAlreadyPresented &&
                        !(
                          landingTarget &&
                          (landingStage === 'flash' ||
                            landingStage === 'feedback')
                        );
                      return (
                        <Text
                          accessible={false}
                          adjustsFontSizeToFit
                          key={anchor.id}
                          minimumFontScale={0.9}
                          numberOfLines={1}
                          testID={
                            active
                              ? 'active-anchor'
                              : landingTarget && landingStage === 'flash'
                                ? 'line-landing-flash'
                              : `saccades-anchor-${lineIndex}-${anchorIndex}`
                          }
                          style={[
                            readingDisplay.text,
                            styles.anchor,
                            active && styles.activeAnchor,
                            concealedLineStart && styles.concealedLineStart,
                            landingTarget &&
                              landingStage === 'flash' &&
                              styles.landingFlash,
                          ]}
                        >
                          {concealedLineStart
                            ? '••••'
                            : anchor.words.join(' ')}
                        </Text>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ReadingColumn>
          {landingPrompt && landingStage === 'flash' && (
            <View style={styles.landingPanel} testID="line-landing-preview">
              <Text style={styles.landingEyebrow}>LINE-START GLIMPSE</Text>
              <Text style={styles.landingInstruction}>
                {landingPrompt.exposureMode === 'manual'
                  ? 'Take the time you need, then hide the phrase and choose it.'
                  : 'Keep the return movement natural. The phrase will hide shortly.'}
              </Text>
              {landingPrompt.exposureMode === 'manual' && (
                <>
                  <Text style={styles.screenReaderLandingText}>
                    Line beginning: {landingPrompt.target}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={revealLandingChoices}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.manualLandingButton,
                      pressed && styles.pressed,
                    ]}
                    testID="line-landing-manual-continue"
                  >
                    <Text style={styles.primaryButtonText}>
                      Hide phrase and choose
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
          {landingPrompt && landingStage === 'choice' && (
            <View style={styles.landingPanel} testID="line-landing-choice">
              <Text style={styles.landingEyebrow}>WHAT STARTED THE LINE?</Text>
              <View style={styles.landingOptions}>
                {landingPrompt.options.map((option, optionIndex) => (
                  <Pressable
                    accessibilityRole="button"
                    key={`${optionIndex}-${option}`}
                    onPress={() => answerLanding(optionIndex)}
                    style={({ pressed }) => [
                      styles.option,
                      styles.landingOption,
                      pressed && styles.pressed,
                    ]}
                    testID={`line-landing-option-${optionIndex}`}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {landingPrompt && landingStage === 'feedback' && (
            <View style={styles.landingPanel} testID="line-landing-feedback">
              <Text
                style={[
                  styles.feedbackBadge,
                  landingPrompt.correct
                    ? styles.feedbackCorrect
                    : styles.feedbackIncorrect,
                ]}
              >
                {landingPrompt.correct ? 'Caught' : 'Review the line start'}
              </Text>
              {!landingPrompt.correct &&
                landingPrompt.selectedIndex !== null && (
                  <Text style={styles.selectedAnswer}>
                    Your answer:{' '}
                    {landingPrompt.options[landingPrompt.selectedIndex]}
                  </Text>
                )}
              <Text style={styles.correctAnswerLabel}>Line beginning</Text>
              <Text style={styles.correctAnswer}>{landingPrompt.target}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={continueAfterLanding}
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.feedbackContinue,
                  pressed && styles.pressed,
                ]}
                testID="continue-line-landing"
              >
                <Text style={styles.primaryButtonText}>Continue reading</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.controls} testID="saccades-controls">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back one highlighted phrase"
              disabled={landingControlsLocked}
              onPress={backOneAnchor}
              style={({ pressed }) => [
                styles.secondaryButton,
                landingControlsLocked && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
              testID="back-anchor"
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Resume line guide' : 'Pause line guide'}
              disabled={landingControlsLocked}
              onPress={togglePause}
              style={({ pressed }) => [
                styles.secondaryButton,
                landingControlsLocked && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
              testID="toggle-guide"
            >
              <Text style={styles.secondaryButtonText}>
                {paused ? 'Resume' : 'Pause'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reduce guide speed by 25 words per minute"
              disabled={landingControlsLocked || guideWpm <= MIN_GUIDE_WPM}
              onPress={() => changePace(-GUIDE_STEP_WPM)}
              style={({ pressed }) => [
                styles.secondaryButton,
                (landingControlsLocked || guideWpm <= MIN_GUIDE_WPM) &&
                  styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
              testID="saccades-slower"
            >
              <Text style={styles.secondaryButtonText}>−25 WPM</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase guide speed by 25 words per minute"
              disabled={landingControlsLocked || guideWpm >= MAX_GUIDE_WPM}
              onPress={() => changePace(GUIDE_STEP_WPM)}
              style={({ pressed }) => [
                styles.secondaryButton,
                (landingControlsLocked || guideWpm >= MAX_GUIDE_WPM) &&
                  styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
              testID="saccades-faster"
            >
              <Text style={styles.secondaryButtonText}>+25 WPM</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Finish reading and answer the question"
            onPress={beginQuestion}
            style={({ pressed }) => [
              styles.finishButton,
              pressed && styles.pressed,
            ]}
            testID="finish-early"
          >
            <Text style={styles.finishButtonText}>Finish safely</Text>
          </Pressable>
          <Text style={styles.safetyNote}>
            Pausing is always okay. Stop if the movement feels uncomfortable.
          </Text>
          <Text style={styles.progressNote} testID="saccades-progress-note">
            {linesPresented} lines visited · line {activeLineIndex + 1} of{' '}
            {sessionLines.length}
          </Text>
          {sessionModeRef.current === 'line-landing' && (
            <Text style={styles.progressNote} testID="line-landing-score">
              {landingCorrect}/{landingAttempts} line starts caught
            </Text>
          )}
        </ScrollView>
      )}

      {phase === 'question' && question && (
        <ScrollView
          contentContainerStyle={styles.gameArea}
          showsVerticalScrollIndicator
          testID="saccades-question"
        >
          <Text style={styles.questionEyebrow}>ONE COMPREHENSION CHECK</Text>
          <Text style={styles.questionText}>{question.question}</Text>
          <View style={styles.options}>
            {question.options.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                key={`${index}-${option}`}
                onPress={() => answerQuestion(index)}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.pressed,
                ]}
                testID={`question-option-${index}`}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {phase === 'feedback' && question && (
        <ScrollView
          contentContainerStyle={styles.gameArea}
          showsVerticalScrollIndicator
          testID="saccades-feedback"
        >
          <Text
            style={[
              styles.feedbackBadge,
              answerCorrect
                ? styles.feedbackCorrect
                : styles.feedbackIncorrect,
            ]}
          >
            {answerCorrect ? 'Correct' : 'Review the answer'}
          </Text>
          <Text style={styles.questionText}>{question.question}</Text>
          {!answerCorrect && selectedOption !== null && (
            <Text style={styles.selectedAnswer}>
              Your answer: {question.options[selectedOption]}
            </Text>
          )}
          <Text style={styles.correctAnswerLabel}>Passage answer</Text>
          <Text style={styles.correctAnswer}>
            {question.options[question.correctIndex]}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => finish(answerCorrect === true)}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.feedbackContinue,
              pressed && styles.pressed,
            ]}
            testID="continue-saccades-feedback"
          >
            <Text style={styles.primaryButtonText}>See results</Text>
          </Pressable>
        </ScrollView>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>Return-sweep practice complete</Text>
          <Text style={styles.endResult}>
            {answerCorrect ? 'Comprehension check correct' : 'Review the article meaning next time'}
          </Text>
          <Text style={styles.endMeta}>
            {wordsPresented} of {sessionArticle.wordCount} words guided
          </Text>
          {sessionModeRef.current === 'line-landing' && (
            <Text style={styles.endMeta}>
              {landingCorrect} of {landingAttempts} line starts caught
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => start(true)}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.replayButton,
              pressed && styles.pressed,
            ]}
            testID="play-again"
          >
            <Text style={styles.primaryButtonText}>Play again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    textAlign: 'center',
  },
  idleDemo: {
    alignItems: 'stretch',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  modeButton: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  modeButtonSelected: {
    backgroundColor: colors.infoSurface,
    borderColor: colors.primary,
  },
  modeButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  modeButtonTextSelected: {
    color: colors.infoForeground,
  },
  demoLine: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  demoLineMuted: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
  },
  demoAnchor: {
    backgroundColor: colors.infoSurface,
    color: colors.infoForeground,
    fontWeight: '800',
  },
  gameArea: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: spacing.sm,
    maxWidth: 840,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    width: '100%',
  },
  statsRow: {
    gap: spacing.sm,
  },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    borderRadius: borderRadius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    padding: spacing.sm,
  },
  statValue: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.full,
    height: 6,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    height: '100%',
  },
  readingCard: {
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    minHeight: 300,
    padding: spacing.md,
    position: 'relative',
    width: '100%',
    ...shadows.medium,
  },
  articleTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
    minHeight: 28,
  },
  statusMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  lineCounter: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  accessibilityAnnouncement: {
    height: 1,
    left: 0,
    opacity: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  lineWindow: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  line: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    paddingVertical: 1,
    width: '100%',
  },
  contextLine: {
    opacity: 1,
  },
  currentLine: {
    opacity: 1,
  },
  returnTargetLine: {
    opacity: 1,
  },
  lastLine: {
    justifyContent: 'flex-start',
  },
  anchor: {
    borderRadius: borderRadius.sm,
    flexShrink: 1,
  },
  activeAnchor: {
    backgroundColor: colors.infoSurface,
    color: colors.infoForeground,
  },
  concealedLineStart: {
    color: colors.textMuted,
    letterSpacing: 1,
    opacity: 0.38,
  },
  landingFlash: {
    backgroundColor: colors.warningSurface,
    color: colors.warningForeground,
  },
  landingPanel: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  landingEyebrow: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  landingInstruction: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  pausedPill: {
    backgroundColor: colors.infoSurface,
    borderRadius: borderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pausedText: {
    color: colors.infoForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: borderRadius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.onInteractive,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexBasis: '45%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  finishButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    marginTop: spacing.xs,
    minHeight: 48,
  },
  finishButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  safetyNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  progressNote: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  questionEyebrow: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  feedbackBadge: {
    alignSelf: 'center',
    borderRadius: borderRadius.full,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  feedbackCorrect: {
    backgroundColor: colors.successSurface,
    color: colors.successForeground,
  },
  feedbackIncorrect: {
    backgroundColor: colors.errorSurface,
    color: colors.errorForeground,
  },
  selectedAnswer: {
    color: colors.errorForeground,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  correctAnswerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  correctAnswer: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    textAlign: 'center',
  },
  feedbackContinue: {
    alignSelf: 'center',
    flex: 0,
    marginTop: spacing.md,
    minWidth: 160,
  },
  options: {
    gap: spacing.sm,
  },
  landingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  landingOption: {
    flexBasis: '45%',
    flexGrow: 1,
  },
  option: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  screenReaderLandingText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  manualLandingButton: {
    marginTop: spacing.md,
  },
  endCard: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  endTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  endResult: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  endMeta: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  replayButton: {
    flex: 0,
    marginTop: spacing.sm,
    minWidth: 150,
  },
});
