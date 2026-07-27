import React, { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type {
  Difficulty,
  DifficultyMode,
} from '../data/difficultyPreferences';
import { getGameCatalogEntry } from '../data/gameCatalog';
import { colors } from '../theme/colors';

type DifficultyOption = {
  value: Difficulty;
  label: string;
  helper: string;
};

type DifficultyControlValue = {
  gameId: string;
  mode: DifficultyMode;
  difficulty: Difficulty;
  adaptiveDifficulty: Difficulty;
  allowsAdaptive: boolean;
  options: readonly DifficultyOption[];
  onChange: (mode: DifficultyMode, difficulty: Difficulty) => void;
};

const DifficultyControlContext = createContext<DifficultyControlValue | null>(
  null
);

const DEFAULT_OPTIONS: readonly DifficultyOption[] = [
  { value: 'easy', label: 'Easy', helper: 'A calmer starting point' },
  { value: 'medium', label: 'Medium', helper: 'More speed or complexity' },
  { value: 'hard', label: 'Hard', helper: 'The strongest challenge' },
];

export function getDifficultyOptions(
  gameId: string
): readonly DifficultyOption[] {
  const entry = getGameCatalogEntry(gameId);
  if (entry) {
    return (['easy', 'medium', 'hard'] as const).map((value) => ({
      value,
      ...entry.difficulty[value],
    }));
  }
  return DEFAULT_OPTIONS;
}

export function GameDifficultyProvider({
  value,
  children,
}: {
  value: DifficultyControlValue;
  children: React.ReactNode;
}) {
  return (
    <DifficultyControlContext.Provider value={value}>
      {children}
    </DifficultyControlContext.Provider>
  );
}

export function useGameDifficultyControl() {
  return useContext(DifficultyControlContext);
}

export function GameDifficultyControl() {
  const control = useGameDifficultyControl();
  if (!control) return null;

  const currentLabel =
    control.options.find((option) => option.value === control.difficulty)
      ?.label ?? control.difficulty;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Choose difficulty"
      style={styles.container}
      testID="difficulty-control"
    >
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Difficulty</Text>
        <Text style={styles.current}>
          {control.mode === 'adaptive'
            ? `Adaptive · ${currentLabel}`
            : `${currentLabel} · Manual`}
        </Text>
      </View>

      <View style={styles.options}>
        {control.allowsAdaptive && (
          <DifficultyButton
            selected={control.mode === 'adaptive'}
            label="Adaptive"
            helper={`Tracks your level · currently ${control.adaptiveDifficulty}`}
            testID="difficulty-choice-adaptive"
            onPress={() =>
              control.onChange('adaptive', control.adaptiveDifficulty)
            }
          />
        )}
        {control.options.map((option) => (
          <DifficultyButton
            key={option.value}
            selected={
              control.mode === 'manual' &&
              control.difficulty === option.value
            }
            label={option.label}
            helper={option.helper}
            testID={`difficulty-choice-${option.value}`}
            onPress={() => control.onChange('manual', option.value)}
          />
        ))}
      </View>

      {!control.allowsAdaptive && (
        <Text style={styles.lockedNote}>
          This activity stays at your chosen setting until you change it.
        </Text>
      )}
    </View>
  );
}

function DifficultyButton({
  selected,
  label,
  helper,
  testID,
  onPress,
}: {
  selected: boolean;
  label: string;
  helper: string;
  testID: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}. ${helper}`}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
          {label}
        </Text>
        <Text style={styles.optionHelper}>{helper}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTonal,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  current: {
    flexShrink: 1,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  options: {
    gap: 8,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.cardBackground,
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionCopy: {
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
  optionHelper: {
    marginTop: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  lockedNote: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.76,
  },
});
