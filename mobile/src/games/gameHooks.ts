import { useCallback, useEffect, useRef, useState } from 'react';

import { loadGameProgress, type GameProgress } from '../data/progressStore';
import { normalizeGameId } from '../data/gameIds';

export type Difficulty = 'easy' | 'medium' | 'hard';

export function useGameProgress(gameId: string, initialDifficulty: Difficulty) {
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [gameProgress, setGameProgress] = useState<GameProgress>({
    level: 1,
    streak: 0,
    totalPlays: 0,
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(initialDifficulty);

  useEffect(() => {
    let active = true;
    const normalizedId = normalizeGameId(gameId);
    setProgressLoaded(false);
    loadGameProgress(normalizedId)
      .then((progress) => {
        if (!active) return;
        setGameProgress(progress);
      })
      .catch(() => {
        // Keep the safe in-memory defaults when local storage is unavailable.
      })
      .finally(() => {
        if (active) setProgressLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [gameId]);

  useEffect(() => {
    setSelectedDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  return {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  };
}

export function useAutoStart(
  autoStart: boolean,
  phase: string,
  progressLoaded: boolean,
  start: () => void
) {
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (progressLoaded && autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase, progressLoaded, start]);
}

export function useTrackedTimeouts() {
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const clearTrackedTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  const scheduleTimeout = useCallback(
    (callback: () => void, delayMs: number) => {
      const timeout = setTimeout(() => {
        timeoutsRef.current.delete(timeout);
        callback();
      }, delayMs);
      timeoutsRef.current.add(timeout);
      return timeout;
    },
    []
  );

  useEffect(() => clearTrackedTimeouts, [clearTrackedTimeouts]);

  return { scheduleTimeout, clearTrackedTimeouts };
}
