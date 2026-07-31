import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { getRecallFeedbackDurationMs } from '../recallFeedback';
import SentenceRecall from './SentenceRecall';

describe('SentenceRecall', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('briefly displays a natural sentence and scores normalized reconstruction', () => {
    const onReportResult = jest.fn();
    const view = render(
      <SentenceRecall
        prompts={['Careful readers compare the strongest evidence.']}
        displayMs={10}
        totalRounds={1}
        difficulty="hard"
        onReportResult={onReportResult}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('recall-sentence')).toHaveTextContent(
      'Careful readers compare the strongest evidence.'
    );
    expect(view.queryByTestId('recall-sentence-mask')).toBeNull();
    expect(view.getByTestId('recall-sentence')).toHaveProp('numberOfLines', 3);
    act(() => jest.advanceTimersByTime(20));
    fireEvent.changeText(
      view.getByTestId('recall-input'),
      'careful readers compare the strongest evidence'
    );
    fireEvent.press(view.getByTestId('submit-recall'));
    act(() => jest.advanceTimersByTime(600));

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult.mock.calls[0][0]).toMatchObject({
      score: 1,
      accuracy: 1,
      details: { activityType: 'sentence-recall' },
    });
  });

  it('holds a missed sentence on screen long enough to compare both versions', () => {
    const expected = 'Careful readers compare the strongest evidence.';
    const view = render(
      <SentenceRecall
        prompts={[expected]}
        displayMs={10}
        totalRounds={1}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    act(() => jest.advanceTimersByTime(20));
    fireEvent.changeText(
      view.getByTestId('recall-input'),
      'Careful readers compare evidence.'
    );
    fireEvent.press(view.getByTestId('submit-recall'));

    expect(view.getByTestId('recall-input')).toHaveProp(
      'value',
      'Careful readers compare evidence.'
    );
    expect(view.getByTestId('recall-correct-answer')).toHaveTextContent(
      expected
    );
    const reviewMs = getRecallFeedbackDurationMs(expected, false);
    act(() => jest.advanceTimersByTime(reviewMs - 1));
    expect(view.queryByTestId('end')).toBeNull();
    act(() => jest.advanceTimersByTime(2));
    expect(view.getByTestId('end')).toBeTruthy();
  });

  it('continues the no-replacement sentence deck across replays', () => {
    const prompts = [
      'Amber notes mark the route.',
      'Careful readers compare sources.',
      'Quiet teams review the evidence.',
    ];
    const view = render(
      <SentenceRecall
        prompts={prompts}
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
      const shown = view.getByTestId('recall-sentence').props
        .children as string;
      shownPrompts.push(shown);
      act(() => jest.advanceTimersByTime(11));
      fireEvent.changeText(view.getByTestId('recall-input'), shown);
      fireEvent.press(view.getByTestId('submit-recall'));
      act(() =>
        jest.advanceTimersByTime(getRecallFeedbackDurationMs(shown, true) + 1)
      );
      expect(view.getByTestId('end')).toBeTruthy();
    }

    expect(new Set(shownPrompts.slice(0, prompts.length)).size).toBe(
      prompts.length
    );
    expect(shownPrompts[3]).not.toBe(shownPrompts[2]);
  });
});
