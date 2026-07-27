import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import LastWordRecall from './LastWordRecall';

const WORDS = ['amber', 'cabin', 'delta', 'fable', 'grace', 'habit'];

describe('LastWordRecall', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts, flashes a complete stream, and offers four answers', () => {
    const { getByTestId } = render(
      <LastWordRecall
        words={WORDS}
        wordDisplayMs={20}
        sequenceLength={4}
        totalRounds={1}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('stream-word')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(90);
    });

    expect(getByTestId('last-word-options')).toBeTruthy();
    expect(getByTestId('last-word-option-3')).toBeTruthy();
  });

  it('stops unpredictably after a random 3–10 words', () => {
    const onReportResult = jest.fn();
    const randomValues = [0, 0.999999];
    let randomIndex = 0;
    const random = () => randomValues[randomIndex++] ?? 0;
    const view = render(
      <LastWordRecall
        words={WORDS}
        wordDisplayMs={20}
        totalRounds={2}
        random={random}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(70);
    });
    expect(view.getByTestId('last-word-options')).toBeTruthy();

    fireEvent.press(view.getByTestId('last-word-option-0'));
    act(() => {
      jest.advanceTimersByTime(70);
    });
    expect(view.queryByTestId('last-word-options')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(140);
    });
    expect(view.getByTestId('last-word-options')).toBeTruthy();

    fireEvent.press(view.getByTestId('last-word-option-0'));
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          sequenceLength: null,
          streamLengths: [3, 10],
          streamLengthRange: { min: 3, max: 10 },
        }),
      })
    );
  });

  it('finishes, reports once, and supports replay', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <LastWordRecall
        words={WORDS}
        wordDisplayMs={20}
        sequenceLength={4}
        totalRounds={1}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(90);
    });
    fireEvent.press(getByTestId('last-word-option-0'));

    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          rounds: 1,
          sequenceLength: 4,
          initialWpm: 3000,
          finalWpm: 3000,
        }),
      })
    );

    fireEvent.press(getByTestId('play-again'));
    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(getByTestId('stream-word')).toBeTruthy();
  });

  it('clears the word-stream timer on unmount', () => {
    const onReportResult = jest.fn();
    const { getByTestId, unmount } = render(
      <LastWordRecall
        words={WORDS}
        wordDisplayMs={20}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).not.toHaveBeenCalled();
  });

  it('raises pace after four correct recalls and ends after three straight misses', () => {
    const onReportResult = jest.fn();
    const view = render(
      <LastWordRecall
        words={WORDS}
        sequenceLength={3}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(view.getByTestId('start-button'));
    for (let attempt = 0; attempt < 4; attempt += 1) {
      act(() => {
        jest.advanceTimersByTime(700);
      });
      const answer = view.getByTestId('stream-word').props.children as string;
      act(() => {
        jest.advanceTimersByTime(400);
      });
      fireEvent.press(view.getByLabelText(answer));
    }
    expect(view.getByText('205')).toBeTruthy();

    for (let miss = 0; miss < 3; miss += 1) {
      act(() => {
        jest.advanceTimersByTime(700);
      });
      const answer = view.getByTestId('stream-word').props.children as string;
      act(() => {
        jest.advanceTimersByTime(400);
      });
      const wrongIndex = [0, 1, 2, 3].find(
        (index) =>
          view.getByTestId(`last-word-option-${index}`).props
            .accessibilityLabel !== answer
      );
      fireEvent.press(
        view.getByTestId(`last-word-option-${wrongIndex ?? 0}`)
      );
    }

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          rounds: 7,
          finalWpm: 205,
          endingFailureStreak: 3,
          finishReason: 'three-misses',
        }),
      })
    );
  });
});
