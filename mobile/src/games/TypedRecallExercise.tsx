import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../data/gameDescriptions';
import { createVariedSequence } from '../data/flashPracticeContent';
import type { GameId } from '../data/gameIds';
import { normalizeRecallAnswer } from '../data/recallContent';
import { updateProgress } from '../data/progressStore';
import { colors } from '../theme/colors';
import { SimpleIdlePanel } from '../ui/SimpleIdlePanel';
import { StatsRow } from '../ui/StatsRow';
import { useAutoStart, useTrackedTimeouts, type Difficulty } from './gameHooks';
import { getRecallFeedbackDurationMs } from './recallFeedback';

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
  totalRounds: number;
  difficulty: Difficulty;
  autoStart?: boolean;
  twoWordLayout?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'display' | 'recall' | 'feedback' | 'ended';

export function TypedRecallExercise({
  gameId,
  title,
  subtitle,
  inputPlaceholder,
  prompts,
  displayMs,
  totalRounds,
  difficulty,
  autoStart = false,
  twoWordLayout = false,
  onReportResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [prompt, setPrompt] = useState('');
  const [input, setInput] = useState('');
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startedAtRef = useRef(0);
  const roundRef = useRef(0);
  const correctRef = useRef(0);
  const promptRef = useRef('');
  const deckRef = useRef<string[]>([]);
  const deckIndexRef = useRef(0);
  const previousPromptRef = useRef('');
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
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

  function takePrompt(): string {
    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = createVariedSequence(
        prompts,
        Math.max(totalRounds, prompts.length),
        previousPromptRef.current
      );
      deckIndexRef.current = 0;
    }
    const next =
      deckRef.current[deckIndexRef.current] ??
      prompts[0] ??
      (twoWordLayout ? 'quiet focus' : 'Quiet readers notice the central idea.');
    deckIndexRef.current += 1;
    previousPromptRef.current = next;
    return next;
  }

  function showRound() {
    const next = takePrompt();
    promptRef.current = next;
    setPrompt(next);
    setInput('');
    setFeedback(null);
    setPhase('display');
    scheduleTimeout(() => {
      if (!cancelledRef.current) setPhase('recall');
    }, displayMs);
  }

  function start() {
    if (phase !== 'idle' && phase !== 'ended') return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    roundRef.current = 0;
    correctRef.current = 0;
    deckRef.current = createVariedSequence(
      prompts,
      Math.max(totalRounds, prompts.length),
      previousPromptRef.current
    );
    deckIndexRef.current = 0;
    setRound(0);
    setCorrect(0);
    startedAtRef.current = Date.now();
    showRound();
  }

  useAutoStart(autoStart, phase, true, start);

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
        displayMs,
        difficulty,
        promptPoolSize: prompts.length,
        comparisonNormalization: 'case-whitespace-punctuation-insensitive',
        wordCountPerPrompt: twoWordLayout ? 2 : null,
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
          containerStyle={styles.idle}
          buttonStyle={styles.primaryButton}
          buttonTextStyle={styles.primaryButtonText}
        />
      )}

      {phase !== 'idle' && phase !== 'ended' && (
        <View style={styles.gameArea}>
          <StatsRow
            items={[
              { key: 'round', value: `${Math.min(round + 1, totalRounds)}/${totalRounds}`, label: 'Round' },
              { key: 'correct', value: correct, label: 'Correct' },
              { key: 'display', value: `${displayMs / 1000}s`, label: 'Display' },
            ]}
          />

          {phase === 'display' && (
            <View testID="recall-display" style={styles.promptCard}>
              {twoWordLayout ? (
                <View style={styles.wordPair}>
                  <Text testID="recall-word-0" style={styles.word}>{displayedWords[0]}</Text>
                  <Text testID="recall-word-1" style={styles.word}>{displayedWords[1]}</Text>
                </View>
              ) : (
                <Text testID="recall-sentence" style={styles.sentence}>
                  {prompt}
                </Text>
              )}
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
                        selectable
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
        </View>
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
  gameArea: { flex: 1, gap: 14, paddingTop: 14 },
  promptCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 180,
    padding: 24,
  },
  wordPair: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'center' },
  word: { color: colors.interactivePrimary, fontSize: 34, fontWeight: '800' },
  sentence: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
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
