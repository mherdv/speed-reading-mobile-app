import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import EvenNumbers, {
  buildEvenNumbersGrid,
  getEvenNumbersConfig,
} from './EvenNumbers';

describe('EvenNumbers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a multi-select grid and scores all even values across rows and columns', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <EvenNumbers
        grid={[1, 2, 3, 4]}
        gridSize={2}
        durationMs={100}
        difficulty="easy"
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('even-numbers-grid')).toBeTruthy();
    fireEvent.press(getByTestId('even-cell-1'));
    fireEvent.press(getByTestId('even-cell-3'));
    fireEvent.press(getByTestId('submit-even-grid'));
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult.mock.calls[0][0]).toMatchObject({
      score: 20,
      accuracy: 1,
      details: {
        attempts: 2,
        correct: 2,
        rounds: 1,
        difficulty: 'easy',
        gridSize: 2,
      },
    });
  });

  it('makes grid size, number range, and session time meaningfully harder', () => {
    expect(getEvenNumbersConfig('easy')).toEqual({
      gridSize: 4,
      maxNumber: 40,
      durationMs: 45_000,
    });
    expect(getEvenNumbersConfig('hard')).toEqual({
      gridSize: 6,
      maxNumber: 500,
      durationMs: 25_000,
    });
    const grid = buildEvenNumbersGrid(5, 120);
    expect(grid).toHaveLength(25);
    expect(grid.some((number) => number % 2 === 0)).toBe(true);
    expect(grid.some((number) => number % 2 !== 0)).toBe(true);
  });

  it('reports once, replays cleanly, and cleans up after unmount', () => {
    const onReportResult = jest.fn();
    const view = render(
      <EvenNumbers
        grid={[1, 2, 3, 4]}
        gridSize={2}
        durationMs={100}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(onReportResult).toHaveBeenCalledTimes(1);
    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByTestId('even-numbers-grid')).toBeTruthy();
    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).toHaveBeenCalledTimes(1);
  });
});
