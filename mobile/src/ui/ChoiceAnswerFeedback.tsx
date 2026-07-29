import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  answerLabel: string;
  testID: string;
};

export function ChoiceAnswerFeedback({
  correct,
  selectedAnswer,
  correctAnswer,
  answerLabel,
  testID,
}: Props) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.card,
        correct ? styles.correctCard : styles.reviewCard,
      ]}
      testID={testID}
    >
      <Text style={[styles.title, correct ? styles.correctTitle : styles.reviewTitle]}>
        {correct ? 'Correct' : 'Review this answer'}
      </Text>

      {!correct && (
        <View style={styles.answerGroup}>
          <Text style={styles.label}>You chose</Text>
          <Text
            style={[styles.answer, styles.selectedAnswer]}
            testID={`${testID}-selected`}
          >
            {selectedAnswer}
          </Text>
        </View>
      )}

      <View style={styles.answerGroup}>
        <Text style={styles.label}>{answerLabel}</Text>
        <Text
          style={[styles.answer, correct && styles.correctAnswer]}
          testID={`${testID}-correct`}
        >
          {correctAnswer}
        </Text>
      </View>

      {!correct && (
        <Text style={styles.hint}>
          Compare both carefully before the next flash.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  correctCard: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successForeground,
  },
  reviewCard: {
    backgroundColor: colors.errorSurface,
    borderColor: colors.errorForeground,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  correctTitle: {
    color: colors.successForeground,
  },
  reviewTitle: {
    color: colors.errorForeground,
  },
  answerGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  answer: {
    maxWidth: '100%',
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 27,
    textAlign: 'center',
  },
  selectedAnswer: {
    color: colors.errorForeground,
  },
  correctAnswer: {
    color: colors.successForeground,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
