import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { shuffleItems } from '../../data/flashPracticeContent';
import { updateProgress } from '../../data/progressStore';
import {
  MIXUP_WORDS,
  type MixupWord,
} from '../../data/vocabularyPracticeContent';
import { colors } from '../../theme/colors';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import {
  useAutoStart,
  useGameProgress,
  useTrackedTimeouts,
  type Difficulty,
} from '../gameHooks';

const GAME_ID = 'LetterJumble';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  words?: readonly MixupWord[];
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type Round = MixupWord & {
  mixed: string;
};

function candidateSwapIndexes(word: string, difficulty: Difficulty): number[] {
  const all = Array.from({ length: word.length - 1 }, (_, index) => index).filter(
    (index) => word[index] !== word[index + 1]
  );
  if (difficulty === 'easy') {
    const edges = all.filter(
      (index) => index <= 1 || index >= word.length - 3
    );
    return edges.length > 0 ? edges : all;
  }
  const internal = all.filter(
    (index) => index >= 1 && index <= word.length - 3
  );
  if (difficulty === 'hard' && internal.length > 0) {
    const center = (word.length - 2) / 2;
    return [...internal].sort(
      (first, second) =>
        Math.abs(first - center) - Math.abs(second - center)
    ).slice(0, Math.max(1, Math.ceil(internal.length / 2)));
  }
  return internal.length > 0 ? internal : all;
}

/** Applies one controlled adjacent transposition rather than a random shuffle. */
export function transposeWord(
  word: string,
  difficulty: Difficulty,
  random: () => number = Math.random
): string {
  const candidates = candidateSwapIndexes(word, difficulty);
  if (candidates.length === 0) return word;
  const index =
    candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
  const letters = [...word];
  [letters[index], letters[index + 1]] = [letters[index + 1], letters[index]];
  return letters.join('');
}

export default function LetterJumble({
  words,
  durationMs = 60_000,
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
  const [current, setCurrent] = useState<Round>(() => {
    const first = words?.[0] ?? MIXUP_WORDS[difficulty][0]!;
    return { ...first, mixed: transposeWord(first.word, difficulty) };
  });
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const [showHint, setShowHint] = useState(false);

  const startedAtRef = useRef(0);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const deckRef = useRef<MixupWord[]>([]);
  const deckIndexRef = useRef(0);
  const previousWordRef = useRef('');
  const inputRef = useRef<TextInput>(null);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();
  const pool = words && words.length > 0 ? words : MIXUP_WORDS[selectedDifficulty];

  useEffect(() => {
    if (phase !== 'running') return;
    const endAt = startedAtRef.current + durationMs;
    const interval = setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setTimeLeftMs(left);
      if (left === 0) {
        clearInterval(interval);
        finish(Date.now());
      }
    }, 100);
    return () => clearInterval(interval);
  }, [durationMs, phase]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      clearTrackedTimeouts();
    },
    // Cleanup belongs to unmount, not helper identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useAutoStart(autoStart, phase, progressLoaded, start);

  function takeNextRound(): Round {
    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = shuffleItems(pool);
      if (
        deckRef.current.length > 1 &&
        deckRef.current[0]?.word === previousWordRef.current
      ) {
        [deckRef.current[0], deckRef.current[1]] = [
          deckRef.current[1],
          deckRef.current[0],
        ];
      }
      deckIndexRef.current = 0;
    }
    const item =
      deckRef.current[deckIndexRef.current] ??
      pool[0] ??
      MIXUP_WORDS.easy[0]!;
    deckIndexRef.current += 1;
    previousWordRef.current = item.word;
    return {
      ...item,
      mixed: transposeWord(item.word, selectedDifficulty),
    };
  }

  function start() {
    if (phase === 'running') return;
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    deckRef.current = shuffleItems(pool);
    deckIndexRef.current = 0;
    setScore(0);
    setAttempts(0);
    setTimeLeftMs(durationMs);
    setCurrent(takeNextRound());
    setInput('');
    setShowHint(false);
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish(now = Date.now()) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const accuracy =
      attemptsRef.current > 0 ? scoreRef.current / attemptsRef.current : 0;
    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current)
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs: Math.max(0, now - startedAtRef.current),
      score: scoreRef.current,
      accuracy,
      details: {
        rounds: attemptsRef.current,
        correct: scoreRef.current,
        difficulty: selectedDifficulty,
        promptPoolSize: pool.length,
        mutation: 'one-adjacent-transposition',
        hints: 'definition-and-part-of-speech',
      },
    });
  }

  function nextRound() {
    setCurrent(takeNextRound());
    setInput('');
    setShowHint(false);
    scheduleTimeout(() => inputRef.current?.focus(), 50);
  }

  function onSubmit() {
    if (phase !== 'running') return;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    if (
      input.toLocaleLowerCase('en').trim() ===
      current.word.toLocaleLowerCase('en')
    ) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    nextRound();
  }

  function onSkip() {
    if (phase !== 'running') return;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    nextRound();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Letter Mixup</Text>
      <Text style={styles.subtitle}>Correct one pair of transposed letters</Text>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={Math.min(5, Math.max(1, Math.ceil(gameProgress.level / 3)))}
          onStart={start}
          containerStyle={styles.idle}
          buttonStyle={styles.primaryButton}
          buttonTextStyle={styles.primaryButtonText}
        />
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            items={[
              { key: 'solved', value: score, label: 'Solved' },
              { key: 'time', value: Math.ceil(timeLeftMs / 1000), label: 'Seconds' },
              { key: 'attempts', value: attempts, label: 'Attempts' },
            ]}
          />
          <View style={styles.mixupCard}>
            <Text testID="mixed-word" style={styles.mixedWord}>
              {current.mixed.toLocaleUpperCase('en')}
            </Text>
            <Text style={styles.mutationHint}>Exactly two neighboring letters changed places.</Text>
            {showHint && (
              <Text testID="definition-hint" style={styles.definition}>
                {current.partOfSpeech}: {current.definition}
              </Text>
            )}
          </View>
          <TextInput
            ref={inputRef}
            testID="answer-input"
            value={input}
            onChangeText={setInput}
            placeholder="Type the corrected word"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={onSubmit}
            style={styles.input}
          />
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              testID="hint-button"
              onPress={() => setShowHint(true)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Definition</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onSkip} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Skip</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              testID="submit-button"
              onPress={onSubmit}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Check</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>Mixup session complete</Text>
          <Text style={styles.endScore}>{score} corrected</Text>
          <Text style={styles.endMeta}>
            {attempts > 0 ? Math.round((score / attempts) * 100) : 0}% accuracy
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
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  idle: { flex: 1 },
  gameArea: { flex: 1, gap: 14, paddingTop: 14 },
  mixupCard: {
    alignItems: 'center',
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningForeground,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  mixedWord: {
    color: colors.warningForeground,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 4,
  },
  mutationHint: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  definition: {
    color: colors.warningForeground,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 17,
    minHeight: 48,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  buttons: { flexDirection: 'row', gap: 8 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  primaryButtonText: { color: colors.onInteractive, fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
  secondaryButtonText: { color: colors.interactivePrimary, fontSize: 14, fontWeight: '700' },
  endCard: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  endTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  endScore: { color: colors.interactivePrimary, fontSize: 34, fontWeight: '800' },
  endMeta: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
});
