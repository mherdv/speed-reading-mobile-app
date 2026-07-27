import { useState, useCallback, useRef } from 'react';

export type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const CORRECT_THRESHOLD = 5; // Increase difficulty after 5 correct
const FAIL_THRESHOLD = 3; // Decrease difficulty after 3 failures

type ProgressionState = {
  difficulty: Difficulty;
  correctStreak: number;
  failStreak: number;
};

type UseDifficultyProgressionReturn = {
  difficulty: Difficulty;
  correctStreak: number;
  failStreak: number;
  recordCorrect: () => void;
  recordFail: () => void;
  reset: () => void;
  setDifficulty: (d: Difficulty) => void;
};

export function useDifficultyProgression(
  initialDifficulty: Difficulty = 'easy',
  autoAdjust = true
): UseDifficultyProgressionReturn {
  const [state, setState] = useState<ProgressionState>({
    difficulty: initialDifficulty,
    correctStreak: 0,
    failStreak: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const recordCorrect = useCallback(() => {
    setState((prev) => {
      const newCorrectStreak = prev.correctStreak + 1;
      const currentIndex = DIFFICULTIES.indexOf(prev.difficulty);

      // Check if we should increase difficulty
      if (
        autoAdjust &&
        newCorrectStreak >= CORRECT_THRESHOLD &&
        currentIndex < DIFFICULTIES.length - 1
      ) {
        return {
          difficulty: DIFFICULTIES[currentIndex + 1],
          correctStreak: 0,
          failStreak: 0,
        };
      }

      return {
        ...prev,
        correctStreak: newCorrectStreak,
        failStreak: 0, // Reset fail streak on correct
      };
    });
  }, [autoAdjust]);

  const recordFail = useCallback(() => {
    setState((prev) => {
      const newFailStreak = prev.failStreak + 1;
      const currentIndex = DIFFICULTIES.indexOf(prev.difficulty);

      // Check if we should decrease difficulty
      if (autoAdjust && newFailStreak >= FAIL_THRESHOLD && currentIndex > 0) {
        return {
          difficulty: DIFFICULTIES[currentIndex - 1],
          correctStreak: 0,
          failStreak: 0,
        };
      }

      return {
        ...prev,
        failStreak: newFailStreak,
        correctStreak: 0, // Reset correct streak on fail
      };
    });
  }, [autoAdjust]);

  const reset = useCallback(() => {
    setState({
      difficulty: initialDifficulty,
      correctStreak: 0,
      failStreak: 0,
    });
  }, [initialDifficulty]);

  const setDifficulty = useCallback((d: Difficulty) => {
    setState({
      difficulty: d,
      correctStreak: 0,
      failStreak: 0,
    });
  }, []);

  return {
    difficulty: state.difficulty,
    correctStreak: state.correctStreak,
    failStreak: state.failStreak,
    recordCorrect,
    recordFail,
    reset,
    setDifficulty,
  };
}
