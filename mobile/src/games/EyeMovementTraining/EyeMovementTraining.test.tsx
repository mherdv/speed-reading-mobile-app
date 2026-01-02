import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import EyeMovementTraining from './EyeMovementTraining';

describe('EyeMovementTraining', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<EyeMovementTraining />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows dot positions after pressing start', () => {
    const { getByTestId } = render(
      <EyeMovementTraining positions={5} rounds={3} intervalMs={500} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('dot-track')).toBeTruthy();
  });

  it('ends after all rounds complete', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <EyeMovementTraining positions={3} rounds={2} intervalMs={100} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onReportResult).toHaveBeenCalled();
    expect(getByTestId('end-screen')).toBeTruthy();
  });

  it('shows play again button on end screen', () => {
    const { getByTestId } = render(
      <EyeMovementTraining positions={3} rounds={1} intervalMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getByTestId('play-again')).toBeTruthy();
  });
});
