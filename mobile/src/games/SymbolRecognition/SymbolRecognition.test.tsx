import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import SymbolRecognition from './SymbolRecognition';

describe('SymbolRecognition (TDD from spec)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('AC-2: evaluates match/no against target symbol', () => {
    const { getByTestId } = render(
      <SymbolRecognition target="★" stream={["✦", "★"]} durationMs={500} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('symbol')).toHaveTextContent('✦');
    fireEvent.press(getByTestId('no'));
    expect(getByTestId('score')).toHaveTextContent('Score: 10');

    expect(getByTestId('symbol')).toHaveTextContent('★');
    fireEvent.press(getByTestId('match'));
    expect(getByTestId('score')).toHaveTextContent('Score: 20');
  });

  it('ends on timer', () => {
    const { getByTestId } = render(
      <SymbolRecognition target="x" stream={["x"]} durationMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getByTestId('end')).toBeTruthy();
  });
});
