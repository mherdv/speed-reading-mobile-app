import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { TextSample } from '../../domain/types';
import RepeatedReading from './RepeatedReading';

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
