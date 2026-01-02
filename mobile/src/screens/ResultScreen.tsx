import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { TEXT_SAMPLES } from '../data/textSamples';
import { Button } from '../ui/Button';
import { ProgressChart } from '../ui/ProgressChart';
import { CircularProgress } from '../ui/CircularProgress';
import { StarRating } from '../ui/StarRating';

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
      <Text style={styles.title}>🎉 Result</Text>

      <View style={styles.card}>
        <Text style={styles.sampleTitle}>{result.sampleTitle}</Text>

        {/* Main Score Display with Circular Progress */}
        <View style={styles.scoreContainer}>
          <CircularProgress
            percentage={accuracyPercent}
            size={140}
            strokeWidth={12}
            color="#6366F1"
            gradientEnd="#EC4899"
            centerLabel={hasWpm ? `${result.wpm}` : hasScore ? `${result.score}` : '✓'}
            subLabel={hasWpm ? 'WPM' : hasScore ? 'Score' : 'Done'}
          />
        </View>

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          <StarRating rating={starRating} size={28} />
          <Text style={styles.starsLabel}>
            {starRating >= 5 ? 'Perfect!' : starRating >= 4 ? 'Excellent!' : starRating >= 3 ? 'Good job!' : 'Keep practicing!'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>{(result.elapsedMs / 1000).toFixed(1)}s</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          
          {hasWpm && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📝</Text>
              <Text style={styles.statValue}>{result.wordCount}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
          )}
          
          {hasAccuracy && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statValue}>{Math.round(result.accuracy! * 100)}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          )}
          
          {isExercise && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>{result.comprehensionCorrect ? '✅' : '❌'}</Text>
              <Text style={styles.statValue}>{result.comprehensionCorrect ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>Comprehension</Text>
            </View>
          )}
        </View>
      </View>

      <ProgressChart gameId={result.sampleId} currentScore={result.score} />

      <View style={styles.playAgainRow}>
        <Button testID="play-again" label="🔄 Play Again" onPress={onPlayAgain} />
      </View>

      <View style={styles.row}>
        <Button testID="done" label="Back to home" onPress={onDone} />
        <View style={styles.spacer} />
        <Button testID="history" label="History" onPress={onOpenHistory} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sampleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  starsLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  playAgainRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  spacer: {
    width: 10,
  },
});
