import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import VisualSpanExpansion from './VisualSpanExpansion';

async function flushAsyncEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('VisualSpanExpansion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', async () => {
    const { getByTestId } = render(<VisualSpanExpansion />);
    await flushAsyncEffects();
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows sequence display after pressing start', async () => {
    const { getByTestId } = render(
      <VisualSpanExpansion startingLength={3} displayMs={500} />
    );
    await flushAsyncEffects();

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('sequence-display')).toBeTruthy();
  });

  it('transitions to recall phase after display timeout', async () => {
    const { getByTestId } = render(
      <VisualSpanExpansion startingLength={3} displayMs={50} />
    );
    await flushAsyncEffects();

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(getByTestId('recall-input')).toBeTruthy();
  });

  it('keeps the submitted and correct sequences visible before ending', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <VisualSpanExpansion
        startingLength={2}
        displayMs={30}
        onReportResult={onReportResult}
      />
    );
    await flushAsyncEffects();

    fireEvent.press(view.getByTestId('start-button'));
    const expected = String(view.getByTestId('sequence').props.children);

    act(() => {
      jest.advanceTimersByTime(40);
    });

    const wrong = `${(Number(expected[0]) + 1) % 10}${expected.slice(1)}`;
    fireEvent.changeText(view.getByTestId('recall-input'), wrong);
    fireEvent.press(view.getByTestId('submit-btn'));

    expect(view.getByTestId('visual-span-user-answer')).toHaveTextContent(
      wrong.split('').join(' ')
    );
    expect(view.getByTestId('visual-span-correct-answer')).toHaveTextContent(
      expected.split('').join(' ')
    );

    const reviewMs = getRecallFeedbackDurationMs(expected, false);
    act(() => jest.advanceTimersByTime(reviewMs - 1));
    expect(view.queryByTestId('end')).toBeNull();
    expect(onReportResult).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(2));
    expect(view.getByTestId('end')).toBeTruthy();
    await flushAsyncEffects();
  });
});
