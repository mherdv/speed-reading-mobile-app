import { Fragment, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  getArticlesByDifficulty,
  getRandomArticle,
  type Article,
} from '../../data/articles';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { levelToStars, updateProgress } from '../../data/progressStore';
import {
  epochNowMs,
  measuredElapsedMs,
  monotonicNowMs,
} from '../../domain/timing';
import { borderRadius, colors, spacing } from '../../theme/colors';
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
const WINDOW_LINE_COUNT = 3;

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

type Phase = 'idle' | 'active' | 'question' | 'feedback' | 'ended';

type Props = {
  article?: Article;
  anchorWords?: number;
  lineWords?: number;
  guideWpm?: number;
  tickMs?: number;
  random?: () => number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

export function getReadingSaccadesConfig(
  difficulty: Difficulty
): ReadingSaccadesConfig {
  if (difficulty === 'easy') {
    return { anchorWords: 2, lineWords: 6, guideWpm: 150 };
  }
  if (difficulty === 'medium') {
    return { anchorWords: 3, lineWords: 8, guideWpm: 230 };
  }
  return { anchorWords: 3, lineWords: 10, guideWpm: 320 };
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
  random = Math.random,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const [phase, setPhase] = useState<Phase>('idle');
  const [guideStep, setGuideStep] = useState<GuideStep>({
    kind: 'anchor',
    lineIndex: 0,
    anchorIndex: 0,
  });
  const [paused, setPaused] = useState(false);
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
      anchorWordsProp ?? config.anchorWords
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
  const sessionAnchorWordsRef = useRef(1);
  const sessionLineWordsRef = useRef(1);
  const sessionGuideWpmRef = useRef(1);
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

  useAutoStart(autoStart, phase, progressLoaded, start);

  function setCurrentPhase(nextPhase: Phase) {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
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
      160,
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
    stopActiveClock();
    setCurrentPhase('question');
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
      guideStepRef.current = returnStep;
      setGuideStep(returnStep);
      scheduleNextStep(returnStep);
      return;
    }

    beginQuestion();
  }

  function start(force = false) {
    if (!force && phaseRef.current !== 'idle') return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    pausedRef.current = false;
    presentedWordIndexesRef.current = new Set();
    presentedLineIndexesRef.current = new Set();
    returnSweepsRef.current = 0;
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
    const configuredGuideWpm = Math.max(
      1,
      Math.floor(guideWpmProp ?? config.guideWpm)
    );
    const nextArticle = chooseNextArticle();
    const nextLines = buildSaccadeLines(
      nextArticle.text,
      configuredLineWords,
      configuredAnchorWords
    );

    articleRef.current = nextArticle;
    linesRef.current = nextLines;
    sessionAnchorWordsRef.current = configuredAnchorWords;
    sessionLineWordsRef.current = configuredLineWords;
    sessionGuideWpmRef.current = configuredGuideWpm;
    sessionTickMsRef.current = tickMs;
    startedEpochRef.current = epochNowMs();
    lastArticleIdRef.current = nextArticle.id;

    setSessionArticle(nextArticle);
    setSessionLines(nextLines);
    setPaused(false);
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

  function togglePause() {
    if (phaseRef.current !== 'active') return;
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
    if (phaseRef.current !== 'active') return;
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
    const completedEnoughForProgress =
      completionRate >= COMPLETION_THRESHOLD && comprehensionCorrect;

    setCurrentPhase('ended');
    void updateProgress(
      GAME_ID,
      completedEnoughForProgress,
      actualWordsPresented,
      selectedDifficulty
    )
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(startedEpochRef.current).toISOString(),
      finishedAtIso: new Date(finishedEpoch).toISOString(),
      elapsedMs,
      score: actualWordsPresented,
      accuracy: comprehensionAccuracy,
      details: {
        schemaVersion: 1,
        activityType: 'reading-saccade-guide',
        contentId: articleRef.current.id,
        contentVersion: articleRef.current.version,
        comparisonBand: `reading-saccade-${selectedDifficulty}`,
        difficulty: selectedDifficulty,
        targetWpm: sessionGuideWpmRef.current,
        configuredPaceOnly: true,
        anchorWords: sessionAnchorWordsRef.current,
        lineWords: sessionLineWordsRef.current,
        totalWords,
        wordCount: actualWordsPresented,
        wordsPresented: actualWordsPresented,
        completionRate,
        completionThreshold: COMPLETION_THRESHOLD,
        completedEnoughForProgress,
        linesPresented: presentedLineIndexesRef.current.size,
        returnSweepsCompleted: returnSweepsRef.current,
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
      : Math.floor(activeLineIndex / WINDOW_LINE_COUNT) * WINDOW_LINE_COUNT;
  const windowStart = Math.max(
    0,
    Math.min(
      preferredWindowStart,
      Math.max(0, sessionLines.length - WINDOW_LINE_COUNT)
    )
  );
  const visibleLines = sessionLines.slice(
    windowStart,
    windowStart + WINDOW_LINE_COUNT
  );
  const question = sessionArticle.comprehensionQuestions[0];
  const activeAnchor =
    guideStep.kind === 'anchor'
      ? sessionLines[guideStep.lineIndex]?.anchors[guideStep.anchorIndex]
      : undefined;
  const activeGuideLabel =
    guideStep.kind === 'return'
      ? `Return to line ${guideStep.toLineIndex + 1}`
      : `Current phrase: ${activeAnchor?.words.join(' ') ?? ''}`;

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
          startLabel="Start line guide"
        >
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
            items={[
              {
                key: 'pace',
                value: sessionGuideWpmRef.current,
                label: 'Guide WPM',
              },
              {
                key: 'progress',
                value: `${wordsPresented}/${sessionArticle.wordCount}`,
                label: 'Words shown',
              },
            ]}
          />
          <ReadingColumn
            style={[styles.readingCard, readingDisplay.column, readingDisplay.surface]}
          >
            <Text style={styles.articleTitle}>{sessionArticle.title}</Text>
            <Text
              accessibilityLiveRegion="polite"
              style={styles.accessibilityAnnouncement}
              testID="saccades-current-announcement"
            >
              {activeGuideLabel}
            </Text>
            <View style={styles.lineWindow}>
              {visibleLines.map((line, visibleLineIndex) => {
                const lineIndex = windowStart + visibleLineIndex;
                const returnTarget =
                  guideStep.kind === 'return' &&
                  guideStep.toLineIndex === lineIndex;
                return (
                  <Text
                    accessible={false}
                    adjustsFontSizeToFit
                    key={line.id}
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    style={[readingDisplay.text, styles.line]}
                    testID={`saccades-line-${lineIndex}`}
                  >
                    <Text
                      accessible={false}
                      style={[
                        styles.returnCueInline,
                        !returnTarget && styles.returnCueHidden,
                      ]}
                      testID={returnTarget ? 'return-sweep-cue' : undefined}
                    >
                      {returnTarget ? '↙ ' : '\u00A0\u00A0'}
                    </Text>
                    {line.anchors.map((anchor, anchorIndex) => {
                      const active =
                        guideStep.kind === 'anchor' &&
                        guideStep.lineIndex === lineIndex &&
                        guideStep.anchorIndex === anchorIndex;
                      return (
                        <Fragment key={anchor.id}>
                          <Text
                            testID={
                              active
                                ? 'active-anchor'
                                : `saccades-anchor-${lineIndex}-${anchorIndex}`
                            }
                            style={[
                              styles.anchor,
                              active && styles.activeAnchor,
                            ]}
                          >
                            {anchor.words.join(' ')}
                          </Text>
                          {anchorIndex < line.anchors.length - 1 ? ' ' : null}
                        </Fragment>
                      );
                    })}
                  </Text>
                );
              })}
            </View>
          </ReadingColumn>
          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back one highlighted phrase"
              onPress={backOneAnchor}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              testID="back-anchor"
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Resume line guide' : 'Pause line guide'}
              onPress={togglePause}
              style={({ pressed }) => [
                styles.secondaryButton,
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
              accessibilityLabel="Finish reading and answer the question"
              onPress={beginQuestion}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
              testID="finish-early"
            >
              <Text style={styles.primaryButtonText}>Finish early</Text>
            </Pressable>
          </View>
          <Text style={styles.safetyNote}>
            Pausing is always okay. Stop if the movement feels uncomfortable.
          </Text>
          <Text style={styles.progressNote}>
            {linesPresented} lines visited · {returnSweepsCompleted} return sweeps
          </Text>
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
    padding: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  gameArea: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  readingCard: {
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 300,
    padding: spacing.md,
    width: '100%',
  },
  articleTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  accessibilityAnnouncement: {
    height: 1,
    left: 0,
    opacity: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  returnCueInline: {
    color: colors.infoForeground,
    fontWeight: '800',
  },
  returnCueHidden: {
    opacity: 0,
  },
  lineWindow: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  line: {
    minHeight: 48,
    paddingVertical: spacing.xs,
    textAlign: 'left',
    width: '100%',
  },
  anchor: {
    borderRadius: borderRadius.sm,
    marginRight: 4,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  activeAnchor: {
    backgroundColor: colors.warningSurface,
    color: colors.warningForeground,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  controls: {
    flexDirection: 'row',
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
    flex: 1,
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
