import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { TextSample } from '../../domain/types';
import RepeatedReading, {
  chooseNextRepeatedReadingSample,
  getRepeatedReadingPool,
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

  it('offers several non-baseline passages in every difficulty band', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const pool = getRepeatedReadingPool(difficulty);
      expect(pool.length).toBeGreaterThanOrEqual(5);
      expect(
        pool.every((item) => item.complexityBand !== 'baseline-brief')
      ).toBe(true);
    }
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

  it('times two reading passes and checks comprehension', async () => {
    const onReportResult = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <RepeatedReading sample={SAMPLE} onReportResult={onReportResult} />
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
      <RepeatedReading sample={SAMPLE} />
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

    expect(getByTestId('repeated-passage')).toBeTruthy();
    expect(queryByTestId('end')).toBeNull();
  });

  it('keeps an immediate raw attempt but excludes it from calibration', async () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <RepeatedReading sample={SAMPLE} onReportResult={onReportResult} />
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
