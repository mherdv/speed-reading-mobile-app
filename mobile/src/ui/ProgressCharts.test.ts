import type { AttemptResult } from '../domain/types';
import { groupByComparableGame } from './ProgressCharts';

function result(
  id: string,
  score: number,
  difficulty: 'easy' | 'hard'
): AttemptResult {
  return {
    id,
    sampleId: 'TextSearch',
    sampleTitle: 'Text Search',
    startedAtIso: `2026-07-26T08:0${id}:00.000Z`,
    finishedAtIso: `2026-07-26T08:0${id}:10.000Z`,
    elapsedMs: 10_000,
    wordCount: 0,
    wpm: 0,
    comprehensionCorrect: false,
    score,
    accuracy: score / 100,
    details: {
      activityType: 'scanning',
      difficulty,
    },
  };
}

describe('comparable progress grouping', () => {
  it('retains zero-score failures and separates difficulty groups', () => {
    const groups = groupByComparableGame([
      result('1', 0, 'easy'),
      result('2', 80, 'easy'),
      result('3', 100, 'hard'),
    ]);

    expect(groups).toHaveLength(2);
    const easy = groups.find((group) =>
      group.comparisonLabel.includes('Easy')
    );
    expect(easy).toEqual(
      expect.objectContaining({
        attempts: 2,
        bestScore: 80,
        latestScore: 80,
        recentScores: [0, 80],
      })
    );
  });

  it('excludes explicitly invalid measurements from trends', () => {
    const invalid = result('1', 100, 'easy');
    invalid.details = {
      ...invalid.details,
      measurementValid: false,
    };
    expect(groupByComparableGame([invalid])).toEqual([]);
  });

  it('groups measured reads from different passage IDs by comparison band', () => {
    const first: AttemptResult = {
      ...result('1', 0, 'easy'),
      sampleId: 'sample-1',
      sampleTitle: 'Passage one',
      wordCount: 120,
      wpm: 220,
      score: undefined,
      accuracy: undefined,
      details: {
        activityType: 'measured-reading',
        difficulty: 'easy',
        contentId: 'sample-1',
        comparisonBand: 'general-practice-brief-v1',
        measurementValid: true,
      },
    };
    const second: AttemptResult = {
      ...first,
      id: '2',
      sampleId: 'sample-7',
      sampleTitle: 'Passage seven',
      wpm: 240,
      details: {
        ...first.details,
        contentId: 'sample-7',
      },
      finishedAtIso: '2026-07-26T08:02:10.000Z',
    };

    expect(groupByComparableGame([first, second])).toEqual([
      expect.objectContaining({
        gameId: 'MeasuredReading',
        gameName: 'Measured reading baseline',
        attempts: 2,
        recentScores: [220, 240],
        comparisonLabel: 'WPM · Easy · same reading band',
      }),
    ]);
  });
});
