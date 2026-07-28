import type { AttemptResult } from './types';
import {
  BASELINE_TEXT_SAMPLES,
  TEXT_SAMPLES,
} from '../data/textSamples';
import {
  buildTodayPlan,
  calculatePersonalPracticeEstimate,
  estimateReadingMinutes,
  formatReadingEstimate,
  isBaselineEligibleResult,
} from './readingPlan';

function reading(
  id: string,
  sampleId: string,
  wpm: number,
  correct: number,
  total = 3,
  valid = true
): AttemptResult {
  return {
    id,
    sampleId,
    sampleTitle: sampleId,
    startedAtIso: '2026-07-26T08:00:00.000Z',
    finishedAtIso: '2026-07-26T08:02:00.000Z',
    elapsedMs: 120_000,
    wordCount: 300,
    wpm,
    comprehensionCorrect: correct === total,
    details: {
      activityType: 'measured-reading',
      contentId: sampleId,
      contentVersion: 1,
      comparisonBand: 'general-practice-brief-v1',
      measurementValid: valid,
      comprehensionCorrectCount: correct,
      comprehensionQuestionCount: total,
    },
  };
}

describe('reading-first Today and baseline model', () => {
  it('requires three distinct valid passages and reports the median with counts', () => {
    const two = [
      reading('1', 'sample-1', 200, 2),
      reading('2', 'sample-2', 340, 3),
      reading('invalid', 'sample-3', 900, 3, 3, false),
    ];
    expect(calculatePersonalPracticeEstimate(two)).toEqual({
      ready: false,
      validPassageCount: 2,
      requiredPassageCount: 3,
      correct: 5,
      total: 6,
    });
    expect(
      calculatePersonalPracticeEstimate([
        ...two,
        reading('3', 'sample-3', 260, 1),
      ])
    ).toEqual({
      ready: true,
      validPassageCount: 3,
      requiredPassageCount: 3,
      medianWpm: 260,
      correct: 6,
      total: 9,
    });
  });

  it('builds an explained deterministic plan that swaps and skips without mutating results', () => {
    const results: AttemptResult[] = [];
    const initial = buildTodayPlan({ results, samples: TEXT_SAMPLES });
    expect(initial.map((item) => item.id)).toEqual(['reading', 'skill']);
    expect(initial.every((item) => item.reason.length > 20)).toBe(true);
    expect(initial[0]?.title).toBe('Baseline passage 1 of 3');

    const swapped = buildTodayPlan({
      results,
      samples: TEXT_SAMPLES,
      swapOffset: 1,
      readingSwapOffset: 1,
    });
    expect(swapped[0]?.title).toBe('Baseline passage 1 of 3');
    expect(
      swapped.find((item) => item.id === 'reading' && item.kind === 'reading')
    ).toHaveProperty('sample.id', 'sample-2');
    expect(swapped[1]?.title).not.toBe(initial[1]?.title);

    expect(
      buildTodayPlan({
        results,
        samples: TEXT_SAMPLES,
        skipped: ['reading', 'skill'],
      })
    ).toEqual([]);
    expect(results).toEqual([]);
  });

  it('adds optional comfort only after sustained same-day use', () => {
    const shortResults = [
      reading('1', 'sample-1', 200, 2),
      reading('2', 'sample-2', 220, 2),
      reading('3', 'sample-3', 240, 2),
    ];
    expect(
      buildTodayPlan({
        results: shortResults.map((result) => ({
          ...result,
          elapsedMs: 30_000,
        })),
        samples: TEXT_SAMPLES,
        now: new Date('2026-07-26T12:00:00.000Z'),
      }).map((item) => item.id)
    ).toEqual(['reading', 'skill']);
    expect(
      buildTodayPlan({
        results: shortResults.map((result) => ({
          ...result,
          elapsedMs: 200_000,
        })),
        samples: TEXT_SAMPLES,
        now: new Date('2026-07-26T12:00:00.000Z'),
      }).map((item) => item.id)
    ).toEqual(['reading', 'skill', 'comfort']);
  });

  it('rotates to a fresh reviewed passage after the three-reading estimate is ready', () => {
    const completed = BASELINE_TEXT_SAMPLES.slice(0, 3).map((sample, index) =>
      reading(`${index + 1}`, sample.id, 220 + index * 10, 3)
    );
    const nextReading = buildTodayPlan({
      results: completed,
      samples: TEXT_SAMPLES,
    })[0];

    expect(nextReading?.title).toBe(
      `Measured reading: ${BASELINE_TEXT_SAMPLES[3]!.title}`
    );
    expect(nextReading).toHaveProperty(
      'sample.id',
      BASELINE_TEXT_SAMPLES[3]!.id
    );
  });

  it('accepts a valid passage completed through the standalone Baseline Reading game', () => {
    const sample = BASELINE_TEXT_SAMPLES[3]!;
    const standaloneResult: AttemptResult = {
      ...reading('standalone', sample.id, 245, 3),
      sampleId: 'WpmTest',
      sampleTitle: 'Baseline Reading',
    };

    expect(isBaselineEligibleResult(standaloneResult)).toBe(true);
  });

  it('rejects legacy baseline attempts and counts only completed baseline IDs', () => {
    const legacy = reading('legacy', 'sample-1', 220, 1, 1);
    expect(isBaselineEligibleResult(legacy)).toBe(false);
    expect(
      calculatePersonalPracticeEstimate([
        legacy,
        reading('legacy-2', 'sample-2', 220, 1, 1),
        reading('legacy-3', 'sample-3', 220, 1, 1),
      ])
    ).toEqual({
      ready: false,
      validPassageCount: 0,
      requiredPassageCount: 3,
      correct: 0,
      total: 0,
    });

    const nonBaseline = Array.from({ length: 20 }, (_, index) =>
      reading(`other-${index}`, `sample-${index + 4}`, 220, 3)
    );
    expect(
      buildTodayPlan({ results: nonBaseline, samples: TEXT_SAMPLES })[0]?.title
    ).toBe('Baseline passage 1 of 3');
    expect(
      isBaselineEligibleResult({
        ...reading('wrong-version', 'sample-1', 220, 3),
        details: {
          ...reading('wrong-version', 'sample-1', 220, 3).details,
          contentVersion: 2,
        },
      })
    ).toBe(false);
    expect(
      isBaselineEligibleResult({
        ...reading('wrong-band', 'sample-1', 220, 3),
        details: {
          ...reading('wrong-band', 'sample-1', 220, 3).details,
          comparisonBand: 'different-band',
        },
      })
    ).toBe(false);
  });

  it('excludes an extreme brief-passage result from baseline completion', () => {
    const extreme = {
      ...reading('extreme', 'sample-1', 900, 3),
      wordCount: 140,
      elapsedMs: 9_333,
    };
    expect(isBaselineEligibleResult(extreme)).toBe(false);
    expect(
      buildTodayPlan({ results: [extreme], samples: TEXT_SAMPLES })[0]?.title
    ).toBe('Baseline passage 1 of 3');
  });

  it('uses one shared duration calculation', () => {
    const sample = TEXT_SAMPLES[0]!;
    expect(formatReadingEstimate(sample)).toBe(
      `About ${estimateReadingMinutes(sample)} minutes`
    );
  });
});
