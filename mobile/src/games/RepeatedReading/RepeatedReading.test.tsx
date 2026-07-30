import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { TextSample } from '../../domain/types';
import RepeatedReading, {
  buildRepeatedReadingDeck,
  chooseNextRepeatedReadingSample,
  getRepeatedReadingPool,
  prepareRepeatedReadingSample,
} from './RepeatedReading';

const SAMPLE: TextSample = {
  id: 'repeated-test',
  comparisonBand: 'test-brief-v1',
  title: 'A short passage',
  text: 'One two three four five six.',
  question: {
    prompt: 'Which number came last?',
    choices: ['Four', 'Five', 'Six'],
    correctIndex: 2,
  },
};

describe('RepeatedReading', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a recommended pace as optional guidance on the intro', async () => {
    const view = render(
      <RepeatedReading sample={SAMPLE} suggestedWpm={210} />
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(view.getByTestId('suggested-wpm')).toBeTruthy();
    expect(view.getByText('About 210 WPM')).toBeTruthy();
    expect(view.queryByTestId('repeated-passage')).toBeNull();
  });

  it('uses three explicit, disjoint ten-passage difficulty bands', () => {
    const easy = getRepeatedReadingPool('easy');
    const medium = getRepeatedReadingPool('medium');
    const hard = getRepeatedReadingPool('hard');

    expect(easy).toHaveLength(10);
    expect(medium).toHaveLength(10);
    expect(hard).toHaveLength(10);
    expect(easy.map((item) => item.id)).toContain('sample-14');
    expect(medium.map((item) => item.id)).toContain('sample-18');
    expect(hard.map((item) => item.id)).toContain('repeated-training-05');

    const all = [...easy, ...medium, ...hard];
    expect(new Set(all.map((item) => item.id)).size).toBe(30);
    expect(
      all.every((item) => item.complexityBand !== 'baseline-brief')
    ).toBe(true);
  });

  it('avoids immediately repeating the previous bundled passage', () => {
    const pool = getRepeatedReadingPool('easy');
    expect(
      chooseNextRepeatedReadingSample('easy', pool[0]!.id, () => 0).id
    ).toBe(pool[1]!.id);
  });

  it('excludes a prior result passage from generated practice', () => {
    const pool = getRepeatedReadingPool('easy');

    expect(
      chooseNextRepeatedReadingSample(
        'easy',
        '',
        () => 0,
        pool[0]!.id
      ).id
    ).toBe(pool[1]!.id);
  });

  it('builds a complete unique passage cycle and protects its boundary', () => {
    const pool = getRepeatedReadingPool('easy');
    const firstDeck = buildRepeatedReadingDeck(pool, '', () => 0);
    const boundaryId = firstDeck[0]!.id;
    const protectedDeck = buildRepeatedReadingDeck(
      pool,
      boundaryId,
      () => 0
    );
    const excludedDeck = buildRepeatedReadingDeck(
      pool,
      '',
      () => 0,
      pool[0]!.id
    );

    expect(new Set(firstDeck.map((item) => item.id)).size).toBe(pool.length);
    expect(protectedDeck[0]!.id).not.toBe(boundaryId);
    expect(new Set(protectedDeck.map((item) => item.id)).size).toBe(
      pool.length
    );
    expect(excludedDeck).toHaveLength(pool.length - 1);
    expect(excludedDeck.map((item) => item.id)).not.toContain(pool[0]!.id);
  });

  it('uses every generated passage before refilling its local deck', async () => {
    const pool = getRepeatedReadingPool('easy');
    const report = jest.fn();
    const view = render(
      <RepeatedReading
        difficulty="easy"
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });

    const completeSession = (
      startTestId: 'start-button' | 'play-again'
    ) => {
      fireEvent.press(view.getByTestId(startTestId));
      const firstPassage =
        view.getByTestId('repeated-passage').props.children;
      fireEvent.press(view.getByTestId('finish-round'));
      fireEvent.press(view.getByTestId('start-next-round'));
      expect(view.getByTestId('repeated-passage')).toHaveTextContent(
        firstPassage
      );
      fireEvent.press(view.getByTestId('finish-round'));
      fireEvent.press(view.getByTestId('repeated-choice-0'));
      fireEvent.press(view.getByTestId('submit-repeated-answer'));
    };

    for (let index = 0; index < pool.length; index += 1) {
      completeSession(index === 0 ? 'start-button' : 'play-again');
    }
    const firstCycleIds = report.mock.calls.map(
      ([payload]) => payload.details.contentId
    );
    expect(new Set(firstCycleIds).size).toBe(pool.length);

    completeSession('play-again');
    const nextCycleId =
      report.mock.calls[pool.length]![0].details.contentId;
    expect(nextCycleId).not.toBe(firstCycleIds.at(-1));
  });

  it('keeps excluded generated content out of the local deck', async () => {
    const pool = getRepeatedReadingPool('easy');
    const view = render(
      <RepeatedReading
        difficulty="easy"
        excludedContentId={pool[0]!.id}
        random={() => 0.999}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(view.getByTestId('start-button'));

    expect(view.getByTestId('repeated-passage')).not.toHaveTextContent(
      pool[0]!.text
    );
  });

  it('preserves the correct answer when recognition choices are shuffled', () => {
    const prepared = prepareRepeatedReadingSample(SAMPLE, () => 0);

    expect(prepared.question.choices[prepared.question.correctIndex]).toBe(
      SAMPLE.question.choices[SAMPLE.question.correctIndex]
    );
    expect(prepared.question.correctIndex).not.toBe(
      SAMPLE.question.correctIndex
    );
    expect(SAMPLE.question.correctIndex).toBe(2);
  });

  it('does not retain a constant answer position in any difficulty pool', () => {
    const randomValues = [0, 0.25, 0.5, 0.75];

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const positions = getRepeatedReadingPool(difficulty).flatMap((item) =>
        randomValues.map(
          (value) =>
            prepareRepeatedReadingSample(item, () => value).question
              .correctIndex
        )
      );
      const positionCounts = positions.reduce<Record<number, number>>(
        (counts, position) => ({
          ...counts,
          [position]: (counts[position] ?? 0) + 1,
        }),
        {}
      );

      expect(new Set(positions).size).toBe(4);
      expect(Math.max(...Object.values(positionCounts))).toBeLessThan(
        positions.length / 2
      );
    }
  });

  it('times two reading passes and checks comprehension', async () => {
    const onReportResult = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <RepeatedReading
        sample={SAMPLE}
        random={() => 0.999}
        onReportResult={onReportResult}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(queryByTestId('repeated-passage')).toBeNull();
    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    fireEvent.press(getByTestId('finish-round'));
    expect(getByTestId('between-rounds')).toBeTruthy();

    fireEvent.press(getByTestId('start-next-round'));
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    fireEvent.press(getByTestId('finish-round'));

    fireEvent.press(getByTestId('repeated-choice-2'));
    await act(async () => {
      fireEvent.press(getByTestId('submit-repeated-answer'));
      await Promise.resolve();
    });

    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 90_000,
        score: 12,
        details: expect.objectContaining({
          activityType: 'measured-reading',
          wordCount: 6,
          roundWpms: [6, 12],
          firstWpm: 6,
          lastWpm: 12,
          comprehensionCorrect: true,
        }),
      })
    );
  });

  it('keeps both reading passes stable across civil clock changes', async () => {
    const onReportResult = jest.fn();
    let monotonicTime = 1_000;
    let civilTime = Date.parse('2020-01-01T08:00:00.000Z');
    const { getByTestId } = render(
      <RepeatedReading
        sample={SAMPLE}
        clock={() => monotonicTime}
        civilClock={() => civilTime}
        random={() => 0.999}
        onReportResult={onReportResult}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));
    monotonicTime += 60_000;
    civilTime -= 2 * 3_600_000;
    fireEvent.press(getByTestId('finish-round'));

    monotonicTime += 45_000;
    fireEvent.press(getByTestId('start-next-round'));
    monotonicTime += 30_000;
    civilTime += 3_600_000;
    fireEvent.press(getByTestId('finish-round'));

    monotonicTime += 120_000;
    civilTime += 5 * 3_600_000;
    fireEvent.press(getByTestId('repeated-choice-2'));
    await act(async () => {
      fireEvent.press(getByTestId('submit-repeated-answer'));
      await Promise.resolve();
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        startedAtIso: '2020-01-01T08:00:00.000Z',
        finishedAtIso: '2020-01-01T08:02:15.000Z',
        elapsedMs: 90_000,
        details: expect.objectContaining({
          roundWpms: [6, 12],
          timingMethod: 'monotonic-elapsed',
        }),
      })
    );
  });

  it('resets the full flow when replayed', async () => {
    const { getByTestId, queryByTestId } = render(
      <RepeatedReading sample={SAMPLE} random={() => 0.999} />
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('finish-round'));
    fireEvent.press(getByTestId('start-next-round'));
    fireEvent.press(getByTestId('finish-round'));
    fireEvent.press(getByTestId('repeated-choice-2'));
    await act(async () => {
      fireEvent.press(getByTestId('submit-repeated-answer'));
      await Promise.resolve();
    });
    fireEvent.press(getByTestId('play-again'));

    expect(getByTestId('repeated-passage')).toHaveTextContent(SAMPLE.text);
    expect(queryByTestId('end')).toBeNull();
  });

  it('keeps an immediate raw attempt but excludes it from calibration', async () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <RepeatedReading
        sample={SAMPLE}
        random={() => 0.999}
        onReportResult={onReportResult}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(1);
    });
    fireEvent.press(getByTestId('finish-round'));
    fireEvent.press(getByTestId('start-next-round'));
    act(() => {
      jest.advanceTimersByTime(1);
    });
    fireEvent.press(getByTestId('finish-round'));
    fireEvent.press(getByTestId('repeated-choice-2'));
    fireEvent.press(getByTestId('submit-repeated-answer'));

    expect(getByTestId('repeated-quality-warning')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 2,
        details: expect.objectContaining({
          measurementValid: false,
          qualityFlag: 'too-short',
        }),
      })
    );
  });
});
