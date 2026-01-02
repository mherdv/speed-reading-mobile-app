import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { TEXT_SAMPLES } from '../data/textSamples';
import { Button } from '../ui/Button';
import { ProgressChart } from '../ui/ProgressChart';

type Props = {
  result: AttemptResult;
  onDone: () => void;
  onOpenHistory: () => void;
  onPlayAgain: () => void;
};

export function ResultScreen({ result, onDone, onOpenHistory, onPlayAgain }: Props) {
  const hasWpm = result.wordCount > 0 && result.wpm > 0;
  const hasScore = typeof result.score === 'number';
  const hasAccuracy = typeof result.accuracy === 'number';
  const isExercise = TEXT_SAMPLES.some((s) => s.id === result.sampleId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Result</Text>

      <View style={styles.card}>
        <Text style={styles.sampleTitle}>{result.sampleTitle}</Text>

        {hasWpm ? (
          <Text style={styles.big}>{result.wpm} WPM</Text>
        ) : hasScore ? (
          <Text style={styles.big}>Score: {result.score}</Text>
        ) : (
          <Text style={styles.big}>Completed</Text>
        )}

        <Text style={styles.meta}>Time: {(result.elapsedMs / 1000).toFixed(1)}s</Text>

        {hasWpm ? <Text style={styles.meta}>Words: {result.wordCount}</Text> : null}
        {hasAccuracy ? <Text style={styles.meta}>Accuracy: {Math.round(result.accuracy! * 100)}%</Text> : null}
        {hasScore && !hasWpm ? <Text style={styles.meta}>Score: {result.score}</Text> : null}

        {isExercise ? (
          <Text style={styles.meta}>
            Comprehension: {result.comprehensionCorrect ? 'Correct' : 'Incorrect'}
          </Text>
        ) : null}
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    color: '#111827',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  big: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 8,
    color: '#111827',
  },
  meta: {
    color: '#374151',
    marginBottom: 4,
  },
  playAgainRow: {
    marginTop: 16,
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
