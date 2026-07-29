import type { AttemptResult } from './types';
import {
  calculateDailyStreak,
  formatAttemptSummary,
  formatDuration,
  getResultMetric,
  assessReadingMeasurement,
  isValidProgressMeasurement,
  areResultsComparable,
  areResultsSameContent,
  getResultComparison,
} from './results';

function makeResult(overrides: Partial<AttemptResult> = {}): AttemptResult {
  return {
    id: 'result-1',
    sampleId: 'sample-1',
    sampleTitle: 'Focus & Pace',
    startedAtIso: '2026-07-26T08:00:00.000Z',
    finishedAtIso: '2026-07-26T08:01:00.000Z',
    elapsedMs: 60_000,
    wordCount: 200,
    wpm: 200,
    comprehensionCorrect: true,
    ...overrides,
  };
}

describe('result helpers', () => {
  it('prefers WPM for measured reading attempts', () => {
    expect(getResultMetric(makeResult({ score: 999 }))).toEqual({
      value: 200,
      label: 'WPM',
    });
    expect(formatAttemptSummary(makeResult())).toContain('Comprehension correct');
  });

  it('uses break duration for eye-comfort sessions', () => {
    expect(
      getResultMetric(
        makeResult({
          wordCount: 0,
          wpm: 0,
          score: 40,
          details: {
            activityType: 'eye-comfort',
            breakSeconds: 40,
          },
        })
      )
    ).toEqual({ value: 40, label: 'Sec break' });
  });

  it('infers legacy Power Reader WPM as a configured guide, not measured reading', () => {
    const summary = formatAttemptSummary(
      makeResult({
        sampleId: 'PowerReader',
        sampleTitle: 'Power Reader',
      })
    );

    expect(summary).toBe('Power Reader: 200 Guided pace');
    expect(getResultComparison(makeResult({ sampleId: 'PowerReader' })).key)
      .toContain('paced-reading|Guided pace');
  });

  it('falls back to the legacy Power Reader score when WPM was not stored', () => {
    expect(
      getResultMetric(
        makeResult({
          sampleId: 'PowerReader',
          wordCount: 0,
          wpm: 0,
          score: 325,
        })
      )
    ).toEqual({ value: 325, label: 'Guided pace' });
  });

  it('uses activity type instead of a title heuristic for new results', () => {
    expect(
      formatAttemptSummary(
        makeResult({
          sampleId: 'future-pacer',
          wordCount: 12,
          wpm: 0,
          details: { activityType: 'paced-reading', targetWpm: 275 },
        })
      )
    ).toBe('Focus & Pace: 275 Guided pace');

    expect(
      formatAttemptSummary(
        makeResult({
          sampleId: 'RepeatedReading',
          details: { activityType: 'measured-reading' },
        })
      )
    ).toContain('Comprehension correct');
  });

  it('formats short and multi-minute durations', () => {
    expect(formatDuration(4_320)).toBe('4.32s');
    expect(formatDuration(19_600)).toBe('19.60s');
    expect(formatDuration(125_000)).toBe('2m 5.00s');
    expect(formatDuration(59_999)).toBe('1m 0.00s');
    expect(formatDuration(-1)).toBe('0.00s');
    expect(formatDuration(Number.NaN)).toBe('0.00s');
  });

  it('flags immediate or implausibly fast reading without changing raw data', () => {
    expect(assessReadingMeasurement(200, 1)).toEqual({
      valid: false,
      reason: 'too-short',
    });
    expect(assessReadingMeasurement(200, 10_000)).toEqual({
      valid: false,
      reason: 'implausible-speed',
    });
    expect(assessReadingMeasurement(200, 60_000)).toEqual({ valid: true });
    expect(assessReadingMeasurement(800, 60_000)).toEqual({ valid: true });
    expect(assessReadingMeasurement(801, 60_000)).toEqual({
      valid: false,
      reason: 'implausible-speed',
    });
    expect(assessReadingMeasurement(140, 9_333)).toEqual({
      valid: false,
      reason: 'implausible-speed',
    });
    expect(
      isValidProgressMeasurement(
        makeResult({ details: { measurementValid: false } })
      )
    ).toBe(false);
    expect(
      isValidProgressMeasurement(
        makeResult({
          elapsedMs: 9_333,
          wordCount: 140,
          wpm: 900,
          details: { measurementValid: true },
        })
      )
    ).toBe(false);
  });

  it('segments progress by activity, metric, difficulty, and reading band', () => {
    const easy = makeResult({
      sampleId: 'RepeatedReading',
      details: {
        activityType: 'measured-reading',
        difficulty: 'easy',
        contentId: 'passage-a',
        comparisonBand: 'brief-general-v1',
      },
    });
    const hard = makeResult({
      sampleId: 'RepeatedReading',
      details: {
        activityType: 'measured-reading',
        difficulty: 'hard',
        contentId: 'passage-a',
        comparisonBand: 'brief-general-v1',
      },
    });
    const otherContent = makeResult({
      sampleId: 'sample-different',
      details: {
        activityType: 'measured-reading',
        difficulty: 'easy',
        contentId: 'passage-b',
        comparisonBand: 'brief-general-v1',
      },
    });

    expect(areResultsComparable(easy, hard)).toBe(false);
    expect(areResultsComparable(easy, otherContent)).toBe(true);
    expect(areResultsSameContent(easy, otherContent)).toBe(false);
    expect(areResultsSameContent(easy, easy)).toBe(true);
    expect(getResultComparison(easy).label).toBe(
      'WPM · Easy · same reading band'
    );
  });

  it('keeps stable and moving Schulte grids in separate comparisons', () => {
    const legacyStable = makeResult({
      sampleId: 'SchulteNumbers',
      wordCount: 0,
      wpm: 0,
      score: 32,
      details: { difficulty: 'medium' },
    });
    const explicitStable = makeResult({
      ...legacyStable,
      id: 'stable',
      details: { difficulty: 'medium', gridMode: 'stable' },
    });
    const moving = makeResult({
      ...legacyStable,
      id: 'moving',
      details: { difficulty: 'medium', gridMode: 'reshuffle' },
    });

    expect(areResultsComparable(legacyStable, explicitStable)).toBe(true);
    expect(areResultsComparable(explicitStable, moving)).toBe(false);
    expect(getResultComparison(moving).label).toBe(
      'Score · Medium · Shuffle after each tap'
    );
  });

  it('labels modern Schulte rates and separates them from legacy scores', () => {
    const modern = makeResult({
      sampleId: 'SchulteNumbers',
      wordCount: 0,
      wpm: 0,
      score: 38,
      details: {
        difficulty: 'easy',
        gridMode: 'stable',
        itemsPerMinute: 38,
      },
    });
    const legacy = makeResult({
      ...modern,
      id: 'legacy',
      details: {
        difficulty: 'easy',
        gridMode: 'stable',
      },
    });

    expect(getResultMetric(modern)).toEqual({
      value: 38,
      label: 'Items/min',
    });
    expect(getResultMetric(legacy)).toEqual({
      value: 38,
      label: 'Score',
    });
    expect(areResultsComparable(modern, legacy)).toBe(false);
  });

  it('labels configured pacing separately from measured WPM', () => {
    expect(
      getResultMetric(
        makeResult({
          wordCount: 24,
          wpm: 0,
          details: { activityType: 'paced-reading', targetWpm: 300 },
        })
      )
    ).toEqual({ value: 300, label: 'Guided pace' });
  });

  it('counts unique consecutive activity days', () => {
    const now = new Date(2026, 6, 26, 12);
    const results = [
      makeResult({ id: 'today', finishedAtIso: new Date(2026, 6, 26, 9).toISOString() }),
      makeResult({ id: 'today-2', finishedAtIso: new Date(2026, 6, 26, 10).toISOString() }),
      makeResult({ id: 'yesterday', finishedAtIso: new Date(2026, 6, 25, 9).toISOString() }),
      makeResult({ id: 'two-days', finishedAtIso: new Date(2026, 6, 24, 9).toISOString() }),
    ];

    expect(calculateDailyStreak(results, now)).toBe(3);
  });

  it('keeps a streak active from yesterday and resets stale activity', () => {
    const now = new Date(2026, 6, 26, 12);
    expect(
      calculateDailyStreak([
        makeResult({ finishedAtIso: new Date(2026, 6, 25, 9).toISOString() }),
      ], now)
    ).toBe(1);
    expect(
      calculateDailyStreak([
        makeResult({ finishedAtIso: new Date(2026, 6, 23, 9).toISOString() }),
      ], now)
    ).toBe(0);
  });
});
