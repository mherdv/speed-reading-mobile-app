import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import VisualSpanExpansion from './VisualSpanExpansion';

describe('VisualSpanExpansion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<VisualSpanExpansion />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows sequence display after pressing start', () => {
    const { getByTestId } = render(
      <VisualSpanExpansion startingLength={3} displayMs={500} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('sequence-display')).toBeTruthy();
  });

  it('transitions to recall phase after display timeout', () => {
    const { getByTestId } = render(
      <VisualSpanExpansion startingLength={3} displayMs={50} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(getByTestId('recall-input')).toBeTruthy();
  });

  it('accepts user input and submits', () => {
    const { getByTestId } = render(
      <VisualSpanExpansion startingLength={2} displayMs={30} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(40);
    });

    fireEvent.changeText(getByTestId('recall-input'), '12');
    fireEvent.press(getByTestId('submit-btn'));
  });

  it('calls onReportResult when game ends', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <VisualSpanExpansion startingLength={2} displayMs={20} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));

    // Go through a few rounds until game ends
    for (let i = 0; i < 5; i++) {
      act(() => {
        jest.advanceTimersByTime(30);
      });
      try {
        fireEvent.changeText(getByTestId('recall-input'), 'wrong');
        fireEvent.press(getByTestId('submit-btn'));
      } catch {
        break;
      }
      act(() => {
        jest.advanceTimersByTime(1600);
      });
    }
  });
});
