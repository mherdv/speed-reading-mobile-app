import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeGameId } from './gameIds';
import {
  allowsAdaptiveDifficulty,
  loadDifficultyPreference,
  type Difficulty,
} from './difficultyPreferences';

const STORAGE_KEY = 'speed-reading:progress:v1';

export type GameProgress = {
  /** Persisted adaptive band marker (1=easy, 6=medium, 11=hard). */
  level: number;
  /** Positive at-target or negative below-target qualification run. */
  streak: number;
  /** Total plays of this game */
  totalPlays: number;
  /** Best score achieved */
  bestScore?: number;
  /** Last played timestamp */
  lastPlayedAt?: string;
  /** Difficulty of the current adaptive qualification run. */
  adaptiveQualificationDifficulty?: Difficulty;
};

type ProgressStore = Record<string, GameProgress>;

const DEFAULT_PROGRESS: GameProgress = {
  level: 1,
  streak: 0,
  totalPlays: 0,
};

const MAX_LEVEL = 15;
export const LEVEL_DOWN_THRESHOLD = 2;
export const LEVEL_UP_THRESHOLD = 2;

export function describeAdaptiveProgress(progress: GameProgress): string {
  if (progress.streak > 0) {
    const remaining = Math.max(1, LEVEL_UP_THRESHOLD - progress.streak);
    return `${remaining} more at-target ${
      remaining === 1 ? 'session' : 'sessions'
    } in a row to raise the difficulty`;
  }
  if (progress.streak < 0) {
    const remaining = Math.max(1, LEVEL_DOWN_THRESHOLD + progress.streak);
    return `${remaining} more below-target ${
      remaining === 1 ? 'session' : 'sessions'
    } in a row before the difficulty is reduced`;
  }
  return `${LEVEL_UP_THRESHOLD} at-target sessions raise the difficulty · ${LEVEL_DOWN_THRESHOLD} below-target sessions reduce it`;
}

export async function loadAllProgress(): Promise<ProgressStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const normalized: ProgressStore = {};
    for (const [gameId, progress] of Object.entries(parsed as ProgressStore)) {
      const normalizedId = normalizeGameId(gameId);
      if (!normalized[normalizedId]) {
        normalized[normalizedId] = progress as GameProgress;
      }
    }
    return normalized;
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
  all[normalizeGameId(gameId)] = progress;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Record a completed attempt and update the next-session adaptive suggestion.
 * Manual sessions update play count and best score only.
 */
export async function updateProgress(
  gameId: string,
  correct: boolean,
  score?: number,
  playedDifficulty?: Difficulty
): Promise<{ progress: GameProgress; levelChanged: boolean; levelDelta: number }> {
  const normalizedId = normalizeGameId(gameId);
  const [current, preference] = await Promise.all([
    loadGameProgress(normalizedId),
    loadDifficultyPreference(normalizedId),
  ]);
  let levelDelta = 0;
  const adaptive =
    preference.mode === 'adaptive' && allowsAdaptiveDifficulty(normalizedId);

  if (adaptive) {
    const activeDifficulty =
      playedDifficulty ?? levelToDifficulty(current.level);
    // Migrate the old 15-step counter to the public three-band model on the
    // first adaptive completion without changing the active band.
    current.level = difficultyToLevel(activeDifficulty);
    if (
      current.adaptiveQualificationDifficulty !== undefined &&
      current.adaptiveQualificationDifficulty !== activeDifficulty
    ) {
      current.streak = 0;
    }
    current.adaptiveQualificationDifficulty = activeDifficulty;

    if (correct) {
      current.streak = current.streak < 0 ? 1 : current.streak + 1;
      if (current.streak >= LEVEL_UP_THRESHOLD) {
        const nextDifficulty =
          activeDifficulty === 'easy'
            ? 'medium'
            : activeDifficulty === 'medium'
              ? 'hard'
              : 'hard';
        if (nextDifficulty !== activeDifficulty) {
          current.level = difficultyToLevel(nextDifficulty);
          levelDelta = 1;
        }
        current.streak = 0;
        current.adaptiveQualificationDifficulty = undefined;
      }
    } else {
      current.streak = current.streak > 0 ? -1 : current.streak - 1;
      if (current.streak <= -LEVEL_DOWN_THRESHOLD) {
        const nextDifficulty =
          activeDifficulty === 'hard'
            ? 'medium'
            : activeDifficulty === 'medium'
              ? 'easy'
              : 'easy';
        if (nextDifficulty !== activeDifficulty) {
          current.level = difficultyToLevel(nextDifficulty);
          levelDelta = -1;
        }
        current.streak = 0;
        current.adaptiveQualificationDifficulty = undefined;
      }
    }
  }

  // Manual play is still saved in history/bests, while the adaptive level,
  // qualification run, and its difficulty remain untouched.
  current.totalPlays += 1;
  current.lastPlayedAt = new Date().toISOString();

  if (score !== undefined) {
    current.bestScore = Math.max(current.bestScore ?? 0, score);
  }

  await saveGameProgress(normalizedId, current);

  return {
    progress: current,
    levelChanged: levelDelta !== 0,
    levelDelta,
  };
}

/**
 * Reading-skill activities use a transparent, between-session suggestion:
 * two complete sessions at or above the task threshold suggest the next
 * difficulty band. Manual difficulty remains untouched by this stored signal.
 */
export async function updateTwoSessionDifficultySuggestion(
  gameId: string,
  playedDifficulty: Difficulty,
  metThreshold: boolean,
  score?: number
): Promise<{ progress: GameProgress; suggestedDifficulty: Difficulty }> {
  const { progress } = await updateProgress(
    gameId,
    metThreshold,
    score,
    playedDifficulty
  );
  return {
    progress,
    suggestedDifficulty: levelToDifficulty(progress.level),
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
