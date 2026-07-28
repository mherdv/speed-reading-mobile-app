import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  countWords,
  createRecognitionOptions,
  createVariedSequence,
  generatePhrasePool,
  uniqueStrings,
} from '../../data/flashPracticeContent';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { colors } from '../../theme/colors';
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
  updateFlashPace,
  wpmForDisplayDuration,
  type FlashPaceBounds,
  type FlashPaceState,
} from '../flashPacing';

const GAME_ID = 'TimedPhraseRecognition';
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
  phrases?: string[];
  displayMs?: number;
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'show' | 'choose' | 'ended';
type FinishReason = 'three-misses' | 'manual' | 'round-limit';

function getConfig(difficulty: Difficulty): FlashPaceBounds & {
  baseWpm: number;
} {
  switch (difficulty) {
    case 'easy':
      return { baseWpm: 180, minWpm: 120, maxWpm: 280 };
    case 'medium':
      return { baseWpm: 260, minWpm: 180, maxWpm: 400 };
    case 'hard':
      return { baseWpm: 360, minWpm: 260, maxWpm: 520 };
  }
}

export default function TimedPhraseRecognition({
  phrases: phrasesProp,
  displayMs: displayMsProp,
  totalRounds: totalRoundsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const config = getConfig(difficulty);
  const totalRounds = totalRoundsProp;
  const generatedPoolRef = useRef<string[]>([]);
  if (generatedPoolRef.current.length === 0) {
    generatedPoolRef.current = generatePhrasePool(difficulty, 240);
  }

  const phrasePool =
    phrasesProp && phrasesProp.length > 0
      ? uniqueStrings(phrasesProp)
      : generatedPoolRef.current;
  const optionPool = uniqueStrings([
    ...phrasePool,
    ...generatedPoolRef.current,
  ]);
  const defaultWpm =
    displayMsProp == null
      ? config.baseWpm
      : wpmForDisplayDuration(displayMsProp);
  const [phase, setPhase] = useState<Phase>('idle');
  const [startingWpm, setStartingWpm] = useState(defaultWpm);
  const [liveWpm, setLiveWpm] = useState(defaultWpm);
  const [round, setRound] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [missStreak, setMissStreak] = useState(0);
  const [finishReason, setFinishReason] =
    useState<FinishReason>('three-misses');

  const startRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const phraseRef = useRef('');
  const previousPhraseRef = useRef('');
  const deckRef = useRef<string[]>([]);
  const deckIndexRef = useRef(0);
  const paceRef = useRef<FlashPaceState>(
    createFlashPaceState(defaultWpm)
  );
  const initialWpmRef = useRef(defaultWpm);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(() => {
    generatedPoolRef.current = generatePhrasePool(difficulty, 240);
    const nextWpm =
      displayMsProp == null
        ? getConfig(difficulty).baseWpm
        : wpmForDisplayDuration(displayMsProp);
    setStartingWpm(nextWpm);
    setLiveWpm(nextWpm);
  }, [difficulty, displayMsProp]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function createOptions(answer: string): string[] {
    return createRecognitionOptions(answer, optionPool);
  }

  function takeNextPhrase() {
    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = createVariedSequence(
        phrasePool,
        Math.max(32, phrasePool.length),
        previousPhraseRef.current
      );
      deckIndexRef.current = 0;
    }
    const phrase =
      deckRef.current[deckIndexRef.current] ??
      phrasePool[0] ??
      'Focused readers notice details';
    deckIndexRef.current += 1;
    return phrase;
  }

  function showRound() {
    const phrase = takeNextPhrase();
    phraseRef.current = phrase;
    previousPhraseRef.current = phrase;
    setCurrentPhrase(phrase);
    setOptions(createOptions(phrase));
    setPhase('show');
    scheduleTimeout(
      () => {
        if (!cancelledRef.current) setPhase('choose');
      },
      displayMsProp ??
        displayDurationForWpm(paceRef.current.wpm, countWords(phrase), 300)
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
      phrasePool,
      Math.max(32, phrasePool.length),
      previousPhraseRef.current
    );
    deckIndexRef.current = 0;
    setRound(0);
    setScore(0);
    setCorrectStreak(0);
    setMissStreak(0);
    setLiveWpm(startingWpm);
    startRef.current = Date.now();
    showRound();
  }

  useAutoStart(autoStart, phase, true, start);

  function choose(index: number) {
    if (phase !== 'choose') return;
    const correct = options[index] === phraseRef.current;
    if (correct) {
      scoreRef.current += 20;
      correctRef.current += 1;
      setScore(scoreRef.current);
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
        initialWpm: initialWpmRef.current,
        finalWpm: paceRef.current.wpm,
        paceChanges: paceRef.current.changes,
        phraseTemplates: generatedPoolRef.current.length,
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
        <Text style={styles.title}>Phrase Flash</Text>
        <Text style={styles.subtitle}>Remember the exact phrase</Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          containerStyle={styles.idleContent}
        >
          <Text style={styles.varietyText}>
            240 fresh phrase combinations · +25 WPM after{' '}
            {CORRECT_ANSWERS_TO_INCREASE} correct · 3 misses end
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

      {phase === 'show' && (
        <View style={styles.gameArea}>
          {stats}
          <View testID="phrase-flash" style={styles.phraseCard}>
            <Text testID="phrase" style={styles.phrase}>
              {currentPhrase}
            </Text>
          </View>
          <Text style={styles.instruction}>Read the whole phrase once</Text>
        </View>
      )}

      {phase === 'choose' && (
        <View style={styles.gameArea}>
          {stats}
          <Text style={styles.chooseTitle}>Which exact phrase did you see?</Text>
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

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>◫</Text>
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
  varietyText: {
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
    backgroundColor: colors.infoSurface,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.interactiveInfo },
  statLabel: { fontSize: 10, color: colors.textSecondary },
  phraseCard: {
    minHeight: 190,
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  phrase: {
    fontSize: 22,
    lineHeight: 31,
    fontWeight: '700',
    color: colors.infoForeground,
    textAlign: 'center',
  },
  instruction: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
  chooseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsContainer: { gap: 9 },
  optionButton: {
    minHeight: 52,
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  optionPressed: {
    backgroundColor: colors.infoSurface,
    borderColor: colors.interactiveInfo,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
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
  endEmoji: { fontSize: 38, marginBottom: 8 },
  endTitle: { fontSize: 21, fontWeight: '800', color: colors.textPrimary },
  endScore: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.interactiveInfo,
    marginVertical: 8,
  },
  endMeta: { fontSize: 14, color: colors.textSecondary },
  endPace: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.infoForeground,
    marginTop: 7,
  },
  playAgainButton: {
    minHeight: 48,
    marginTop: 18,
    backgroundColor: colors.interactiveInfo,
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
