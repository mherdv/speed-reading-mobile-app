import {
  FLASH_CHALLENGE_MAX_LEVEL,
  FLASH_CHALLENGE_MIN_LEVEL,
  clampFlashChallengeLevel,
} from '../data/flashChallengeProgress';

export const FLASH_CHALLENGE_WPM_STEP = 25;

export type FlashChallengeProfile = {
  level: number;
  contentTier: 1 | 2 | 3 | 4;
  contentFraction: number;
  maskFraction: number;
  wpmBonus: number;
  label: string;
};

const CONTENT_FRACTIONS = [
  0.24,
  0.28,
  0.34,
  0.42,
  0.5,
  0.58,
  0.68,
  0.78,
  0.9,
  1,
  1,
  1,
  1,
  1,
  1,
] as const;

const CONTENT_START_FRACTIONS = [
  0,
  0,
  0,
  0.04,
  0.08,
  0.14,
  0.22,
  0.3,
  0.4,
  0.5,
  0.54,
  0.58,
  0.62,
  0.66,
  0.7,
] as const;

const MASK_FRACTIONS = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0.1,
  0.14,
  0.18,
  0.24,
  0.31,
  0.38,
] as const;

export function getFlashChallengeProfile(
  level: number
): FlashChallengeProfile {
  const safeLevel = clampFlashChallengeLevel(level);
  const index = safeLevel - 1;
  const contentTier: 1 | 2 | 3 | 4 =
    safeLevel <= 3
      ? 1
      : safeLevel <= 6
        ? 2
        : safeLevel <= 8
          ? 3
          : 4;
  const maskFraction =
    MASK_FRACTIONS[index] ??
    MASK_FRACTIONS[MASK_FRACTIONS.length - 1];
  const label =
    safeLevel <= 3
      ? 'Short and clear'
      : safeLevel <= 6
        ? 'Longer content'
        : safeLevel <= 9
          ? 'Harder content'
          : maskFraction < 0.22
            ? 'Marker introduced'
            : 'Fast masked recall';

  return {
    level: safeLevel,
    contentTier,
    contentFraction:
      CONTENT_FRACTIONS[index] ??
      CONTENT_FRACTIONS[CONTENT_FRACTIONS.length - 1],
    maskFraction,
    wpmBonus: index * FLASH_CHALLENGE_WPM_STEP,
    label,
  };
}

export function wpmForFlashChallengeLevel(
  baseWpm: number,
  level: number,
  maxWpm: number
): number {
  return Math.min(
    maxWpm,
    Math.max(1, Math.round(baseWpm)) +
      getFlashChallengeProfile(level).wpmBonus
  );
}

export function resumeWpmForFlashChallenge(
  baseWpm: number,
  level: number,
  savedResumeWpm: number | null | undefined,
  maxWpm: number
): number {
  return Math.min(
    maxWpm,
    Math.max(
      savedResumeWpm == null ? 0 : Math.max(1, Math.round(savedResumeWpm)),
      wpmForFlashChallengeLevel(baseWpm, level, maxWpm)
    )
  );
}

export function exposureMsForFlashChallengeLevel(
  baseExposureMs: number,
  level: number,
  minimumExposureMs = 300
): number {
  const safeBase = Math.max(1, Math.round(baseExposureMs));
  const safeMinimum = Math.min(
    safeBase,
    Math.max(1, Math.round(minimumExposureMs))
  );
  const speedMultiplier =
    1 + (clampFlashChallengeLevel(level) - 1) * 0.065;
  return Math.max(
    safeMinimum,
    Math.round(safeBase / speedMultiplier)
  );
}

