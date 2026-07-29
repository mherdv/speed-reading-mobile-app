import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { AttemptResult } from '../domain/types';
import {
  formatDuration,
  getResultMetric,
  getSchulteGridModeLabel,
  isMeasuredReadingResult,
  isReadingResult,
  isValidProgressMeasurement,
} from '../domain/results';
import { getComprehensionCounts } from '../domain/readingPlan';
import { getComprehensionDiagnostic } from '../domain/comprehensionDiagnostics';
import { TEXT_SAMPLES } from '../data/textSamples';
import { BackButton } from '../ui/BackButton';
import { ProgressChart } from '../ui/ProgressChart';
import { ResponsiveShell } from '../ui/ResponsiveShell';
import {
  borderRadius,
  colors,
  gradients,
  shadows,
  spacing,
} from '../theme/colors';

type Props = {
  result: AttemptResult;
  onDone: () => void;
  onOpenHistory: () => void;
  onPlayAgain: () => void;
};

function encouragement(
  result: AttemptResult,
  isMeasuredReading: boolean
): { title: string; body: string } {
  if (result.details?.activityType === 'eye-comfort') {
    return result.details.comfort === 'uncomfortable'
      ? {
          title: 'Time for a longer break',
          body: 'If discomfort keeps returning, consider advice from an eye-care professional.',
        }
      : {
          title: 'Screen break complete',
          body: 'Use this as a comfort pause—not as a treatment or a reading-speed score.',
        };
  }

  if (isMeasuredReading) {
    return result.comprehensionCorrect
      ? {
          title: 'Strong pace, meaning intact',
          body: 'Keep this speed comfortable before nudging it higher.',
        }
      : {
          title: 'Speed found—now protect meaning',
          body: 'Repeat the passage a little slower and focus on its main claim.',
        };
  }

  if (result.details?.activityType === 'paced-reading') {
    return {
      title: 'Guided session complete',
      body: 'This was a configured display pace. Use a measured read next to check speed with understanding.',
    };
  }

  if (isReadingResult(result)) {
    return {
      title: 'Pacing session complete',
      body: 'Use a measured read next to check whether this pace preserves understanding.',
    };
  }

  if ((result.accuracy ?? 0) >= 0.85) {
    return {
      title: 'Sharp and controlled',
      body: 'You are ready to keep building difficulty.',
    };
  }
  return {
      title: 'Good training signal',
      body: 'This score reflects this task. Use a measured read with comprehension to check reading transfer.',
    };
}

function nextSessionRecommendation(
  result: AttemptResult,
  measuredReading: boolean
): { title: string; body: string } {
  const comprehension = getComprehensionCounts(result);
  const comprehensionPercent =
    comprehension.total > 0
      ? Math.round((comprehension.correct / comprehension.total) * 100)
      : undefined;
  const difficultyMode = result.details?.difficultyMode;
  const modeSuffix =
    difficultyMode === 'manual'
      ? ' Your manual difficulty will stay unchanged.'
      : difficultyMode === 'adaptive'
        ? ' Adaptive difficulty changes only after two consecutive at-target or below-target sessions.'
        : '';

  if (measuredReading && comprehensionPercent !== undefined) {
    if (comprehensionPercent < 80) {
      const nextWpm = Math.max(60, Math.round((result.wpm * 0.9) / 5) * 5);
      return {
        title: 'Protect meaning next',
        body: `Try about ${nextWpm} WPM on a fresh passage. Increase pace only after comprehension returns to at least 80%.`,
      };
    }
    if (comprehensionPercent >= 90) {
      return {
        title: 'Confirm before increasing',
        body: `Repeat near ${result.wpm} WPM on a comparable fresh passage. Two strong readings are a better signal than one peak.`,
      };
    }
    return {
      title: 'Hold this pace',
      body: `Stay near ${result.wpm} WPM until comprehension is consistently above 80%, then make a small increase.`,
    };
  }

  const accuracy =
    typeof result.accuracy === 'number'
      ? result.accuracy <= 1
        ? result.accuracy
        : result.accuracy / 100
      : undefined;
  if (accuracy !== undefined && accuracy >= 0.85) {
    return {
      title: 'Repeat once at this challenge',
      body: `Accuracy is stable enough to confirm this level once more before increasing it.${modeSuffix}`,
    };
  }
  if (accuracy !== undefined && accuracy < 0.7) {
    return {
      title: 'Reduce one source of difficulty',
      body: `Slow the pace or choose an easier setting, then repeat with accuracy as the priority.${modeSuffix}`,
    };
  }
  return {
    title: 'Build consistency',
    body: `Repeat this task at the same setting and aim for at least 85% accuracy.${modeSuffix}`,
  };
}

