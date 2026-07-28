import type { AttemptResult } from './types';
import {
  BASELINE_TEXT_SAMPLES,
  TEXT_SAMPLES,
} from '../data/textSamples';
import {
  buildTodayPlan,
  calculatePersonalPracticeEstimate,
  calculateReadingPerformanceProfile,
  calculateTrainingSkillProfile,
  estimateReadingMinutes,
  formatReadingEstimate,
  isBaselineEligibleResult,
  recommendSkillPractice,
  resolveTodayPlanSnapshot,
  selectReadingBenchmarkResults,
} from './readingPlan';
import type { TodayPlanSnapshot } from '../data/todayPlanStore';

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
      eligiblePassageCount: 2,
      requiredPassageCount: 3,
      benchmarkWindowDays: 30,
      benchmarkBand: 'general-practice-brief-v1',
      benchmarkContentVersion: 1,
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
      eligiblePassageCount: 3,
      requiredPassageCount: 3,
      benchmarkWindowDays: 30,
      benchmarkBand: 'general-practice-brief-v1',
      benchmarkContentVersion: 1,
      medianWpm: 260,
      correct: 6,
      total: 9,
    });
  });

  it('protects the reported training pace with an 80% comprehension floor', () => {
    const strongProfile = calculateReadingPerformanceProfile([
      reading('1', 'sample-1', 210, 3),
      reading('2', 'sample-2', 230, 3),
      reading('3', 'sample-3', 260, 3),
    ]);
    expect(strongProfile).toMatchObject({
      ready: true,
      measuredMedianWpm: 230,
      sustainableWpm: 230,
      comprehensionPercent: 100,
      confidence: 'developing',
      paceRange: { lowerWpm: 210, upperWpm: 260 },
      eligiblePassageCount: 3,
      sustainablePassageCount: 3,
      benchmarkWindowDays: 30,
    });

    const rushedProfile = calculateReadingPerformanceProfile([
      reading('1', 'sample-1', 300, 1),
      reading('2', 'sample-2', 330, 2),
      reading('3', 'sample-3', 360, 2),
    ]);
    expect(rushedProfile).toMatchObject({
      ready: true,
      measuredMedianWpm: 330,
      comprehensionPercent: 56,
      sustainablePassageCount: 0,
    });
    expect(rushedProfile.sustainableWpm).toBeUndefined();
    expect(rushedProfile.recommendation).toContain('80%');
  });

  it('uses only individually understood passages for sustainable WPM', () => {
    const profile = calculateReadingPerformanceProfile([
      reading('1', 'sample-1', 200, 4, 5),
      reading('2', 'sample-2', 220, 4, 5),
      reading('3', 'sample-3', 240, 5, 5),
      reading('4', 'baseline-4', 500, 3, 5),
    ]);

    expect(profile).toMatchObject({
      ready: true,
      eligiblePassageCount: 4,
      measuredMedianWpm: 230,
      sustainablePassageCount: 3,
      sustainableWpm: 220,
    });
  });

  it('selects at most the latest six distinct passages in one 30-day band/version cohort', () => {
    const now = new Date('2026-07-28T12:00:00.000Z');
    const dated = BASELINE_TEXT_SAMPLES.slice(0, 8).map(
      (sample, index): AttemptResult => ({
        ...reading(
          `result-${index}`,
          sample.id,
          200 + index * 10,
          3
        ),
        startedAtIso: new Date(
          now.getTime() - (index + 1) * 24 * 60 * 60 * 1000 - 60_000
        ).toISOString(),
        finishedAtIso: new Date(
          now.getTime() - (index + 1) * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
    );
    const tooOld = {
      ...reading('old', 'baseline-9', 999, 3),
      startedAtIso: '2026-06-01T11:59:00.000Z',
      finishedAtIso: '2026-06-01T12:00:00.000Z',
    };
    const selection = selectReadingBenchmarkResults(
      [...dated, tooOld],
      { now }
    );

    expect(selection.results).toHaveLength(6);
    expect(selection.results.map((result) => result.id)).toEqual(
      dated.slice(0, 6).map((result) => result.id)
    );
    expect(selection).toMatchObject({
      eligiblePassageCount: 6,
      windowDays: 30,
      limit: 6,
      comparisonBand: 'general-practice-brief-v1',
      contentVersion: 1,
    });
  });

  it('never mixes comparison bands or content versions in one benchmark', () => {
    const now = new Date('2026-07-28T12:00:00.000Z');
    const customSamples = BASELINE_TEXT_SAMPLES.slice(0, 6).map(
      (sample, index) => ({
        ...sample,
        comparisonBand: index < 3 ? 'band-a' : 'band-b',
        version: index < 3 ? 1 : 2,
      })
    );
    const cohortA = customSamples.slice(0, 3).map((sample, index) => ({
      ...reading(`a-${index}`, sample.id, 210 + index * 10, 3),
      startedAtIso: `2026-07-2${index}T09:59:00.000Z`,
      finishedAtIso: `2026-07-2${index}T10:00:00.000Z`,
      details: {
        ...reading(`a-${index}`, sample.id, 210, 3).details,
        comparisonBand: 'band-a',
        contentVersion: 1,
      },
    }));
    const cohortB = customSamples.slice(3).map((sample, index) => ({
      ...reading(`b-${index}`, sample.id, 240 + index * 10, 3),
      startedAtIso: `2026-07-2${index + 4}T09:59:00.000Z`,
      finishedAtIso: `2026-07-2${index + 4}T10:00:00.000Z`,
      details: {
        ...reading(`b-${index}`, sample.id, 240, 3).details,
        comparisonBand: 'band-b',
        contentVersion: 2,
      },
    }));

    const selection = selectReadingBenchmarkResults(
      [...cohortA, ...cohortB],
      { now, baselineSamples: customSamples }
    );
    expect(selection.results.map((result) => result.id)).toEqual([
      'b-2',
      'b-1',
      'b-0',
    ]);
    expect(selection).toMatchObject({
      comparisonBand: 'band-b',
      contentVersion: 2,
      eligiblePassageCount: 3,
    });
  });

  it('scores skills separately and recommends the weakest measured skill', () => {
    const contextResult: AttemptResult = {
      ...reading('context', 'ContextBuilder', 0, 0),
      details: {
        meaningAccuracy: 1,
        clueAccuracy: 0.8,
      },
    };
    const evidenceResult: AttemptResult = {
      ...reading('evidence', 'EvidenceHunt', 0, 0),
      details: {
        answerAccuracy: 0.5,
        evidenceAccuracy: 0.25,
      },
    };
    const skillProfile = calculateTrainingSkillProfile([
      contextResult,
      evidenceResult,
    ]);
    expect(
      skillProfile.find((skill) => skill.id === 'vocabulary')
    ).toMatchObject({ score: 90, sessionCount: 1 });
    expect(skillProfile.find((skill) => skill.id === 'evidence')).toMatchObject({
      score: 38,
      sessionCount: 1,
    });
    expect(
      recommendSkillPractice([contextResult, evidenceResult])
    ).toMatchObject({
      gameId: 'EvidenceHunt',
      skill: { id: 'evidence', score: 38 },
    });
    expect(
      recommendSkillPractice([contextResult, evidenceResult], 1).gameId
    ).not.toBe('EvidenceHunt');
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
      eligiblePassageCount: 0,
      requiredPassageCount: 3,
      benchmarkWindowDays: 30,
      benchmarkBand: undefined,
      benchmarkContentVersion: undefined,
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

  it('derives terminal Today states only from exact results started after assignment', () => {
    const snapshot: TodayPlanSnapshot = {
      schemaVersion: 2,
      localDate: '2026-6-26',
      createdAtIso: '2026-07-26T09:00:00.000Z',
      reading: {
        sampleId: 'sample-1',
        assignedAtIso: '2026-07-26T09:00:00.000Z',
        swapOffset: 0,
      },
      skill: {
        gameId: 'ContextBuilder',
        assignedAtIso: '2026-07-26T09:00:00.000Z',
        swapOffset: 0,
      },
      skipped: [],
    };
    const beforeAssignment = reading('before', 'sample-1', 220, 3);
    const wrongSkill: AttemptResult = {
      ...reading('wrong-skill', 'EvidenceHunt', 0, 0),
      startedAtIso: '2026-07-26T10:00:00.000Z',
      finishedAtIso: '2026-07-26T10:01:00.000Z',
      details: { activityType: 'evidence-hunt' },
    };
    const pending = resolveTodayPlanSnapshot({
      snapshot,
      results: [beforeAssignment, wrongSkill],
      samples: TEXT_SAMPLES,
      now: new Date('2026-07-26T12:00:00.000Z'),
    });
    expect(pending.pendingItems.map((item) => item.id)).toEqual([
      'reading',
      'skill',
    ]);

    const completedReading: AttemptResult = {
      ...reading('completed-reading', 'sample-1', 230, 3),
      startedAtIso: '2026-07-26T10:00:00.000Z',
      finishedAtIso: '2026-07-26T10:02:00.000Z',
    };
    const completedSkill: AttemptResult = {
      ...reading('completed-skill', 'ContextBuilder', 0, 0),
      startedAtIso: '2026-07-26T10:03:00.000Z',
      finishedAtIso: '2026-07-26T10:04:00.000Z',
      details: { activityType: 'context-builder' },
    };
    const complete = resolveTodayPlanSnapshot({
      snapshot,
      results: [completedReading, completedSkill],
      samples: TEXT_SAMPLES,
      now: new Date('2026-07-26T12:00:00.000Z'),
    });
    expect(complete.pendingItems).toEqual([]);
    expect(complete.completedCount).toBe(2);
    expect(complete.isComplete).toBe(true);
    expect(complete.items.map((item) => item.status)).toEqual([
      'completed',
      'completed',
    ]);
  });
});
