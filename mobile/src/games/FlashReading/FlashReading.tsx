import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  createPersistentVariedDeckState,
  getFlashWordPool,
  takeNextPersistentVariedItem,
  uniqueStrings,
  type RandomSource,
} from '../../data/flashPracticeContent';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { colors } from '../../theme/colors';
import { BriefStimulus } from '../../ui/BriefStimulus';
import { FlashPaceControl } from '../../ui/FlashPaceControl';
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
import { getRecallFeedbackDurationMs } from '../recallFeedback';

const GAME_ID = 'FlashReading';
const CORRECT_ANSWERS_TO_INCREASE = 4;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

export type { Difficulty };

type Props = {
  words?: string[];
  displayMs?: number;
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: RandomSource;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'flash' | 'recall' | 'feedback' | 'ended';
type FinishReason = 'three-misses' | 'manual' | 'round-limit';

function getConfig(
  difficulty: Difficulty
): FlashPaceBounds & { baseWpm: number } {
  switch (difficulty) {
    case 'easy':
      return {
        baseWpm: 120,
        minWpm: 80,
        maxWpm: RAPID_FLASH_MAX_WPM,
      };
    case 'medium':
      return {
        baseWpm: 220,
        minWpm: 140,
        maxWpm: RAPID_FLASH_MAX_WPM,
      };
    case 'hard':
      return {
        baseWpm: 320,
        minWpm: 220,
        maxWpm: RAPID_FLASH_MAX_WPM,
      };
  }
}

export default function FlashReading({
  words: wordsProp,
  displayMs: displayMsProp,
  totalRounds,
  difficulty = 'easy',
  autoStart = false,
  random = Math.random,
  onReportResult,
}: Props) {
  const config = getConfig(difficulty);
  const wordPool = useMemo(() => {
    const customPool = uniqueStrings(wordsProp ?? []);
    return customPool.length > 0
      ? customPool
      : getFlashWordPool(difficulty);
  }, [difficulty, wordsProp]);
  const defaultWpm =
    displayMsProp == null
      ? config.baseWpm
      : wpmForDisplayDuration(displayMsProp);
  const [phase, setPhase] = useState<Phase>('idle');
  const [startingWpm, setStartingWpm] = useState(defaultWpm);
  const [liveWpm, setLiveWpm] = useState(defaultWpm);
  const [current, setCurrent] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [missStreak, setMissStreak] = useState(0);
  const [finishReason, setFinishReason] =
    useState<FinishReason>('three-misses');

  const startRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const correctRef = useRef(0);
  const currentRef = useRef('');
  const deckStateRef = useRef(createPersistentVariedDeckState());
  const paceRef = useRef<FlashPaceState>(
    createFlashPaceState(defaultWpm)
  );
  const initialWpmRef = useRef(defaultWpm);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(() => {
    const nextConfig = getConfig(difficulty);
    const nextWpm =
      displayMsProp == null
        ? nextConfig.baseWpm
        : wpmForDisplayDuration(displayMsProp);
    setStartingWpm(nextWpm);
    setLiveWpm(nextWpm);
  }, [difficulty, displayMsProp]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function takeNextWord() {
    return (
      takeNextPersistentVariedItem(
        deckStateRef.current,
        wordPool,
        random
      ) ??
      wordPool[0] ??
      'focus'
    );
  }

  function showRound() {
    const word = takeNextWord();
    currentRef.current = word;
    setCurrent(word);
    setInput('');
    setFeedback(null);
    setPhase('flash');
    scheduleTimeout(
      () => {
        if (!cancelledRef.current) setPhase('recall');
      },
      displayMsProp ?? displayDurationForWpm(paceRef.current.wpm)
    );
  }

  function start() {
    if (phase !== 'idle' && phase !== 'ended') return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    scoreRef.current = 0;
    roundRef.current = 0;
    correctRef.current = 0;
    initialWpmRef.current = startingWpm;
    paceRef.current = createFlashPaceState(startingWpm);
    setScore(0);
    setRound(0);
    setCorrectStreak(0);
    setMissStreak(0);
    setLiveWpm(startingWpm);
    startRef.current = Date.now();
    showRound();
  }

  useAutoStart(autoStart, phase, true, start);

  function submit() {
    if (phase !== 'recall') return;
    const correct =
      input.toLocaleLowerCase().trim() ===
      currentRef.current.toLocaleLowerCase();

    if (correct) {
      scoreRef.current += 20;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    paceRef.current = updateFlashPace(paceRef.current, correct, {
      ...config,
      step: displayMsProp == null ? config.step : 0,
      correctAnswersToIncrease: CORRECT_ANSWERS_TO_INCREASE,
      missesToDecrease: null,
    });
    setLiveWpm(paceRef.current.wpm);
    setCorrectStreak(paceRef.current.correctStreak);
    setMissStreak(paceRef.current.missStreak);

    setPhase('feedback');
    scheduleTimeout(() => {
      if (cancelledRef.current) return;
      roundRef.current += 1;
      setRound(roundRef.current);
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
        showRound();
      }
    }, getRecallFeedbackDurationMs(currentRef.current, correct));
  }

  function finish(reason: FinishReason) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const attempts = roundRef.current;
    const accuracy = attempts > 0 ? correctRef.current / attempts : 0;
    setFinishReason(reason);
    setPhase('ended');
    void updateProgress(
      GAME_ID,
      accuracy >= 0.7,
      scoreRef.current
    ).catch(() => undefined);
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
        initialWpm: initialWpmRef.current,
        finalWpm: paceRef.current.wpm,
        paceChanges: paceRef.current.changes,
        adaptivePacing: displayMsProp == null,
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
        <Text style={styles.title}>Flash Recall</Text>
        <Text style={styles.subtitle}>Type the briefly shown word</Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          containerStyle={styles.idleContent}
        >
          <Text style={styles.sessionHint}>
            +25 WPM after {CORRECT_ANSWERS_TO_INCREASE} correct · 3 misses end
          </Text>
          <Text style={styles.maskHint}>
            Easy is clear · Medium hides the lower edge · Hard hides more
          </Text>
          <FlashPaceControl
            wpm={startingWpm}
            minWpm={config.minWpm}
            maxWpm={config.maxWpm}
            disabled={displayMsProp != null}
            correctAnswersToIncrease={CORRECT_ANSWERS_TO_INCREASE}
            onChange={setStartingWpm}
          />
        </SimpleIdlePanel>
      )}

      {phase === 'flash' && (
        <View style={styles.gameArea}>
          {stats}
          <View style={styles.flashCard}>
            <BriefStimulus
              value={current}
              difficulty={difficulty}
              testID="flash-word"
              color={colors.warningForeground}
              backgroundColor={colors.background}
              maxFontSize={44}
              minFontSize={14}
            />
          </View>
        </View>
      )}

      {(phase === 'recall' || phase === 'feedback') && (
        <View style={styles.gameArea}>
          {stats}
          <View
            style={[
              styles.inputCard,
              feedback === 'correct' && styles.correctCard,
              feedback === 'wrong' && styles.wrongCard,
            ]}
          >
            <TextInput
              testID="recall-input"
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type the word"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              editable={phase === 'recall'}
              onSubmitEditing={submit}
            />
            {feedback === 'correct' && (
              <Text
                accessibilityLiveRegion="polite"
                testID="flash-recall-feedback"
                style={styles.correctText}
              >
                Correct
              </Text>
            )}
            {feedback === 'wrong' && (
              <View
                accessibilityLiveRegion="polite"
                testID="flash-recall-feedback"
                style={styles.feedbackReview}
              >
                <Text style={styles.wrongText}>Review this word</Text>
                <Text style={styles.answerLabel}>Correct word</Text>
                <Text
                  testID="flash-correct-answer"
                  style={styles.correctAnswer}
                >
                  {current}
                </Text>
                <Text style={styles.reviewHint}>
                  Compare it with what you typed above.
                </Text>
              </View>
            )}
          </View>
          {phase === 'recall' && (
            <>
              <Pressable
                accessibilityRole="button"
                testID="submit-btn"
                style={styles.submitButton}
                onPress={submit}
              >
                <Text style={styles.submitButtonText}>Check answer</Text>
              </Pressable>
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
            </>
          )}
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>⚡</Text>
          <Text style={styles.endTitle}>
            {finishReason === 'three-misses'
              ? 'Three misses — session complete'
              : 'Set complete'}
          </Text>
          <Text style={styles.endScore}>{scoreRef.current}</Text>
          <Text style={styles.endMeta}>
            {correctRef.current}/{roundRef.current} correct
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
  sessionHint: {
    color: colors.warningForeground,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  maskHint: {
    color: colors.warningForeground,
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
    backgroundColor: colors.warningSurface,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.warningForeground },
  statLabel: { fontSize: 10, color: colors.textSecondary },
  flashCard: {
    minHeight: 190,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 0,
    justifyContent: 'center',
    margin: 0,
    padding: 0,
  },
  inputCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  correctCard: {
    backgroundColor: colors.successSurface,
    borderColor: colors.success,
  },
  wrongCard: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.error,
  },
  input: {
    minHeight: 52,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    userSelect: 'text',
  },
  correctText: {
    color: colors.successForeground,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  wrongText: {
    color: colors.errorForeground,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  feedbackReview: {
    alignItems: 'center',
    gap: 5,
  },
  answerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  correctAnswer: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  reviewHint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  submitButton: {
    minHeight: 50,
    backgroundColor: colors.interactiveWarm,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitButtonText: {
    color: colors.onInteractive,
    fontSize: 15,
    fontWeight: '700',
  },
  finishButton: {
    minHeight: 48,
    marginTop: 10,
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
  endEmoji: { fontSize: 38, marginBottom: 8 },
  endTitle: { fontSize: 21, fontWeight: '800', color: colors.textPrimary },
  endScore: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.warningForeground,
    marginVertical: 8,
  },
  endMeta: { fontSize: 14, color: colors.textSecondary },
  endPace: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warningForeground,
    marginTop: 7,
  },
  playAgainButton: {
    minHeight: 48,
    marginTop: 18,
    backgroundColor: colors.interactiveWarm,
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
