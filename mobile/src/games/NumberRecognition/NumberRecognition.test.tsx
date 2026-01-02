import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import NumberRecognition from './NumberRecognition';

describe('NumberRecognition (TDD from spec)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('AC-2: evaluates Match/No against target', () => {
    const { getByTestId } = render(
      <NumberRecognition target={37} stream={[37, 73]} durationMs={500} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('current-number')).toHaveTextContent('37');

    fireEvent.press(getByTestId('match'));
    expect(getByTestId('score')).toHaveTextContent('Score: 10');

    expect(getByTestId('current-number')).toHaveTextContent('73');
    fireEvent.press(getByTestId('no'));
    expect(getByTestId('score')).toHaveTextContent('Score: 20');
  });

  it('ends on timer', () => {
    const { getByTestId } = render(
      <NumberRecognition target={1} stream={[1]} durationMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getByTestId('end')).toBeTruthy();
  });
});
