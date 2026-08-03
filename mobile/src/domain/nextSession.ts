import type { Difficulty } from '../data/difficultyPreferences';
import type { TextSample, AttemptResult } from './types';
import { randomIndex, type RandomSource } from '../data/randomization';
import { getComprehensionCounts } from './readingPlan';
import {
  isGuidedPaceActivity,
  isMeasuredReadingResult,
  isValidProgressMeasurement,
} from './results';

export type NextSessionAction =
  | {
      kind: 'fresh-reading';
      title: string;
      body: string;
      label: 'Read a fresh passage' | 'Retake measured reading';
      targetWpm?: number;
    }
  | {
      kind: 'measured-reading';
      title: string;
      body: string;
      label: 'Check with measured reading';
    }
  | {
      kind: 'replay';
      title: string;
      body: string;
      label: string;
      autoStart: boolean;
      difficulty?: Difficulty;
    }
  | {
      kind: 'finish';
      title: string;
      body: string;
      label: 'Done for now';
    };

function resultDifficulty(result: AttemptResult): Difficulty | undefined {
  const difficulty = result.details?.difficulty;
  return difficulty === 'easy' ||
    difficulty === 'medium' ||
    difficulty === 'hard'
    ? difficulty
    : undefined;
}

function normalizedAccuracy(result: AttemptResult): number | undefined {
  if (typeof result.accuracy !== 'number') return undefined;
  return result.accuracy <= 1 ? result.accuracy : result.accuracy / 100;
}

function lowerDifficulty(difficulty: Difficulty): Difficulty {
  if (difficulty === 'hard') return 'medium';
  return 'easy';
}

export function getNextSessionAction(
  result: AttemptResult
): NextSessionAction {
  const activityType = result.details?.activityType;

  if (activityType === 'eye-comfort') {
    return {
      kind: 'finish',
      title: 'Let the break do its job',
      body:
        result.details?.comfort === 'uncomfortable'
          ? 'Stop screen practice for now. If discomfort keeps returning, consider advice from an eye-care professional.'
          : 'Return when your eyes feel ready. This comfort break is complete; no further task is needed.',
      label: 'Done for now',
    };
  }

  if (isGuidedPaceActivity(activityType)) {
    return {
      kind: 'measured-reading',
      title: 'Check transfer next',
      body:
        'Use a fresh connected passage with comprehension questions to see whether the guided pace preserved meaning.',
      label: 'Check with measured reading',
    };
  }

  if (isMeasuredReadingResult(result)) {
    if (!isValidProgressMeasurement(result)) {
      return {
        kind: 'fresh-reading',
        title: 'Retake a clean measurement',
        body:
          'Read a different comparable passage at a comfortable pace. This attempt will not set a pace target because its timing was not reliable enough for calibration.',
        label: 'Retake measured reading',
      };
    }

    const comprehension = getComprehensionCounts(result);
    const comprehensionPercent =
      comprehension.total > 0
        ? Math.round((comprehension.correct / comprehension.total) * 100)
        : undefined;

    if (comprehensionPercent !== undefined && comprehensionPercent < 80) {
      const nextWpm = Math.max(60, Math.round((result.wpm * 0.9) / 5) * 5);
      return {
        kind: 'fresh-reading',
        title: 'Protect meaning next',
        body: `Try about ${nextWpm} WPM on a different comparable passage. Increase pace only after comprehension returns to at least 80%.`,
        label: 'Read a fresh passage',
        targetWpm: nextWpm,
      };
    }
    if (comprehensionPercent !== undefined && comprehensionPercent >= 90) {
      return {
        kind: 'fresh-reading',
        title: 'Confirm before increasing',
        body: `Read a different comparable passage near ${result.wpm} WPM. Two strong readings are a better signal than one peak.`,
        label: 'Read a fresh passage',
        targetWpm: result.wpm,
      };
    }
    return {
      kind: 'fresh-reading',
      title:
        comprehensionPercent === undefined
          ? 'Validate on fresh material'
          : 'Hold this pace',
      body:
        comprehensionPercent === undefined
          ? 'Use a different comparable passage with an understanding check before treating this pace as sustainable.'
          : `Use a different comparable passage near ${result.wpm} WPM. Increase only after comprehension is consistently above 80%.`,
      label: 'Read a fresh passage',
      targetWpm:
        comprehensionPercent === undefined ? undefined : result.wpm,
    };
  }

  const accuracy = normalizedAccuracy(result);
  const difficulty = resultDifficulty(result);
  const difficultyMode = result.details?.difficultyMode;

  if (difficultyMode === 'adaptive') {
    return {
      kind: 'replay',
      title: 'Review your next Adaptive level',
      body:
        'This result is being applied now. The next screen will show whether your Adaptive level stayed, increased, or decreased before you start.',
      label: 'Review next level',
      autoStart: false,
    };
  }

  if (accuracy !== undefined && accuracy < 0.7) {
    if (difficultyMode === 'manual' && difficulty) {
      const nextDifficulty = lowerDifficulty(difficulty);
      if (nextDifficulty !== difficulty) {
        const levelLabel =
          nextDifficulty[0].toUpperCase() + nextDifficulty.slice(1);
        return {
          kind: 'replay',
          title: 'Reduce one source of difficulty',
          body: `Try ${levelLabel} once, review its setup, and make accuracy the priority. Your saved Manual preference will not be changed.`,
          label: `Try ${levelLabel}`,
          autoStart: false,
          difficulty: nextDifficulty,
        };
      }
      return {
        kind: 'replay',
        title: 'Review the Easy setup',
        body:
          'You are already at Easy. Review the pace or challenge controls, then repeat with accuracy as the priority.',
        label: 'Review Easy setup',
        autoStart: false,
        difficulty,
      };
    }

    return {
      kind: 'replay',
      title: 'Reduce one source of difficulty',
      body:
        'Review the setup, slow the pace if the game allows it, and repeat with accuracy as the priority.',
      label: 'Review setup',
      autoStart: false,
      difficulty,
    };
  }

  if (accuracy !== undefined && accuracy >= 0.85) {
    return {
      kind: 'replay',
      title: 'Confirm this challenge once',
      body:
        difficultyMode === 'manual'
          ? 'Repeat at the same setting. Your manual difficulty will stay unchanged.'
          : 'Repeat at the same setting before increasing the challenge.',
      label: 'Train again',
      autoStart: true,
      difficulty,
    };
  }

  return {
    kind: 'replay',
    title: 'Build consistency',
    body:
      difficultyMode === 'manual'
        ? 'Repeat at the same setting and aim for at least 85% accuracy. Your manual difficulty will stay unchanged.'
        : 'Repeat this task at the same setting and aim for at least 85% accuracy.',
    label: 'Train again',
    autoStart: true,
    difficulty,
  };
}

