import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TextSample } from '../domain/types';
import { countWords, computeWpm } from '../domain/wpm';
import { Button } from '../ui/Button';

type Props = {
  sample: TextSample;
  onFinish: (payload: {
    startedAtIso: string;
    finishedAtIso: string;
    elapsedMs: number;
    wordCount: number;
    wpm: number;
    comprehensionCorrect: boolean;
  }) => void;
  onCancel: () => void;
};

type Phase = 'reading' | 'question';

export function ExerciseScreen({ sample, onFinish, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('reading');
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const wordCount = useMemo(() => countWords(sample.text), [sample.text]);

  function start() {
    setStartedAt(new Date());
  }

  function finishReading() {
    if (!startedAt) return;
    setPhase('question');
  }

  function submitAnswer() {
    if (!startedAt) return;
    if (selectedIndex === null) return;

    const finishedAt = new Date();
    const elapsedMs = finishedAt.getTime() - startedAt.getTime();
    const wpm = computeWpm(wordCount, elapsedMs);
    const comprehensionCorrect = selectedIndex === sample.question.correctIndex;

    onFinish({
      startedAtIso: startedAt.toISOString(),
      finishedAtIso: finishedAt.toISOString(),
      elapsedMs,
      wordCount,
      wpm,
      comprehensionCorrect,
    });
  }

  const canFinishReading = startedAt !== null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{sample.title}</Text>

      {phase === 'reading' ? (
        <>
          <Text style={styles.hint}>Tap Start, read, then Finish.</Text>
          <ScrollView style={styles.reader} contentContainerStyle={styles.readerInner}>
            <Text style={styles.text}>{sample.text}</Text>
          </ScrollView>

          <View style={styles.row}>
            <Button testID="cancel" label="Back" onPress={onCancel} />
            <View style={styles.spacer} />
            <Button
              testID="start-reading"
              label={startedAt ? 'Started' : 'Start'}
              onPress={start}
              disabled={startedAt !== null}
            />
            <View style={styles.spacer} />
            <Button
              testID="finish-reading"
              label="Finish"
              onPress={finishReading}
              disabled={!canFinishReading}
            />
          </View>

          <Text style={styles.meta}>Words: {wordCount}</Text>
        </>
      ) : (
        <>
          <Text style={styles.hint}>Quick comprehension check.</Text>
          <View style={styles.card}>
            <Text style={styles.question}>{sample.question.prompt}</Text>

            {sample.question.choices.map((c, idx) => {
              const selected = idx === selectedIndex;
              return (
                <View key={c} style={styles.choiceRow}>
                  <Button
                    testID={`choice-${idx}`}
                    label={selected ? `✓ ${c}` : c}
                    onPress={() => setSelectedIndex(idx)}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.row}>
            <Button testID="back-to-reading" label="Back" onPress={() => setPhase('reading')} />
            <View style={styles.spacer} />
            <Button
              testID="submit-answer"
              label="Submit"
              disabled={selectedIndex === null}
              onPress={submitAnswer}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111827',
  },
  hint: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 10,
  },
  reader: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  readerInner: {
    padding: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  meta: {
    marginTop: 10,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  spacer: {
    width: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'white',
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  choiceRow: {
    marginBottom: 8,
  },
});
