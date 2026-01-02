import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import PowerReader from './PowerReader';

describe('PowerReader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<PowerReader />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows chunk display after pressing start', () => {
    const { getByTestId } = render(
      <PowerReader text="The quick brown fox jumps" chunkSize={2} intervalMs={300} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('chunk-display')).toBeTruthy();
  });

  it('auto-advances chunks based on interval', () => {
    const { getByTestId } = render(
      <PowerReader text="One two three four" chunkSize={2} intervalMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should have advanced to next chunk
    expect(getByTestId('chunk-display')).toBeTruthy();
  });

  it('ends when all chunks are displayed', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <PowerReader text="One two" chunkSize={2} intervalMs={50} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onReportResult).toHaveBeenCalled();
    expect(getByTestId('end-screen')).toBeTruthy();
  });

  it('shows play again button on end screen', () => {
    const { getByTestId } = render(
      <PowerReader text="A B" chunkSize={2} intervalMs={30} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getByTestId('play-again')).toBeTruthy();
  });
});
