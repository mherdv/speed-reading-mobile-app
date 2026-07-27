import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import {
  STRUCTURE_SCAN_ROUNDS,
  type StructureScanRound,
  type StructureScanSection,
} from '../../data/structureScanPassages';
import { levelToStars, updateProgress } from '../../data/progressStore';
import { colors, shadows, spacing } from '../../theme/colors';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'StructureScan';

type Props = {
  rounds?: readonly StructureScanRound[];
  roundCount?: number;
  previewLimitMs?: number | null;
  random?: () => number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'preview' | 'choice' | 'feedback' | 'ended';

type DifficultyConfig = {
  sectionCount: number;
  roundCount: number;
  previewLimitMs: number | null;
};

function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  if (difficulty === 'easy') {
    return { sectionCount: 3, roundCount: 3, previewLimitMs: null };
  }
  if (difficulty === 'medium') {
    return { sectionCount: 4, roundCount: 4, previewLimitMs: 35_000 };
  }
  return { sectionCount: 5, roundCount: 5, previewLimitMs: 25_000 };
}

function selectRounds(
  source: readonly StructureScanRound[],
  count: number,
  offset: number
): StructureScanRound[] {
  if (source.length === 0) return [];
  return Array.from(
    { length: Math.min(count, source.length) },
    (_, index) => source[(offset + index) % source.length]
  );
}