function resultContentId(result: AttemptResult): string {
  const contentId = result.details?.contentId;
  return typeof contentId === 'string' && contentId.length > 0
    ? contentId
    : result.sampleId;
}

/**
 * Chooses unseen comparable material first. Once every passage in the band has
 * appeared, it returns one of the least-recently used passages. The completed
 * passage itself is never eligible.
 */
export function selectFreshComparableSample(
  result: AttemptResult,
  samples: readonly TextSample[],
  recentResults: readonly AttemptResult[] = [],
  random: RandomSource = Math.random
): TextSample | undefined {
  const completedContentId = resultContentId(result);
  const completedSample = samples.find(
    (sample) => sample.id === completedContentId
  );
  const comparisonBand =
    typeof result.details?.comparisonBand === 'string'
      ? result.details.comparisonBand
      : completedSample?.comparisonBand;
  const candidates = samples.filter(
    (sample) =>
      sample.id !== completedContentId &&
      (!comparisonBand || sample.comparisonBand === comparisonBand)
  );
  if (candidates.length === 0) return undefined;

  const mostRecentIndex = new Map<string, number>();
  recentResults.forEach((recent, index) => {
    const contentId = resultContentId(recent);
    if (!mostRecentIndex.has(contentId)) mostRecentIndex.set(contentId, index);
  });
  const unseen = candidates.filter(
    (sample) => !mostRecentIndex.has(sample.id)
  );
  if (unseen.length > 0) {
    return unseen[randomIndex(unseen.length, random)];
  }

  const leastRecentIndex = Math.max(
    ...candidates.map((sample) => mostRecentIndex.get(sample.id) ?? -1)
  );
  const leastRecent = candidates.filter(
    (sample) => mostRecentIndex.get(sample.id) === leastRecentIndex
  );
  return leastRecent[randomIndex(leastRecent.length, random)];
}
