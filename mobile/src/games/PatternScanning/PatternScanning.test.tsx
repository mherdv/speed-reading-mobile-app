import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import PatternScanning from './PatternScanning';

describe('PatternScanning', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<PatternScanning />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows grid and target after pressing start', () => {
    const { getByTestId } = render(
      <PatternScanning gridSize={4} targetPattern="★" durationMs={5000} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('target-display')).toBeTruthy();
    expect(getByTestId('grid')).toBeTruthy();
  });

  it('ends when timer expires', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <PatternScanning gridSize={3} durationMs={100} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onReportResult).toHaveBeenCalled();
    expect(getByTestId('end-screen')).toBeTruthy();
  });

  it('shows play again button on end screen', () => {
    const { getByTestId } = render(
      <PatternScanning gridSize={3} durationMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getByTestId('play-again')).toBeTruthy();
  });
});
