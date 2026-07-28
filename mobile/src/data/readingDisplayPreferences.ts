import AsyncStorage from '@react-native-async-storage/async-storage';

export const READING_DISPLAY_STORAGE_KEY =
  'speed-reading:reading-display:v1';

export type ReadingFontSize = 'compact' | 'comfortable' | 'large';
export type ReadingLineSpacing = 'compact' | 'comfortable' | 'airy';
export type ReadingMeasure = 'narrow' | 'standard' | 'wide';
export type ReadingTheme = 'light' | 'warm' | 'dark';

export type ReadingDisplayPreferences = {
  fontSize: ReadingFontSize;
  lineSpacing: ReadingLineSpacing;
  measure: ReadingMeasure;
  theme: ReadingTheme;
};

export const DEFAULT_READING_DISPLAY_PREFERENCES: ReadingDisplayPreferences = {
  fontSize: 'comfortable',
  lineSpacing: 'comfortable',
  measure: 'standard',
  theme: 'light',
};

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : fallback;
}

export function sanitizeReadingDisplayPreferences(
  value: unknown
): ReadingDisplayPreferences {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_READING_DISPLAY_PREFERENCES };
  }
  const candidate = value as Partial<ReadingDisplayPreferences>;
  return {
    fontSize: oneOf(
      candidate.fontSize,
      ['compact', 'comfortable', 'large'] as const,
      DEFAULT_READING_DISPLAY_PREFERENCES.fontSize
    ),
    lineSpacing: oneOf(
      candidate.lineSpacing,
      ['compact', 'comfortable', 'airy'] as const,
      DEFAULT_READING_DISPLAY_PREFERENCES.lineSpacing
    ),
    measure: oneOf(
      candidate.measure,
      ['narrow', 'standard', 'wide'] as const,
      DEFAULT_READING_DISPLAY_PREFERENCES.measure
    ),
    theme: oneOf(
      candidate.theme,
      ['light', 'warm', 'dark'] as const,
      DEFAULT_READING_DISPLAY_PREFERENCES.theme
    ),
  };
}

export async function loadReadingDisplayPreferences(): Promise<ReadingDisplayPreferences> {
  try {
    const raw = await AsyncStorage.getItem(READING_DISPLAY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_READING_DISPLAY_PREFERENCES };
    return sanitizeReadingDisplayPreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_READING_DISPLAY_PREFERENCES };
  }
}

export async function saveReadingDisplayPreferences(
  preferences: ReadingDisplayPreferences
): Promise<void> {
  await AsyncStorage.setItem(
    READING_DISPLAY_STORAGE_KEY,
    JSON.stringify(sanitizeReadingDisplayPreferences(preferences))
  );
}

