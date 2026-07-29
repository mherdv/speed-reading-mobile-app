import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  createRecognitionOptions,
  createVariedSequence,
  getFlashWordPool,
} from '../../data/flashPracticeContent';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { levelToStars, updateProgress } from '../../data/progressStore';
import { colors } from '../../theme/colors';
import { ChoiceAnswerFeedback } from '../../ui/ChoiceAnswerFeedback';
import { FlashPaceControl } from '../../ui/FlashPaceControl';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import {
  useAutoStart,
  useGameProgress,
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

const GAME_ID = 'TimedWordRecognition';
const CORRECT_ANSWERS_TO_INCREASE = 8;

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
  displayMs?: number;
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'show' | 'choose' | 'feedback' | 'ended';
type FinishReason = 'three-misses' | 'manual' | 'round-limit';
type AnswerReview = { selectedAnswer: string; correct: boolean } | null;

function getPaceConfig(difficulty: Difficulty): FlashPaceBounds & {
  baseWpm: number;
} {
  switch (difficulty) {
    case 'easy':
      return { baseWpm: 120, minWpm: 80, maxWpm: RAPID_FLASH_MAX_WPM };
    case 'medium':
      return { baseWpm: 220, minWpm: 140, maxWpm: RAPID_FLASH_MAX_WPM };
    case 'hard':
      return { baseWpm: 320, minWpm: 220, maxWpm: RAPID_FLASH_MAX_WPM };
  }
}

export default function TimedWordRecognition({
  words: wordsProp,
  displayMs: displayMsProp,
  totalRounds,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const paceConfig = getPaceConfig(selectedDifficulty);
  const defaultWpm =
    displayMsProp == null
      ? paceConfig.baseWpm
      : wpmForDisplayDuration(displayMsProp);
  const [startingWpm, setStartingWpm] = useState(defaultWpm);
  const [liveWpm, setLiveWpm] = useState(defaultWpm);
  const [round, setRound] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
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
  const wordRef = useRef('');
  const previousWordRef = useRef('');
  const deckRef = useRef<string[]>([]);
  const deckIndexRef = useRef(0);
  const paceRef = useRef<FlashPaceState>(
    createFlashPaceState(defaultWpm)
  );
  const initialWpmRef = useRef(defaultWpm);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  const wordPool =
    wordsProp && wordsProp.length > 0
      ? wordsProp
      : getFlashWordPool(selectedDifficulty);

  useEffect(() => {
    const nextConfig = getPaceConfig(selectedDifficulty);
    const nextWpm =
      displayMsProp == null
        ? nextConfig.baseWpm
        : wpmForDisplayDuration(displayMsProp);
    setStartingWpm(nextWpm);
    setLiveWpm(nextWpm);
  }, [displayMsProp, selectedDifficulty]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function takeNextWord() {
    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = createVariedSequence(
        wordPool,
        Math.max(32, wordPool.length),
        previousWordRef.current
      );
      deckIndexRef.current = 0;
    }
    const word =
      deckRef.current[deckIndexRef.current] ?? wordPool[0] ?? 'focus';
    deckIndexRef.current += 1;
    return word;
  }

  function showRound() {
    const word = takeNextWord();
    wordRef.current = word;
    previousWordRef.current = word;
    setCurrentWord(word);
    setOptions(createRecognitionOptions(word, wordPool));
    setAnswerReview(null);
    setPhase('show');
    scheduleTimeout(
      () => {
        if (!cancelledRef.current) setPhase('choose');
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
    correctRef.current = 0;
    roundRef.current = 0;
    initialWpmRef.current = startingWpm;
    paceRef.current = createFlashPaceState(startingWpm);
    deckRef.current = createVariedSequence(
      wordPool,
      Math.max(32, wordPool.length),
      previousWordRef.current
    );
    deckIndexRef.current = 0;
    setRound(0);
    setScore(0);
    setCorrectStreak(0);
    setMissStreak(0);
    setAnswerReview(null);
    setLiveWpm(startingWpm);
    startRef.current = Date.now();
    showRound();
  }

  useAutoStart(autoStart, phase, progressLoaded, start);

  function choose(index: number) {
    if (phase !== 'choose') return;
    const selectedAnswer = options[index] ?? '';
    const correct = selectedAnswer === wordRef.current;

    if (correct) {
      scoreRef.current += 10;
      correctRef.current += 1;
      setScore(scoreRef.current);
    }

    paceRef.current = updateFlashPace(paceRef.current, correct, {
      ...paceConfig,
      step: displayMsProp == null ? paceConfig.step : 0,
      correctAnswersToIncrease: CORRECT_ANSWERS_TO_INCREASE,
      missesToDecrease: null,
    });
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
        showRound();
      }
    }, getRecallFeedbackDurationMs(wordRef.current, correct));
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
    void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current)
      .then(({ progress }) => setGameProgress(progress))
      .catch(() => undefined);
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
        difficulty: selectedDifficulty,
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
          containerStyle: [styles.statBox, styles.roundBox],
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
        <Text style={styles.title}>Word Flash</Text>
        <Text style={styles.subtitle}>Remember the word, then select it</Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          containerStyle={styles.idleContent}
        >
          <Text style={styles.sessionHint}>
            +25 WPM after {CORRECT_ANSWERS_TO_INCREASE} correct · 3 misses end
          </Text>
          <FlashPaceControl
            wpm={startingWpm}
            minWpm={paceConfig.minWpm}
            maxWpm={paceConfig.maxWpm}
            disabled={displayMsProp != null}
            correctAnswersToIncrease={CORRECT_ANSWERS_TO_INCREASE}
            onChange={setStartingWpm}
          />
        </GameIdlePanel>
      )}

      {phase === 'show' && (
        <View style={styles.gameArea}>
          {stats}
          <View testID="word-flash" style={styles.wordCard}>
            <Text testID="word" style={styles.word}>
              {currentWord}
            </Text>
          </View>
          <Text style={styles.instruction}>Read and remember this word</Text>
        </View>
      )}

      {phase === 'choose' && (
        <View style={styles.gameArea}>
          {stats}
          <Text style={styles.chooseTitle}>Which word did you see?</Text>
          <View testID="options-container" style={styles.optionsContainer}>
            {options.map((option, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={option}
                key={`${option}-${index}`}
                testID={`option-${index}`}
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
            correctAnswer={wordRef.current}
            answerLabel="Correct word"
            testID="word-choice-feedback"
          />
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
    color: colors.infoForeground,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
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
  roundBox: { backgroundColor: colors.infoSurface },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.primaryDark },
  statLabel: { fontSize: 10, color: colors.textSecondary },
  wordCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    borderWidth: 1,
    borderColor: colors.border,
  },
  word: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  instruction: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 12,
  },
  chooseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsContainer: { gap: 10 },
  optionButton: {
    minHeight: 52,
    backgroundColor: colors.cardBackground,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPressed: {
    backgroundColor: colors.surfaceTonal,
    borderColor: colors.primaryLight,
  },
  optionText: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
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
  endEmoji: { fontSize: 38, marginBottom: 8 },
  endTitle: { fontSize: 21, fontWeight: '800', color: colors.textPrimary },
  endScore: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primaryDark,
    marginVertical: 8,
  },
  endMeta: { fontSize: 14, color: colors.textSecondary },
  endPace: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
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
