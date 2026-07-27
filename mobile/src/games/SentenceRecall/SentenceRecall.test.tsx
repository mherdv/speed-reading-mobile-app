import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

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
        onReportResult={onReportResult}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('recall-sentence')).toHaveTextContent(
      'Careful readers compare the strongest evidence.'
    );
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
});
