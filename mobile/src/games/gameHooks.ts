import { useEffect, useRef, useState } from 'react';

import { loadGameProgress, levelToDifficulty, type GameProgress } from '../data/progressStore';
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
    const normalizedId = normalizeGameId(gameId);
    loadGameProgress(normalizedId).then((progress) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
      setProgressLoaded(true);
    });
  }, [gameId]);

  return {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    setSelectedDifficulty,
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
