import React from 'react';
import {
  act,
  fireEvent,
  render,
  within,
} from '@testing-library/react-native';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
import MemoryRecall from './MemoryRecall';

type MemoryRecallView = ReturnType<typeof render>;

function readShownSequence(view: MemoryRecallView): number[] {
  return String(view.getByTestId('sequence').props.children)
    .split(' ')
    .map(Number);
}

function submitCurrentSequence(
  view: MemoryRecallView,
  displayMs: number,
  correct: boolean
): number[] {
  const shown = readShownSequence(view);
  act(() => {
    jest.advanceTimersByTime(displayMs + 10);
  });

  const answer = correct
    ? shown
    : [(shown[0]! + 1) % 10, ...shown.slice(1)];
  answer.forEach((digit) => {
    fireEvent.press(view.getByTestId(`digit-${digit}`));
  });
  return shown;
}

function advanceReview(shown: number[], correct: boolean) {
  act(() => {
    jest.advanceTimersByTime(
      getRecallFeedbackDurationMs(shown.join(' '), correct) + 10
    );
  });
}

describe('MemoryRecall', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<MemoryRecall />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows sequence after pressing start', () => {
    const { getByTestId } = render(
      <MemoryRecall startingLength={3} displayMs={500} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('sequence-display')).toBeTruthy();
  });

  it('transitions to recall phase after display timeout', () => {
    const { getByTestId } = render(
      <MemoryRecall startingLength={3} displayMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(getByTestId('digit-keypad')).toBeTruthy();
  });

  it('uses a phone-style three-column keypad with zero centered on the last row', () => {
    const { getByTestId } = render(
      <MemoryRecall startingLength={3} displayMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(within(getByTestId('keypad-row-1')).getByTestId('digit-1')).toBeTruthy();
    expect(within(getByTestId('keypad-row-1')).getByTestId('digit-2')).toBeTruthy();
    expect(within(getByTestId('keypad-row-1')).getByTestId('digit-3')).toBeTruthy();
    expect(within(getByTestId('keypad-row-2')).getByTestId('digit-4')).toBeTruthy();
    expect(within(getByTestId('keypad-row-2')).getByTestId('digit-5')).toBeTruthy();
    expect(within(getByTestId('keypad-row-2')).getByTestId('digit-6')).toBeTruthy();
    expect(within(getByTestId('keypad-row-3')).getByTestId('digit-7')).toBeTruthy();
    expect(within(getByTestId('keypad-row-3')).getByTestId('digit-8')).toBeTruthy();
    expect(within(getByTestId('keypad-row-3')).getByTestId('digit-9')).toBeTruthy();

    const lastRow = within(getByTestId('keypad-row-4'));
    expect(lastRow.getByTestId('keypad-spacer')).toBeTruthy();
    expect(lastRow.getByTestId('digit-0')).toBeTruthy();
    expect(lastRow.getByTestId('delete-btn')).toBeTruthy();
  });

  it('allows digit input during recall phase', () => {
    const { getByTestId, queryByTestId } = render(
      <MemoryRecall startingLength={2} displayMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60);
    });

    fireEvent.press(getByTestId('digit-1'));
    expect(queryByTestId('input-display')).toBeTruthy();
  });

  it('subtracts 10 points, reduces sequence length, and continues after a miss', () => {
    const view = render(
      <MemoryRecall startingLength={2} displayMs={30} />
    );

    fireEvent.press(view.getByTestId('start-button'));
    const correctSequence = submitCurrentSequence(view, 30, true);

    expect(view.getByTestId('memory-score')).toHaveTextContent('20');
    expect(view.getByTestId('memory-level')).toHaveTextContent('3');
    expect(view.getByTestId('memory-strikes')).toHaveTextContent('0/3');
    advanceReview(correctSequence, true);

    const missedSequence = submitCurrentSequence(view, 30, false);

    expect(view.queryByTestId('end')).toBeNull();
    expect(view.getByTestId('memory-score')).toHaveTextContent('10');
    expect(view.getByTestId('memory-level')).toHaveTextContent('2');
    expect(view.getByTestId('memory-strikes')).toHaveTextContent('1/3');
    expect(view.getByTestId('memory-correct-answer')).toHaveTextContent(
      missedSequence.join(' ')
    );
    const reviewMs = getRecallFeedbackDurationMs(
      missedSequence.join(' '),
      false
    );
    act(() => jest.advanceTimersByTime(reviewMs - 1));
    expect(view.getByTestId('memory-feedback')).toBeTruthy();
    act(() => jest.advanceTimersByTime(2));
    expect(view.getByTestId('sequence-display')).toBeTruthy();
  });

  it('resets the consecutive-failure streak after a correct sequence', () => {
    const view = render(
      <MemoryRecall startingLength={2} displayMs={30} />
    );

    fireEvent.press(view.getByTestId('start-button'));
    const missedSequence = submitCurrentSequence(view, 30, false);
    expect(view.getByTestId('memory-strikes')).toHaveTextContent('1/3');
    advanceReview(missedSequence, false);

    submitCurrentSequence(view, 30, true);
    expect(view.getByTestId('memory-strikes')).toHaveTextContent('0/3');
    expect(view.queryByTestId('end')).toBeNull();
  });

  it('ends and reports only after three consecutive failures', () => {
    const onReportResult = jest.fn();
    const view = render(
      <MemoryRecall startingLength={2} displayMs={30} onReportResult={onReportResult} />
    );

    fireEvent.press(view.getByTestId('start-button'));

    let missedSequence = submitCurrentSequence(view, 30, false);
    expect(view.queryByTestId('end')).toBeNull();
    advanceReview(missedSequence, false);

    missedSequence = submitCurrentSequence(view, 30, false);
    expect(view.queryByTestId('end')).toBeNull();
    advanceReview(missedSequence, false);

    missedSequence = submitCurrentSequence(view, 30, false);
    expect(view.getByTestId('memory-correct-answer')).toHaveTextContent(
      missedSequence.join(' ')
    );
    expect(view.queryByTestId('end')).toBeNull();
    const finalReviewMs = getRecallFeedbackDurationMs(
      missedSequence.join(' '),
      false
    );
    act(() => jest.advanceTimersByTime(finalReviewMs - 1));
    expect(view.queryByTestId('end')).toBeNull();
    expect(onReportResult).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(2));
    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 0,
        details: expect.objectContaining({
          failures: 3,
          endingFailureStreak: 3,
          failurePenalty: 10,
        }),
      })
    );
  });
});
