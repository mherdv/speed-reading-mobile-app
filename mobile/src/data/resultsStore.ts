import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AttemptResult } from '../domain/types';
import { normalizeGameId } from './gameIds';

const STORAGE_KEY = 'speed-reading:results:v1';

export async function loadResults(): Promise<AttemptResult[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as AttemptResult[]).map((result) => {
      const normalizedId = normalizeGameId(result.sampleId);
      const normalizedTitle = result.sampleTitle === result.sampleId
        ? normalizedId
        : result.sampleTitle;
      return {
        ...result,
        sampleId: normalizedId,
        sampleTitle: normalizedTitle,
      };
    });
  } catch {
    return [];
  }
}

export async function saveResult(result: AttemptResult): Promise<void> {
  const existing = await loadResults();
  const normalizedId = normalizeGameId(result.sampleId);
  const normalizedTitle = result.sampleTitle === result.sampleId
    ? normalizedId
    : result.sampleTitle;
  const next = [{
    ...result,
    sampleId: normalizedId,
    sampleTitle: normalizedTitle,
  }, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function clearResults(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
