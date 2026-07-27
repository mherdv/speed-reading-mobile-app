import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import EyeMovementTraining from './EyeMovementTraining';

describe('Eye Reset', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with an honest comfort description', () => {
    const { getByTestId, getByText } = render(<EyeMovementTraining />);

    expect(getByTestId('start-button')).toBeTruthy();
    expect(getByText('Comfort, not correction')).toBeTruthy();
    expect(getByText(/does not improve eyesight/i)).toBeTruthy();
  });

  it('moves from gentle blinks into the look-away break', () => {
    const { getByTestId } = render(
      <EyeMovementTraining blinkGoal={2} breakSeconds={2} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('blink-stage')).toBeTruthy();

    fireEvent.press(getByTestId('record-blink'));
    expect(getByTestId('blink-count')).toHaveTextContent('1');
    fireEvent.press(getByTestId('record-blink'));
    expect(getByTestId('look-away-ready')).toBeTruthy();

    fireEvent.press(getByTestId('begin-look-away'));
    expect(getByTestId('look-away-stage')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(getByTestId('comfort-check')).toBeTruthy();
  });

  it('reports the completed comfort break once', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <EyeMovementTraining
        blinkGoal={1}
        breakSeconds={1}
        difficulty="easy"
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('record-blink'));
    fireEvent.press(getByTestId('begin-look-away'));
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    fireEvent.press(getByTestId('comfort-comfortable'));

    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 1,
        details: expect.objectContaining({
          activityType: 'eye-comfort',
          breakSeconds: 1,
          comfort: 'comfortable',
          difficulty: 'easy',
        }),
      })
    );
    expect(getByTestId('end-screen')).toBeTruthy();
  });

  it('offers another reset after completion', () => {
    const { getByTestId } = render(
      <EyeMovementTraining blinkGoal={1} breakSeconds={1} />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('record-blink'));
    fireEvent.press(getByTestId('begin-look-away'));
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    fireEvent.press(getByTestId('comfort-same'));

    expect(getByTestId('play-again')).toBeTruthy();
  });
});
