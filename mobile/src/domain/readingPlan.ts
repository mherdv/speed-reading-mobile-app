import type { GameId } from '../data/gameIds';
import { getGameCatalogEntry } from '../data/gameCatalog';
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

export type ReadingConfidence = 'building' | 'developing' | 'established';

export type ReadingPerformanceProfile = {
  ready: boolean;
  validPassageCount: number;
  requiredPassageCount: 3;
  measuredMedianWpm?: number;
  sustainableWpm?: number;
  comprehensionPercent: number;
  correct: number;
  total: number;
  confidence: ReadingConfidence;
  paceRange?: {
    lowerWpm: number;
    upperWpm: number;
  };
  recommendation: string;
};

export type TrainingSkillId =
  | 'fluency'
  | 'comprehension'
  | 'evidence'
  | 'vocabulary'
  | 'recall'
  | 'visual-search'
  | 'recognition';

export type TrainingSkillSummary = {
  id: TrainingSkillId;
  label: string;
  score?: number;
  sessionCount: number;
  confidence: ReadingConfidence;
  recommendedGames: readonly GameId[];
};

export type SkillPracticeRecommendation = {
  gameId: GameId;
  skill: TrainingSkillSummary;
  reason: string;
};

const REQUIRED_BASELINE_PASSAGES = 3;
const SUSTAINABLE_COMPREHENSION_PERCENT = 80;
const SKILL_HISTORY_LIMIT = 8;

const SKILL_DEFINITIONS: readonly Omit<
  TrainingSkillSummary,
  'score' | 'sessionCount' | 'confidence'
>[] = [
  {
    id: 'fluency',
    label: 'Fluent connected reading',
    recommendedGames: ['RepeatedReading'],
  },
  {
    id: 'comprehension',
    label: 'Main ideas and structure',
    recommendedGames: ['MainIdeaSprint', 'StructureScan', 'ComprehensionTest'],
  },
  {
    id: 'evidence',
    label: 'Evidence and detail',
    recommendedGames: ['EvidenceHunt'],
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary in context',
    recommendedGames: ['ContextBuilder', 'WordPairs', 'LetterJumble'],
  },
  {
    id: 'recall',
    label: 'Reading recall',
    recommendedGames: ['SentenceRecall', 'LastWordRecall', 'WordsRecall'],
  },
  {
    id: 'visual-search',
    label: 'Visual search',
    recommendedGames: ['TextSearch', 'WordSearchGame', 'SchulteNumbers'],
  },
  {
    id: 'recognition',
    label: 'Rapid recognition',
    recommendedGames: [
      'TimedPhraseRecognition',
      'TimedWordRecognition',
      'FlashReading',
    ],
  },
];

const GAME_SKILLS = new Map<GameId, TrainingSkillId>(
  SKILL_DEFINITIONS.flatMap((definition) =>
    definition.recommendedGames.map((gameId) => [gameId, definition.id] as const)
  )
);

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

function latestEligibleBaselineResults(
  results: readonly AttemptResult[]
): AttemptResult[] {
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
  return [...latestByPassage.values()];
}

function summarizeComprehension(
  results: readonly AttemptResult[]
): {
  correct: number;
  total: number;
} {
  return results.reduce(
    (summary, result) => {
      const counts = getComprehensionCounts(result);
      return {
        correct: summary.correct + counts.correct,
        total: summary.total + counts.total,
      };
    },
    { correct: 0, total: 0 }
  );
}

function median(values: readonly number[]): number {
  const ordered = [...values].sort((first, second) => first - second);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 1
    ? ordered[middle] ?? 0
    : Math.round(
        ((ordered[middle - 1] ?? 0) + (ordered[middle] ?? 0)) / 2
      );
}

export function calculatePersonalPracticeEstimate(
  results: readonly AttemptResult[]
): PersonalPracticeEstimate {
  const passages = latestEligibleBaselineResults(results);
  const comprehension = summarizeComprehension(passages);
  if (passages.length < REQUIRED_BASELINE_PASSAGES) {
    return {
      ready: false,
      validPassageCount: passages.length,
      requiredPassageCount: REQUIRED_BASELINE_PASSAGES,
      ...comprehension,
    };
  }
  return {
    ready: true,
    validPassageCount: passages.length,
    requiredPassageCount: REQUIRED_BASELINE_PASSAGES,
    medianWpm: median(passages.map((result) => result.wpm)),
    ...comprehension,
  };
}

