import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
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
        jest.advanceTimersByTime(510);
      });
    }
  });

  it('shows the correct word for a readable delay and ends after the third miss', () => {
    const onReportResult = jest.fn();
    const view = render(
      <FlashReading
        words={['focus', 'signal']}
        displayMs={10}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(view.getByTestId('start-button'));
    for (let miss = 0; miss < 3; miss += 1) {
      act(() => {
        jest.advanceTimersByTime(15);
      });
      fireEvent.changeText(view.getByTestId('recall-input'), 'wrong');
      fireEvent.press(view.getByTestId('submit-btn'));
      const correctWord = String(
        view.getByTestId('flash-correct-answer').props.children
      );
      expect(correctWord).toMatch(/focus|signal/);
      const reviewMs = getRecallFeedbackDurationMs(correctWord, false);
      act(() => {
        jest.advanceTimersByTime(reviewMs - 1);
      });
      expect(view.queryByTestId('end')).toBeNull();
      act(() => {
        jest.advanceTimersByTime(2);
      });
      if (miss < 2) {
        expect(view.queryByTestId('end')).toBeNull();
      }
    }

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          rounds: 3,
          endingFailureStreak: 3,
          finishReason: 'three-misses',
        }),
      })
    );
  });
});
