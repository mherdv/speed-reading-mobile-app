import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import TimedWordRecognition from './TimedWordRecognition';

describe('TimedWordRecognition', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows level display and start button in idle phase', async () => {
    const { getByTestId, getByText } = render(<TimedWordRecognition />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByText(/Level/)).toBeTruthy();
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('flashes a word and then shows options', () => {
    const { getByTestId, queryByTestId } = render(
      <TimedWordRecognition words={['apple', 'banana', 'cherry', 'date']} displayMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));

    // Word should be visible during show phase
    expect(getByTestId('word-flash')).toBeTruthy();

    // Advance past display time
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Now options should be visible
    expect(getByTestId('options-container')).toBeTruthy();
    expect(getByTestId('option-0')).toBeTruthy();
    expect(getByTestId('option-1')).toBeTruthy();
    expect(getByTestId('option-2')).toBeTruthy();
    expect(getByTestId('option-3')).toBeTruthy();
  });

  it('shows correct feedback when right option is selected', () => {
    const testWords = ['apple', 'banana', 'cherry', 'date'];
    const { getByTestId, getByText } = render(
      <TimedWordRecognition words={testWords} displayMs={100} totalRounds={1} />
    );

    fireEvent.press(getByTestId('start-button'));

    // Get the flashed word
    const word = getByTestId('word').props.children;

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Find and click the correct option
    for (let i = 0; i < 4; i++) {
      const optionText = getByTestId(`option-${i}`).props.children[0].props.children;
      if (optionText === word) {
        fireEvent.press(getByTestId(`option-${i}`));
        break;
      }
    }

    // Advance through feedback
    act(() => {
      jest.advanceTimersByTime(700);
    });

    // Game should end after 1 round
    expect(getByTestId('end')).toBeTruthy();
  });

  it('calls onReportResult when game ends', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <TimedWordRecognition
        words={['apple', 'banana', 'cherry', 'date']}
        displayMs={100}
        totalRounds={1}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Click any option
    fireEvent.press(getByTestId('option-0'));

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(onReportResult).toHaveBeenCalled();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: expect.any(Number),
        accuracy: expect.any(Number),
        details: expect.objectContaining({
          rounds: 1,
          correct: expect.any(Number),
          difficulty: 'easy',
        }),
      })
    );
  });

  it('respects difficulty prop for display time', () => {
    const { getByTestId } = render(
      <TimedWordRecognition
        words={['apple', 'banana', 'cherry', 'date']}
        difficulty="easy"
      />
    );

    fireEvent.press(getByTestId('start-button'));

    // Word should still be showing after 500ms on easy (1000ms display)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(getByTestId('word-flash')).toBeTruthy();

    // After 1100ms it should be in choose phase
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(getByTestId('options-container')).toBeTruthy();
  });
});
