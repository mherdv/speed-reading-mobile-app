import AsyncStorage from '@react-native-async-storage/async-storage';

export type TodayPlanItemId = 'reading' | 'skill' | 'comfort';

const STORAGE_KEY = 'speed-reading:today-skips:v1';

export function getLocalDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export async function loadTodayPlanSkips(
  now = new Date()
): Promise<TodayPlanItemId[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      localDate?: unknown;
      skipped?: unknown;
    };
    if (
      parsed.localDate !== getLocalDateKey(now) ||
      !Array.isArray(parsed.skipped)
    ) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return parsed.skipped.filter(
      (value): value is TodayPlanItemId =>
        value === 'reading' || value === 'skill' || value === 'comfort'
    );
  } catch {
    return [];
  }
}

export async function saveTodayPlanSkips(
  skipped: readonly TodayPlanItemId[],
  now = new Date()
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      localDate: getLocalDateKey(now),
      skipped: [...new Set(skipped)],
    })
  );
}
