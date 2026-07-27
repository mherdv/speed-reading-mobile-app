import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FLASH_PACE_STEP, clampWpm } from '../games/flashPacing';
import { colors } from '../theme/colors';

type Props = {
  wpm: number;
  minWpm: number;
  maxWpm: number;
  onChange: (wpm: number) => void;
  step?: number;
  disabled?: boolean;
  label?: string;
  correctAnswersToIncrease?: number;
  failureLimit?: number;
};

export function FlashPaceControl({
  wpm,
  minWpm,
  maxWpm,
  onChange,
  step = FLASH_PACE_STEP,
  disabled = false,
  label = 'Starting pace',
  correctAnswersToIncrease = 4,
  failureLimit = 3,
}: Props) {
  const bounds = { minWpm, maxWpm, step };
  const decreaseDisabled = disabled || wpm <= minWpm;
  const increaseDisabled = disabled || wpm >= maxWpm;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease pace by ${step} words per minute`}
          accessibilityState={{ disabled: decreaseDisabled }}
          disabled={decreaseDisabled}
          testID="pace-decrease"
          onPress={() => onChange(clampWpm(wpm - step, bounds))}
          style={({ pressed }) => [
            styles.button,
            decreaseDisabled && styles.buttonDisabled,
            pressed && !decreaseDisabled && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>

        <View
          accessibilityRole="text"
          accessibilityLabel={`${wpm} words per minute`}
          testID="pace-value"
          style={styles.valueBox}
        >
          <Text style={styles.value}>{wpm}</Text>
          <Text style={styles.unit}>WPM</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase pace by ${step} words per minute`}
          accessibilityState={{ disabled: increaseDisabled }}
          disabled={increaseDisabled}
          testID="pace-increase"
          onPress={() => onChange(clampWpm(wpm + step, bounds))}
          style={({ pressed }) => [
            styles.button,
            increaseDisabled && styles.buttonDisabled,
            pressed && !increaseDisabled && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Auto pace: +{step} after {correctAnswersToIncrease} correct · session
        {' '}ends after {failureLimit} misses
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.surfaceTonal,
  },
  buttonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.disabledSurface,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: colors.primaryDark,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 30,
  },
  valueBox: {
    minWidth: 104,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
  },
  value: {
    color: colors.onInteractive,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 23,
  },
  unit: {
    color: colors.onInteractive,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
    textAlign: 'center',
  },
});
