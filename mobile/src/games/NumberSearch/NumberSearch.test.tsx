import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  exposureMsForFlashChallengeLevel,
  getFlashChallengeProfile,
} from '../flashChallenge';
import * as flashChallengeHook from '../useFlashChallenge';
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
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('previews the target, then hides it before making the grid actionable', () => {
    const { getByTestId, queryByTestId } = render(
      <NumberSearch previewMs={500} gridSize={3} difficulty="hard" />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('target-preview')).toBeTruthy();
    expect(queryByTestId('target-number-mask')).toBeNull();
    expect(getByTestId('target-number')).toHaveProp('numberOfLines', 1);
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
    const longerGrid = buildNumberSearchGrid(4, 1_000, 100);
    expect(
      longerGrid.grid.flat().every((value) => value >= 100)
    ).toBe(true);
    const boundedGrid = buildNumberSearchGrid(
      4,
      17,
      0,
      () => 0
    );
    expect(new Set(boundedGrid.grid.flat()).size).toBe(16);
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

  it('records only one adaptive miss for repeated wrong taps on one grid', () => {
    const recordOutcome = jest.fn((correct: boolean) => ({
      state: {
        level: correct ? 6 : 4,
        correctStreak: 0,
        missStreak: correct ? 0 : 1,
      },
      levelDelta: correct ? (1 as const) : (-1 as const),
      qualified: correct,
      shouldSaveRollback: false,
    }));
    jest.spyOn(
      flashChallengeHook,
      'useFlashChallenge'
    ).mockReturnValue({
      beginSession: () => 5,
      getCurrentLevel: () => 5,
      getHighestLevel: () => 5,
      getHighestWpm: () => undefined,
      getResumeLevel: () => 5,
      getResumeWpm: () => undefined,
      highestLevel: 5,
      highestWpm: undefined,
      level: 5,
      loaded: true,
      profile: getFlashChallengeProfile(5),
      recordQualifiedWpm: jest.fn(),
      recordOutcome,
      recordRollbackWpm: jest.fn(),
      resumeLevel: 5,
      resumeWpm: undefined,
    });
    const { getAllByRole, getByLabelText, getByTestId } = render(
      <NumberSearch
        durationMs={5_000}
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
    const wrongCells = getAllByRole('button').filter(
      (button) =>
        button.props.accessibilityLabel !== `Number ${target}`
    );
    wrongCells.forEach((cell) => fireEvent.press(cell));
    fireEvent.press(getByLabelText(`Number ${target}`));

    expect(recordOutcome).toHaveBeenCalledTimes(1);
    expect(recordOutcome).toHaveBeenCalledWith(false);
  });

  it('reports the actual stage-derived grid, range, and preview', () => {
    const level = 7;
    const previewMs = exposureMsForFlashChallengeLevel(
      getNumberSearchConfig('easy').previewMs,
      level,
      350
    );
    jest.spyOn(
      flashChallengeHook,
      'useFlashChallenge'
    ).mockReturnValue({
      beginSession: () => level,
      getCurrentLevel: () => level,
      getHighestLevel: () => level,
      getHighestWpm: () => undefined,
      getResumeLevel: () => level,
      getResumeWpm: () => undefined,
      highestLevel: level,
      highestWpm: undefined,
      level,
      loaded: true,
      profile: getFlashChallengeProfile(level),
      recordQualifiedWpm: jest.fn(),
      recordOutcome: jest.fn(),
      recordRollbackWpm: jest.fn(),
      resumeLevel: level,
      resumeWpm: undefined,
    });
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <NumberSearch
        durationMs={100}
        difficulty="easy"
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(previewMs);
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          gridSize: 5,
          numberRange: 1_000,
          numberMinimum: 100,
          previewMs,
          initialGridSize: 5,
          finalGridSize: 5,
          initialNumberRange: 1_000,
          initialNumberMinimum: 100,
          finalNumberRange: 1_000,
          finalNumberMinimum: 100,
          initialPreviewMs: previewMs,
          finalPreviewMs: previewMs,
        }),
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
