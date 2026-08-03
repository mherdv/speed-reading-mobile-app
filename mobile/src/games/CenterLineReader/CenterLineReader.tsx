import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ARTICLES,
  getArticlesByDifficulty,
  type Article,
} from '../../data/articles';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { levelToStars, updateProgress } from '../../data/progressStore';
import type { RandomSource } from '../../data/randomization';
import {
  epochNowMs,
  measuredElapsedMs,
  monotonicNowMs,
} from '../../domain/timing';
import { borderRadius, colors, shadows, spacing } from '../../theme/colors';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import {
  useAutoStart,
  useGameProgress,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'CenterLineReader';
const MIN_GUIDE_WPM = 100;
const MAX_GUIDE_WPM = 800;
const GUIDE_STEP_WPM = 25;
const MAX_FOCUS_CHARS = 24;

export type CenterLineConfig = {
  chunkWords: number;
  guideWpm: number;
  neighborOpacity: number;
};

export function getCenterLineConfig(
  difficulty: Difficulty
): CenterLineConfig {
  if (difficulty === 'easy') {
    return { chunkWords: 1, guideWpm: 160, neighborOpacity: 0.62 };
  }
  if (difficulty === 'medium') {
    return { chunkWords: 2, guideWpm: 250, neighborOpacity: 0.48 };
  }
  return { chunkWords: 4, guideWpm: 360, neighborOpacity: 0.34 };
}

export function chunkCenterLineText(
  text: string,
  wordsPerChunk: number,
  maxCharacters = MAX_FOCUS_CHARS
): string[] {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  const safeSize = Math.max(1, Math.floor(wordsPerChunk));
  const safeCharacterLimit = Math.max(1, Math.floor(maxCharacters));
  const chunks: string[] = [];
  let currentWords: string[] = [];
  for (const word of words) {
    const candidate = [...currentWords, word].join(' ');
    if (
      currentWords.length > 0 &&
      (currentWords.length >= safeSize || candidate.length > safeCharacterLimit)
    ) {
      chunks.push(currentWords.join(' '));
      currentWords = [word];
    } else {
      currentWords.push(word);
    }
    if (currentWords.length >= safeSize) {
      chunks.push(currentWords.join(' '));
      currentWords = [];
    }
  }
  if (currentWords.length > 0) chunks.push(currentWords.join(' '));
  return chunks;
}

export function getCenterLineDelayMs(chunk: string, guideWpm: number): number {
  const wordCount = Math.max(
    1,
    chunk.trim().split(/\s+/u).filter(Boolean).length
  );
  const safeWpm = Math.max(MIN_GUIDE_WPM, guideWpm);
  const baseDelay = (60_000 * wordCount) / safeWpm;
  const trimmed = chunk.trim();
  const punctuationMultiplier = /[.!?]["')\x5D]?$/u.test(trimmed)
    ? 1.5
    : /[,;:]["')\x5D]?$/u.test(trimmed)
      ? 1.25
      : 1;
  return Math.max(90, Math.round(baseDelay * punctuationMultiplier));
}

type Props = {
  article?: Article;
  chunkWords?: number;
  guideWpm?: number;
  intervalMs?: number;
  random?: RandomSource;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'paused' | 'question' | 'feedback' | 'ended';

function clampWpm(value: number): number {
  return Math.min(MAX_GUIDE_WPM, Math.max(MIN_GUIDE_WPM, value));
}

function countChunkWords(chunks: readonly string[], throughIndex: number): number {
  return chunks.slice(0, throughIndex + 1).reduce(
    (total, chunk) =>
      total + chunk.trim().split(/\s+/u).filter(Boolean).length,
    0
  );
}

export default function CenterLineReader({
  article: articleProp,
  chunkWords: chunkWordsProp,
  guideWpm: guideWpmProp,
  intervalMs,
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
  const config = getCenterLineConfig(selectedDifficulty);
  const configuredChunkWords = Math.max(
    1,
    Math.floor(chunkWordsProp ?? config.chunkWords)
  );
  const initialGuideWpm = clampWpm(guideWpmProp ?? config.guideWpm);

  const [phase, setPhase] = useState<Phase>('idle');
  const [sessionArticle, setSessionArticle] = useState<Article | null>(null);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [guideWpm, setGuideWpm] = useState(initialGuideWpm);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [backCount, setBackCount] = useState(0);

  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const maxChunkIndexRef = useRef(0);
  const questionsCorrectRef = useRef(0);
  const questionsAnsweredRef = useRef(0);
  const pauseCountRef = useRef(0);
  const backCountRef = useRef(0);
  const guideWpmRef = useRef(initialGuideWpm);
  const sessionInitialGuideWpmRef = useRef(initialGuideWpm);
  const startedAtEpochRef = useRef(0);
  const activeSegmentStartedRef = useRef<number | null>(null);
  const activeElapsedMsRef = useRef(0);
  const lastArticleIdRef = useRef<string | null>(null);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearTrackedTimeouts();
    };
  }, [clearTrackedTimeouts]);

  useEffect(() => {
    if (phase === 'idle') setGuideWpm(initialGuideWpm);
  }, [initialGuideWpm, phase]);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function chooseArticle(): Article {
    if (articleProp) return articleProp;
    const levelArticles = getArticlesByDifficulty(selectedDifficulty);
    const freshArticles = levelArticles.filter(
      (candidate) => candidate.id !== lastArticleIdRef.current
    );
    const pool = freshArticles.length > 0 ? freshArticles : levelArticles;
    if (pool.length === 0) return ARTICLES[0]!;
    const value = Math.min(0.999999, Math.max(0, random()));
    return pool[Math.floor(value * pool.length)]!;
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

  function scheduleCurrentChunk() {
    clearTrackedTimeouts();
    const current = chunksRef.current[chunkIndexRef.current];
    if (!current) {
      finishReading();
      return;
    }
    const delay = intervalMs ?? getCenterLineDelayMs(current, guideWpmRef.current);
    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      if (chunkIndexRef.current >= chunksRef.current.length - 1) {
        finishReading();
        return;
      }
      chunkIndexRef.current += 1;
      maxChunkIndexRef.current = Math.max(
        maxChunkIndexRef.current,
        chunkIndexRef.current
      );
      setChunkIndex(chunkIndexRef.current);
      scheduleCurrentChunk();
    }, delay);
  }

  function start(preserveAdjustedPace = false) {
    if (phase !== 'idle' && phase !== 'ended') return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    questionsCorrectRef.current = 0;
    questionsAnsweredRef.current = 0;
    pauseCountRef.current = 0;
    backCountRef.current = 0;
    activeElapsedMsRef.current = 0;
    activeSegmentStartedRef.current = null;
    setPauseCount(0);
    setBackCount(0);
    setQuestionIndex(0);
    setSelectedOption(null);
    setFeedbackCorrect(false);

    const selectedArticle = chooseArticle();
    const chunks = chunkCenterLineText(
      selectedArticle.text,
      configuredChunkWords
    );
    lastArticleIdRef.current = selectedArticle.id;
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    maxChunkIndexRef.current = 0;
    setSessionArticle(selectedArticle);
    setChunkIndex(0);
    const sessionStartingWpm = preserveAdjustedPace
      ? guideWpmRef.current
      : initialGuideWpm;
    sessionInitialGuideWpmRef.current = sessionStartingWpm;
    setGuideWpm(sessionStartingWpm);
    guideWpmRef.current = sessionStartingWpm;
    startedAtEpochRef.current = epochNowMs();
    startActiveClock();
    setPhase('running');
    scheduleCurrentChunk();
  }

  function finishReading() {
    clearTrackedTimeouts();
    stopActiveClock();
    setQuestionIndex(0);
    setSelectedOption(null);
    setPhase('question');
  }

  function pause() {
    if (phase !== 'running') return;
    clearTrackedTimeouts();
    stopActiveClock();
    pauseCountRef.current += 1;
    setPauseCount(pauseCountRef.current);
    setPhase('paused');
  }

  function resume() {
    if (phase !== 'paused') return;
    startActiveClock();
    setPhase('running');
    scheduleCurrentChunk();
  }

  function changePace(delta: number) {
    const next = clampWpm(guideWpm + delta);
    if (next === guideWpm) return;
    setGuideWpm(next);
    guideWpmRef.current = next;
    if (phase === 'running') {
      clearTrackedTimeouts();
      const current = chunksRef.current[chunkIndexRef.current];
      if (current) {
        const delay = intervalMs ?? getCenterLineDelayMs(current, next);
        scheduleTimeout(() => {
          if (cancelledRef.current) return;
          if (chunkIndexRef.current >= chunksRef.current.length - 1) {
            finishReading();
            return;
          }
          chunkIndexRef.current += 1;
          maxChunkIndexRef.current = Math.max(
            maxChunkIndexRef.current,
            chunkIndexRef.current
          );
          setChunkIndex(chunkIndexRef.current);
          scheduleCurrentChunk();
        }, delay);
      }
    }
  }

  function backOneChunk() {
    if (phase !== 'running' && phase !== 'paused') return;
    const next = Math.max(0, chunkIndexRef.current - 1);
    if (next === chunkIndexRef.current) return;
    chunkIndexRef.current = next;
    setChunkIndex(next);
    backCountRef.current += 1;
    setBackCount(backCountRef.current);
    if (phase === 'running') scheduleCurrentChunk();
  }

  function finishEarly() {
    if (phase !== 'running' && phase !== 'paused') return;
    clearTrackedTimeouts();
    stopActiveClock();
    reportAndEnd(false);
  }

  function answerQuestion(optionIndex: number) {
    if (phase !== 'question' || !sessionArticle) return;
    const question = sessionArticle.comprehensionQuestions[questionIndex];
    if (!question) return;
    const correct = optionIndex === question.correctIndex;
    questionsAnsweredRef.current += 1;
    if (correct) questionsCorrectRef.current += 1;
    setSelectedOption(optionIndex);
    setFeedbackCorrect(correct);
    setPhase('feedback');
  }

  function continueAfterFeedback() {
    if (phase !== 'feedback' || !sessionArticle) return;
    const next = questionIndex + 1;
    if (next >= sessionArticle.comprehensionQuestions.length) {
      reportAndEnd(true);
      return;
    }
    setQuestionIndex(next);
    setSelectedOption(null);
    setPhase('question');
  }

  function reportAndEnd(completedNaturally: boolean) {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    stopActiveClock();

    const chunks = chunksRef.current;
    const totalWords = sessionArticle?.wordCount ?? 0;
    const wordsPresented = countChunkWords(chunks, maxChunkIndexRef.current);
    const completionRate =
      totalWords > 0 ? Math.min(1, wordsPresented / totalWords) : 0;
    const questionsTotal = sessionArticle?.comprehensionQuestions.length ?? 0;
    const accuracy =
      questionsAnsweredRef.current > 0
        ? questionsCorrectRef.current / questionsAnsweredRef.current
        : undefined;
    const comprehensionQualified =
      completedNaturally &&
      questionsAnsweredRef.current === questionsTotal &&
      accuracy !== undefined &&
      accuracy >= 0.8;
    const score =
      accuracy === undefined ? undefined : Math.round(accuracy * 100);
    const finishedAtEpoch = epochNowMs();
    const elapsedMs = Math.max(1, Math.round(activeElapsedMsRef.current));

    setPhase('ended');
    void updateProgress(
      GAME_ID,
      comprehensionQualified,
      score,
      selectedDifficulty
    )
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(startedAtEpochRef.current).toISOString(),
      finishedAtIso: new Date(finishedAtEpoch).toISOString(),
      elapsedMs,
      score,
      accuracy,
      details: {
        schemaVersion: 1,
        activityType: 'focus-lane-guided-reading',
        presentationMode: 'three-slot-focus-lane',
        contentId: sessionArticle?.id,
        articleId: sessionArticle?.id,
        contentVersion: sessionArticle?.version,
        comparisonBand: `focus-lane-${selectedDifficulty}-${configuredChunkWords}-word`,
        targetWpm: guideWpmRef.current,
        initialTargetWpm: sessionInitialGuideWpmRef.current,
        finalTargetWpm: guideWpmRef.current,
        configuredPaceOnly: true,
        wordCount: wordsPresented,
        wpm: 0,
        totalWords,
        wordsPresented,
        chunksPresented: Math.min(maxChunkIndexRef.current + 1, chunks.length),
        totalChunks: chunks.length,
        chunkSize: configuredChunkWords,
        completionRate,
        completedNaturally,
        comprehensionCorrect:
          questionsAnsweredRef.current === questionsTotal && questionsTotal > 0
            ? questionsCorrectRef.current === questionsTotal
            : undefined,
        questionsCorrect: questionsCorrectRef.current,
        questionsAnswered: questionsAnsweredRef.current,
        questionsTotal,
        pauseCount: pauseCountRef.current,
        backCount: backCountRef.current,
        timingMethod: 'monotonic-active-elapsed',
        difficulty: selectedDifficulty,
      },
    });
  }

  function playAgain() {
    clearTrackedTimeouts();
    setPhase('idle');
    scheduleTimeout(() => start(true), 50);
  }

  const currentChunk = chunksRef.current[chunkIndex] ?? '';
  const previousChunk = chunksRef.current[chunkIndex - 1] ?? '';
  const nextChunk = chunksRef.current[chunkIndex + 1] ?? '';
  const totalChunks = chunksRef.current.length;
  const progress = totalChunks > 0 ? (chunkIndex + 1) / totalChunks : 0;
  const focusFontSize =
    typeof readingDisplay.text.fontSize === 'number'
      ? readingDisplay.text.fontSize + 8
      : 26;
  const currentQuestion =
    sessionArticle?.comprehensionQuestions[questionIndex] ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Lane</Text>
        <Text style={styles.subtitle}>
          Keep your gaze near the fixed center guides while context stays visible
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          startLabel="Start Focus Lane"
        >
          <View style={styles.idleDemo}>
            <View style={styles.guideTick} />
            <View style={styles.demoLane}>
              <Text style={styles.demoNeighbor}>meaningful</Text>
              <Text style={styles.demoCurrent}>reading stays</Text>
              <Text style={styles.demoNeighbor}>connected</Text>
            </View>
            <View style={styles.guideTick} />
          </View>
          <Text style={styles.safetyText}>
            Pause or stop if the motion feels uncomfortable. This is a pacing
            guide, not vision treatment or proof of faster reading.
          </Text>
        </GameIdlePanel>
      )}

      {(phase === 'running' || phase === 'paused') && (
        <ScrollView
          contentContainerStyle={styles.activeContent}
          showsVerticalScrollIndicator
          testID="focus-lane-active"
        >
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{guideWpm}</Text>
              <Text style={styles.statLabel}>guide WPM</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{configuredChunkWords}</Text>
              <Text style={styles.statLabel}>
                {configuredChunkWords === 1 ? 'word' : 'words'} / focus
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {chunkIndex + 1}/{totalChunks}
              </Text>
              <Text style={styles.statLabel}>chunks</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <View
            style={[
              styles.laneCard,
              readingDisplay.surface,
              readingDisplay.column,
            ]}
            testID="focus-lane"
          >
            <View
              accessible={false}
              testID="focus-guides"
              style={styles.guideRow}
            >
              <View style={styles.guideTick} />
            </View>
            <View style={styles.laneRow}>
              <View style={styles.neighborSlot}>
                <Text
                  accessible={false}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                  numberOfLines={1}
                  style={[
                    styles.neighborText,
                    readingDisplay.text,
                    { opacity: config.neighborOpacity },
                  ]}
                >
                  {previousChunk}
                </Text>
              </View>
              <View style={styles.currentSlot}>
                <Text
                  accessibilityLiveRegion="polite"
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  numberOfLines={1}
                  style={[
                    styles.currentText,
                    readingDisplay.text,
                    { fontSize: focusFontSize, lineHeight: focusFontSize + 10 },
                  ]}
                  testID="focus-current"
                >
                  {currentChunk}
                </Text>
              </View>
              <View style={styles.neighborSlot}>
                <Text
                  accessible={false}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                  numberOfLines={1}
                  style={[
                    styles.neighborText,
                    readingDisplay.text,
                    { opacity: config.neighborOpacity },
                  ]}
                >
                  {nextChunk}
                </Text>
              </View>
            </View>
            <View accessible={false} style={styles.guideRow}>
              <View style={styles.guideTick} />
            </View>
            {phase === 'paused' && (
              <View style={styles.pausedPill}>
                <Text style={styles.pausedText}>PAUSED</Text>
              </View>
            )}
          </View>

          <Text style={styles.contextHint}>
            Read the center chunk; use the faded neighbors for preview or recovery.
          </Text>

          <View style={styles.controlGrid}>
            <Button
              label={phase === 'paused' ? 'Resume' : 'Pause'}
              onPress={phase === 'paused' ? resume : pause}
              testID="toggle-focus-pause"
            />
            <Button
              label="Back one"
              onPress={backOneChunk}
              disabled={chunkIndex === 0}
              testID="focus-back"
              variant="secondary"
            />
            <Button
              label="−25 WPM"
              onPress={() => changePace(-GUIDE_STEP_WPM)}
              disabled={guideWpm <= MIN_GUIDE_WPM}
              testID="focus-slower"
              variant="secondary"
            />
            <Button
              label="+25 WPM"
              onPress={() => changePace(GUIDE_STEP_WPM)}
              disabled={guideWpm >= MAX_GUIDE_WPM}
              testID="focus-faster"
              variant="secondary"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={finishEarly}
            style={({ pressed }) => [
              styles.finishButton,
              pressed && styles.pressed,
            ]}
            testID="finish-focus-early"
          >
            <Text style={styles.finishButtonText}>Finish safely</Text>
          </Pressable>
          <Text style={styles.sessionMeta}>
            {sessionArticle?.title} · paused {pauseCount} · back {backCount}
          </Text>
        </ScrollView>
      )}

      {phase === 'question' && currentQuestion && (
        <ScrollView
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator
          testID="focus-question"
        >
          <Text style={styles.eyebrow}>
            MEANING CHECK {questionIndex + 1} OF{' '}
            {sessionArticle?.comprehensionQuestions.length}
          </Text>
          <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
          <Text style={styles.questionHint}>
            Reading time has stopped. Choose from what you understood.
          </Text>
          <View style={styles.options}>
            {currentQuestion.options.map((option, optionIndex) => (
              <Pressable
                accessibilityRole="button"
                key={option}
                onPress={() => answerQuestion(optionIndex)}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.pressed,
                ]}
                testID={`focus-option-${optionIndex}`}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {phase === 'feedback' && currentQuestion && (
        <ScrollView
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator
          testID="focus-feedback"
        >
          <View
            style={[
              styles.feedbackBadge,
              feedbackCorrect
                ? styles.feedbackBadgeCorrect
                : styles.feedbackBadgeIncorrect,
            ]}
          >
            <Text
              style={[
                styles.feedbackLabel,
                feedbackCorrect
                  ? styles.feedbackLabelCorrect
                  : styles.feedbackLabelIncorrect,
              ]}
            >
              {feedbackCorrect ? 'Correct' : 'Review the answer'}
            </Text>
          </View>
          <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
          {!feedbackCorrect && selectedOption !== null && (
            <Text style={styles.reviewText}>
              Your answer: {currentQuestion.options[selectedOption]}
            </Text>
          )}
          <Text style={styles.correctAnswerLabel}>Passage answer</Text>
          <Text style={styles.correctAnswer}>
            {currentQuestion.options[currentQuestion.correctIndex]}
          </Text>
          <Button
            label={
              questionIndex + 1 >=
              (sessionArticle?.comprehensionQuestions.length ?? 0)
                ? 'See results'
                : 'Next question'
            }
            onPress={continueAfterFeedback}
            testID="continue-focus-feedback"
          />
        </ScrollView>
      )}

      {phase === 'ended' && (
        <View style={styles.endCard} testID="end">
          <Text style={styles.completeMark}>✓</Text>
          <Text style={styles.endTitle}>Focus Lane complete</Text>
          <Text style={styles.endScore}>
            {questionsAnsweredRef.current > 0
              ? `${questionsCorrectRef.current}/${questionsAnsweredRef.current} understood`
              : 'Session ended safely'}
          </Text>
          <Text style={styles.endDetail}>
            {guideWpm} WPM guide · {configuredChunkWords}{' '}
            {configuredChunkWords === 1 ? 'word' : 'words'} per center chunk
          </Text>
          <Text style={styles.endNote}>
            This result keeps comprehension separate from the configured guide
            pace. Check transfer with a normal connected passage.
          </Text>
          <Button
            label="Read another passage"
            onPress={playAgain}
            testID="play-again"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  header: { alignItems: 'center', paddingBottom: spacing.sm },
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
    maxWidth: 540,
    textAlign: 'center',
  },
  idleDemo: {
    width: '100%',
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    backgroundColor: colors.background,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  demoLane: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  demoNeighbor: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    opacity: 0.48,
    textAlign: 'center',
  },
  demoCurrent: {
    flex: 1.35,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  safetyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  activeContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stat: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceTonal,
    padding: spacing.sm,
  },
  statValue: { color: colors.primaryDark, fontSize: 17, fontWeight: '800' },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundDark,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryLight,
  },
  laneCard: {
    minHeight: 210,
    justifyContent: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: spacing.lg,
    ...shadows.medium,
  },
  guideRow: { height: 24, alignItems: 'center', justifyContent: 'center' },
  guideTick: {
    width: 3,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryLight,
  },
  laneRow: {
    width: '100%',
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
  },
  neighborSlot: {
    flex: 0.35,
    minWidth: 0,
    paddingHorizontal: 3,
  },
  currentSlot: {
    flex: 4,
    minWidth: 0,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.secondaryLight,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    paddingHorizontal: 4,
  },
  neighborText: { textAlign: 'center' },
  currentText: { fontWeight: '800', textAlign: 'center' },
  pausedPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.infoSurface,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pausedText: {
    color: colors.infoForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  contextHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginVertical: spacing.sm,
    textAlign: 'center',
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  finishButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  finishButtonText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  sessionMeta: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  questionContent: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  questionTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 29,
  },
  questionHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  options: { gap: spacing.sm, marginTop: spacing.lg },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  optionText: { color: colors.textPrimary, fontSize: 15, lineHeight: 21 },
  feedbackBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  feedbackBadgeCorrect: { backgroundColor: colors.successSurface },
  feedbackBadgeIncorrect: { backgroundColor: colors.errorSurface },
  feedbackLabel: { fontSize: 12, fontWeight: '800' },
  feedbackLabelCorrect: { color: colors.successForeground },
  feedbackLabelIncorrect: { color: colors.errorForeground },
  reviewText: {
    color: colors.errorForeground,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  correctAnswerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
  },
  correctAnswer: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: spacing.lg,
    marginTop: 5,
  },
  endCard: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    backgroundColor: colors.cardBackground,
    padding: spacing.lg,
    ...shadows.medium,
  },
  completeMark: { color: colors.success, fontSize: 38, fontWeight: '900' },
  endTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  endScore: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  endDetail: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  endNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
