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

  it('reports partial target coverage below 100%', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <PatternScanning
        grid={[
          ['★', '★'],
          ['●', '●'],
        ]}
        targetPattern="★"
        durationMs={100}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('cell-0-0'));
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 0.5,
        details: expect.objectContaining({
          totalTargets: 2,
          found: 1,
          missed: 1,
          errors: 0,
        }),
      })
    );
  });

  it('penalizes wrong selections even after every target is found', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <PatternScanning
        grid={[
          ['★', '●'],
          ['★', '●'],
        ]}
        targetPattern="★"
        durationMs={100}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('cell-0-1'));
    fireEvent.press(getByTestId('cell-0-0'));
    fireEvent.press(getByTestId('cell-1-0'));
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 2 / 3,
        details: expect.objectContaining({
          totalTargets: 2,
          found: 2,
          missed: 0,
          errors: 1,
        }),
      })
    );
  });

  it('awards perfect accuracy only for complete error-free selection', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <PatternScanning
        grid={[['★', '●']]}
        targetPattern="★"
        durationMs={100}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('cell-0-0'));
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 1,
        details: expect.objectContaining({
          totalTargets: 1,
          found: 1,
          missed: 0,
          errors: 0,
        }),
      })
    );
  });
});
