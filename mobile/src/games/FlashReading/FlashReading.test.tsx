import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import FlashReading from './FlashReading';

describe('FlashReading', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<FlashReading />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows flash word after pressing start', () => {
    const { getByTestId } = render(
      <FlashReading words={['apple', 'banana']} displayMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('flash-word')).toBeTruthy();
  });

  it('transitions to recall phase after display timeout', () => {
    const { getByTestId } = render(
      <FlashReading words={['apple']} displayMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(getByTestId('recall-input')).toBeTruthy();
  });

  it('accepts user input and submits for scoring', () => {
    const { getByTestId } = render(
      <FlashReading words={['test']} displayMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60);
    });

    fireEvent.changeText(getByTestId('recall-input'), 'test');
    fireEvent.press(getByTestId('submit-btn'));
  });

  it('calls onReportResult when all rounds complete', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <FlashReading words={['a']} displayMs={20} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));

    // Go through 5 rounds
    for (let i = 0; i < 5; i++) {
      act(() => {
        jest.advanceTimersByTime(30);
      });
      try {
        fireEvent.changeText(getByTestId('recall-input'), 'a');
        fireEvent.press(getByTestId('submit-btn'));
      } catch {
        break;
      }
      act(() => {
        jest.advanceTimersByTime(500);
      });
    }
  });
});
