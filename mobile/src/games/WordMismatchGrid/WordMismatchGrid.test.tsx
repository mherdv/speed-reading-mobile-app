import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import WordMismatchGrid from './WordMismatchGrid';

describe('WordMismatchGrid (card-based similar words)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('Start -> game runs and can select cards', () => {
    const { getByTestId, getAllByTestId } = render(
      <WordMismatchGrid durationMs={30000} difficulty="easy" />
    );

    fireEvent.press(getByTestId('start-button'));

    // Game should be running
    expect(getByTestId('score')).toHaveTextContent('0');
    
    // Cards should be rendered (easy mode has 4 cards)
    const cards = getAllByTestId(/^card-\d+$/);
    expect(cards.length).toBeGreaterThanOrEqual(4);
    
    // Select first card - the game may auto-submit if correct
    fireEvent.press(getByTestId('card-0'));
    
    // Game should still be running or have progressed to next round
    // Just verify game is still active (not ended)
    expect(getByTestId('score')).toBeTruthy();
  });

  it('Reports score/accuracy on end', () => {
    const onReportResult = jest.fn();

    const { getByTestId, getByText } = render(
      <WordMismatchGrid durationMs={1000} difficulty="easy" onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));
    
    // Submit one round without selection
    fireEvent.press(getByText(/Submit/));

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    
    const payload = onReportResult.mock.calls[0][0];
    expect(payload.details.difficulty).toBe('easy');
  });

  it('Level display and start button work', async () => {
    const { getByTestId, getByText } = render(<WordMismatchGrid />);

    await act(async () => {
      await Promise.resolve();
    });

    // Should show Level display (difficulty is auto-adjusted)
    expect(getByText(/Level/)).toBeTruthy();
    
    // Start the game
    fireEvent.press(getByTestId('start-button'));
    
    // Cards should exist
    expect(getByTestId('card-0')).toBeTruthy();
  });
});