function shuffleWith<T>(source: readonly T[], random: () => number): T[] {
  const shuffled = [...source];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomValue = Math.min(0.999999, Math.max(0, random()));
    const swapIndex = Math.floor(randomValue * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

/**
 * Builds the section map shown for one goal. The answer is selected first so
 * reduced Easy/Medium maps can never remove it, then the complete map is
 * shuffled so answer position does not become a shortcut.
 */
export function prepareStructureScanSections(
  round: StructureScanRound,
  sectionCount: number,
  random: () => number = Math.random
): StructureScanSection[] {
  const correctSection = round.sections.find(
    (section) => section.heading === round.correctHeading
  );
  if (!correctSection) {
    return shuffleWith(
      round.sections.slice(0, Math.max(0, sectionCount)),
      random
    );
  }

  const safeCount = Math.min(
    round.sections.length,
    Math.max(1, sectionCount)
  );
  const distractors = shuffleWith(
    round.sections.filter(
      (section) => section.heading !== round.correctHeading
    ),
    random
  ).slice(0, safeCount - 1);

  return shuffleWith([correctSection, ...distractors], random);
}

export default function StructureScan({
  rounds = STRUCTURE_SCAN_ROUNDS,
  roundCount,
  previewLimitMs,
  random = Math.random,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedHeading, setSelectedHeading] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const sessionRoundsRef = useRef<StructureScanRound[]>([]);
  const sessionSectionsRef = useRef<StructureScanSection[][]>([]);
  const sessionStartedAtRef = useRef(0);
  const choiceStartedAtRef = useRef(0);
  const totalDecisionMsRef = useRef(0);
  const correctCountRef = useRef(0);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  const config = getDifficultyConfig(selectedDifficulty);
  const configuredRoundCount = roundCount ?? config.roundCount;
  const configuredPreviewLimit =
    previewLimitMs === undefined ? config.previewLimitMs : previewLimitMs;

  function clearPreviewTimer() {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearPreviewTimer();
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function beginPreviewTimer() {
    clearPreviewTimer();
    if (configuredPreviewLimit === null) return;
    previewTimerRef.current = setTimeout(() => {
      choiceStartedAtRef.current = Date.now();
      setPhase('choice');
    }, configuredPreviewLimit);
  }

  function start(force = false) {
    if (!force && phase !== 'idle' && phase !== 'ended') return;
    cancelledRef.current = false;
    reportedRef.current = false;
    correctCountRef.current = 0;
    totalDecisionMsRef.current = 0;
    setCorrectCount(0);
    setRoundIndex(0);
    setSelectedHeading(null);
    const selectedRounds = selectRounds(
      rounds,
      configuredRoundCount,
      gameProgress.totalPlays % Math.max(rounds.length, 1)
    );
    sessionRoundsRef.current = selectedRounds;
    sessionSectionsRef.current = selectedRounds.map((round) =>
      prepareStructureScanSections(round, config.sectionCount, random)
    );
    sessionStartedAtRef.current = Date.now();
    setPhase('preview');
    beginPreviewTimer();
  }

  function showChoices() {
    if (phase !== 'preview') return;
    clearPreviewTimer();
    choiceStartedAtRef.current = Date.now();
    setPhase('choice');
  }

  function chooseHeading(heading: string) {
    if (phase !== 'choice') return;
    const current = sessionRoundsRef.current[roundIndex];
    if (!current) return;
    totalDecisionMsRef.current += Math.max(
      0,
      Date.now() - choiceStartedAtRef.current
    );
    setSelectedHeading(heading);
    if (heading === current.correctHeading) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
    }
    setPhase('feedback');
  }

  function continueAfterFeedback() {
    if (phase !== 'feedback') return;
    const nextIndex = roundIndex + 1;
    if (nextIndex >= sessionRoundsRef.current.length) {
      finish();
      return;
    }
    setRoundIndex(nextIndex);
    setSelectedHeading(null);
    setPhase('preview');
    beginPreviewTimer();
  }

  function finish() {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    clearPreviewTimer();
    const now = Date.now();
    const total = sessionRoundsRef.current.length;
    const accuracy = total > 0 ? correctCountRef.current / total : 0;
    const score = Math.round(accuracy * 100);
    const averageDecisionMs =
      total > 0 ? Math.round(totalDecisionMsRef.current / total) : 0;

    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, score)
      .then(({ progress }) => {
        if (cancelledRef.current) return;
        setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(sessionStartedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs: Math.max(1, now - sessionStartedAtRef.current),
      score,
      accuracy,
      details: {
        activityType: 'structure-scan',
        rounds: total,
        correct: correctCountRef.current,
        averageDecisionMs,
        difficulty: selectedDifficulty,
      },
    });
  }

  const currentRound = sessionRoundsRef.current[roundIndex] ?? rounds[0];
  const visibleSections = sessionSectionsRef.current[roundIndex] ?? [];
  const totalRounds =
    sessionRoundsRef.current.length ||
    Math.min(configuredRoundCount, rounds.length);

  if (!currentRound) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Structure Scan</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.stageTitle}>No articles available</Text>
          <Text style={styles.bodyText}>Add at least one structured article.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Structure Scan</Text>
        <Text style={styles.subtitle}>Set a goal, preview headings, choose where to read</Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          startLabel="Start structure scan"
          onStart={() => start()}
        >
          <View style={styles.idleMeta}>
            <Text style={styles.idleMetaText}>
              {totalRounds} goals · {config.sectionCount} sections
              {configuredPreviewLimit
                ? ` · ${configuredPreviewLimit / 1000}s preview`
                : ' · untimed preview'}
            </Text>
          </View>
        </GameIdlePanel>
      )}

      {phase === 'preview' && (
        <View style={styles.stage}>
          <View style={styles.goalCard}>
            <Text style={styles.eyebrow}>
              INFORMATION GOAL · {roundIndex + 1} OF {totalRounds}
            </Text>
            <Text style={styles.goalText}>{currentRound.goal}</Text>
          </View>

          <ReadingColumn
            testID="structure-scan-reading-column"
            style={styles.readingArea}
          >
            <ScrollView
              testID="structure-scan-article"
              style={styles.articleCard}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.articleTitle}>{currentRound.title}</Text>
              {visibleSections.map((section) => (
                <View key={section.heading} style={styles.articleSection}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  <Text style={styles.bodyText}>{section.body}</Text>
                </View>
              ))}
            </ScrollView>
          </ReadingColumn>

          <Button
            testID="show-structure-choices"
            label="Choose the best section"
            onPress={showChoices}
          />
        </View>
      )}

      {phase === 'choice' && (
        <View style={styles.stage}>
          <View style={styles.goalCard}>
            <Text style={styles.eyebrow}>RETRIEVE THE ARTICLE MAP</Text>
            <Text style={styles.goalText}>{currentRound.goal}</Text>
          </View>
          <View testID="structure-scan-choices" style={styles.choicesCard}>
            {visibleSections.map((section, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={section.heading}
                key={section.heading}
                testID={`structure-choice-${index}`}
                style={({ pressed }) => [
                  styles.choice,
                  pressed && styles.choicePressed,
                ]}
                onPress={() => chooseHeading(section.heading)}
              >
                <Text style={styles.choiceNumber}>{index + 1}</Text>
                <Text style={styles.choiceText}>{section.heading}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'feedback' && (
        <View style={styles.centerStage}>
          <View
            testID="structure-scan-feedback"
            style={[
              styles.feedbackCard,
              selectedHeading === currentRound.correctHeading
                ? styles.feedbackCorrect
                : styles.feedbackReview,
            ]}
          >
            <Text style={styles.eyebrow}>
              {selectedHeading === currentRound.correctHeading
                ? 'GOOD ROUTE'
                : 'REVIEW THE ROUTE'}
            </Text>
            <Text style={styles.feedbackTitle}>
              {currentRound.correctHeading}
            </Text>
            <Text style={styles.feedbackText}>{currentRound.evidence}</Text>
          </View>
          <Button
            testID="continue-structure-scan"
            label={
              roundIndex + 1 >= totalRounds ? 'See results' : 'Next goal'
            }
            onPress={continueAfterFeedback}
          />
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.centerStage}>
          <View style={styles.feedbackCard}>
            <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
            <Text style={styles.bigMetric}>
              {correctCount}/{totalRounds}
            </Text>
            <Text style={styles.metricLabel}>information routes found</Text>
            <Text style={styles.feedbackText}>
              Use this preview skill when your goal is to locate a section.
              Read the chosen section carefully when meaning matters.
            </Text>
          </View>
          <Button
            testID="play-again"
            label="Scan another set"
            onPress={() => start(true)}
          />
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
    marginBottom: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceTonal,
  },
  idleMetaText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  stage: {
    flex: 1,
    gap: spacing.sm,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  goalCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#E9F8FA',
    borderWidth: 1,
    borderColor: '#BCE5E9',
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  goalText: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  articleCard: {
    flex: 1,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  readingArea: { flex: 1 },
  articleTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  articleSection: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  choicesCard: {
    gap: spacing.sm,
  },
  choice: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  choicePressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  choiceNumber: {
    width: 34,
    height: 34,
    textAlign: 'center',
    lineHeight: 34,
    borderRadius: 11,
    overflow: 'hidden',
    color: colors.primaryDark,
    backgroundColor: colors.surfaceTonal,
    fontWeight: '800',
  },
  choiceText: {
    flex: 1,
    marginLeft: 12,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackCard: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  feedbackCorrect: {
    borderWidth: 1,
    borderColor: '#A8DFC8',
    backgroundColor: '#F0FBF6',
  },
  feedbackReview: {
    borderWidth: 1,
    borderColor: '#F0D2A8',
    backgroundColor: '#FFF9EF',
  },
  feedbackTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 6,
  },
  feedbackText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  bigMetric: {
    color: colors.primaryDark,
    fontSize: 44,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  stageTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
  },
});
