import { useCallback, useRef } from 'react';
import { logEvent } from '../analytics';
import { normalizeGameId } from '../data/gameIds';

export function useAnalytics(gameId: string) {
  const startRef = useRef<number | null>(null);
  const normalizedGameId = normalizeGameId(gameId);

  const start = useCallback(() => {
    startRef.current = Date.now();
    void logEvent({ id: `${normalizedGameId}:${Date.now()}`, name: 'game_start', ts: new Date().toISOString(), payload: { gameId: normalizedGameId } });
  }, [normalizedGameId]);

  const log = useCallback((name: string, payload?: any) => {
    void logEvent({ id: `${normalizedGameId}:${name}:${Date.now()}`, name, ts: new Date().toISOString(), payload: { gameId: normalizedGameId, ...payload } });
  }, [normalizedGameId]);

  const end = useCallback((extra?: any) => {
    const startedAt = startRef.current ?? Date.now();
    const finishedAt = Date.now();
    const elapsedMs = finishedAt - startedAt;
    void logEvent({ id: `${normalizedGameId}:end:${Date.now()}`, name: 'game_end', ts: new Date().toISOString(), payload: { gameId: normalizedGameId, elapsedMs, ...(extra ?? {}) } });
    return { startedAtIso: new Date(startedAt).toISOString(), finishedAtIso: new Date(finishedAt).toISOString(), elapsedMs };
  }, [normalizedGameId]);

  return { start, log, end };
}

export function adaptDifficulty(current: number, accuracy: number) {
  // simple rule: increase difficulty if accuracy > 0.85, decrease if <0.6
  if (accuracy > 0.85) return current + 1;
  if (accuracy < 0.6) return Math.max(1, current - 1);
  return current;
}