function textComplexity(value: string): number {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const uncommonCharacters = (value.match(/[-'’]/g) ?? []).length;
  return words.length * 100 + value.length * 2 + uncommonCharacters * 5;
}

/**
 * Moves an overlapping window upward through a pool ordered by visible/textual
 * complexity, so advanced stages no longer keep sampling the easiest items.
 * Small custom pools are kept intact so deterministic sessions and authored
 * test sets still work as supplied.
 */
export function getProgressiveFlashContent(
  values: readonly string[],
  level: number,
  minimumPoolSize = 8
): string[] {
  if (values.length <= minimumPoolSize) return [...values];
  const profile = getFlashChallengeProfile(level);
  const ordered = values
    .map((value, index) => ({ value, index }))
    .sort(
      (first, second) =>
        textComplexity(first.value) -
          textComplexity(second.value) ||
        first.index - second.index
    );
  const end = Math.min(
    ordered.length,
    Math.max(
      minimumPoolSize,
      Math.ceil(ordered.length * profile.contentFraction)
    )
  );
  const requestedStart = Math.floor(
    ordered.length *
      (CONTENT_START_FRACTIONS[profile.level - 1] ?? 0)
  );
  const start = Math.min(
    requestedStart,
    Math.max(0, end - minimumPoolSize)
  );
  return ordered.slice(start, end).map(({ value }) => value);
}

export function getFlashChallengeStreamRange(
  level: number
): { min: number; max: number } {
  const tier = getFlashChallengeProfile(level).contentTier;
  switch (tier) {
    case 1:
      return { min: 3, max: 4 };
    case 2:
      return { min: 4, max: 6 };
    case 3:
      return { min: 5, max: 8 };
    case 4:
      return { min: 6, max: 10 };
  }
}

export type FlashChallengeSessionState = {
  level: number;
  correctStreak: number;
  missStreak: number;
};

export type FlashChallengeOutcome = {
  state: FlashChallengeSessionState;
  levelDelta: -1 | 0 | 1;
  qualified: boolean;
  shouldSaveRollback: boolean;
};

export function createFlashChallengeSessionState(
  level: number
): FlashChallengeSessionState {
  return {
    level: clampFlashChallengeLevel(level),
    correctStreak: 0,
    missStreak: 0,
  };
}

export function updateFlashChallengeSession(
  current: FlashChallengeSessionState,
  correct: boolean,
  correctAnswersToAdvance: number,
  missesToEnd = 3
): FlashChallengeOutcome {
  const threshold = Math.max(1, Math.round(correctAnswersToAdvance));
  if (correct) {
    const correctStreak = current.correctStreak + 1;
    if (correctStreak >= threshold) {
      const nextLevel = Math.min(
        FLASH_CHALLENGE_MAX_LEVEL,
        current.level + 1
      );
      return {
        state: {
          level: nextLevel,
          correctStreak: 0,
          missStreak: 0,
        },
        levelDelta:
          nextLevel > current.level ? 1 : 0,
        qualified: nextLevel > current.level,
        shouldSaveRollback: false,
      };
    }
    return {
      state: {
        level: current.level,
        correctStreak,
        missStreak: 0,
      },
      levelDelta: 0,
      qualified: false,
      shouldSaveRollback: false,
    };
  }

  const missStreak = current.missStreak + 1;
  const nextLevel = Math.max(
    FLASH_CHALLENGE_MIN_LEVEL,
    current.level - 1
  );
  return {
    state: {
      level: nextLevel,
      correctStreak: 0,
      missStreak,
    },
    levelDelta: nextLevel < current.level ? -1 : 0,
    qualified: false,
    shouldSaveRollback: missStreak === Math.max(1, missesToEnd),
  };
}

export function describeNextFlashChallenge(level: number): string {
  const safeLevel = clampFlashChallengeLevel(level);
  if (safeLevel >= FLASH_CHALLENGE_MAX_LEVEL) {
    return 'Maximum stage; keep sustaining accuracy';
  }
  const current = getFlashChallengeProfile(safeLevel);
  const next = getFlashChallengeProfile(safeLevel + 1);
  if (next.contentTier > current.contentTier) return 'Next: longer content';
  if (next.maskFraction > current.maskFraction) {
    return 'Next: a little more marker';
  }
  if (next.contentFraction > current.contentFraction) {
    return 'Next: slightly longer content';
  }
  return 'Next: a faster flash';
}

export { FLASH_CHALLENGE_MAX_LEVEL, FLASH_CHALLENGE_MIN_LEVEL };
