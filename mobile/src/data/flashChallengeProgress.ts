import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Difficulty } from './difficultyPreferences';
import { normalizeGameId } from './gameIds';

export const FLASH_CHALLENGE_STORAGE_KEY =
  'speed-reading:flash-challenge-progress:v1';
export const FLASH_CHALLENGE_MIN_LEVEL = 1;
export const FLASH_CHALLENGE_MAX_LEVEL = 15;
export const FLASH_CHALLENGE_MAX_WPM = 3_000;

export type FlashChallengeProgress = {
  /** Level used to begin the next session at this public difficulty. */
  resumeLevel: number;
  /** Best level the learner has qualified at, even after a later rollback. */
  highestLevel: number;
  /** Sustained rapid-flash pace used to begin the next eligible session. */
  resumeWpm?: number;
  /** Fastest rapid-flash pace ever sustained at this setting. */
  highestWpm?: number;
  updatedAtIso?: string;
};

type DifficultyProgress = Partial<
  Record<Difficulty, FlashChallengeProgress>
>;
type FlashChallengeStore = Record<string, DifficultyProgress>;

const DEFAULT_PROGRESS: FlashChallengeProgress = {
  resumeLevel: FLASH_CHALLENGE_MIN_LEVEL,
  highestLevel: FLASH_CHALLENGE_MIN_LEVEL,
};

let mutationQueue: Promise<void> = Promise.resolve();

function enqueueMutation<T>(mutation: () => Promise<T>): Promise<T> {
  const operation = mutationQueue.catch(() => undefined).then(mutation);
  mutationQueue = operation.then(
    () => undefined,
    () => undefined
  );
  return operation;
}

export function clampFlashChallengeLevel(level: number): number {
  if (!Number.isFinite(level)) return FLASH_CHALLENGE_MIN_LEVEL;
  return Math.min(
    FLASH_CHALLENGE_MAX_LEVEL,
    Math.max(FLASH_CHALLENGE_MIN_LEVEL, Math.round(level))
  );
}

function sanitizeWpm(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.min(
    FLASH_CHALLENGE_MAX_WPM,
    Math.max(1, Math.round(value))
  );
}

function sanitizeProgress(value: unknown): FlashChallengeProgress {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PROGRESS };
  const candidate = value as Partial<FlashChallengeProgress>;
  const resumeLevel = clampFlashChallengeLevel(
    candidate.resumeLevel ?? FLASH_CHALLENGE_MIN_LEVEL
  );
  const highestLevel = Math.max(
    resumeLevel,
    clampFlashChallengeLevel(
      candidate.highestLevel ?? resumeLevel
    )
  );
  const resumeWpm = sanitizeWpm(candidate.resumeWpm);
  const highestWpm = Math.max(
    resumeWpm ?? 0,
    sanitizeWpm(candidate.highestWpm) ?? 0
  );
  return {
    resumeLevel,
    highestLevel,
    ...(resumeWpm == null ? {} : { resumeWpm }),
    ...(highestWpm === 0 ? {} : { highestWpm }),
    updatedAtIso:
      typeof candidate.updatedAtIso === 'string'
        ? candidate.updatedAtIso
        : undefined,
  };
}

async function loadStore(): Promise<FlashChallengeStore> {
  const raw = await AsyncStorage.getItem(FLASH_CHALLENGE_STORAGE_KEY);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new TypeError('Invalid flash challenge progress store');
  }

  const normalized: FlashChallengeStore = {};
  for (const [gameId, difficultyValue] of Object.entries(
    parsed as Record<string, unknown>
  )) {
    if (
      !difficultyValue ||
      typeof difficultyValue !== 'object' ||
      Array.isArray(difficultyValue)
    ) {
      continue;
    }
    const difficultyProgress: DifficultyProgress = {};
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const value = (
        difficultyValue as Record<string, unknown>
      )[difficulty];
      if (value !== undefined) {
        difficultyProgress[difficulty] = sanitizeProgress(value);
      }
    }
    normalized[normalizeGameId(gameId)] = difficultyProgress;
  }
  return normalized;
}

export async function loadFlashChallengeProgress(
  gameId: string,
  difficulty: Difficulty
): Promise<FlashChallengeProgress> {
  const store = await loadStore();
  return sanitizeProgress(
    store[normalizeGameId(gameId)]?.[difficulty]
  );
}

