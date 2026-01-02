import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'speed-reading:progress:v1';

export type GameProgress = {
  /** Current difficulty level (1-15) */
  level: number;
  /** Consecutive correct answers at this level */
  streak: number;
  /** Total plays of this game */
  totalPlays: number;
  /** Best score achieved */
  bestScore?: number;
  /** Last played timestamp */
  lastPlayedAt?: string;
};

type ProgressStore = Record<string, GameProgress>;

const DEFAULT_PROGRESS: GameProgress = {
  level: 1,
  streak: 0,
  totalPlays: 0,
};

const MAX_LEVEL = 15;
const LEVEL_UP_THRESHOLD = 5; // Correct answers to level up
const LEVEL_DOWN_THRESHOLD = 3; // Failures to level down

export async function loadAllProgress(): Promise<ProgressStore> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed as ProgressStore;
  } catch {
    return {};
  }
}

export async function loadGameProgress(gameId: string): Promise<GameProgress> {
  const all = await loadAllProgress();
  return all[gameId] ?? { ...DEFAULT_PROGRESS };
}

export async function saveGameProgress(
  gameId: string,
  progress: GameProgress
): Promise<void> {
  const all = await loadAllProgress();
  all[gameId] = progress;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Update progress after a game attempt.
 * Returns the new progress and whether level changed.
 */
export async function updateProgress(
  gameId: string,
  correct: boolean,
  score?: number
): Promise<{ progress: GameProgress; levelChanged: boolean; levelDelta: number }> {
  const current = await loadGameProgress(gameId);
  let levelDelta = 0;

  if (correct) {
    // On success, increment streak (reset negative streak to 1)
    current.streak = current.streak < 0 ? 1 : current.streak + 1;
    if (current.streak >= LEVEL_UP_THRESHOLD && current.level < MAX_LEVEL) {
      current.level += 1;
      current.streak = 0;
      levelDelta = 1;
    }
  } else {
    // On failure, decrement streak (reset positive streak to -1)
    current.streak = current.streak > 0 ? -1 : current.streak - 1;
    if (current.streak <= -LEVEL_DOWN_THRESHOLD && current.level > 1) {
      current.level -= 1;
      current.streak = 0;
      levelDelta = -1;
    }
  }

  current.totalPlays += 1;
  current.lastPlayedAt = new Date().toISOString();

  if (score !== undefined) {
    current.bestScore = Math.max(current.bestScore ?? 0, score);
  }

  await saveGameProgress(gameId, current);

  return {
    progress: current,
    levelChanged: levelDelta !== 0,
    levelDelta,
  };
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Map level (1-15) to difficulty string
 * Levels 1-5: easy
 * Levels 6-10: medium  
 * Levels 11-15: hard
 */
export function levelToDifficulty(level: number): 'easy' | 'medium' | 'hard' {
  if (level <= 5) return 'easy';
  if (level <= 10) return 'medium';
  return 'hard';
}

/**
 * Map difficulty to base level
 */
export function difficultyToLevel(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy': return 1;
    case 'medium': return 6;
    case 'hard': return 11;
  }
}

/**
 * Calculate star rating from level (0-5 stars)
 * Level 1: 0 stars (beginner)
 * Level 2-4: 1 star
 * Level 5-7: 2 stars
 * Level 8-10: 3 stars  
 * Level 11-13: 4 stars
 * Level 14-15: 5 stars
 */
export function levelToStars(level: number): number {
  if (level <= 1) return 0;
  if (level <= 4) return 1;
  if (level <= 7) return 2;
  if (level <= 10) return 3;
  if (level <= 13) return 4;
  return 5;
}

export { MAX_LEVEL };
