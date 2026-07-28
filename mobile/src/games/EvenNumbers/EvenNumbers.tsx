import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { formatDuration } from '../../domain/results';
import { colors } from '../../theme/colors';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, type Difficulty } from '../gameHooks';

const GAME_ID = 'EvenNumbers';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  grid?: number[];
  gridSize?: number;
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type DifficultyConfig = {
  gridSize: number;
  maxNumber: number;
  durationMs: number;
};

export function getEvenNumbersConfig(difficulty: Difficulty): DifficultyConfig {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 4, maxNumber: 40, durationMs: 45_000 };
    case 'medium':
      return { gridSize: 5, maxNumber: 120, durationMs: 35_000 };
    case 'hard':
      return { gridSize: 6, maxNumber: 500, durationMs: 25_000 };
  }
}

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildEvenNumbersGrid(size: number, maxNumber: number): number[] {
  const count = size * size;
  const evenCount = Math.max(2, Math.round(count * 0.4));
  const evens = Array.from(
    { length: Math.ceil((maxNumber + 1) / 2) },
    (_, index) => index * 2
  );
  const odds = Array.from(
    { length: Math.ceil(maxNumber / 2) },
    (_, index) => index * 2 + 1
  ).filter((number) => number <= maxNumber);

  return shuffle([
    ...shuffle(evens).slice(0, evenCount),
    ...shuffle(odds).slice(0, count - evenCount),
  ]);
}

function evenIndexes(numbers: readonly number[]): Set<number> {
  return new Set(
    numbers.flatMap((number, index) => (number % 2 === 0 ? [index] : []))
  );
}

export default function EvenNumbers({
  grid: gridProp,
  gridSize: gridSizeProp,
  durationMs: durationMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const config = getEvenNumbersConfig(difficulty);
  const gridSize = gridSizeProp ?? config.gridSize;
  const durationMs = durationMsProp ?? config.durationMs;
  const [phase, setPhase] = useState<Phase>('idle');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);

  const startedAtRef = useRef(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const roundsRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  useAutoStart(autoStart, phase, true, start);

  useEffect(() => {
    if (phase !== 'running') return;
    const endAt = startedAtRef.current + durationMs;
    const interval = setInterval(() => {
      const remaining = Math.max(0, endAt - Date.now());
      setTimeLeftMs(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        finish(Date.now());
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [durationMs, phase]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
    },
    []
  );

  function createRound() {
    setNumbers(
      gridProp
        ? gridProp.slice(0, gridSize * gridSize)
        : buildEvenNumbersGrid(gridSize, config.maxNumber)
    );
    setSelected(new Set());
  }

  function start() {
    if (phase === 'running') return;
    cancelledRef.current = false;
    reportedRef.current = false;
    scoreRef.current = 0;
    correctRef.current = 0;
    attemptsRef.current = 0;
    roundsRef.current = 0;
    setScore(0);
    setCorrect(0);
    setAttempts(0);
    setRounds(0);
    setTimeLeftMs(durationMs);
    startedAtRef.current = Date.now();
    createRound();
    setPhase('running');
  }

  function finish(now = Date.now()) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    const accuracy =
      attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0;
    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current).catch(
      () => undefined
    );
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs: Math.max(0, now - startedAtRef.current),
      score: scoreRef.current,
      accuracy,
      details: {
        attempts: attemptsRef.current,
        correct: correctRef.current,
        rounds: roundsRef.current,
        difficulty,
        gridSize,
        maxNumber: config.maxNumber,
        durationMs,
      },
    });
  }

  function toggleCell(index: number) {
    if (phase !== 'running') return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function submitRound() {
    if (phase !== 'running') return;
    const expected = evenIndexes(numbers);
    const correctSelections = [...selected].filter((index) =>
      expected.has(index)
    ).length;
    const wrongSelections = [...selected].filter(
      (index) => !expected.has(index)
    ).length;
    const missed = [...expected].filter((index) => !selected.has(index)).length;
    const roundAttempts = correctSelections + wrongSelections + missed;

    correctRef.current += correctSelections;
    attemptsRef.current += roundAttempts;
    roundsRef.current += 1;
    scoreRef.current += Math.max(0, correctSelections * 10 - (wrongSelections + missed) * 3);
    setCorrect(correctRef.current);
    setAttempts(attemptsRef.current);
    setRounds(roundsRef.current);
    setScore(scoreRef.current);
    createRound();
  }

  const cellWidth = `${Math.floor(100 / gridSize) - 1}%` as const;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Even Numbers</Text>
      <Text style={styles.subtitle}>Scan each row and column. Select every even number.</Text>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          containerStyle={styles.idle}
          descriptionStyle={styles.description}
          buttonStyle={styles.primaryButton}
          buttonTextStyle={styles.primaryButtonText}
        />
      )}

      {phase === 'running' && (
        <View testID="even-numbers-grid" style={styles.gameArea}>
          <StatsRow
            items={[
              { key: 'score', label: 'Score', value: score },
              { key: 'rounds', label: 'Rounds', value: rounds },
              {
                key: 'time',
                label: 'Left',
                value: formatDuration(timeLeftMs),
              },
            ]}
          />
          <Text style={styles.instruction}>
            Tap all even values, then check the grid.
          </Text>
          <View style={styles.grid}>
            {numbers.map((number, index) => {
              const isSelected = selected.has(index);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Number ${number}`}
                  key={`${rounds}-${index}`}
                  testID={`even-cell-${index}`}
                  onPress={() => toggleCell(index)}
                  style={[
                    styles.cell,
                    { width: cellWidth },
                    isSelected && styles.cellSelected,
                  ]}
                >
                  <Text style={[styles.cellText, isSelected && styles.cellTextSelected]}>
                    {number}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            testID="submit-even-grid"
            onPress={submitRound}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              Check {selected.size} selected
            </Text>
          </Pressable>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>Session complete</Text>
          <Text style={styles.endScore}>{score} points</Text>
          <Text style={styles.endMeta}>
            {attempts > 0 ? Math.round((correct / attempts) * 100) : 0}% accuracy · {rounds} rounds
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
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  gameArea: { flex: 1, gap: 12, paddingTop: 12 },
  instruction: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  cell: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  cellSelected: {
    backgroundColor: colors.infoSurface,
    borderColor: colors.interactiveInfo,
    borderWidth: 2,
  },
  cellText: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  cellTextSelected: { color: colors.infoForeground },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: colors.onInteractive, fontSize: 16, fontWeight: '700' },
  endCard: { alignItems: 'center', flex: 1, justifyContent: 'center', gap: 8 },
  endTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  endScore: { color: colors.interactivePrimary, fontSize: 36, fontWeight: '800' },
  endMeta: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
});
