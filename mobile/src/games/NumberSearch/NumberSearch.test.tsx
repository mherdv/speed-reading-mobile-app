import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import NumberSearch, {
  buildNumberSearchGrid,
  getNumberSearchConfig,
} from './NumberSearch';

describe('NumberSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('previews the target, then hides it before making the grid actionable', () => {
    const { getByTestId, queryByTestId } = render(
      <NumberSearch previewMs={500} gridSize={3} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('target-preview')).toBeTruthy();
    expect(queryByTestId('cell-0-0')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(queryByTestId('target-preview')).toBeNull();
    expect(queryByTestId('target-number')).toBeNull();
    expect(String(getByTestId('target-hidden').props.children)).toContain(
      'Target hidden'
    );
    expect(getByTestId('cell-0-0')).toBeTruthy();
  });

  it('uses larger grids, wider ranges, and shorter previews at higher difficulty', () => {
    expect(getNumberSearchConfig('easy')).toEqual({
      gridSize: 4,
      numberRange: 50,
      previewMs: 1_200,
      durationMs: 45_000,
    });
    expect(getNumberSearchConfig('hard')).toEqual({
      gridSize: 6,
      numberRange: 1_000,
      previewMs: 650,
      durationMs: 25_000,
    });
    const hardGrid = buildNumberSearchGrid(6, 1_000);
    expect(hardGrid.grid.flat()).toHaveLength(36);
    expect(new Set(hardGrid.grid.flat()).size).toBe(36);
  });

  it('reports once, exposes truthful settings, and replays through a fresh preview', () => {
    const onReportResult = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <NumberSearch
        durationMs={100}
        previewMs={10}
        gridSize={2}
        numberRange={20}
        difficulty="easy"
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(10);
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult.mock.calls[0][0]).toMatchObject({
      score: 0,
      accuracy: 0,
      details: {
        difficulty: 'easy',
        gridSize: 2,
        numberRange: 20,
        previewMs: 10,
        durationMs: 100,
      },
    });

    fireEvent.press(getByTestId('play-again'));
    expect(queryByTestId('end')).toBeNull();
    expect(getByTestId('target-preview')).toBeTruthy();
  });

  it('keeps one session deadline across later target previews', () => {
    const { getByLabelText, getByTestId } = render(
      <NumberSearch
        durationMs={500}
        previewMs={10}
        gridSize={2}
        numberRange={20}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    const target = getByTestId('target-number').props.children;
    act(() => {
      jest.advanceTimersByTime(10);
    });
    fireEvent.press(getByLabelText(`Number ${target}`));
    act(() => {
      jest.advanceTimersByTime(260);
    });
    expect(getByTestId('target-preview')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(10);
    });
    act(() => {
      jest.advanceTimersByTime(310);
    });

    expect(getByTestId('end')).toBeTruthy();
  });

  it('locks a solved round before a rapid second target press', () => {
    const onReportResult = jest.fn();
    const { getByLabelText, getByTestId } = render(
      <NumberSearch
        durationMs={100}
        previewMs={10}
        gridSize={2}
        numberRange={20}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    const target = getByTestId('target-number').props.children;
    act(() => {
      jest.advanceTimersByTime(10);
    });
    const targetCell = getByLabelText(`Number ${target}`);
    fireEvent.press(targetCell);
    fireEvent.press(targetCell);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 1,
        details: expect.objectContaining({ rounds: 1, correct: 1 }),
      })
    );
  });

  it('cleans up preview and session timers without reporting after unmount', () => {
    const onReportResult = jest.fn();
    const view = render(
      <NumberSearch
        previewMs={100}
        durationMs={100}
        onReportResult={onReportResult}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).not.toHaveBeenCalled();
  });
});
