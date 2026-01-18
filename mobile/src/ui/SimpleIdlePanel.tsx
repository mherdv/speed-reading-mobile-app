import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

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
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.descriptionText, descriptionStyle]}>{description}</Text>
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
