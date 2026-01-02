import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import TimedPhraseRecognition from './TimedPhraseRecognition';

describe('TimedPhraseRecognition', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<TimedPhraseRecognition />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows phrase flash after pressing start', () => {
    const { getByTestId } = render(
      <TimedPhraseRecognition phrases={['The quick fox']} displayMs={500} totalRounds={3} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('phrase-flash')).toBeTruthy();
  });

  it('transitions to choice phase after display timeout', () => {
    const { getByTestId } = render(
      <TimedPhraseRecognition phrases={['Test phrase']} displayMs={50} totalRounds={1} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(getByTestId('options-container')).toBeTruthy();
  });

  it('allows selecting an option', () => {
    const { getByTestId } = render(
      <TimedPhraseRecognition phrases={['Hello world', 'Goodbye world']} displayMs={30} totalRounds={1} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(40);
    });

    fireEvent.press(getByTestId('option-0'));
  });

  it('calls onReportResult when all rounds complete', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <TimedPhraseRecognition 
        phrases={['A', 'B']} 
        displayMs={20} 
        totalRounds={1} 
        onReportResult={onReportResult} 
      />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(30);
    });

    fireEvent.press(getByTestId('option-0'));

    act(() => {
      jest.advanceTimersByTime(600);
    });
  });
});
