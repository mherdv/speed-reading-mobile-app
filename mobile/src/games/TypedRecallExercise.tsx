import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GAME_DESCRIPTIONS } from '../data/gameDescriptions';
import {
  createPersistentVariedDeckState,
  takeNextPersistentVariedItem,
  type RandomSource,
} from '../data/flashPracticeContent';
import type { GameId } from '../data/gameIds';
import { normalizeRecallAnswer } from '../data/recallContent';
import { updateProgress } from '../data/progressStore';
import { colors } from '../theme/colors';
import { BriefStimulus } from '../ui/BriefStimulus';
import { FlashChallengeStatus } from '../ui/FlashChallengeStatus';
import { SimpleIdlePanel } from '../ui/SimpleIdlePanel';
import { StatsRow } from '../ui/StatsRow';
import { useAutoStart, useTrackedTimeouts, type Difficulty } from './gameHooks';
import {
  exposureMsForFlashChallengeLevel,
  getProgressiveFlashContent,
} from './flashChallenge';
import { getRecallFeedbackDurationMs } from './recallFeedback';
import { useFlashChallenge } from './useFlashChallenge';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  gameId: Extract<GameId, 'WordsRecall' | 'SentenceRecall'>;
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  prompts: readonly string[];
  displayMs: number;
  fixedDisplayMs?: boolean;
  masteryEligible?: boolean;
  totalRounds: number;
  difficulty: Difficulty;
  autoStart?: boolean;
  twoWordLayout?: boolean;
  random?: RandomSource;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'display' | 'recall' | 'feedback' | 'ended';
const CORRECT_ANSWERS_TO_ADVANCE = 3;
const MISSES_TO_ROLL_BACK = 3;

export function getTypedRecallExposureMs(
  baseDisplayMs: number,
  challengeLevel: number,
  minimumDisplayMs: number,
  fixedDisplayMs = false
): number {
  if (fixedDisplayMs) return Math.max(1, Math.round(baseDisplayMs));
  return exposureMsForFlashChallengeLevel(
    baseDisplayMs,
    challengeLevel,
    minimumDisplayMs
  );
}

