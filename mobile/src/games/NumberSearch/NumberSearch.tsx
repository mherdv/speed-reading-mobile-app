import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import {
  randomIndex,
  shuffleItems,
  type RandomSource,
} from '../../data/randomization';
import { formatDuration } from '../../domain/results';
import { colors } from '../../theme/colors';
import { BriefStimulus } from '../../ui/BriefStimulus';
import { FlashChallengeStatus } from '../../ui/FlashChallengeStatus';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useTrackedTimeouts, type Difficulty } from '../gameHooks';
import { exposureMsForFlashChallengeLevel } from '../flashChallenge';
import { useFlashChallenge } from '../useFlashChallenge';

const GAME_ID = 'NumberSearch';
const CORRECT_TARGETS_TO_ADVANCE = 3;
const MISSES_TO_ROLL_BACK = 3;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  durationMs?: number;
  previewMs?: number;
  gridSize?: number;
  numberRange?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'preview' | 'searching' | 'ended';

type GridData = {
  grid: number[][];
  target: number;
  targetPos: { row: number; col: number };
};

type DifficultyConfig = {
  gridSize: number;
  numberRange: number;
  previewMs: number;
  durationMs: number;
};

type NumberSearchStageSettings = Pick<
  DifficultyConfig,
  'gridSize' | 'numberRange' | 'previewMs'
> & {
  numberMinimum: number;
};

export function getNumberSearchConfig(difficulty: Difficulty): DifficultyConfig {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 4, numberRange: 50, previewMs: 1_200, durationMs: 45_000 };
    case 'medium':
      return { gridSize: 5, numberRange: 200, previewMs: 900, durationMs: 35_000 };
    case 'hard':
      return { gridSize: 6, numberRange: 1_000, previewMs: 650, durationMs: 25_000 };
  }
}

export function buildNumberSearchGrid(
  size: number,
  numberRange: number,
  numberMinimum = 0,
  random: RandomSource = Math.random
): GridData {
  const count = size * size;
  const safeMinimum = Math.max(0, Math.round(numberMinimum));
  const effectiveRange = Math.max(
    numberRange,
    safeMinimum + count + 1
  );
  const availableCount = effectiveRange - safeMinimum;
  const sampledOffsets = new Set<number>();
  // Floyd's bounded sampling produces exactly `count` unique values even
  // when an injected random source repeatedly returns the same boundary.
  for (
    let candidate = availableCount - count;
    candidate < availableCount;
    candidate += 1
  ) {
    const sampled = randomIndex(candidate + 1, random);
    sampledOffsets.add(
      sampledOffsets.has(sampled) ? candidate : sampled
    );
  }
  const flat = shuffleItems(
    [...sampledOffsets].map((value) => safeMinimum + value),
    random
  );
  const targetIndex = randomIndex(flat.length, random);
  const target = flat[targetIndex];
  return {
    grid: Array.from({ length: size }, (_, row) =>
      flat.slice(row * size, (row + 1) * size)
    ),
    target,
    targetPos: {
      row: Math.floor(targetIndex / size),
      col: targetIndex % size,
    },
  };
}

