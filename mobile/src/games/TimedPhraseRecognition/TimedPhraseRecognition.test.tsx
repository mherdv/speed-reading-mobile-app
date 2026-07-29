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

  it('uses the selected 3,000 WPM pace without a hidden phrase-duration cap', () => {
    const view = render(
      <TimedPhraseRecognition
        phrases={['alpha beta gamma delta']}
        totalRounds={1}
      />
    );

    fireEvent.press(view.getByTestId('pace-preset-3000'));
    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(79);
    });
    expect(view.getByTestId('phrase-flash')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2);
    });
    expect(view.getByTestId('options-container')).toBeTruthy();
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

  it('continues after ordinary misses and ends on the third consecutive miss', () => {
    const onReportResult = jest.fn();
    const phrases = [
      'A bright path',
      'A calm river',
      'A clear signal',
      'A quiet room',
    ];
    const view = render(
      <TimedPhraseRecognition
        phrases={phrases}
        displayMs={10}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(view.getByTestId('start-button'));
    for (let miss = 0; miss < 3; miss += 1) {
      const answer = view.getByTestId('phrase').props.children as string;
      act(() => {
        jest.advanceTimersByTime(15);
      });
      const wrongIndex = [0, 1, 2, 3].find(
        (index) =>
          view.getByTestId(`option-${index}`).props.accessibilityLabel !== answer
      );
      fireEvent.press(view.getByTestId(`option-${wrongIndex ?? 0}`));
      if (miss < 2) expect(view.queryByTestId('end')).toBeNull();
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
