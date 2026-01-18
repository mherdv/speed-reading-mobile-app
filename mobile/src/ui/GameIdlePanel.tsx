import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  description: string;
  level: number;
  stars: number;
  onStart: () => void;
  startLabel?: string;
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
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.descriptionText, descriptionStyle]}>{description}</Text>
      <View style={[styles.progressInfo, progressInfoStyle]}>
        <Text style={[styles.levelLabel, levelLabelStyle]}>Level {level}</Text>
        <Text style={[styles.starsDisplay, starsStyle]}>
          {'★'.repeat(stars)}
          {'☆'.repeat(5 - stars)}
        </Text>
      </View>
      {children}
      <Pressable testID={testID} style={[styles.startButton, buttonStyle]} onPress={onStart}>
        <Text style={[styles.startButtonText, buttonTextStyle]}>{startLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: 16,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  startButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
