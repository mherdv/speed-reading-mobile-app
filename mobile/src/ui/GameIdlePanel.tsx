import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

import { colors } from '../theme/colors';
import { levelToDifficulty } from '../data/progressStore';
import {
  GameDifficultyControl,
  useGameDifficultyControl,
} from './GameDifficultyControl';

type Props = {
  description: string;
  level: number;
  stars: number;
  onStart: () => void;
  startLabel?: string;
  startDisabled?: boolean;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  progressInfoStyle?: StyleProp<ViewStyle>;
  levelLabelStyle?: StyleProp<TextStyle>;
  starsStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
};

export function GameIdlePanel({
  description,
  level,
  stars,
  onStart,
  startLabel = 'Start Game',
  startDisabled = false,
  testID = 'start-button',
  containerStyle,
  descriptionStyle,
  progressInfoStyle,
  levelLabelStyle,
  starsStyle,
  buttonStyle,
  buttonTextStyle,
  children,
}: Props) {
  const difficultyControl = useGameDifficultyControl();
  const difficulty =
    difficultyControl?.difficulty ?? levelToDifficulty(level);
  const difficultyLabel =
    difficultyControl?.options.find((option) => option.value === difficulty)
      ?.label ?? difficulty;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      style={[styles.scroll, containerStyle]}
      testID="game-idle-scroll"
    >
      <View style={styles.card}>
        <View style={styles.difficultyPill}>
          <Text style={styles.difficultyText}>
            {difficultyControl?.mode === 'adaptive'
              ? `ADAPTIVE · ${difficultyLabel.toUpperCase()}`
              : difficultyLabel.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.descriptionText, descriptionStyle]}>{description}</Text>
        {difficultyControl ? (
          <View style={[styles.progressInfo, progressInfoStyle]}>
            <Text style={[styles.levelLabel, levelLabelStyle]}>
              {difficultyControl.mode === 'adaptive'
                ? `Adaptive target: ${difficultyLabel}`
                : `Manual setting: ${difficultyLabel}`}
            </Text>
          </View>
        ) : (
          <View style={[styles.progressInfo, progressInfoStyle]}>
            <Text style={[styles.levelLabel, levelLabelStyle]}>Level {level}</Text>
            <Text
              accessibilityLabel={`${stars} of 5 difficulty stars`}
              style={[styles.starsDisplay, starsStyle]}
            >
              {'★'.repeat(stars)}
              {'☆'.repeat(5 - stars)}
            </Text>
          </View>
        )}
        <GameDifficultyControl />
        {children}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={startLabel}
          accessibilityState={{ disabled: startDisabled }}
          disabled={startDisabled}
          testID={testID}
          style={({ pressed }) => [
            styles.startButton,
            buttonStyle,
            startDisabled && styles.disabled,
            pressed && !startDisabled && styles.pressed,
          ]}
          onPress={onStart}
        >
          <Text style={[styles.startButtonText, buttonTextStyle]}>{startLabel}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 2,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  difficultyPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceTonal,
    marginBottom: 14,
  },
  difficultyText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 21,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  starsDisplay: {
    fontSize: 16,
    color: colors.starActive,
    marginTop: 6,
  },
  startButton: {
    minWidth: 160,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  startButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.48,
  },
});
