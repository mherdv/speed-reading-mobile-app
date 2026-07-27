import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { TEXT_SAMPLES } from '../data/textSamples';
import { ExerciseScreen } from './ExerciseScreen';

describe('ExerciseScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T08:00:00.000Z'));
  });

  function answerAll(
    getByTestId: (id: string) => ReturnType<ReturnType<typeof render>['getByTestId']>,
    sample: (typeof TEXT_SAMPLES)[number]
  ) {
    (sample.questions ?? [sample.question]).forEach((question, index) => {
      fireEvent.press(
        getByTestId(
          index === 0
            ? `choice-${question.correctIndex}`
            : `choice-${index}-${question.correctIndex}`
        )
      );
    });
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not reveal the passage before the measured read starts', () => {
    const sample = TEXT_SAMPLES[0];
    const { getByTestId, queryByText } = render(
      <ExerciseScreen sample={sample} onCancel={jest.fn()} onFinish={jest.fn()} />
    );

    expect(getByTestId('start-reading')).toBeTruthy();
    expect(queryByText(sample.text)).toBeNull();
  });

  it('calculates WPM from reading time only, excluding the question phase', () => {
    const sample = TEXT_SAMPLES[0];
    const onFinish = jest.fn();
    const { getByTestId } = render(
      <ExerciseScreen sample={sample} onCancel={jest.fn()} onFinish={onFinish} />
    );

    fireEvent.press(getByTestId('start-reading'));
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    fireEvent.press(getByTestId('finish-reading'));

    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    answerAll(getByTestId, sample);
    fireEvent.press(getByTestId('submit-answer'));

    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 60_000,
        comprehensionCorrect: true,
        details: expect.objectContaining({ measurementValid: true }),
      })
    );
  });

  it('flags a 1ms completion as invalid while preserving its raw timing', () => {
    const sample = TEXT_SAMPLES[0];
    const onFinish = jest.fn();
    const { getByTestId } = render(
      <ExerciseScreen sample={sample} onCancel={jest.fn()} onFinish={onFinish} />
    );

    fireEvent.press(getByTestId('start-reading'));
    act(() => {
      jest.advanceTimersByTime(1);
    });
    fireEvent.press(getByTestId('finish-reading'));
    answerAll(getByTestId, sample);
    fireEvent.press(getByTestId('submit-answer'));

    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 1,
        details: expect.objectContaining({
          activityType: 'measured-reading',
          measurementValid: false,
          qualityFlag: 'too-short',
        }),
      })
    );
  });
});
