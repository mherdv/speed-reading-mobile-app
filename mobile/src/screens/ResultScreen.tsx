import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { AttemptResult } from '../domain/types';
import {
  formatDuration,
  getResultMetric,
  isMeasuredReadingResult,
  isReadingResult,
  isValidProgressMeasurement,
} from '../domain/results';
import { getComprehensionCounts } from '../domain/readingPlan';
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
    label: isReadingResult(result) ? 'Reading time' : 'Session time',
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
        <Text style={styles.activityName}>{result.sampleTitle}</Text>
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
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
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
