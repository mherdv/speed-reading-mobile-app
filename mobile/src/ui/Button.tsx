import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  disabled,
  testID,
  variant = 'primary',
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'destructive' && styles.destructive,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[
        styles.label,
        variant === 'secondary' && styles.labelSecondary,
        variant === 'destructive' && styles.labelDestructive,
        disabled && styles.labelDisabled,
      ]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  destructive: {
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.errorForeground,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    backgroundColor: colors.backgroundDark,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  labelSecondary: {
    color: colors.textPrimary,
  },
  labelDestructive: {
    color: colors.errorForeground,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
});
