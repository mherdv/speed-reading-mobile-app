import type { AttemptResult } from './types';
import { normalizeGameId } from '../data/gameIds';

const DAY_MS = 24 * 60 * 60 * 1000;

export type ResultMetric = {
  value: number;
  label:
    | 'WPM'
    | 'Paced WPM'
    | 'Score'
    | 'Accuracy'
    | 'Sec break'
    | 'Answer accuracy'
    | 'Evidence accuracy'
    | 'Meaning accuracy'
    | 'Clue accuracy';
};

export type ResultComparison = {
  key: string;
  label: string;
  metric: ResultMetric;
};

export const MIN_VALID_READING_MS = 3_000;
/**
 * Conservative quality ceiling for personal estimates and trends.
 * Attempts above this value remain stored and visible, but brief-passage rates
 * above 800 WPM are too unstable to calibrate progress.
 */
export const MAX_PERSONAL_ESTIMATE_WPM = 800;

export type ReadingMeasurementQuality = {
  valid: boolean;
  reason?: 'too-short' | 'implausible-speed';
};

export function assessReadingMeasurement(
  wordCount: number,
  elapsedMs: number
): ReadingMeasurementQuality {
  if (elapsedMs < MIN_VALID_READING_MS) {
    return { valid: false, reason: 'too-short' };
  }
  const rawWpm = elapsedMs > 0 ? Math.round((wordCount * 60_000) / elapsedMs) : 0;
  if (rawWpm > MAX_PERSONAL_ESTIMATE_WPM) {
    return { valid: false, reason: 'implausible-speed' };
  }
  return { valid: true };
}

export function isValidProgressMeasurement(result: AttemptResult): boolean {
  if (
    result.details?.measurementValid === false ||
    result.details?.immediateReplayDuplicate === true
  ) {
    return false;
  }
  if (isReadingResult(result)) {
    return assessReadingMeasurement(result.wordCount, result.elapsedMs).valid;
  }
  return true;
}

export function isReadingResult(result: AttemptResult): boolean {
  return result.wordCount > 0 && result.wpm > 0;
}

export function isMeasuredReadingResult(result: AttemptResult): boolean {
  if (!isReadingResult(result)) return false;
  const activityType = result.details?.activityType;
  if (activityType === 'paced-reading') return false;
  if (activityType === 'measured-reading') return true;
  return result.sampleId !== 'PowerReader';
}

export function getResultMetric(result: AttemptResult): ResultMetric {
  const activityType = result.details?.activityType;
  if (activityType === 'evidence-hunt') {
    const value = result.details?.answerAccuracy;
    if (typeof value === 'number') {
      return { value: Math.round(value * 100), label: 'Accuracy' };
    }
  }
  if (activityType === 'context-builder') {
    const value = result.details?.meaningAccuracy;
    if (typeof value === 'number') {
      return { value: Math.round(value * 100), label: 'Accuracy' };
    }
  }
  if (
    result.details?.activityType === 'eye-comfort' &&
    typeof result.details.breakSeconds === 'number'
  ) {
    return { value: result.details.breakSeconds, label: 'Sec break' };
  }
  if (
    result.details?.activityType === 'paced-reading' &&
    isReadingResult(result)
  ) {
    return { value: result.wpm, label: 'Paced WPM' };
  }
  if (isReadingResult(result)) {
    return { value: result.wpm, label: 'WPM' };
  }
  if (typeof result.score === 'number') {
    return { value: result.score, label: 'Score' };
  }
  return {
    value: Math.round((result.accuracy ?? 0) * 100),
    label: 'Accuracy',
  };
}

export function getResultMetrics(result: AttemptResult): ResultMetric[] {
  if (result.details?.activityType === 'evidence-hunt') {
    const answer = result.details.answerAccuracy;
    const evidence = result.details.evidenceAccuracy;
    if (typeof answer === 'number' && typeof evidence === 'number') {
      return [
        { value: Math.round(answer * 100), label: 'Answer accuracy' },
        { value: Math.round(evidence * 100), label: 'Evidence accuracy' },
      ];
    }
  }
  if (result.details?.activityType === 'context-builder') {
    const meaning = result.details.meaningAccuracy;
    const clue = result.details.clueAccuracy;
    if (typeof meaning === 'number' && typeof clue === 'number') {
      return [
        { value: Math.round(meaning * 100), label: 'Meaning accuracy' },
        { value: Math.round(clue * 100), label: 'Clue accuracy' },
      ];
    }
  }
  return [getResultMetric(result)];
}

