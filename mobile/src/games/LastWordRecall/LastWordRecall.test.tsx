import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { getRecallFeedbackDurationMs } from '../recallFeedback';
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
        difficulty="hard"
      />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('stream-word')).toBeTruthy();
    expect(getByTestId('stream-word-mask')).toBeTruthy();
    expect(getByTestId('stream-word')).toHaveProp('numberOfLines', 1);

    act(() => {
      jest.advanceTimersByTime(65);
    });
    const answer = getByTestId('stream-word').props.children as string;
    act(() => {
      jest.advanceTimersByTime(25);
    });

    expect(getByTestId('last-word-options')).toBeTruthy();
    expect(getByTestId('last-word-option-3')).toBeTruthy();
    for (let index = 0; index < 4; index += 1) {
      const option = getByTestId(`last-word-option-${index}`).props
        .accessibilityLabel as string;
      expect(option.length).toBe(answer.length);
    }
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
      jest.advanceTimersByTime(50);
    });
    const firstAnswer = view.getByTestId('stream-word').props.children as string;
    act(() => {
      jest.advanceTimersByTime(20);
    });
    expect(view.getByTestId('last-word-options')).toBeTruthy();

    fireEvent.press(view.getByLabelText(firstAnswer));
    expect(view.getByTestId('last-word-feedback')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(681);
    });
    const secondAnswer = view.getByTestId('stream-word').props
      .children as string;
    act(() => {
      jest.advanceTimersByTime(25);
    });
    expect(view.getByTestId('last-word-options')).toBeTruthy();

    fireEvent.press(view.getByLabelText(secondAnswer));
    act(() => {
      jest.advanceTimersByTime(501);
    });
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
    const { getByLabelText, getByTestId } = render(
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
      jest.advanceTimersByTime(65);
    });
    const answer = getByTestId('stream-word').props.children as string;
    act(() => {
      jest.advanceTimersByTime(25);
    });
    fireEvent.press(getByLabelText(answer));
    expect(getByTestId('last-word-feedback')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(501);
    });

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
      expect(view.getByTestId('last-word-feedback')).toBeTruthy();
      act(() => {
        jest.advanceTimersByTime(501);
      });
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
      expect(
        view.getByTestId('last-word-feedback-correct').props.children
      ).toBe(answer);
      expect(
        view.getByTestId('last-word-feedback-selected').props.children
      ).not.toBe(answer);
      const reviewMs = getRecallFeedbackDurationMs(answer, false);
      act(() => {
        jest.advanceTimersByTime(reviewMs - 1);
      });
      expect(view.queryByTestId('end')).toBeNull();
      act(() => {
        jest.advanceTimersByTime(2);
      });
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

  it('uses one no-replacement word stream across rounds and replays', () => {
    const words = ['amber', 'cabin', 'delta', 'fable'];
    const view = render(
      <LastWordRecall
        words={words}
        wordDisplayMs={20}
        sequenceLength={3}
        totalRounds={1}
        contentRandom={() => 0}
      />
    );
    const shownWords: string[] = [];

    for (let session = 0; session < 2; session += 1) {
      fireEvent.press(
        view.getByTestId(session === 0 ? 'start-button' : 'play-again')
      );
      if (session > 0) {
        act(() => jest.advanceTimersByTime(51));
      }
      shownWords.push(
        view.getByTestId('stream-word').props.children as string
      );
      for (let index = 1; index < 3; index += 1) {
        act(() => jest.advanceTimersByTime(21));
        shownWords.push(
          view.getByTestId('stream-word').props.children as string
        );
      }
      const answer = shownWords.at(-1)!;
      act(() => jest.advanceTimersByTime(21));
      fireEvent.press(view.getByLabelText(answer));
      act(() =>
        jest.advanceTimersByTime(getRecallFeedbackDurationMs(answer, true) + 1)
      );
      expect(view.getByTestId('end')).toBeTruthy();
    }

    expect(new Set(shownWords.slice(0, words.length)).size).toBe(words.length);
    for (let index = 1; index < shownWords.length; index += 1) {
      expect(shownWords[index]).not.toBe(shownWords[index - 1]);
    }
  });
});
