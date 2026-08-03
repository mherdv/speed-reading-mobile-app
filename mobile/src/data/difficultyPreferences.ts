import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeGameId } from './gameIds';

const STORAGE_KEY = 'speed-reading:difficulty-preferences:v1';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyMode = 'adaptive' | 'manual';

export type DifficultyPreference = {
  mode: DifficultyMode;
  difficulty: Difficulty;
};

type DifficultyPreferenceStore = Record<string, DifficultyPreference>;

const MANUAL_ONLY_GAME_IDS = new Set([
  'SchulteNumbers',
  'SchulteLetters',
  'SchulteMix',
  'EyeMovementTraining',
]);

const ADAPTIVE_DEFAULT_GAME_IDS = new Set([
  'RepeatedReading',
  'WpmTest',
  'MainIdeaSprint',
  'StructureScan',
  'ComprehensionTest',
  'CenterLineReader',
  'TextSearch',
]);

export function allowsAdaptiveDifficulty(gameId: string): boolean {
  return !MANUAL_ONLY_GAME_IDS.has(normalizeGameId(gameId));
}

export function getDefaultDifficultyPreference(gameId: string): DifficultyPreference {
  const normalizedId = normalizeGameId(gameId);
  return {
    mode:
      allowsAdaptiveDifficulty(normalizedId) &&
      ADAPTIVE_DEFAULT_GAME_IDS.has(normalizedId)
        ? 'adaptive'
        : 'manual',
    difficulty: 'easy',
  };
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function isDifficultyMode(value: unknown): value is DifficultyMode {
  return value === 'adaptive' || value === 'manual';
}

function sanitizePreference(
  gameId: string,
  value: unknown
): DifficultyPreference {
  const fallback = getDefaultDifficultyPreference(gameId);
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<DifficultyPreference>;
  const difficulty = isDifficulty(candidate.difficulty)
    ? candidate.difficulty
    : fallback.difficulty;
  const mode =
    isDifficultyMode(candidate.mode) && allowsAdaptiveDifficulty(gameId)
      ? candidate.mode
      : fallback.mode;

  return { mode, difficulty };
}

export async function loadAllDifficultyPreferences(): Promise<DifficultyPreferenceStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const normalized: DifficultyPreferenceStore = {};
    for (const [gameId, preference] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      const normalizedId = normalizeGameId(gameId);
      normalized[normalizedId] = sanitizePreference(normalizedId, preference);
    }
    return normalized;
  } catch {
    return {};
  }
}

export async function loadDifficultyPreference(
  gameId: string
): Promise<DifficultyPreference> {
  const normalizedId = normalizeGameId(gameId);
  const all = await loadAllDifficultyPreferences();
  return sanitizePreference(normalizedId, all[normalizedId]);
}

export async function saveDifficultyPreference(
  gameId: string,
  preference: DifficultyPreference
): Promise<void> {
  const normalizedId = normalizeGameId(gameId);
  const all = await loadAllDifficultyPreferences();
  all[normalizedId] = sanitizePreference(normalizedId, preference);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
