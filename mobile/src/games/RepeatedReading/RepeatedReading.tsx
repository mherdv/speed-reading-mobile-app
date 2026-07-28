import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { TEXT_SAMPLES } from '../../data/textSamples';
import { levelToStars, updateProgress } from '../../data/progressStore';
import type { TextSample } from '../../domain/types';
import { computeWpm, countWords } from '../../domain/wpm';
import {
  assessReadingMeasurement,
  formatDuration,
} from '../../domain/results';
import { colors, shadows, spacing } from '../../theme/colors';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'RepeatedReading';
const TOTAL_ROUNDS = 2;

type Props = {
  sample?: TextSample;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: () => number;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'reading' | 'between' | 'question' | 'ended';

function passageComplexityScore(sample: TextSample): number {
  const words = sample.text
    .toLocaleLowerCase('en')
    .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  const averageWordLength =
    words.reduce((total, word) => total + word.length, 0) /
    Math.max(words.length, 1);
  return averageWordLength + words.length / 500;
}

/**
 * Repeated Reading uses its own training pool so measured baseline passages
 * stay unfamiliar. Lexical density divides the authored training texts into
 * meaningful, deterministic difficulty bands.
 */
export function getRepeatedReadingPool(
  difficulty: Difficulty
): readonly TextSample[] {
  const trainingSamples = TEXT_SAMPLES
    .filter((item) => item.complexityBand !== 'baseline-brief')
    .sort(
      (first, second) =>
        passageComplexityScore(first) - passageComplexityScore(second) ||
        first.id.localeCompare(second.id)
    );
  const bandSize = Math.ceil(trainingSamples.length / 3);
  const bandIndex = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2;
  const start = bandIndex * bandSize;
  const end =
    difficulty === 'hard' ? trainingSamples.length : start + bandSize;
  return trainingSamples.slice(start, end);
}

export function chooseNextRepeatedReadingSample(
  difficulty: Difficulty,
  previousId: string,
  random: () => number
): TextSample {
  const pool = getRepeatedReadingPool(difficulty);
  const candidates = pool.filter((item) => item.id !== previousId);
  const available = candidates.length > 0 ? candidates : pool;
  return available[
    Math.min(
      available.length - 1,
      Math.floor(random() * available.length)
    )
  ] ?? TEXT_SAMPLES[0];
}

export default function RepeatedReading({
  sample,
  difficulty = 'easy',
  autoStart = false,
  random = Math.random,
  onReportResult,
}: Props) {
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const initialSample =
    sample ?? getRepeatedReadingPool(selectedDifficulty)[0] ?? TEXT_SAMPLES[0];
  const [activeSample, setActiveSample] =
    useState<TextSample>(initialSample);
  const wordCount = useMemo(
    () => countWords(activeSample.text),
    [activeSample.text]
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundWpms, setRoundWpms] = useState<number[]>([]);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [measurementValid, setMeasurementValid] = useState(true);

  const sessionStartedAtRef = useRef(0);
  const roundStartedAtRef = useRef(0);
  const roundDurationsRef = useRef<number[]>([]);
  const roundWpmsRef = useRef<number[]>([]);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const previousSampleIdRef = useRef(activeSample.id);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'idle') return;
    const next =
      sample ??
      getRepeatedReadingPool(selectedDifficulty)[0] ??
      TEXT_SAMPLES[0];
    setActiveSample(next);
    previousSampleIdRef.current = next.id;
  }, [phase, sample, selectedDifficulty]);

  useEffect(() => {
    if (phase !== 'reading') return;
    const timer = setInterval(() => {
      setLiveElapsedMs(Date.now() - roundStartedAtRef.current);
    }, 50);
    return () => clearInterval(timer);
  }, [phase, roundIndex]);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function beginRound(index: number) {
    roundStartedAtRef.current = Date.now();
    setRoundIndex(index);
    setLiveElapsedMs(0);
    setPhase('reading');
  }

  function start(force = false) {
    cancelledRef.current = false;
    if (!force && phase !== 'idle' && phase !== 'ended') return;
    if (!sample) {
      const nextSample = chooseNextRepeatedReadingSample(
        selectedDifficulty,
        previousSampleIdRef.current,
        random
      );
      previousSampleIdRef.current = nextSample.id;
      setActiveSample(nextSample);
    }
    reportedRef.current = false;
    roundDurationsRef.current = [];
    roundWpmsRef.current = [];
    setRoundWpms([]);
    setSelectedAnswer(null);
    setMeasurementValid(true);
    sessionStartedAtRef.current = Date.now();
    beginRound(0);
  }

  function finishRound() {
    if (phase !== 'reading') return;
    const duration = Math.max(1, Date.now() - roundStartedAtRef.current);
    const wpm = computeWpm(wordCount, duration);
    roundDurationsRef.current.push(duration);
    roundWpmsRef.current.push(wpm);
    setRoundWpms([...roundWpmsRef.current]);
    setLiveElapsedMs(duration);

    if (roundIndex + 1 < TOTAL_ROUNDS) {
      setPhase('between');
    } else {
      setPhase('question');
    }
  }

  function submitAnswer() {
    if (selectedAnswer === null || reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const comprehensionCorrect =
      selectedAnswer === activeSample.question.correctIndex;
    const firstWpm = roundWpmsRef.current[0] ?? 0;
    const lastWpm =
      roundWpmsRef.current[roundWpmsRef.current.length - 1] ?? firstWpm;
    const elapsedMs = roundDurationsRef.current.reduce(
      (total, duration) => total + duration,
      0
    );
    const maintainedMeaningfulPace =
      firstWpm === 0 || lastWpm >= firstWpm * 0.9;
    const roundQuality = roundDurationsRef.current.map((duration) =>
      assessReadingMeasurement(wordCount, duration)
    );
    const validMeasurement = roundQuality.every((quality) => quality.valid);
    const qualityReason = roundQuality.find((quality) => !quality.valid)?.reason;

    setPhase('ended');
    setMeasurementValid(validMeasurement);
    if (validMeasurement) {
      void updateProgress(
        GAME_ID,
        comprehensionCorrect && maintainedMeaningfulPace,
        lastWpm
      ).then(({ progress }) => {
        if (cancelledRef.current) return;
        setGameProgress(progress);
      }).catch(() => undefined);
    }

    onReportResult?.({
      startedAtIso: new Date(sessionStartedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: lastWpm,
      details: {
        activityType: 'measured-reading',
        contentId: activeSample.id,
        comparisonBand: activeSample.comparisonBand,
        wordCount,
        wpm: lastWpm,
        roundWpms: [...roundWpmsRef.current],
        firstWpm,
        lastWpm,
        comprehensionCorrect,
        measurementValid: validMeasurement,
        qualityFlag: qualityReason,
        difficulty: selectedDifficulty,
      },
    });
  }

  const firstWpm = roundWpms[0] ?? 0;
  const latestWpm = roundWpms[roundWpms.length - 1] ?? 0;
  const changePercent =
    firstWpm > 0 && latestWpm > 0
      ? Math.round(((latestWpm - firstWpm) / firstWpm) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Repeated Reading</Text>
        <Text style={styles.subtitle}>Build fluency without losing the point</Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          startLabel="Start first read"
          onStart={() => start()}
        >
          <View style={styles.idleMeta}>
            <Text style={styles.idleMetaValue}>{wordCount} words</Text>
            <Text style={styles.idleMetaDot}>•</Text>
            <Text style={styles.idleMetaValue}>2 timed reads</Text>
            <Text style={styles.idleMetaDot}>•</Text>
            <Text style={styles.idleMetaValue}>1 question</Text>
          </View>
        </GameIdlePanel>
      )}

      {phase === 'reading' && (
        <View style={styles.stage}>
          <View style={styles.stageHeader}>
            <View>
              <Text style={styles.eyebrow}>PASS {roundIndex + 1} OF {TOTAL_ROUNDS}</Text>
              <Text style={styles.stageTitle}>
                {roundIndex === 0 ? 'Find a comfortable baseline' : 'Read smoothly, not hurriedly'}
              </Text>
            </View>
            <View style={styles.timerPill}>
              <Text style={styles.timerValue}>{formatDuration(liveElapsedMs)}</Text>
            </View>
          </View>

          <ReadingColumn
            testID="repeated-reading-column"
            style={styles.readingArea}
          >
            <ScrollView style={styles.passageCard} showsVerticalScrollIndicator={false}>
              <Text style={styles.passageTitle}>{activeSample.title}</Text>
              <Text testID="repeated-passage" style={styles.passageText}>
                {activeSample.text}
              </Text>
            </ScrollView>
          </ReadingColumn>

          <Button
            testID="finish-round"
            label={`Finish pass ${roundIndex + 1}`}
            onPress={finishRound}
          />
        </View>
      )}

      {phase === 'between' && (
        <View testID="between-rounds" style={styles.centerStage}>
          <View style={styles.summaryCard}>
            <Text style={styles.eyebrow}>BASELINE RECORDED</Text>
            <Text style={styles.bigMetric}>{firstWpm}</Text>
            <Text style={styles.metricLabel}>words per minute</Text>
            <Text style={styles.summaryText}>
              On the second pass, use familiarity to read more smoothly. Keep enough
              attention for the question that follows.
            </Text>
          </View>
          <Button
            testID="start-next-round"
            label="Begin second read"
            onPress={() => beginRound(1)}
          />
        </View>
      )}

      {phase === 'question' && (
        <View style={styles.stage}>
          <View style={styles.questionIntro}>
            <Text style={styles.eyebrow}>MEANING CHECK</Text>
            <Text style={styles.stageTitle}>Protect comprehension</Text>
            <Text style={styles.questionMeta}>
              Passes: {roundWpms.join(' → ')} WPM
              {changePercent !== 0 ? ` · ${changePercent > 0 ? '+' : ''}${changePercent}%` : ''}
            </Text>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{activeSample.question.prompt}</Text>
            <View accessibilityRole="radiogroup">
              {activeSample.question.choices.map((choice, index) => {
                const selected = selectedAnswer === index;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={choice}
                    key={`${choice}-${index}`}
                    testID={`repeated-choice-${index}`}
                    style={[styles.choice, selected && styles.choiceSelected]}
                    onPress={() => setSelectedAnswer(index)}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {choice}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button
            testID="submit-repeated-answer"
            label="Complete session"
            disabled={selectedAnswer === null}
            onPress={submitAnswer}
          />
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.centerStage}>
          <View style={styles.summaryCard}>
            <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
            <Text style={styles.bigMetric}>{latestWpm}</Text>
            <Text style={styles.metricLabel}>final WPM</Text>
            <Text style={styles.summaryText}>
              First pass {firstWpm} WPM · Final pass {latestWpm} WPM
            </Text>
            {!measurementValid && (
              <Text testID="repeated-quality-warning" style={styles.qualityWarning}>
                This attempt was too short to calibrate progress. The raw result
                is kept for review.
              </Text>
            )}
          </View>
          <Button testID="play-again" label="Read again" onPress={() => start(true)} />
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
  qualityWarning: {
    marginTop: 10,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  idleMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  idleMetaValue: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  idleMetaDot: {
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  stage: {
    flex: 1,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  stageTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  timerPill: {
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceTonal,
  },
  timerValue: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  passageCard: {
    flex: 1,
    marginBottom: spacing.md,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  readingArea: { flex: 1 },
  passageTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
    marginBottom: spacing.md,
  },
  passageText: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 30,
  },
  summaryCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  bigMetric: {
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: spacing.sm,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  summaryText: {
    maxWidth: 310,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  questionIntro: {
    marginBottom: spacing.md,
  },
  questionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  questionCard: {
    flex: 1,
    padding: 18,
    marginBottom: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
    marginBottom: spacing.md,
  },
  choice: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceTonal,
  },
  radio: {
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textMuted,
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  choiceText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 11,
  },
  choiceTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
