import { normalizeGameId } from '../data/gameIds';
import type {
  TodayPlanItemId,
  TodayPlanLaunchContext,
} from '../data/todayPlanStore';
import {
  isMeasuredReadingResult,
  isValidProgressMeasurement,
} from '../domain/results';
import type { AttemptResult, TextSample } from '../domain/types';
import {
  resolveTodayPlanSnapshot,
  type ResolvedTodayPlanItem,
} from '../domain/readingPlan';

export function mergeOptimisticTodayPlanResult(
  result: AttemptResult,
  storedResults: readonly AttemptResult[]
): AttemptResult[] {
  return [
    result,
    ...storedResults.filter((storedResult) => storedResult.id !== result.id),
  ];
}

function currentResultCompletesOrigin(
  context: TodayPlanLaunchContext,
  result: AttemptResult
): boolean {
  if (context.itemId === 'reading') {
    return (
      isMeasuredReadingResult(result) &&
      isValidProgressMeasurement(result) &&
      result.details?.contentId === context.snapshot.reading.sampleId
    );
  }
  if (context.itemId === 'skill') {
    return normalizeGameId(result.sampleId) === context.snapshot.skill.gameId;
  }
  return (
    context.snapshot.comfort !== undefined &&
    normalizeGameId(result.sampleId) === context.snapshot.comfort.gameId
  );
}

export function getOptimisticTodayPlanCompletionIds(
  context: TodayPlanLaunchContext,
  result: AttemptResult
): TodayPlanItemId[] {
  const completed = new Set(context.optimisticallyCompletedItemIds ?? []);
  if (currentResultCompletesOrigin(context, result)) {
    completed.add(context.itemId);
  }
  return [...completed];
}

export function resolveNextTodayPlanItem({
  context,
  result,
  storedResults,
  samples,
  now,
}: {
  context: TodayPlanLaunchContext;
  result: AttemptResult;
  storedResults: readonly AttemptResult[];
  samples: readonly TextSample[];
  now?: Date;
}): ResolvedTodayPlanItem | undefined {
  const optimisticCompleted = new Set(
    getOptimisticTodayPlanCompletionIds(context, result)
  );
  return resolveTodayPlanSnapshot({
    snapshot: context.snapshot,
    results: mergeOptimisticTodayPlanResult(result, storedResults),
    samples,
    now,
  }).pendingItems.find((item) => !optimisticCompleted.has(item.id));
}
