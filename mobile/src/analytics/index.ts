import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = 'speed-reading:events:v1';

export type AnalyticsEvent = {
  id: string;
  name: string;
  ts: string;
  payload?: Record<string, unknown>;
};

export async function logEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const next = [event, ...existing];
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  } catch (e) {
    // best-effort
    // eslint-disable-next-line no-console
    console.warn('analytics.logEvent failed', e);
  }
}

export async function clearEvents(): Promise<void> {
  await AsyncStorage.removeItem(EVENTS_KEY);
}
