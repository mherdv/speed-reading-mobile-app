export const FLASH_PACE_STEP = 25;
export const RAPID_FLASH_MAX_WPM = 3000;
export const MIN_FLASH_DISPLAY_MS = 20;
export const FLASH_PACE_PRESETS = [150, 300, 600, 1000, 2000, 3000] as const;
export const DEFAULT_CORRECT_ANSWERS_TO_INCREASE = 4;
export const DEFAULT_MISSES_TO_DECREASE = 2;
export const MAX_CONSECUTIVE_FLASH_FAILURES = 3;

export type FlashPaceState = {
  wpm: number;
  correctStreak: number;
  missStreak: number;
  changes: number;
};

export type FlashPaceBounds = {
  minWpm: number;
  maxWpm: number;
  step?: number;
  correctAnswersToIncrease?: number;
  missesToDecrease?: number | null;
};

export function clampWpm(
  value: number,
  bounds: FlashPaceBounds
): number {
  return Math.min(bounds.maxWpm, Math.max(bounds.minWpm, Math.round(value)));
}

export function displayDurationForWpm(
  wpm: number,
  wordCount = 1,
  minMs = MIN_FLASH_DISPLAY_MS,
  maxMs = 4000
): number {
  const safeWpm = Math.max(1, wpm);
  const duration = Math.round((Math.max(1, wordCount) * 60_000) / safeWpm);
  return Math.min(maxMs, Math.max(minMs, duration));
}

export function wpmForDisplayDuration(
  displayMs: number,
  wordCount = 1
): number {
  return Math.max(
    1,
    Math.round((Math.max(1, wordCount) * 60_000) / Math.max(1, displayMs))
  );
}

export function createFlashPaceState(wpm: number): FlashPaceState {
  return {
    wpm,
    correctStreak: 0,
    missStreak: 0,
    changes: 0,
  };
}

export function updateFlashPace(
  state: FlashPaceState,
  correct: boolean,
  bounds: FlashPaceBounds
): FlashPaceState {
  const step = bounds.step ?? FLASH_PACE_STEP;
  const correctAnswersToIncrease =
    bounds.correctAnswersToIncrease ??
    DEFAULT_CORRECT_ANSWERS_TO_INCREASE;
  const missesToDecrease =
    bounds.missesToDecrease === undefined
      ? DEFAULT_MISSES_TO_DECREASE
      : bounds.missesToDecrease;

  if (correct) {
    const correctStreak = state.correctStreak + 1;
    if (correctStreak < correctAnswersToIncrease) {
      return { ...state, correctStreak, missStreak: 0 };
    }

    const wpm = clampWpm(state.wpm + step, bounds);
    return {
      wpm,
      correctStreak: 0,
      missStreak: 0,
      changes: state.changes + (wpm === state.wpm ? 0 : 1),
    };
  }

  const missStreak = state.missStreak + 1;
  if (missesToDecrease === null || missStreak < missesToDecrease) {
    return { ...state, correctStreak: 0, missStreak };
  }

  const wpm = clampWpm(state.wpm - step, bounds);
  return {
    wpm,
    correctStreak: 0,
    // Pace can step down while the consecutive-failure run continues. The
    // owning game still needs the third miss to end the session.
    missStreak,
    changes: state.changes + (wpm === state.wpm ? 0 : 1),
  };
}
