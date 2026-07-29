import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing } from '../theme/colors';
import type { SchulteGridMode } from './schulteShared';

type Props = {
  value: SchulteGridMode;
  onChange: (value: SchulteGridMode) => void;
};

const OPTIONS: ReadonlyArray<{
  value: SchulteGridMode;
  label: string;
  helper: string;
}> = [
  {
    value: 'stable',
    label: 'Stable grid',
    helper: 'Cells stay in place and completed targets are marked.',
  },
  {
    value: 'reshuffle',
    label: 'Shuffle after each tap',
    helper: 'Every correct non-final tap moves the grid; completed cells stay uncolored.',
  },
];

export function SchulteGridModeControl({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Grid movement</Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={`${option.label}. ${option.helper}`}
              accessibilityState={{ checked: selected }}
              key={option.value}
              testID={`schulte-mode-${option.value}`}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <View style={styles.copy}>
                <Text
                  style={[
                    styles.optionLabel,
                    selected && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.helper}>{option.helper}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBackground,
  },
  optionSelected: {
    borderColor: colors.interactivePrimary,
    backgroundColor: colors.infoSurface,
  },
  optionPressed: {
    opacity: 0.82,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textMuted,
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: colors.interactivePrimary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.interactivePrimary,
  },
  copy: {
    flex: 1,
    marginLeft: 10,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: colors.primaryDark,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
});
