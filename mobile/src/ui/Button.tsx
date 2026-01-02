import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function Button({ label, onPress, disabled, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        disabled ? styles.disabled : styles.enabled,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  enabled: {
    backgroundColor: '#111827',
  },
  disabled: {
    backgroundColor: '#9CA3AF',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
