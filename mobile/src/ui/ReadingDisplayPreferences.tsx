import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  DEFAULT_READING_DISPLAY_PREFERENCES,
  loadReadingDisplayPreferences,
  saveReadingDisplayPreferences,
  type ReadingDisplayPreferences,
} from '../data/readingDisplayPreferences';
import { borderRadius, colors, spacing } from '../theme/colors';
import { useAccessibilityPreferences } from '../hooks/useAccessibilityPreferences';

type ReadingDisplayContextValue = {
  preferences: ReadingDisplayPreferences;
  boldText: boolean;
  update: <Key extends keyof ReadingDisplayPreferences>(
    key: Key,
    value: ReadingDisplayPreferences[Key]
  ) => void;
  reload: () => Promise<void>;
};

const ReadingDisplayContext =
  createContext<ReadingDisplayContextValue | null>(null);

export type ReadingDisplayTokens = {
  text: TextStyle;
  title: TextStyle;
  surface: ViewStyle;
  column: ViewStyle;
};

export function getReadingDisplayTokens(
  preferences: ReadingDisplayPreferences,
  boldText = false
): ReadingDisplayTokens {
  const fontSize =
    preferences.fontSize === 'compact'
      ? 16
      : preferences.fontSize === 'large'
        ? 21
        : 18;
  const lineGap =
    preferences.lineSpacing === 'compact'
      ? 8
      : preferences.lineSpacing === 'airy'
        ? 16
        : 12;
  const maxWidth =
    preferences.measure === 'narrow'
      ? 560
      : preferences.measure === 'wide'
        ? 840
        : 700;
  const palette =
    preferences.theme === 'dark'
      ? {
          surface: '#17252D',
          text: '#F4F8FA',
          title: '#FFFFFF',
        }
      : preferences.theme === 'warm'
        ? {
            surface: '#FFF8E8',
            text: '#31291F',
            title: '#211B15',
          }
        : {
            surface: colors.cardBackground,
            text: colors.textPrimary,
            title: colors.textPrimary,
          };

  return {
    text: {
      color: palette.text,
      fontSize,
      lineHeight: fontSize + lineGap,
      fontWeight: boldText ? '600' : '400',
    },
    title: {
      color: palette.title,
    },
    surface: {
      backgroundColor: palette.surface,
    },
    column: {
      width: '100%',
      maxWidth,
      alignSelf: 'center',
    },
  };
}

export function ReadingDisplayProvider({ children }: { children: ReactNode }) {
  const { boldText } = useAccessibilityPreferences();
  const [preferences, setPreferences] = useState(
    DEFAULT_READING_DISPLAY_PREFERENCES
  );

  const reload = useCallback(async () => {
    const stored = await loadReadingDisplayPreferences();
    setPreferences(stored);
  }, []);

  useEffect(() => {
    let active = true;
    void loadReadingDisplayPreferences().then((stored) => {
      if (active) setPreferences(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ReadingDisplayContextValue>(
    () => ({
      preferences,
      boldText,
      reload,
      update: (key, nextValue) => {
        setPreferences((current) => {
          const next = { ...current, [key]: nextValue };
          void saveReadingDisplayPreferences(next).catch(() => undefined);
          return next;
        });
      },
    }),
    [boldText, preferences, reload]
  );

  return (
    <ReadingDisplayContext.Provider value={value}>
      {children}
    </ReadingDisplayContext.Provider>
  );
}

export function useReadingDisplay() {
  const context = useContext(ReadingDisplayContext);
  const preferences =
    context?.preferences ?? DEFAULT_READING_DISPLAY_PREFERENCES;
  return {
    preferences,
    tokens: getReadingDisplayTokens(preferences, context?.boldText ?? false),
    update: context?.update,
    reload: context?.reload,
  };
}

type Choice<Value extends string> = {
  value: Value;
  label: string;
};

function PreferenceRow<Value extends string>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: Value;
  choices: readonly Choice<Value>[];
  onChange: (value: Value) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View accessibilityRole="radiogroup" style={styles.choices}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${label}: ${choice.label}`}
              key={choice.value}
              onPress={() => onChange(choice.value)}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.choiceText,
                  selected && styles.choiceTextSelected,
                ]}
              >
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ReadingDisplayControl() {
  const { preferences, update } = useReadingDisplay();
  if (!update) return null;

  return (
    <View testID="reading-display-control" style={styles.container}>
      <Text style={styles.title}>Reading display</Text>
      <Text style={styles.subtitle}>
        These settings apply to connected passages, not game stimuli.
      </Text>
      <PreferenceRow
        label="Text size"
        value={preferences.fontSize}
        choices={[
          { value: 'compact', label: 'A−' },
          { value: 'comfortable', label: 'A' },
          { value: 'large', label: 'A+' },
        ]}
        onChange={(value) => update('fontSize', value)}
      />
      <PreferenceRow
        label="Line spacing"
        value={preferences.lineSpacing}
        choices={[
          { value: 'compact', label: 'Tight' },
          { value: 'comfortable', label: 'Normal' },
          { value: 'airy', label: 'Airy' },
        ]}
        onChange={(value) => update('lineSpacing', value)}
      />
      <PreferenceRow
        label="Line width"
        value={preferences.measure}
        choices={[
          { value: 'narrow', label: 'Narrow' },
          { value: 'standard', label: 'Normal' },
          { value: 'wide', label: 'Wide' },
        ]}
        onChange={(value) => update('measure', value)}
      />
      <PreferenceRow
        label="Page tone"
        value={preferences.theme}
        choices={[
          { value: 'light', label: 'Light' },
          { value: 'warm', label: 'Warm' },
          { value: 'dark', label: 'Dark' },
        ]}
        onChange={(value) => update('theme', value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    marginTop: 12,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  choice: {
    minWidth: 64,
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceTonal,
  },
  choiceText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.78,
  },
});
