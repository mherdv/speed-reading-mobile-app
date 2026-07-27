import AsyncStorage from '@react-native-async-storage/async-storage';

import { GAME_IDS, normalizeGameId, type GameId } from './gameIds';

const STORAGE_KEY = 'speed-reading:game-pins:v1';
const MAX_RECENT_GAMES = 6;

export type GamePins = {
  favorites: GameId[];
  recent: GameId[];
};

const EMPTY_PINS: GamePins = {
  favorites: [],
  recent: [],
};

let mutationQueue: Promise<void> = Promise.resolve();

function isGameId(value: string): value is GameId {
  return (GAME_IDS as readonly string[]).includes(value);
}

function sanitizeIds(value: unknown): GameId[] {
  if (!Array.isArray(value)) return [];
  const result: GameId[] = [];
  const seen = new Set<GameId>();

  for (const candidate of value) {
    if (typeof candidate !== 'string') continue;
    const normalized = normalizeGameId(candidate);
    if (!isGameId(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export async function loadGamePins(): Promise<GamePins> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PINS };
    const parsed = JSON.parse(raw) as {
      favorites?: unknown;
      recent?: unknown;
    };
    return {
      favorites: sanitizeIds(parsed?.favorites),
      recent: sanitizeIds(parsed?.recent).slice(0, MAX_RECENT_GAMES),
    };
  } catch {
    return { ...EMPTY_PINS };
  }
}

function mutateGamePins(
  mutation: (pins: GamePins) => GamePins
): Promise<GamePins> {
  let resolveResult: (pins: GamePins) => void = () => undefined;
  let rejectResult: (error: unknown) => void = () => undefined;
  const result = new Promise<GamePins>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  mutationQueue = mutationQueue
    .then(async () => {
      const current = await loadGamePins();
      const next = mutation(current);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      resolveResult(next);
    })
    .catch((error: unknown) => {
      rejectResult(error);
    });

  return result;
}

export function toggleFavoriteGame(gameId: string): Promise<GamePins> {
  const normalized = normalizeGameId(gameId);
  if (!isGameId(normalized)) return loadGamePins();

  return mutateGamePins((pins) => ({
    ...pins,
    favorites: pins.favorites.includes(normalized)
      ? pins.favorites.filter((id) => id !== normalized)
      : [normalized, ...pins.favorites],
  }));
}

export function recordRecentGame(gameId: string): Promise<GamePins> {
  const normalized = normalizeGameId(gameId);
  if (!isGameId(normalized)) return loadGamePins();

  return mutateGamePins((pins) => ({
    ...pins,
    recent: [
      normalized,
      ...pins.recent.filter((id) => id !== normalized),
    ].slice(0, MAX_RECENT_GAMES),
  }));
}