export function calculateReadingPerformanceProfile(
  results: readonly AttemptResult[]
): ReadingPerformanceProfile {
  const passages = latestEligibleBaselineResults(results);
  const comprehension = summarizeComprehension(passages);
  const comprehensionPercent =
    comprehension.total > 0
      ? Math.round((comprehension.correct / comprehension.total) * 100)
      : 0;
  const ready = passages.length >= REQUIRED_BASELINE_PASSAGES;
  const measuredMedianWpm =
    passages.length > 0
      ? median(passages.map((result) => result.wpm))
      : undefined;
  const sustainableWpm =
    ready &&
    comprehensionPercent >= SUSTAINABLE_COMPREHENSION_PERCENT
      ? measuredMedianWpm
      : undefined;
  const confidence: ReadingConfidence =
    passages.length < REQUIRED_BASELINE_PASSAGES
      ? 'building'
      : passages.length < 6
        ? 'developing'
        : 'established';
  const rates = passages.map((result) => result.wpm);
  const lowerWpm = rates.length > 0 ? Math.min(...rates) : undefined;
  const upperWpm = rates.length > 0 ? Math.max(...rates) : undefined;
  const paceRange =
    lowerWpm !== undefined && upperWpm !== undefined
      ? { lowerWpm, upperWpm }
      : undefined;

  let recommendation = `Complete ${Math.max(
    0,
    REQUIRED_BASELINE_PASSAGES - passages.length
  )} more reviewed passage${
    REQUIRED_BASELINE_PASSAGES - passages.length === 1 ? '' : 's'
  } to establish a reliable pace.`;
  if (ready && sustainableWpm === undefined) {
    recommendation =
      'Keep the current pace comfortable and rebuild comprehension to at least 80% before increasing speed.';
  } else if (sustainableWpm !== undefined) {
    recommendation =
      'Use this sustainable pace as the training anchor; increase it only while comprehension stays at or above 80%.';
  }

  return {
    ready,
    validPassageCount: passages.length,
    requiredPassageCount: REQUIRED_BASELINE_PASSAGES,
    measuredMedianWpm,
    sustainableWpm,
    comprehensionPercent,
    ...comprehension,
    confidence,
    paceRange,
    recommendation,
  };
}

function resultSkillScore(result: AttemptResult): number | undefined {
  const explicitQuestionCount = numberDetail(
    result,
    'comprehensionQuestionCount'
  );
  if (explicitQuestionCount !== undefined && explicitQuestionCount > 0) {
    const comprehension = getComprehensionCounts(result);
    return (comprehension.correct / comprehension.total) * 100;
  }

  const pairedDetailKeys: readonly (readonly [string, string])[] = [
    ['answerAccuracy', 'evidenceAccuracy'],
    ['meaningAccuracy', 'clueAccuracy'],
  ];
  for (const keys of pairedDetailKeys) {
    const values = keys
      .map((key) => numberDetail(result, key))
      .filter((value): value is number => value !== undefined);
    if (values.length > 0) {
      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      return average <= 1 ? average * 100 : average;
    }
  }

  if (typeof result.accuracy === 'number' && Number.isFinite(result.accuracy)) {
    return result.accuracy <= 1 ? result.accuracy * 100 : result.accuracy;
  }
  if (typeof result.comprehensionCorrect === 'boolean') {
    return result.comprehensionCorrect ? 100 : 0;
  }
  return undefined;
}

