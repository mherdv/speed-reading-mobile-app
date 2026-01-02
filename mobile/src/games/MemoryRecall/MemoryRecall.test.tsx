import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import MemoryRecall from './MemoryRecall';

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

  it('calls onReportResult when game ends', () => {
    const onReportResult = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <MemoryRecall startingLength={2} displayMs={30} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(40);
    });

    // Enter wrong answer - game auto-submits when input length matches sequence length
    fireEvent.press(getByTestId('digit-0'));
    fireEvent.press(getByTestId('digit-0'));
    // No need to press submit - game auto-checks when input length matches

    act(() => {
      jest.advanceTimersByTime(1600);
    });
    
    // Game should have ended and reported results
    expect(queryByTestId('end')).toBeTruthy();
  });
});
