import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
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
    const { getByTestId, queryByTestId } = render(
      <TimedPhraseRecognition phrases={['The quick fox']} displayMs={500} totalRounds={3} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('phrase-flash')).toBeTruthy();
    expect(queryByTestId('phrase-mask')).toBeNull();
    expect(getByTestId('phrase')).toHaveProp('numberOfLines', 3);
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
    expect(getByTestId('phrase-choice-feedback')).toBeTruthy();
  });

  it('calls onReportResult when all rounds complete', () => {
    const onReportResult = jest.fn();
    const { getByLabelText, getByTestId } = render(
      <TimedPhraseRecognition 
        phrases={['A', 'B']} 
        displayMs={20} 
        totalRounds={1} 
        onReportResult={onReportResult} 
      />
    );

    fireEvent.press(getByTestId('start-button'));
    const answer = getByTestId('phrase').props.children as string;

    act(() => {
      jest.advanceTimersByTime(30);
    });

    fireEvent.press(getByLabelText(answer));
    expect(getByTestId('phrase-choice-feedback')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(501);
    });
    expect(onReportResult).toHaveBeenCalledTimes(1);
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
      expect(view.getByTestId('phrase-choice-feedback')).toBeTruthy();
      expect(
        view.getByTestId('phrase-choice-feedback-correct').props.children
      ).toBe(answer);
      expect(
        view.getByTestId('phrase-choice-feedback-selected').props.children
      ).not.toBe(answer);

      const reviewMs = getRecallFeedbackDurationMs(answer, false);
      act(() => {
        jest.advanceTimersByTime(reviewMs - 1);
      });
      expect(view.queryByTestId('end')).toBeNull();
      act(() => {
        jest.advanceTimersByTime(2);
      });
      if (miss < 2) expect(view.getByTestId('phrase')).toBeTruthy();
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

  it('continues the no-replacement phrase deck across replays', () => {
    const phrases = [
      'Careful readers compare clear evidence',
      'Focused learners notice subtle changes',
      'Patient reviewers trace useful signals',
    ];
    const view = render(
      <TimedPhraseRecognition
        phrases={phrases}
        displayMs={10}
        totalRounds={1}
        random={() => 0}
      />
    );
    const shownPhrases: string[] = [];

    for (let session = 0; session < 4; session += 1) {
      fireEvent.press(
        view.getByTestId(session === 0 ? 'start-button' : 'play-again')
      );
      if (session > 0) {
        act(() => jest.advanceTimersByTime(51));
      }
      const shown = view.getByTestId('phrase').props.children as string;
      shownPhrases.push(shown);
      act(() => jest.advanceTimersByTime(11));
      fireEvent.press(view.getByLabelText(shown));
      act(() =>
        jest.advanceTimersByTime(getRecallFeedbackDurationMs(shown, true) + 1)
      );
      expect(view.getByTestId('end')).toBeTruthy();
    }

    expect(new Set(shownPhrases.slice(0, phrases.length)).size).toBe(
      phrases.length
    );
    expect(shownPhrases[3]).not.toBe(shownPhrases[2]);
  });
});
