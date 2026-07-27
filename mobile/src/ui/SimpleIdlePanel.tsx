import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors } from '../theme/colors';
import { GameDifficultyControl } from './GameDifficultyControl';
import { useMarkGameSessionActive } from './GameSessionActivity';

type Props = {
  description: string;
  onStart: () => void;
  startLabel?: string;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
};

export function SimpleIdlePanel({
  description,
  onStart,
  startLabel = 'Start Game',
  testID = 'start-button',
  containerStyle,
  descriptionStyle,
  buttonStyle,
  buttonTextStyle,
  children,
}: Props) {
  const markSessionActive = useMarkGameSessionActive();

  const handleStart = () => {
    markSessionActive();
    onStart();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      style={[styles.scroll, containerStyle]}
      testID="simple-idle-scroll"
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>FOCUSED DRILL</Text>
        <Text style={[styles.descriptionText, descriptionStyle]}>{description}</Text>
        <GameDifficultyControl />
        {children}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={startLabel}
          testID={testID}
          style={({ pressed }) => [
            styles.startButton,
            buttonStyle,
            pressed && styles.pressed,
          ]}
          onPress={handleStart}
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
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 14,
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
});