export default function NumberSearch({
  durationMs: durationMsProp,
  previewMs: previewMsProp,
  gridSize: gridSizeProp,
  numberRange: numberRangeProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const config = getNumberSearchConfig(difficulty);
  const durationMs = durationMsProp ?? config.durationMs;
  const previewMs = previewMsProp ?? config.previewMs;
  const gridSize = gridSizeProp ?? config.gridSize;
  const numberRange = numberRangeProp ?? config.numberRange;
  const flashChallenge = useFlashChallenge(
    GAME_ID,
    difficulty,
    CORRECT_TARGETS_TO_ADVANCE,
    MISSES_TO_ROLL_BACK,
    {
      masteryEligible:
        previewMsProp == null &&
        gridSizeProp == null &&
        numberRangeProp == null,
    }
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [gridData, setGridData] = useState<GridData>(() =>
    buildNumberSearchGrid(gridSize, numberRange)
  );
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startedAtRef = useRef(0);
  const sessionEndsAtRef = useRef(0);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const roundLockedRef = useRef(true);
  const roundAdaptiveOutcomeRef = useRef<'correct' | 'miss' | null>(null);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const initialChallengeLevelRef = useRef(1);
  const maxChallengeLevelRef = useRef(1);
  const activeSettingsRef = useRef<NumberSearchStageSettings>({
    gridSize,
    numberRange,
    numberMinimum: 0,
    previewMs,
  });
  const initialSettingsRef = useRef<NumberSearchStageSettings>({
    gridSize,
    numberRange,
    numberMinimum: 0,
    previewMs,
  });
  const hardestSettingsRef = useRef<NumberSearchStageSettings>({
    gridSize,
    numberRange,
    numberMinimum: 0,
    previewMs,
  });
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(() => {
    if (
      (phase !== 'searching' && phase !== 'preview') ||
      startedAtRef.current === 0
    ) {
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, sessionEndsAtRef.current - Date.now());
      setTimeLeftMs(remaining);
      if (remaining === 0) {
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
    // The tracked-timeout helpers intentionally do not participate in the
    // lifecycle dependency list: this cleanup must run only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useAutoStart(autoStart, phase, flashChallenge.loaded, start);

  function gridSettingsForChallenge(
    level: number
  ): NumberSearchStageSettings {
    const extraDigitTiers =
      numberRangeProp == null
        ? Math.floor((Math.max(1, level) - 1) / 5)
        : 0;
    const baseDigits = String(
      Math.max(0, Math.round(numberRange) - 1)
    ).length;
    const numberMinimum =
      extraDigitTiers === 0
        ? 0
        : 10 ** (baseDigits + extraDigitTiers - 1);
    const scaledRange =
      numberRangeProp ??
      Math.min(
        100_000,
        Math.round(
          numberRange *
            (1 + Math.floor((level - 1) / 3) * 0.75)
        )
      );
    return {
      gridSize:
        gridSizeProp ??
        Math.min(6, gridSize + Math.floor((level - 1) / 5)),
      numberRange: Math.max(
        scaledRange,
        numberMinimum > 0 ? numberMinimum * 10 : 0
      ),
      numberMinimum,
      previewMs:
        previewMsProp ??
        exposureMsForFlashChallengeLevel(
          previewMs,
          level,
          350
        ),
    };
  }

  function buildNextGrid(level = flashChallenge.getCurrentLevel()) {
    const settings = gridSettingsForChallenge(level);
    return {
      gridData: buildNumberSearchGrid(
        settings.gridSize,
        settings.numberRange,
        settings.numberMinimum
      ),
      settings,
    };
  }

  function beginPreview({
    gridData: nextGrid,
    settings,
  }: ReturnType<typeof buildNextGrid>) {
    activeSettingsRef.current = settings;
    hardestSettingsRef.current = {
      gridSize: Math.max(
        hardestSettingsRef.current.gridSize,
        settings.gridSize
      ),
      numberRange: Math.max(
        hardestSettingsRef.current.numberRange,
        settings.numberRange
      ),
      numberMinimum: Math.max(
        hardestSettingsRef.current.numberMinimum,
        settings.numberMinimum
      ),
      previewMs: Math.min(
        hardestSettingsRef.current.previewMs,
        settings.previewMs
      ),
    };
    roundAdaptiveOutcomeRef.current = null;
    setGridData(nextGrid);
    setFeedback(null);
    setPhase('preview');
    scheduleTimeout(() => {
      if (cancelledRef.current || reportedRef.current) return;
      if (startedAtRef.current === 0) {
        startedAtRef.current = Date.now();
        sessionEndsAtRef.current = startedAtRef.current + durationMs;
        setTimeLeftMs(durationMs);
      }
      roundLockedRef.current = false;
      setPhase('searching');
    }, settings.previewMs);
  }

  function start() {
    if (
      !flashChallenge.loaded ||
      phase === 'searching' ||
      phase === 'preview'
    ) {
      return;
    }
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    roundLockedRef.current = true;
    startedAtRef.current = 0;
    sessionEndsAtRef.current = 0;
    const initialChallengeLevel = flashChallenge.beginSession();
    initialChallengeLevelRef.current = initialChallengeLevel;
    maxChallengeLevelRef.current = initialChallengeLevel;
    const initialGrid = buildNextGrid(initialChallengeLevel);
    initialSettingsRef.current = initialGrid.settings;
    activeSettingsRef.current = initialGrid.settings;
    hardestSettingsRef.current = initialGrid.settings;
    setScore(0);
    setAttempts(0);
    setTimeLeftMs(durationMs);
    beginPreview(initialGrid);
  }

  function finish(now = Date.now()) {
    if (cancelledRef.current || reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    const accuracy =
      attemptsRef.current > 0 ? scoreRef.current / attemptsRef.current : 0;
    const initialSettings = initialSettingsRef.current;
    const finalSettings = activeSettingsRef.current;
    const hardestSettings = hardestSettingsRef.current;
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
        rounds: attemptsRef.current,
        correct: scoreRef.current,
        difficulty,
        gridSize: finalSettings.gridSize,
        numberRange: finalSettings.numberRange,
        numberMinimum: finalSettings.numberMinimum,
        previewMs: finalSettings.previewMs,
        initialGridSize: initialSettings.gridSize,
        finalGridSize: finalSettings.gridSize,
        maximumGridSize: hardestSettings.gridSize,
        initialNumberRange: initialSettings.numberRange,
        initialNumberMinimum: initialSettings.numberMinimum,
        finalNumberRange: finalSettings.numberRange,
        finalNumberMinimum: finalSettings.numberMinimum,
        maximumNumberRange: hardestSettings.numberRange,
        maximumNumberMinimum: hardestSettings.numberMinimum,
        initialPreviewMs: initialSettings.previewMs,
        finalPreviewMs: finalSettings.previewMs,
        minimumPreviewMs: hardestSettings.previewMs,
        durationMs,
        initialChallengeLevel: initialChallengeLevelRef.current,
        finalChallengeLevel: flashChallenge.getCurrentLevel(),
        highestChallengeLevel: maxChallengeLevelRef.current,
        savedBestChallengeLevel: flashChallenge.getHighestLevel(),
      },
    });
  }

  function onCellPress(row: number, col: number) {
    if (phase !== 'searching' || roundLockedRef.current) return;
    const isCorrect =
      row === gridData.targetPos.row && col === gridData.targetPos.col;
    // Lock synchronously before updating refs. React state does not update
    // quickly enough to protect this round from a rapid second press.
    if (isCorrect) roundLockedRef.current = true;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    if (!isCorrect) {
      if (roundAdaptiveOutcomeRef.current === null) {
        roundAdaptiveOutcomeRef.current = 'miss';
        const challengeOutcome = flashChallenge.recordOutcome(false);
        maxChallengeLevelRef.current = Math.max(
          maxChallengeLevelRef.current,
          challengeOutcome.state.level
        );
      }
      setFeedback('wrong');
      scheduleTimeout(() => setFeedback(null), 220);
      return;
    }

    scoreRef.current += 1;
    if (roundAdaptiveOutcomeRef.current === null) {
      roundAdaptiveOutcomeRef.current = 'correct';
      const challengeOutcome = flashChallenge.recordOutcome(true);
      maxChallengeLevelRef.current = Math.max(
        maxChallengeLevelRef.current,
        challengeOutcome.state.level
      );
    }
    setScore(scoreRef.current);
    setFeedback('correct');
    clearTrackedTimeouts();
    scheduleTimeout(
      () => beginPreview(buildNextGrid()),
      260
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Number Search</Text>
      <Text style={styles.subtitle}>Remember the target, then find it after it hides.</Text>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          startDisabled={!flashChallenge.loaded}
          containerStyle={styles.idle}
          descriptionStyle={styles.description}
          buttonStyle={styles.primaryButton}
          buttonTextStyle={styles.primaryButtonText}
        >
          <FlashChallengeStatus
            level={flashChallenge.resumeLevel}
            highestLevel={flashChallenge.highestLevel}
          />
        </SimpleIdlePanel>
      )}

      {phase === 'preview' && (
        <View testID="target-preview" style={styles.previewArea}>
          <FlashChallengeStatus
            compact
            level={flashChallenge.level}
            highestLevel={flashChallenge.highestLevel}
          />
          <Text style={styles.previewLabel}>Remember this number</Text>
          <BriefStimulus
            value={String(gridData.target)}
            difficulty={difficulty}
            testID="target-number"
            color={colors.interactivePrimary}
            backgroundColor={colors.background}
            maxFontSize={68}
            minFontSize={18}
            containerStyle={styles.previewStimulus}
            maskFraction={flashChallenge.profile.maskFraction}
          />
          <Text style={styles.previewHint}>It will hide before the grid appears.</Text>
        </View>
      )}

      {phase === 'searching' && (
        <View testID="number-search-grid" style={styles.gameArea}>
          <StatsRow
            items={[
              { key: 'found', value: score, label: 'Found' },
              {
                key: 'time',
                value: formatDuration(timeLeftMs),
                label: 'Left',
              },
              { key: 'attempts', value: attempts, label: 'Attempts' },
            ]}
          />
          <View
            style={[
              styles.hiddenTarget,
              feedback === 'correct' && styles.correct,
              feedback === 'wrong' && styles.wrong,
            ]}
          >
            <Text testID="target-hidden" style={styles.hiddenTargetText}>
              Target hidden — scan from memory
            </Text>
          </View>
          <View style={styles.grid}>
            {gridData.grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((number, columnIndex) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Number ${number}`}
                    key={`${rowIndex}-${columnIndex}`}
                    testID={`cell-${rowIndex}-${columnIndex}`}
                    style={styles.cell}
                    onPress={() => onCellPress(rowIndex, columnIndex)}
                  >
                    <Text style={styles.cellText}>{number}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endTitle}>Session complete</Text>
          <Text style={styles.endScore}>{score} found</Text>
          <Text style={styles.endMeta}>
            {attempts > 0 ? Math.round((score / attempts) * 100) : 0}% accuracy
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            style={styles.primaryButton}
            onPress={start}
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
  previewArea: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  previewLabel: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  previewStimulus: {
    marginVertical: 18,
  },
  previewHint: { color: colors.textMuted, fontSize: 13 },
  gameArea: { flex: 1, gap: 12, paddingTop: 12 },
  hiddenTarget: {
    alignItems: 'center',
    backgroundColor: colors.surfaceTonal,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  hiddenTargetText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  correct: { backgroundColor: colors.successSurface },
  wrong: { backgroundColor: colors.errorSurface },
  grid: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  cell: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  cellText: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
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
