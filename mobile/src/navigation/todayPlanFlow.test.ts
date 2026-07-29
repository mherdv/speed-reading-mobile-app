import type {
  TodayPlanLaunchContext,
  TodayPlanSnapshot,
} from '../data/todayPlanStore';
import { TEXT_SAMPLES } from '../data/textSamples';
import type { AttemptResult } from '../domain/types';
import {
  getOptimisticTodayPlanCompletionIds,
  mergeOptimisticTodayPlanResult,
  resolveNextTodayPlanItem,
} from './todayPlanFlow';

const assignedAtIso = '2026-07-29T08:00:00.000Z';

const snapshot: TodayPlanSnapshot = {
  schemaVersion: 2,
  localDate: '2026-6-29',
  createdAtIso: assignedAtIso,
  reading: {
    sampleId: TEXT_SAMPLES[0]!.id,
    assignedAtIso,
    swapOffset: 0,
  },
  skill: {
    gameId: 'ContextBuilder',
    assignedAtIso,
    swapOffset: 0,
  },
  skipped: [],
};

function result(
  overrides: Partial<AttemptResult> = {}
): AttemptResult {
  return {
    id: 'just-finished',
    sampleId: TEXT_SAMPLES[0]!.id,
    sampleTitle: TEXT_SAMPLES[0]!.title,
    startedAtIso: '2026-07-29T08:01:00.000Z',
    finishedAtIso: '2026-07-29T08:02:00.000Z',
    elapsedMs: 60_000,
    wordCount: 180,
    wpm: 180,
    comprehensionCorrect: true,
    details: {
      activityType: 'measured-reading',
      contentId: TEXT_SAMPLES[0]!.id,
    },
    ...overrides,
  };
}

describe('Today plan result continuation', () => {
  it('uses the just-finished result optimistically without duplicating it', () => {
    const current = result();
    const older = result({
      id: 'older',
      finishedAtIso: '2026-07-29T07:59:00.000Z',
    });

    expect(
      mergeOptimisticTodayPlanResult(current, [current, older])
        .map((storedResult) => storedResult.id)
    ).toEqual(['just-finished', 'older']);
  });

  it('advances from the completed reading to the first pending assigned item', () => {
    const context: TodayPlanLaunchContext = {
      snapshot,
      itemId: 'reading',
    };

    expect(
      resolveNextTodayPlanItem({
        context,
        result: result(),
        storedResults: [],
        samples: TEXT_SAMPLES,
        now: new Date('2026-07-29T09:00:00.000Z'),
      })
    ).toMatchObject({
      id: 'skill',
      gameId: 'ContextBuilder',
    });
  });

  it('keeps an invalid assigned reading pending for a clean retake', () => {
    const context: TodayPlanLaunchContext = {
      snapshot,
      itemId: 'reading',
    };
    const invalid = result({
      elapsedMs: 1,
      details: {
        activityType: 'measured-reading',
        contentId: TEXT_SAMPLES[0]!.id,
        measurementValid: false,
      },
    });

    expect(
      resolveNextTodayPlanItem({
        context,
        result: invalid,
        storedResults: [],
        samples: TEXT_SAMPLES,
        now: new Date('2026-07-29T09:00:00.000Z'),
      })
    ).toMatchObject({ id: 'reading' });
    expect(getOptimisticTodayPlanCompletionIds(context, invalid)).toEqual([]);
  });

  it('trusts the typed route origin when the civil clock moved backward', () => {
    const context: TodayPlanLaunchContext = {
      snapshot,
      itemId: 'reading',
    };
    const backwardClockResult = result({
      startedAtIso: '2026-07-29T07:59:00.000Z',
      finishedAtIso: '2026-07-29T08:00:00.000Z',
    });

    expect(
      resolveNextTodayPlanItem({
        context,
        result: backwardClockResult,
        storedResults: [],
        samples: TEXT_SAMPLES,
        now: new Date('2026-07-29T09:00:00.000Z'),
      })
    ).toMatchObject({ id: 'skill' });
  });

  it('carries prior optimistic completions across a pending background save', () => {
    const context: TodayPlanLaunchContext = {
      snapshot,
      itemId: 'skill',
      optimisticallyCompletedItemIds: ['reading'],
    };
    const completedSkill = result({
      sampleId: 'ContextBuilder',
      sampleTitle: 'Context Builder',
      wordCount: 0,
      wpm: 0,
      details: { activityType: 'context-builder' },
    });

    expect(
      resolveNextTodayPlanItem({
        context,
        result: completedSkill,
        storedResults: [],
        samples: TEXT_SAMPLES,
        now: new Date('2026-07-29T09:00:00.000Z'),
      })
    ).toBeUndefined();
    expect(
      getOptimisticTodayPlanCompletionIds(context, completedSkill)
    ).toEqual(['reading', 'skill']);
  });

  it('returns no next item once every assigned item is complete', () => {
    const context: TodayPlanLaunchContext = {
      snapshot,
      itemId: 'skill',
    };
    const completedReading = result({ id: 'reading-complete' });
    const completedSkill = result({
      sampleId: 'ContextBuilder',
      sampleTitle: 'Context Builder',
      wordCount: 0,
      wpm: 0,
      details: { activityType: 'context-builder' },
    });

    expect(
      resolveNextTodayPlanItem({
        context,
        result: completedSkill,
        storedResults: [completedReading],
        samples: TEXT_SAMPLES,
        now: new Date('2026-07-29T09:00:00.000Z'),
      })
    ).toBeUndefined();
  });
});
