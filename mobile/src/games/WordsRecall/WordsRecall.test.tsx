import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  createWordsRecallPool,
  normalizeRecallAnswer,
  validateRecallPools,
  WORDS_RECALL_CONFIG,
} from '../../data/recallContent';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import WordsRecall from './WordsRecall';

describe('WordsRecall', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('always displays exactly two words and accepts normalized typed recall', () => {
    const onReportResult = jest.fn();
    const view = render(
      <WordsRecall
        prompts={['harbor lantern']}
        displayMs={10}
        totalRounds={1}
        onReportResult={onReportResult}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('recall-word-0')).toHaveTextContent('harbor');
    expect(view.getByTestId('recall-word-1')).toHaveTextContent('lantern');
    act(() => {
      jest.advanceTimersByTime(20);
    });
    fireEvent.changeText(view.getByTestId('recall-input'), ' HARBOR,   lantern! ');
    fireEvent.press(view.getByTestId('submit-recall'));
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult.mock.calls[0][0]).toMatchObject({
      score: 1,
      accuracy: 1,
      details: {
        activityType: 'two-word-recall',
        wordCountPerPrompt: 2,
      },
    });
  });

  it('changes only vocabulary/display configuration while keeping eight two-word rounds', () => {
    expect(WORDS_RECALL_CONFIG.easy).toEqual({ displayMs: 1_600, roundCount: 8 });
    expect(WORDS_RECALL_CONFIG.hard).toEqual({ displayMs: 700, roundCount: 8 });
    expect(normalizeRecallAnswer(' One,  TWO! ')).toBe('one two');
    expect(validateRecallPools()).toEqual([]);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const first = createWordsRecallPool(difficulty);
      const second = createWordsRecallPool(difficulty);
      expect(first).toHaveLength(120);
      expect(new Set(first).size).toBe(120);
      expect(first).toEqual(second);
      expect(first.every((prompt) => prompt.split(' ').length === 2)).toBe(true);
    }
  });

  it('keeps a missed pair and its correct answer visible before replay', () => {
    const report = jest.fn();
    const expected = 'quiet focus';
    const view = render(
      <WordsRecall
        prompts={[expected]}
        displayMs={10}
        totalRounds={1}
        onReportResult={report}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    act(() => jest.advanceTimersByTime(20));
    fireEvent.changeText(view.getByTestId('recall-input'), 'wrong');
    fireEvent.press(view.getByTestId('submit-recall'));

    expect(view.getByTestId('recall-correct-answer')).toHaveTextContent(expected);
    const reviewMs = getRecallFeedbackDurationMs(expected, false);
    act(() => jest.advanceTimersByTime(reviewMs - 1));
    expect(view.queryByTestId('end')).toBeNull();
    act(() => jest.advanceTimersByTime(2));
    expect(view.getByTestId('end')).toBeTruthy();

    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByTestId('recall-display')).toBeTruthy();
    view.unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(report).toHaveBeenCalledTimes(1);
  });
});