export function getResultComparisonKeyForMetric(
  result: AttemptResult,
  metric: ResultMetric
): string {
  const activity =
    optionalDetailString(result.details, 'activityType') ??
    (isMeasuredReadingResult(result) ? 'measured-reading' : 'legacy');
  const difficulty = optionalDetailString(result.details, 'difficulty');
  const comparisonBand =
    optionalDetailString(result.details, 'comparisonBand') ??
    (isMeasuredReadingResult(result) ? result.sampleId : undefined);
  return [
    activity,
    metric.label,
    difficulty ?? 'difficulty-unspecified',
    comparisonBand ?? 'comparison-band-unspecified',
  ].join('|');
}

function optionalDetailString(
  details: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const value = details?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getResultComparison(result: AttemptResult): ResultComparison {
  const metric = getResultMetric(result);
  const activity =
    optionalDetailString(result.details, 'activityType') ??
    (isMeasuredReadingResult(result) ? 'measured-reading' : 'legacy');
  const difficulty = optionalDetailString(result.details, 'difficulty');
  const content =
    optionalDetailString(result.details, 'contentId') ??
    (activity === 'measured-reading' ? result.sampleId : undefined);
  const comparisonBand =
    optionalDetailString(result.details, 'comparisonBand') ?? content;
  const parts = [
    activity,
    metric.label,
    difficulty ?? 'difficulty-unspecified',
    comparisonBand ?? 'comparison-band-unspecified',
  ];
  const labelParts = [
    metric.label,
    difficulty ? `${difficulty[0].toUpperCase()}${difficulty.slice(1)}` : null,
    comparisonBand ? 'same reading band' : null,
  ].filter((part): part is string => part !== null);

  return {
    key: parts.join('|'),
    label: labelParts.join(' · '),
    metric,
  };
}

export function areResultsSameContent(
  first: AttemptResult,
  second: AttemptResult
): boolean {
  const firstContent = optionalDetailString(first.details, 'contentId');
  const secondContent = optionalDetailString(second.details, 'contentId');
  if (!firstContent || !secondContent) return false;
  return firstContent === secondContent;
}

export function areResultsComparable(
  first: AttemptResult,
  second: AttemptResult
): boolean {
  const sameComparison = getResultComparison(first).key ===
    getResultComparison(second).key;
  if (
    isMeasuredReadingResult(first) &&
    isMeasuredReadingResult(second)
  ) {
    return sameComparison;
  }
  return normalizeGameId(first.sampleId) === normalizeGameId(second.sampleId) &&
    sameComparison;
}

export function formatAttemptSummary(result: AttemptResult): string {
  const metric = getResultMetric(result);
  const parts = [`${result.sampleTitle}: ${metric.value} ${metric.label}`];

  if (isMeasuredReadingResult(result)) {
    parts.push(result.comprehensionCorrect ? 'Comprehension correct' : 'Review comprehension');
  } else if (typeof result.accuracy === 'number') {
    parts.push(`${Math.round(result.accuracy * 100)}% accuracy`);
  }

  if (!isValidProgressMeasurement(result)) {
    parts.push('Not used for progress');
  }

  return parts.join(' · ');
}

export function formatDuration(elapsedMs: number): string {
  const safeMs = Math.max(0, elapsedMs);
  const totalSeconds = Math.round(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function localDayOrdinal(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
  );
}

/**
 * Counts consecutive local calendar days with at least one completed session.
 * A streak remains active when the most recent session was today or yesterday.
 */
export function calculateDailyStreak(
  results: AttemptResult[],
  now = new Date()
): number {
  const activeDays = Array.from(
    new Set(
      results
        .map((result) => new Date(result.finishedAtIso))
        .filter((date) => Number.isFinite(date.getTime()))
        .map(localDayOrdinal)
    )
  ).sort((a, b) => b - a);

  if (activeDays.length === 0) return 0;

  const today = localDayOrdinal(now);
  const latest = activeDays[0];
  if (latest < today - 1 || latest > today) return 0;

  let streak = 0;
  let expected = latest;
  for (const day of activeDays) {
    if (day !== expected) break;
    streak += 1;
    expected -= 1;
  }
  return streak;
}
