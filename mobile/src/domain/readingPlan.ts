import type { GameId } from '../data/gameIds';
import { BASELINE_TEXT_SAMPLES } from '../data/textSamples';
import type { AttemptResult, TextSample } from './types';
import {
  isMeasuredReadingResult,
  isValidProgressMeasurement,
} from './results';
import { countWords } from './wpm';

export type PersonalPracticeEstimate =
  | {
      ready: false;
      validPassageCount: number;
      requiredPassageCount: 3;
      correct: number;
      total: number;
    }
  | {
      ready: true;
      validPassageCount: number;
      requiredPassageCount: 3;
      medianWpm: number;
      correct: number;
      total: number;
    };

export type TodayPlanItem =
  | {
      id: 'reading';
      kind: 'reading';
      title: string;
      reason: string;
      durationLabel: string;
      sample: TextSample;
      optional: boolean;
    }
  | {
      id: 'skill';
      kind: 'skill';
      title: string;
      reason: string;
      durationLabel: string;
      gameId: GameId;
      optional: boolean;
    }
  | {
      id: 'comfort';
      kind: 'comfort';
      title: string;
      reason: string;
      durationLabel: string;
      gameId: 'EyeMovementTraining';
      optional: true;
    };

function numberDetail(
  result: AttemptResult,
  key: string
): number | undefined {
  const value = result.details?.[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

export function getComprehensionCounts(result: AttemptResult): {
  correct: number;
  total: number;
} {
  const correct = numberDetail(result, 'comprehensionCorrectCount');
  const total = numberDetail(result, 'comprehensionQuestionCount');
  if (correct !== undefined && total !== undefined && total > 0) {
    return {
      correct: Math.max(0, Math.min(total, Math.round(correct))),
      total: Math.round(total),
    };
  }
  if (typeof result.comprehensionCorrect === 'boolean') {
    return { correct: result.comprehensionCorrect ? 1 : 0, total: 1 };
  }
  return { correct: 0, total: 0 };
}

export function isBaselineEligibleResult(
  result: AttemptResult,
  baselineSamples: readonly TextSample[] = BASELINE_TEXT_SAMPLES
): boolean {
  if (
    !isMeasuredReadingResult(result) ||
    !isValidProgressMeasurement(result) ||
    result.details?.measurementValid !== true
  ) {
    return false;
  }
  const contentId = result.details.contentId;
  const contentVersion = result.details.contentVersion;
  const comparisonBand = result.details.comparisonBand;
  const questionCount = numberDetail(result, 'comprehensionQuestionCount');
  if (
    typeof contentId !== 'string' ||
    typeof contentVersion !== 'number' ||
    typeof comparisonBand !== 'string' ||
    questionCount === undefined ||
    questionCount < 3
  ) {
    return false;
  }
  const sample = baselineSamples.find((candidate) => candidate.id === contentId);
  return (
    sample !== undefined &&
    typeof sample.version === 'number' &&
    contentVersion === sample.version &&
    comparisonBand === sample.comparisonBand
  );
}

export function calculatePersonalPracticeEstimate(
  results: readonly AttemptResult[]
): PersonalPracticeEstimate {
  const latestByPassage = new Map<string, AttemptResult>();
  const ordered = [...results].sort(
    (first, second) =>
      new Date(second.finishedAtIso).getTime() -
      new Date(first.finishedAtIso).getTime()
  );
  for (const result of ordered) {
    if (!isBaselineEligibleResult(result)) {
      continue;
    }
    const contentId = result.details!.contentId as string;
    if (!latestByPassage.has(contentId)) {
      latestByPassage.set(contentId, result);
    }
  }

  const passages = [...latestByPassage.values()];
  const comprehension = passages.reduce(
    (summary, result) => {
      const counts = getComprehensionCounts(result);
      return {
        correct: summary.correct + counts.correct,
        total: summary.total + counts.total,
      };
    },
    { correct: 0, total: 0 }
  );
  if (passages.length < 3) {
    return {
      ready: false,
      validPassageCount: passages.length,
      requiredPassageCount: 3,
      ...comprehension,
    };
  }
  const rates = passages.map((result) => result.wpm).sort((a, b) => a - b);
  const middle = Math.floor(rates.length / 2);
  const medianWpm =
    rates.length % 2 === 1
      ? rates[middle] ?? 0
      : Math.round(((rates[middle - 1] ?? 0) + (rates[middle] ?? 0)) / 2);
  return {
    ready: true,
    validPassageCount: passages.length,
    requiredPassageCount: 3,
    medianWpm,
    ...comprehension,
  };
}

export function estimateReadingMinutes(
  sampleOrWordCount: TextSample | number,
  questionCount?: number
): number {
  const wordCount =
    typeof sampleOrWordCount === 'number'
      ? sampleOrWordCount
      : countWords(sampleOrWordCount.text);
  const questions =
    questionCount ??
    (typeof sampleOrWordCount === 'number'
      ? 0
      : sampleOrWordCount.questions?.length ?? 1);
  return Math.max(1, Math.ceil(wordCount / 200 + questions * 0.25));
}

export function formatReadingEstimate(
  sampleOrWordCount: TextSample | number,
  questionCount?: number
): string {
  const minutes = estimateReadingMinutes(sampleOrWordCount, questionCount);
  return `About ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

function localDateKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function buildTodayPlan({
  results,
  samples,
  swapOffset = 0,
  readingSwapOffset = 0,
  skipped = [],
  now = new Date(),
}: {
  results: readonly AttemptResult[];
  samples: readonly TextSample[];
  swapOffset?: number;
  readingSwapOffset?: number;
  skipped?: readonly TodayPlanItem['id'][];
  now?: Date;
}): TodayPlanItem[] {
  if (samples.length === 0) return [];
  const skippedSet = new Set(skipped);
  const baselineCandidates = samples.slice(0, 3);
  const completedBaselineIds = new Set(
    results
      .filter((result) =>
        isBaselineEligibleResult(result, baselineCandidates)
      )
      .map((result) => result.details!.contentId as string)
  );
  const incompleteBaseline = baselineCandidates.filter(
    (sample) => !completedBaselineIds.has(sample.id)
  );
  const readingPool =
    incompleteBaseline.length > 0 ? incompleteBaseline : [...samples];
  const baselineSample =
    readingPool[
      ((readingSwapOffset % readingPool.length) + readingPool.length) %
        readingPool.length
    ]!;
  const baselineComplete = baselineCandidates.every((sample) =>
    completedBaselineIds.has(sample.id)
  );

  const skillCandidates: readonly GameId[] = [
    'EvidenceHunt',
    'ContextBuilder',
  ];
  const skillCounts = new Map(
    skillCandidates.map((gameId) => [
      gameId,
      results.filter((result) => result.sampleId === gameId).length,
    ])
  );
  const orderedSkills = [...skillCandidates].sort((first, second) => {
    const countDifference =
      (skillCounts.get(first) ?? 0) - (skillCounts.get(second) ?? 0);
    return countDifference || first.localeCompare(second);
  });
  const skillGameId =
    orderedSkills[
      ((swapOffset % orderedSkills.length) + orderedSkills.length) %
        orderedSkills.length
    ]!;
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const todayResults = results.filter(
    (result) => localDateKey(result.finishedAtIso) === todayKey
  );
  const sustainedUse =
    todayResults.reduce((sum, result) => sum + result.elapsedMs, 0) >=
    10 * 60_000;

  const plan: TodayPlanItem[] = [
    {
      id: 'reading',
      kind: 'reading',
      title: baselineComplete
        ? `Measured reading: ${baselineSample.title}`
        : `Baseline passage ${completedBaselineIds.size + 1} of 3`,
      reason: baselineComplete
        ? 'Selected next because reading with understanding is the primary progress measure.'
        : 'Selected because three different valid passages are needed for a personal practice estimate. You can skip this.',
      durationLabel: `${formatReadingEstimate(baselineSample)} · ${baselineSample.questions?.length ?? 1} questions`,
      sample: baselineSample,
      optional: !baselineComplete,
    },
    {
      id: 'skill',
      kind: 'skill',
      title: skillGameId === 'EvidenceHunt' ? 'Evidence Hunt' : 'Context Builder',
      reason:
        skillGameId === 'EvidenceHunt'
          ? 'Selected because it has fewer completed sessions; it practices justifying answers in connected text.'
          : 'Selected because it has fewer completed sessions; it practices vocabulary inference in connected context.',
      durationLabel: skillGameId === 'EvidenceHunt' ? 'About 8 minutes · untimed available' : 'About 7 minutes · untimed',
      gameId: skillGameId,
      optional: false,
    },
  ];
  if (sustainedUse) {
    plan.push({
      id: 'comfort',
      kind: 'comfort',
      title: 'Optional Eye Reset',
      reason:
        'Selected because you have completed sustained screen practice today. It is a comfort break, not speed training.',
      durationLabel: 'About 1 minute · optional',
      gameId: 'EyeMovementTraining',
      optional: true,
    });
  }
  return plan.filter((item) => !skippedSet.has(item.id)).slice(0, 3);
}
