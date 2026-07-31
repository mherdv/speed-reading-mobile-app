import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  createWordsRecallPool,
  normalizeRecallAnswer,
  validateRecallPools,
  WORDS_RECALL_CONFIG,
} from '../../data/recallContent';
import { getFlashWordPool } from '../../data/flashPracticeContent';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import { getTypedRecallExposureMs } from '../TypedRecallExercise';
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
        difficulty="hard"
        onReportResult={onReportResult}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('typed-recall-scroll')).toHaveProp(
      'keyboardShouldPersistTaps',
      'handled'
    );
    expect(view.getByTestId('recall-word-0')).toHaveTextContent('harbor');
    expect(view.getByTestId('recall-word-1')).toHaveTextContent('lantern');
    expect(view.queryByTestId('recall-prompt-mask')).toBeNull();
    expect(view.getByTestId('recall-prompt')).toHaveProp('numberOfLines', 2);
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
        baseDisplayMs: 10,
        displayMs: 10,
        initialDisplayMs: 10,
        finalDisplayMs: 10,
        fixedDisplayMs: true,
      },
    });
  });

  it('keeps explicit timing fixed while configured timing follows the challenge', () => {
    expect(getTypedRecallExposureMs(1_200, 8, 350, true)).toBe(1_200);
    expect(getTypedRecallExposureMs(1_200, 8, 350)).toBeLessThan(1_200);
  });

  it('changes only vocabulary/display configuration while keeping eight two-word rounds', () => {
    expect(WORDS_RECALL_CONFIG.easy).toEqual({ displayMs: 1_600, roundCount: 8 });
    expect(WORDS_RECALL_CONFIG.hard).toEqual({ displayMs: 700, roundCount: 8 });
    expect(normalizeRecallAnswer(' One,  TWO! ')).toBe('one two');
    expect(validateRecallPools()).toEqual([]);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const first = createWordsRecallPool(difficulty);
      const second = createWordsRecallPool(difficulty);
      const vocabulary = getFlashWordPool(difficulty);
      expect(first).toHaveLength(vocabulary.length);
      expect(new Set(first).size).toBe(vocabulary.length);
      expect(first).toEqual(second);
      expect(first.every((prompt) => prompt.split(' ').length === 2)).toBe(true);
      expect(
        new Set(first.flatMap((prompt) => prompt.split(' ')))
      ).toEqual(new Set(vocabulary));
    }
  });

  it('spreads a shortened prompt request across the source vocabulary', () => {
    const vocabulary = getFlashWordPool('easy');
    const shortened = createWordsRecallPool('easy', 120);
    const covered = new Set(shortened.flatMap((prompt) => prompt.split(' ')));

    expect(shortened).toHaveLength(120);
    expect(covered.has(vocabulary[0]!)).toBe(true);
    expect(covered.has(vocabulary.at(-1)!)).toBe(true);
    expect(covered.size).toBeGreaterThan(200);
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

  it('continues the no-replacement prompt deck across replays', () => {
    const view = render(
      <WordsRecall
        prompts={['amber cabin', 'delta fable', 'grace habit']}
        displayMs={10}
        totalRounds={1}
        random={() => 0}
      />
    );
    const shownPrompts: string[] = [];

    for (let session = 0; session < 4; session += 1) {
      fireEvent.press(
        view.getByTestId(session === 0 ? 'start-button' : 'play-again')
      );
      const shown = [
        view.getByTestId('recall-word-0').props.children,
        view.getByTestId('recall-word-1').props.children,
      ].join(' ');
      shownPrompts.push(shown);
      act(() => jest.advanceTimersByTime(11));
      fireEvent.changeText(view.getByTestId('recall-input'), shown);
      fireEvent.press(view.getByTestId('submit-recall'));
      act(() =>
        jest.advanceTimersByTime(getRecallFeedbackDurationMs(shown, true) + 1)
      );
      expect(view.getByTestId('end')).toBeTruthy();
    }

    expect(new Set(shownPrompts.slice(0, 3)).size).toBe(3);
    expect(shownPrompts[3]).not.toBe(shownPrompts[2]);
  });
});