export function TypedRecallExercise({
  gameId,
  title,
  subtitle,
  inputPlaceholder,
  prompts,
  displayMs,
  fixedDisplayMs = false,
  masteryEligible = true,
  totalRounds,
  difficulty,
  autoStart = false,
  twoWordLayout = false,
  random = Math.random,
  onReportResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [prompt, setPrompt] = useState('');
  const [input, setInput] = useState('');
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [currentDisplayMs, setCurrentDisplayMs] = useState(displayMs);
  const flashChallenge = useFlashChallenge(
    gameId,
    difficulty,
    CORRECT_ANSWERS_TO_ADVANCE,
    MISSES_TO_ROLL_BACK,
    { masteryEligible }
  );

  const startedAtRef = useRef(0);
  const roundRef = useRef(0);
  const correctRef = useRef(0);
  const promptRef = useRef('');
  const deckStatesRef = useRef(
    new Map<number, ReturnType<typeof createPersistentVariedDeckState>>()
  );
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const initialChallengeLevelRef = useRef(1);
  const maxChallengeLevelRef = useRef(1);
  const initialDisplayMsRef = useRef(0);
  const finalDisplayMsRef = useRef(0);
  const minimumDisplayMsRef = useRef(Number.POSITIVE_INFINITY);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(
    () => () => {
      cancelledRef.current = true;
      clearTrackedTimeouts();
    },
    // Cleanup belongs to component unmount, not helper identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function takePrompt(challengeLevel: number): string {
    const progressivePrompts = getProgressiveFlashContent(
      prompts,
      challengeLevel,
      6
    );
    let deckState = deckStatesRef.current.get(challengeLevel);
    if (!deckState) {
      deckState = createPersistentVariedDeckState();
      deckState.previous = promptRef.current;
      deckStatesRef.current.set(challengeLevel, deckState);
    }
    return (
      takeNextPersistentVariedItem(
        deckState,
        progressivePrompts,
        random
      ) ??
      progressivePrompts[0] ??
      (twoWordLayout
        ? 'quiet focus'
        : 'Quiet readers notice the central idea.')
    );
  }

  function showRound() {
    const challengeLevel = flashChallenge.getCurrentLevel();
    const roundDisplayMs = getTypedRecallExposureMs(
      displayMs,
      challengeLevel,
      twoWordLayout ? 350 : 550,
      fixedDisplayMs
    );
    const next = takePrompt(challengeLevel);
    promptRef.current = next;
    setPrompt(next);
    setInput('');
    setFeedback(null);
    setCurrentDisplayMs(roundDisplayMs);
    if (initialDisplayMsRef.current === 0) {
      initialDisplayMsRef.current = roundDisplayMs;
    }
    finalDisplayMsRef.current = roundDisplayMs;
    minimumDisplayMsRef.current = Math.min(
      minimumDisplayMsRef.current,
      roundDisplayMs
    );
    setPhase('display');
    scheduleTimeout(() => {
      if (!cancelledRef.current) setPhase('recall');
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
    roundRef.current = 0;
    correctRef.current = 0;
    const initialChallengeLevel = flashChallenge.beginSession();
    initialChallengeLevelRef.current = initialChallengeLevel;
    maxChallengeLevelRef.current = initialChallengeLevel;
    initialDisplayMsRef.current = 0;
    finalDisplayMsRef.current = 0;
    minimumDisplayMsRef.current = Number.POSITIVE_INFINITY;
    setRound(0);
    setCorrect(0);
    startedAtRef.current = Date.now();
    showRound();
  }

  useAutoStart(autoStart, phase, flashChallenge.loaded, start);

  function finish() {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const now = Date.now();
    const accuracy =
      roundRef.current > 0 ? correctRef.current / roundRef.current : 0;
    setPhase('ended');
    void updateProgress(gameId, accuracy >= 0.7, correctRef.current).catch(
      () => undefined
    );
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs: Math.max(0, now - startedAtRef.current),
      score: correctRef.current,
      accuracy,
      details: {
        activityType:
          gameId === 'WordsRecall' ? 'two-word-recall' : 'sentence-recall',
        correct: correctRef.current,
        rounds: roundRef.current,
        baseDisplayMs: displayMs,
        displayMs: finalDisplayMsRef.current,
        initialDisplayMs: initialDisplayMsRef.current,
        finalDisplayMs: finalDisplayMsRef.current,
        minimumDisplayMs:
          minimumDisplayMsRef.current === Number.POSITIVE_INFINITY
            ? displayMs
            : minimumDisplayMsRef.current,
        fixedDisplayMs,
        difficulty,
        promptPoolSize: prompts.length,
        comparisonNormalization: 'case-whitespace-punctuation-insensitive',
        wordCountPerPrompt: twoWordLayout ? 2 : null,
        initialChallengeLevel: initialChallengeLevelRef.current,
        finalChallengeLevel: flashChallenge.getCurrentLevel(),
        highestChallengeLevel: maxChallengeLevelRef.current,
        savedBestChallengeLevel: flashChallenge.getHighestLevel(),
      },
    });
  }

  function submit() {
    if (phase !== 'recall') return;
    const isCorrect =
      normalizeRecallAnswer(input) === normalizeRecallAnswer(promptRef.current);
    roundRef.current += 1;
    setRound(roundRef.current);
    if (isCorrect) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    const challengeOutcome = flashChallenge.recordOutcome(isCorrect);
    maxChallengeLevelRef.current = Math.max(
      maxChallengeLevelRef.current,
      challengeOutcome.state.level
    );
    setPhase('feedback');
    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      if (roundRef.current >= totalRounds) finish();
      else showRound();
    }, getRecallFeedbackDurationMs(promptRef.current, isCorrect));
  }

  const displayedWords = twoWordLayout ? prompt.split(/\s+/).slice(0, 2) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[gameId]}
          onStart={start}
          startDisabled={!flashChallenge.loaded}
          containerStyle={styles.idle}
          buttonStyle={styles.primaryButton}
          buttonTextStyle={styles.primaryButtonText}
        >
          <FlashChallengeStatus
            level={flashChallenge.resumeLevel}
            highestLevel={flashChallenge.highestLevel}
          />
        </SimpleIdlePanel>
      )}

      {phase !== 'idle' && phase !== 'ended' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={12}
          style={styles.keyboardArea}
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.gameArea}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            style={styles.gameScroll}
            testID="typed-recall-scroll"
          >
            <FlashChallengeStatus
              compact
              level={flashChallenge.level}
              highestLevel={flashChallenge.highestLevel}
            />
            <StatsRow
              items={[
                { key: 'round', value: `${Math.min(round + 1, totalRounds)}/${totalRounds}`, label: 'Round' },
                { key: 'correct', value: correct, label: 'Correct' },
                {
                  key: 'display',
                  value: `${(currentDisplayMs / 1000).toFixed(2)}s`,
                  label: 'Display',
                },
              ]}
            />

            {phase === 'display' && (
              <View testID="recall-display" style={styles.promptCard}>
                <BriefStimulus
                  value={prompt}
                  difficulty={difficulty}
                  testID={
                    twoWordLayout ? 'recall-prompt' : 'recall-sentence'
                  }
                  color={
                    twoWordLayout
                      ? colors.interactivePrimary
                      : colors.textPrimary
                  }
                  backgroundColor={colors.background}
                  maxFontSize={twoWordLayout ? 34 : 24}
                  minFontSize={12}
                  allowWrap
                  maxLines={twoWordLayout ? 2 : 3}
                  style={twoWordLayout ? undefined : styles.sentence}
                  maskFraction={flashChallenge.profile.maskFraction}
                >
                  {twoWordLayout ? (
                    <>
                      <Text testID="recall-word-0">{displayedWords[0]}</Text>
                      {' '}
                      <Text testID="recall-word-1">{displayedWords[1]}</Text>
                    </>
                  ) : (
                    prompt
                  )}
                </BriefStimulus>
              </View>
            )}

            {(phase === 'recall' || phase === 'feedback') && (
              <View
                testID="recall-entry"
                style={[
                  styles.entryCard,
                  feedback === 'correct' && styles.correctCard,
                  feedback === 'wrong' && styles.wrongCard,
                ]}
              >
                <Text style={styles.entryLabel}>Type exactly what you remember</Text>
                <TextInput
                  testID="recall-input"
                  value={input}
                  onChangeText={setInput}
                  editable={phase === 'recall'}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  autoFocus
                  multiline={!twoWordLayout}
                  placeholder={inputPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={twoWordLayout ? submit : undefined}
                  style={[styles.input, !twoWordLayout && styles.multilineInput]}
                />
                {phase === 'recall' && (
                  <Pressable
                    accessibilityRole="button"
                    testID="submit-recall"
                    onPress={submit}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Check recall</Text>
                  </Pressable>
                )}
                {phase === 'feedback' && (
                  <View
                    accessibilityLiveRegion="polite"
                    testID="recall-feedback"
                    style={styles.feedbackReview}
                  >
                    {feedback === 'correct' ? (
                      <Text style={styles.correctText}>Correct</Text>
                    ) : (
                      <>
                        <Text style={styles.wrongText}>Review this answer</Text>
                        <Text style={styles.answerLabel}>Correct answer</Text>
                        <Text
                          testID="recall-correct-answer"
                          style={styles.correctAnswer}
                        >
                          {promptRef.current}
                        </Text>
                        <Text style={styles.reviewHint}>
                          Compare it with what you typed above before the next round.
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>Recall complete</Text>
          <Text style={styles.endScore}>{correct}/{round}</Text>
          <Text style={styles.endMeta}>
            {round > 0 ? Math.round((correct / round) * 100) : 0}% accuracy
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            onPress={start}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 2 },
  idle: { flex: 1 },
  keyboardArea: { flex: 1 },
  gameScroll: { flex: 1 },
  gameArea: {
    flexGrow: 1,
    gap: 14,
    paddingBottom: 24,
    paddingTop: 14,
  },
  promptCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 0,
    flexGrow: 1,
    justifyContent: 'center',
    margin: 0,
    minHeight: 180,
    padding: 0,
  },
  sentence: {
    fontWeight: '700',
  },
  entryCard: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  correctCard: { backgroundColor: colors.successSurface, borderColor: colors.successForeground },
  wrongCard: { backgroundColor: colors.errorSurface, borderColor: colors.errorForeground },
  entryLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 17,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    userSelect: 'text',
  },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: colors.onInteractive, fontSize: 16, fontWeight: '700' },
  correctText: { color: colors.successForeground, fontSize: 15, fontWeight: '700' },
  wrongText: { color: colors.errorForeground, fontSize: 14, fontWeight: '600' },
  feedbackReview: { gap: 6 },
  answerLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  correctAnswer: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 25,
  },
  reviewHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  endCard: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  endTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  endScore: { color: colors.interactivePrimary, fontSize: 40, fontWeight: '800' },
  endMeta: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
});
