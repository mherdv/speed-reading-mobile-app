import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AttemptResult } from '../domain/types';
import { normalizeGameId } from './gameIds';

const STORAGE_KEY = 'speed-reading:results:v1';
const MAX_RESULTS = 500;
let writeQueue: Promise<void> = Promise.resolve();

function normalizeResult(result: AttemptResult): AttemptResult {
  const normalizedId = normalizeGameId(result.sampleId);
  const normalizedTitle =
    result.sampleTitle === result.sampleId
      ? normalizedId
      : result.sampleTitle;
  return {
    ...result,
    sampleId: normalizedId,
    sampleTitle: normalizedTitle,
  };
}

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const queued = writeQueue.catch(() => undefined).then(operation);
  writeQueue = queued;
  return queued;
}

export async function loadResults(): Promise<AttemptResult[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as AttemptResult[]).map(normalizeResult);
  } catch {
    return [];
  }
}

export async function saveResult(result: AttemptResult): Promise<void> {
  const normalized = normalizeResult(result);
  return enqueueWrite(async () => {
    const existing = await loadResults();
    const next = [
      normalized,
      ...existing.filter((stored) => stored.id !== normalized.id),
    ].slice(0, MAX_RESULTS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  });
}

export async function clearResults(): Promise<void> {
  return enqueueWrite(() => AsyncStorage.removeItem(STORAGE_KEY));
}