export function calculateTrainingSkillProfile(
  results: readonly AttemptResult[]
): TrainingSkillSummary[] {
  const recentFirst = [...results].sort(
    (first, second) =>
      new Date(second.finishedAtIso).getTime() -
      new Date(first.finishedAtIso).getTime()
  );

  return SKILL_DEFINITIONS.map((definition) => {
    const sessions = recentFirst
      .filter((result) => {
        const gameId = result.sampleId as GameId;
        return GAME_SKILLS.get(gameId) === definition.id;
      })
      .map(resultSkillScore)
      .filter((score): score is number => score !== undefined)
      .slice(0, SKILL_HISTORY_LIMIT);
    const weightedTotal = sessions.reduce(
      (sum, score, index) => sum + score * (sessions.length - index),
      0
    );
    const weight = sessions.reduce(
      (sum, _score, index) => sum + sessions.length - index,
      0
    );

    return {
      ...definition,
      score:
        sessions.length > 0
          ? Math.round(Math.max(0, Math.min(100, weightedTotal / weight)))
          : undefined,
      sessionCount: sessions.length,
      confidence:
        sessions.length < 2
          ? 'building'
          : sessions.length < 5
            ? 'developing'
            : 'established',
    };
  });
}

export function recommendSkillPractice(
  results: readonly AttemptResult[],
  swapOffset = 0
): SkillPracticeRecommendation {
  const profile = calculateTrainingSkillProfile(results);
  const measured = profile
    .filter(
      (skill): skill is TrainingSkillSummary & { score: number } =>
        skill.score !== undefined
    )
    .sort((first, second) => {
      const scoreDifference = first.score - second.score;
      return (
        scoreDifference ||
        first.sessionCount - second.sessionCount ||
        first.label.localeCompare(second.label)
      );
    });

  if (measured.length === 0) {
    const fallbackGameIds: readonly GameId[] = [
      'ContextBuilder',
      'EvidenceHunt',
    ];
    const fallbackIndex =
      ((swapOffset % fallbackGameIds.length) + fallbackGameIds.length) %
      fallbackGameIds.length;
    const gameId = fallbackGameIds[fallbackIndex]!;
    const skill = profile.find(
      (candidate) => candidate.id === GAME_SKILLS.get(gameId)
    )!;
    return {
      gameId,
      skill,
      reason: `Selected to establish your ${skill.label.toLocaleLowerCase()} baseline before the plan personalizes.`,
    };
  }

  const unmeasured = profile.filter((skill) => skill.score === undefined);
  const ranked = [...measured, ...unmeasured];
  const skill =
    ranked[((swapOffset % ranked.length) + ranked.length) % ranked.length]!;
  const gameIndex =
    Math.floor(Math.abs(swapOffset) / Math.max(1, ranked.length)) %
    skill.recommendedGames.length;
  const gameId = skill.recommendedGames[gameIndex]!;
  if (skill.score === undefined) {
    return {
      gameId,
      skill,
      reason: `Selected to establish your ${skill.label.toLocaleLowerCase()} baseline before the plan personalizes.`,
    };
  }
  return {
    gameId,
    skill,
    reason: `Selected because ${skill.label.toLocaleLowerCase()} is currently your weakest measured skill at ${skill.score}%.`,
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
  const reviewedBaselineIds = new Set(
    BASELINE_TEXT_SAMPLES.map((sample) => sample.id)
  );
  const baselineCandidates = samples.filter((sample) =>
    reviewedBaselineIds.has(sample.id)
  );
  const usableBaselineCandidates =
    baselineCandidates.length >= 3 ? baselineCandidates : samples.slice(0, 3);
  const completedBaselineIds = new Set(
    results
      .filter((result) =>
        isBaselineEligibleResult(result, usableBaselineCandidates)
      )
      .map((result) => result.details!.contentId as string)
  );
  const incompleteBaseline = usableBaselineCandidates.filter(
    (sample) => !completedBaselineIds.has(sample.id)
  );
  const readingPool =
    incompleteBaseline.length > 0
      ? incompleteBaseline
      : usableBaselineCandidates;
  const baselineSample =
    readingPool[
      ((readingSwapOffset % readingPool.length) + readingPool.length) %
        readingPool.length
    ]!;
  const baselineComplete = completedBaselineIds.size >= 3;

  const skillRecommendation = recommendSkillPractice(results, swapOffset);
  const skillGameId = skillRecommendation.gameId;
  const skillGame = getGameCatalogEntry(skillGameId);
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
        : `Baseline passage ${Math.min(completedBaselineIds.size + 1, 3)} of 3`,
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
      title: skillGame?.title ?? skillRecommendation.skill.label,
      reason: skillRecommendation.reason,
      durationLabel: 'About 5–8 minutes · difficulty adjustable',
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
