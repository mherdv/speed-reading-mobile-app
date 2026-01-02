import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import LetterRecognition from './LetterRecognition';

describe('LetterRecognition (Grid Format)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with level display and start button', async () => {
    const { getByTestId, getByText } = render(<LetterRecognition />);

    await act(async () => {
      await Promise.resolve(); // Wait for progress to load
    });

    expect(getByText(/Level/)).toBeTruthy();
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('displays grid of letters after starting', async () => {
    const { getByTestId, getByText } = render(<LetterRecognition />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));

    // Default is now easy (level 1) = 4x4 grid = 16 cells
    expect(getByTestId('cell-0')).toBeTruthy();
    expect(getByTestId('cell-15')).toBeTruthy();
    expect(getByText(/selected/)).toBeTruthy();
  });

  it('allows selecting and deselecting cells', async () => {
    const { getByTestId, getByText } = render(<LetterRecognition />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));

    // Select a cell
    fireEvent.press(getByTestId('cell-0'));
    expect(getByText('Submit (1 selected)')).toBeTruthy();

    // Select another cell
    fireEvent.press(getByTestId('cell-1'));
    expect(getByText('Submit (2 selected)')).toBeTruthy();

    // Deselect first cell
    fireEvent.press(getByTestId('cell-0'));
    expect(getByText('Submit (1 selected)')).toBeTruthy();
  });

  it('ends on timer', async () => {
    const { getByTestId } = render(<LetterRecognition durationMs={100} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(getByTestId('end')).toBeTruthy();
  });

  it('calls onReportResult when game ends', async () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <LetterRecognition durationMs={100} onReportResult={onReportResult} />
    );

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(onReportResult).toHaveBeenCalled();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: expect.any(Number),
        accuracy: expect.any(Number),
        details: expect.objectContaining({
          rounds: expect.any(Number),
          difficulty: 'easy', // Default is now easy (level 1)
        }),
      })
    );
  });

  it('respects difficulty prop', async () => {
    const { getByTestId } = render(<LetterRecognition difficulty="easy" />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));

    // Easy difficulty = 4x4 grid = 16 cells
    expect(getByTestId('cell-0')).toBeTruthy();
    expect(getByTestId('cell-15')).toBeTruthy();
  });

  it('auto-starts game when autoStart prop is true', async () => {
    const { getByTestId, queryByTestId } = render(
      <LetterRecognition autoStart={true} />
    );

    // Wait for progress to load and auto-start to trigger
    await act(async () => {
      await Promise.resolve();
    });
    
    // Advance timer for auto-start delay
    act(() => {
      jest.advanceTimersByTime(150);
    });
    
    await act(async () => {
      await Promise.resolve();
    });

    // Should be in running phase - start button should not be visible
    expect(queryByTestId('start-button')).toBeNull();
    // Grid should be visible
    expect(getByTestId('cell-0')).toBeTruthy();
  });

  it('shows level and stars in idle phase (no difficulty buttons)', async () => {
    const { getByText, queryByText } = render(<LetterRecognition />);

    await act(async () => {
      await Promise.resolve();
    });

    // Should show level
    expect(getByText(/Level/)).toBeTruthy();
    
    // Should NOT show difficulty buttons
    expect(queryByText('Easy')).toBeNull();
    expect(queryByText('Medium')).toBeNull();
    expect(queryByText('Hard')).toBeNull();
  });

  it('does not double target count on first round after restart (Play Again)', async () => {
    // This test verifies the fix for the bug where restarting the game
    // caused the first round to display double the number of target letters
    const onReportResult = jest.fn();
    const { getByTestId, getByText, queryByTestId, getAllByTestId } = render(
      <LetterRecognition durationMs={500} difficulty="easy" onReportResult={onReportResult} />
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Start the first game
    fireEvent.press(getByTestId('start-button'));

    // Easy difficulty = 4x4 grid = 16 cells, 3 targets
    const firstRunCells = getAllByTestId(/^cell-\d+$/);
    expect(firstRunCells.length).toBe(16);

    // Let game finish
    await act(async () => {
      jest.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Should be in ended phase
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    
    // Check that the first game had 3 targets (for easy difficulty)
    const firstCall = onReportResult.mock.calls[0][0];
    expect(firstCall.details?.difficulty).toBe('easy');

    // Press Play Again
    fireEvent.press(getByText('Play Again'));

    // Should transition to idle then immediately restart
    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });

    // Should be running again (grid should be visible)
    expect(queryByTestId('end')).toBeNull();
    expect(getByTestId('cell-0')).toBeTruthy();

    // Verify the grid still has exactly 16 cells (not doubled)
    const secondRunCells = getAllByTestId(/^cell-\d+$/);
    expect(secondRunCells.length).toBe(16);

    // Verify target hint shows correct target count (3 for easy)
    expect(getByText(/\(3 in grid\)/)).toBeTruthy();

    // Let second game finish
    await act(async () => {
      jest.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Should have reported second result
    expect(onReportResult).toHaveBeenCalledTimes(2);
    const secondCall = onReportResult.mock.calls[1][0];
    expect(secondCall.details?.difficulty).toBe('easy');
  });
});
