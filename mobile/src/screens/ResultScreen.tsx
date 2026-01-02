import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { AttemptResult } from '../domain/types';
import { TEXT_SAMPLES } from '../data/textSamples';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { ProgressChart } from '../ui/ProgressChart';
import { CircularProgress } from '../ui/CircularProgress';
import { StarRating } from '../ui/StarRating';
import { colors } from '../theme/colors';

type Props = {
  result: AttemptResult;
  onDone: () => void;
  onOpenHistory: () => void;
  onPlayAgain: () => void;
};

/** Calculate star rating (1-5) based on performance */
function calculateStars(result: AttemptResult): number {
  // Use accuracy if available, otherwise estimate from score
  if (typeof result.accuracy === 'number') {
    const acc = result.accuracy;
    if (acc >= 0.95) return 5;
    if (acc >= 0.85) return 4;
    if (acc >= 0.70) return 3;
    if (acc >= 0.50) return 2;
    return 1;
  }
  // Fallback: use score thresholds (assuming typical game scores)
  if (typeof result.score === 'number') {
    const score = result.score;
    if (score >= 25) return 5;
    if (score >= 20) return 4;
    if (score >= 15) return 3;
    if (score >= 10) return 2;
    return 1;
  }
  return 3; // Default
}

export function ResultScreen({ result, onDone, onOpenHistory, onPlayAgain }: Props) {
  const hasWpm = result.wordCount > 0 && result.wpm > 0;
  const hasScore = typeof result.score === 'number';
  const hasAccuracy = typeof result.accuracy === 'number';
  const isExercise = TEXT_SAMPLES.some((s) => s.id === result.sampleId);
  
  const starRating = calculateStars(result);
  const accuracyPercent = hasAccuracy ? Math.round(result.accuracy! * 100) : (hasScore ? Math.min(100, (result.score! / 25) * 100) : 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onDone} />
        <Text style={styles.title}>Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        {/* Main Score Display with Circular Progress */}
        <View style={styles.scoreContainer}>
          <CircularProgress
            percentage={accuracyPercent}
            size={160}
            strokeWidth={14}
            color={colors.primary}
            gradientEnd="#9B7BD4"
            centerLabel={hasWpm ? `${result.wpm}` : hasScore ? `${result.score}` : `${accuracyPercent}%`}
            subLabel={hasWpm ? 'WPM' : hasScore ? 'Score' : 'Score'}
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{(result.elapsedMs / 1000).toFixed(0)}s</Text>
          </View>
          
          {hasWpm && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Words</Text>
              <Text style={styles.statValue}>{result.wordCount}</Text>
            </View>
          )}
          
          {hasAccuracy && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{Math.round(result.accuracy! * 100)}%</Text>
            </View>
          )}
          
          {isExercise && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Comprehension</Text>
              <Text style={[styles.statValue, { color: result.comprehensionCorrect ? colors.success : colors.error }]}>
                {result.comprehensionCorrect ? '88%' : '45%'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Recent Progress Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Recent Progress</Text>
        <ProgressChart gameId={result.sampleId} currentScore={result.score} />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Pressable style={styles.playAgainButton} onPress={onPlayAgain}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.playAgainGradient}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </LinearGradient>
        </Pressable>
        
        <Pressable style={styles.homeButton} onPress={onDone}>
          <Text style={styles.homeButtonText}>Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playAgainButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playAgainGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  homeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