async function mutateFlashChallengeProgress(
  gameId: string,
  difficulty: Difficulty,
  level: number,
  qualifyHighest: boolean
): Promise<FlashChallengeProgress> {
  const normalizedId = normalizeGameId(gameId);
  const store = await loadStore();
  const current = sanitizeProgress(store[normalizedId]?.[difficulty]);
  const requestedLevel = clampFlashChallengeLevel(level);
  const resumeLevel = qualifyHighest
    ? Math.max(current.resumeLevel, requestedLevel)
    : requestedLevel;
  const next: FlashChallengeProgress = {
    ...current,
    resumeLevel,
    highestLevel: qualifyHighest
      ? Math.max(current.highestLevel, requestedLevel)
      : current.highestLevel,
    updatedAtIso: new Date().toISOString(),
  };
  store[normalizedId] = {
    ...store[normalizedId],
    [difficulty]: next,
  };
  await AsyncStorage.setItem(
    FLASH_CHALLENGE_STORAGE_KEY,
    JSON.stringify(store)
  );
  return next;
}

async function mutateFlashChallengeWpm(
  gameId: string,
  difficulty: Difficulty,
  wpm: number,
  qualifyHighest: boolean
): Promise<FlashChallengeProgress> {
  const normalizedId = normalizeGameId(gameId);
  const store = await loadStore();
  const current = sanitizeProgress(store[normalizedId]?.[difficulty]);
  const requestedWpm = sanitizeWpm(wpm);
  if (requestedWpm == null) return current;
  const resumeWpm = qualifyHighest
    ? Math.max(current.resumeWpm ?? 0, requestedWpm)
    : requestedWpm;
  const highestWpm = Math.max(
    current.highestWpm ?? current.resumeWpm ?? 0,
    qualifyHighest ? requestedWpm : 0
  );
  const next: FlashChallengeProgress = {
    ...current,
    resumeWpm,
    ...(highestWpm === 0 ? {} : { highestWpm }),
    updatedAtIso: new Date().toISOString(),
  };
  store[normalizedId] = {
    ...store[normalizedId],
    [difficulty]: next,
  };
  await AsyncStorage.setItem(
    FLASH_CHALLENGE_STORAGE_KEY,
    JSON.stringify(store)
  );
  return next;
}

/** Save a level that was sustained for a complete correct-answer run. */
export function qualifyFlashChallengeLevel(
  gameId: string,
  difficulty: Difficulty,
  level: number
): Promise<FlashChallengeProgress> {
  return enqueueMutation(() =>
    mutateFlashChallengeProgress(
      gameId,
      difficulty,
      level,
      true
    )
  );
}

/**
 * Save a safer next-session starting point after three consecutive misses.
 * The highest qualified level remains available for progress reporting.
 */
export function saveFlashChallengeResumeLevel(
  gameId: string,
  difficulty: Difficulty,
  level: number
): Promise<FlashChallengeProgress> {
  return enqueueMutation(() =>
    mutateFlashChallengeProgress(
      gameId,
      difficulty,
      level,
      false
    )
  );
}

/** Save a rapid-flash pace sustained for a complete correct-answer run. */
export function qualifyFlashChallengeWpm(
  gameId: string,
  difficulty: Difficulty,
  wpm: number
): Promise<FlashChallengeProgress> {
  return enqueueMutation(() =>
    mutateFlashChallengeWpm(gameId, difficulty, wpm, true)
  );
}

/**
 * Save a safer rapid-flash pace after the terminal miss streak while keeping
 * the learner's fastest demonstrated pace for progress reporting.
 */
export function saveFlashChallengeResumeWpm(
  gameId: string,
  difficulty: Difficulty,
  wpm: number
): Promise<FlashChallengeProgress> {
  return enqueueMutation(() =>
    mutateFlashChallengeWpm(gameId, difficulty, wpm, false)
  );
}

export function clearFlashChallengeProgress(): Promise<void> {
  return enqueueMutation(() =>
    AsyncStorage.removeItem(FLASH_CHALLENGE_STORAGE_KEY)
  );
}

export async function waitForFlashChallengeUpdates(): Promise<void> {
  await mutationQueue.catch(() => undefined);
}
