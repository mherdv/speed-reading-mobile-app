import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AttemptResult } from '../domain/types';

const STORAGE_KEY = 'speed-reading:results:v1';

export async function loadResults(): Promise<AttemptResult[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AttemptResult[];
  } catch {
    return [];
  }
}

export async function saveResult(result: AttemptResult): Promise<void> {
  const existing = await loadResults();
  const next = [result, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function clearResults(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