export function ResultScreen({
  result,
  onDone,
  onOpenHistory,
  onPlayAgain,
}: Props) {
  const metric = getResultMetric(result);
  const measuredReading = isMeasuredReadingResult(result);
  const isReadingExercise =
    measuredReading ||
    TEXT_SAMPLES.some((sample) => sample.id === result.sampleId);
  const hasAccuracy = typeof result.accuracy === 'number';
  const message = encouragement(result, measuredReading);
  const schulteGridModeLabel = getSchulteGridModeLabel(result);
  const nextSession = nextSessionRecommendation(result, measuredReading);
  const comprehensionDiagnostic = getComprehensionDiagnostic(result);
  const validProgressMeasurement = isValidProgressMeasurement(result);
  const activityType =
    typeof result.details?.activityType === 'string'
      ? result.details.activityType
      : undefined;
  const numberDetail = (key: string): number | undefined => {
    const value = result.details?.[key];
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
  };
  const comprehension = getComprehensionCounts(result);
  const resultMetrics: Array<{ value: string; label: string }> = [];
  if (measuredReading) {
    resultMetrics.push(
      { value: `${result.wpm}`, label: 'Personal practice WPM' },
      {
        value:
          comprehension.total > 0
            ? `${comprehension.correct}/${comprehension.total}`
            : 'Not measured',
        label: 'Comprehension',
      }
    );
  } else if (activityType === 'evidence-hunt') {
    resultMetrics.push(
      {
        value: `${numberDetail('answerCorrect') ?? 0}/${numberDetail('rounds') ?? 0}`,
        label: 'Answers correct',
      },
      {
        value: `${numberDetail('evidenceCorrect') ?? 0}/${numberDetail('evidenceRequired') ?? 0}`,
        label: 'Evidence credit',
      },
      {
        value: `${numberDetail('wrongSelections') ?? 0}`,
        label: 'Wrong selections',
      },
      {
        value:
          (numberDetail('locatedRounds') ?? 0) > 0
            ? formatDuration(numberDetail('medianLocateMs') ?? 0)
            : 'Not recorded',
        label: 'Median locate time',
      }
    );
  } else if (activityType === 'context-builder') {
    const attempts = numberDetail('attempts') ?? 0;
    resultMetrics.push(
      {
        value: `${numberDetail('meaningCorrect') ?? 0}/${attempts}`,
        label: 'Meanings correct',
      },
      {
        value: `${numberDetail('clueCorrect') ?? 0}/${attempts}`,
        label: 'Clues correct',
      },
      { value: `${attempts}`, label: 'Attempted rounds' },
      {
        value: `${numberDetail('omittedRounds') ?? 0}`,
        label: 'Omitted rounds',
      }
    );
  } else {
    resultMetrics.push({
      value: `${metric.value}`,
      label: metric.label,
    });
    if (hasAccuracy) {
      resultMetrics.push({
        value: `${Math.round((result.accuracy ?? 0) * 100)}%`,
        label: 'Task accuracy',
      });
    }
  }
  resultMetrics.push({
    value: formatDuration(result.elapsedMs),
    label:
      activityType === 'paced-reading'
        ? 'Active guide time'
        : isReadingResult(result)
          ? 'Reading time'
          : 'Session time',
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ResponsiveShell>
      <View style={styles.header}>
        <BackButton onPress={onDone} />
        <Text style={styles.headerTitle}>Session complete</Text>
        <View style={styles.headerSpacer} />
      </View>

      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.heroCard}
      >
        <Text
          style={[
            styles.activityName,
            schulteGridModeLabel && styles.activityNameWithMode,
          ]}
        >
          {result.sampleTitle}
        </Text>
        {schulteGridModeLabel && (
          <Text testID="schulte-grid-mode" style={styles.modeBadge}>
            {schulteGridModeLabel}
          </Text>
        )}
        <Text style={styles.messageTitle}>{message.title}</Text>
        <Text style={styles.messageBody}>{message.body}</Text>
      </LinearGradient>

      {!validProgressMeasurement && (
        <View testID="result-quality-warning" style={styles.qualityWarning}>
          <Text style={styles.qualityWarningTitle}>Raw attempt saved</Text>
          <Text style={styles.qualityWarningText}>
            This reading was too short or fast to use for bests, trends, or
            adaptive calibration.
          </Text>
        </View>
      )}

      <View testID="result-metric-cards" style={styles.statsGrid}>
        {resultMetrics.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View testID="next-session-coaching" style={styles.coachingCard}>
        <Text style={styles.coachingEyebrow}>NEXT SESSION</Text>
        <Text style={styles.coachingTitle}>{nextSession.title}</Text>
        <Text style={styles.coachingText}>{nextSession.body}</Text>
        {comprehensionDiagnostic.available && (
          <Text style={styles.coachingAction}>
            {comprehensionDiagnostic.nextAction}
          </Text>
        )}
      </View>

      {comprehensionDiagnostic.wrongAnswers.length > 0 && (
        <View testID="comprehension-review" style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Review what changed the answer</Text>
          <Text style={styles.reviewSubtitle}>
            Use the explanation, then reread only the relevant part when you
            train again.
          </Text>
          {comprehensionDiagnostic.wrongAnswers.slice(0, 3).map((item) => (
            <View key={item.questionId} style={styles.reviewItem}>
              <Text style={styles.reviewType}>{item.typeLabel}</Text>
              <Text style={styles.reviewPrompt}>{item.prompt}</Text>
              <Text style={styles.reviewWrong}>
                Your answer: {item.selectedAnswer}
              </Text>
              <Text style={styles.reviewCorrect}>
                Correct answer: {item.correctAnswer}
              </Text>
              <Text style={styles.reviewRationale}>{item.rationale}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Recent progress</Text>
            <Text style={styles.chartSubtitle}>Compare like-for-like sessions</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View full history"
            onPress={onOpenHistory}
            hitSlop={8}
          >
            <Text style={styles.historyLink}>View all</Text>
          </Pressable>
        </View>
        <ProgressChart gameId={result.sampleId} currentResult={result} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isReadingExercise ? 'Read this passage again' : 'Play this game again'}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
        onPress={onPlayAgain}
      >
        <LinearGradient
          colors={gradients.button.colors}
          start={gradients.button.start}
          end={gradients.button.end}
          style={styles.primaryButtonGradient}
        >
          <Text style={styles.primaryButtonText}>
            {isReadingExercise ? 'Read again' : 'Train again'}
          </Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Return home"
        style={({ pressed }) => [
          styles.homeButton,
          pressed && styles.pressed,
        ]}
        onPress={onDone}
      >
        <Text style={styles.homeButtonText}>Back to home</Text>
      </Pressable>
      </ResponsiveShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    userSelect: 'none',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  coachingCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTonal,
  },
  coachingEyebrow: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  coachingTitle: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  coachingText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  coachingAction: {
    marginTop: 9,
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  reviewCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  reviewTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  reviewSubtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  reviewItem: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewType: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  reviewPrompt: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  reviewWrong: {
    marginTop: 8,
    color: colors.errorForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  reviewCorrect: {
    marginTop: 2,
    color: colors.successForeground,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  reviewRationale: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  qualityWarning: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warningForeground,
  },
  qualityWarningTitle: {
    color: colors.warningForeground,
    fontSize: 14,
    fontWeight: '800',
  },
  qualityWarningText: {
    color: colors.warningForeground,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  heroCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  activityName: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  activityNameWithMode: {
    marginBottom: spacing.xs,
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    color: colors.primaryDark,
    backgroundColor: colors.infoSurface,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  messageTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  messageBody: {
    maxWidth: 290,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statCard: {
    width: '48.5%',
    minHeight: 82,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  statCardSuccess: {
    backgroundColor: '#EAF8F2',
  },
  statCardReview: {
    backgroundColor: '#FFF4E8',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  successText: {
    color: colors.success,
  },
  reviewText: {
    color: colors.warning,
  },
  chartCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  historyLink: {
    minHeight: 44,
    paddingVertical: 13,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    overflow: 'hidden',
    marginTop: spacing.md,
    borderRadius: 17,
    ...shadows.medium,
  },
  primaryButtonGradient: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  homeButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.cardBackground,
  },
  homeButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
