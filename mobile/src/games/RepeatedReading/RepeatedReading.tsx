import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { getCuratedTrainingSamples } from '../../data/curatedComprehensionContent';
import { TEXT_SAMPLES } from '../../data/textSamples';
import { levelToStars, updateProgress } from '../../data/progressStore';
import {
  buildNoReplacementDeck,
  randomIndex,
  shuffleAnswerOptions,
  type RandomSource,
} from '../../data/randomization';
import type { TextSample } from '../../domain/types';
import { computeWpm, countWords } from '../../domain/wpm';
import {
  assessReadingMeasurement,
  formatDuration,
} from '../../domain/results';
import {
  epochNowMs,
  measuredElapsedMs,
  monotonicNowMs,
  type MillisecondClock,
} from '../../domain/timing';
import { colors, shadows, spacing } from '../../theme/colors';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'RepeatedReading';
const TOTAL_ROUNDS = 2;

type Props = {
  sample?: TextSample;
  excludedContentId?: string;
  suggestedWpm?: number;
  clock?: MillisecondClock;
  civilClock?: MillisecondClock;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: RandomSource;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'reading' | 'between' | 'question' | 'ended';

/**
 * Repeated Reading uses its own training pool so measured baseline passages
 * stay unfamiliar. Difficulty membership is editorially reviewed because
 * sentence structure, inference load, and domain density matter more than a
 * mechanical word-length score.
 */
export function getRepeatedReadingPool(
  difficulty: Difficulty
): readonly TextSample[] {
  return getCuratedTrainingSamples(difficulty);
}

export function chooseNextRepeatedReadingSample(
  difficulty: Difficulty,
  previousId: string,
  random: RandomSource,
  excludedContentId?: string
): TextSample {
  const pool = getRepeatedReadingPool(difficulty);
  const permitted = pool.filter((item) => item.id !== excludedContentId);
  const candidates = permitted.filter((item) => item.id !== previousId);
  const available = candidates.length > 0 ? candidates : permitted;
  if (available.length === 0) return TEXT_SAMPLES[0]!;
  return available[randomIndex(available.length, random)]!;
}

export function buildRepeatedReadingDeck(
  samples: readonly TextSample[],
  avoidFirstId = '',
  random: RandomSource = Math.random,
  excludedContentId?: string
): TextSample[] {
  return buildNoReplacementDeck(
    samples.filter((item) => item.id !== excludedContentId),
    (item) => item.id,
    avoidFirstId,
    random
  );
}

export function prepareRepeatedReadingSample(
  sample: TextSample,
  random: RandomSource = Math.random
): TextSample {
  const shuffledAnswers = shuffleAnswerOptions(
    sample.question.choices,
    sample.question.correctIndex,
    random
  );
  return {
    ...sample,
    question: {
      ...sample.question,
      choices: shuffledAnswers.options,
      correctIndex: shuffledAnswers.correctIndex,
    },
  };
}

export default function RepeatedReading({
  sample,
  excludedContentId,
  suggestedWpm,
  clock = monotonicNowMs,
  civilClock = epochNowMs,
  difficulty = 'easy',
  autoStart = false,
  random = Math.random,
  onReportResult,
}: Props) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const initialPool = getRepeatedReadingPool(selectedDifficulty);
  const initialSample =
    sample ??
    initialPool.find((item) => item.id !== excludedContentId) ??
    TEXT_SAMPLES[0];
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
  const sessionStartedAtEpochRef = useRef(0);
  const sessionStartedAtIsoRef = useRef('');
  const readingFinishedAtIsoRef = useRef('');
  const roundStartedAtRef = useRef(0);
  const roundDurationsRef = useRef<number[]>([]);
  const roundWpmsRef = useRef<number[]>([]);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const previousSampleIdRef = useRef(sample?.id ?? '');
  const contentDeckRef = useRef<TextSample[]>([]);
  const contentDeckKeyRef = useRef('');

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'idle') return;
    const pool = getRepeatedReadingPool(selectedDifficulty);
    const next =
      sample ??
      pool.find((item) => item.id !== excludedContentId) ??
      TEXT_SAMPLES[0];
    setActiveSample(next);
    if (sample) {
      previousSampleIdRef.current = next.id;
    }
  }, [excludedContentId, phase, sample, selectedDifficulty]);

  useEffect(() => {
    if (phase !== 'reading') return;
    const timer = setInterval(() => {
      setLiveElapsedMs(measuredElapsedMs(roundStartedAtRef.current, clock));
    }, 50);
    return () => clearInterval(timer);
  }, [clock, phase, roundIndex]);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function beginRound(index: number) {
    roundStartedAtRef.current = clock();
    setRoundIndex(index);
    setLiveElapsedMs(0);
    setPhase('reading');
  }

  function start(force = false) {
    cancelledRef.current = false;
    if (!force && phase !== 'idle' && phase !== 'ended') return;
    let nextSample = sample;
    if (nextSample) {
      contentDeckRef.current = [];
      contentDeckKeyRef.current = '';
    } else {
      const pool = getRepeatedReadingPool(selectedDifficulty);
      const deckKey = `${selectedDifficulty}:${excludedContentId ?? ''}`;
      if (
        contentDeckRef.current.length === 0 ||
        contentDeckKeyRef.current !== deckKey
      ) {
        contentDeckRef.current = buildRepeatedReadingDeck(
          pool,
          previousSampleIdRef.current,
          random,
          excludedContentId
        );
        contentDeckKeyRef.current = deckKey;
      }
      nextSample =
        contentDeckRef.current.shift() ??
        pool.find((item) => item.id !== excludedContentId) ??
        TEXT_SAMPLES[0];
    }
    previousSampleIdRef.current = nextSample.id;
    setActiveSample(
      prepareRepeatedReadingSample(nextSample, random)
    );
    reportedRef.current = false;
    roundDurationsRef.current = [];
    roundWpmsRef.current = [];
    setRoundWpms([]);
    setSelectedAnswer(null);
    setMeasurementValid(true);
    sessionStartedAtRef.current = clock();
    sessionStartedAtEpochRef.current = civilClock();
    sessionStartedAtIsoRef.current = new Date(
      sessionStartedAtEpochRef.current
    ).toISOString();
    readingFinishedAtIsoRef.current = '';
    beginRound(0);
  }

  function finishRound() {
    if (phase !== 'reading') return;
    const roundFinishedAt = clock();
    const duration = Math.max(
      1,
      measuredElapsedMs(roundStartedAtRef.current, () => roundFinishedAt)
    );
    const wpm = computeWpm(wordCount, duration);
    roundDurationsRef.current.push(duration);
    roundWpmsRef.current.push(wpm);
    setRoundWpms([...roundWpmsRef.current]);
    setLiveElapsedMs(duration);

    if (roundIndex + 1 < TOTAL_ROUNDS) {
      setPhase('between');
    } else {
      const sessionElapsedMs = measuredElapsedMs(
        sessionStartedAtRef.current,
        () => roundFinishedAt
      );
      readingFinishedAtIsoRef.current = new Date(
        sessionStartedAtEpochRef.current + sessionElapsedMs
      ).toISOString();
      setPhase('question');
    }
  }

  function submitAnswer() {
    if (selectedAnswer === null || reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;

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
      startedAtIso: sessionStartedAtIsoRef.current,
      finishedAtIso: readingFinishedAtIsoRef.current,
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
        timingMethod: 'monotonic-elapsed',
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
          {suggestedWpm !== undefined && (
            <View testID="suggested-wpm" style={styles.paceGuidance}>
              <Text style={styles.paceGuidanceLabel}>SUGGESTED PACE</Text>
              <Text style={styles.paceGuidanceValue}>
                About {suggestedWpm} WPM
              </Text>
              <Text style={styles.paceGuidanceText}>
                Treat this as guidance. Meaning still decides whether the pace
                is useful.
              </Text>
            </View>
          )}
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
            style={[styles.readingArea, readingDisplay.column]}
          >
            <ScrollView
              style={[styles.passageCard, readingDisplay.surface]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.passageTitle, readingDisplay.title]}>
                {activeSample.title}
              </Text>
              <Text
                testID="repeated-passage"
                style={[styles.passageText, readingDisplay.text]}
              >
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
  paceGuidance: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.infoSurface,
  },
  paceGuidanceLabel: {
    color: colors.infoForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  paceGuidanceValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },
  paceGuidanceText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    textAlign: 'center',
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
