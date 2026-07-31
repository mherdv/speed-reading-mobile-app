import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { getRecallFeedbackDurationMs } from '../recallFeedback';
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

  it('starts the Hard vocabulary band clear without allowing a line break', () => {
    const view = render(
      <TimedWordRecognition
        words={['observation']}
        displayMs={100}
        difficulty="hard"
      />
    );

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.queryByTestId('word-mask')).toBeNull();
    expect(view.getByTestId('word')).toHaveProp('numberOfLines', 1);
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

    expect(getByTestId('word-choice-feedback')).toBeTruthy();
    expect(getByTestId('word-choice-feedback-correct').props.children).toBe(
      word
    );

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(getByTestId('word-choice-feedback')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2);
    });
    expect(getByTestId('end')).toBeTruthy();
  });

  it('calls onReportResult when game ends', () => {
    const onReportResult = jest.fn();
    const { getByLabelText, getByTestId } = render(
      <TimedWordRecognition
        words={['apple', 'banana', 'cherry', 'date']}
        displayMs={100}
        totalRounds={1}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    const answer = getByTestId('word').props.children as string;

    act(() => {
      jest.advanceTimersByTime(150);
    });

    fireEvent.press(getByLabelText(answer));

    act(() => {
      jest.advanceTimersByTime(501);
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

    // Easy starts at 120 WPM, so a one-word flash lasts 500ms.
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(getByTestId('word-flash')).toBeTruthy();

    // After 550ms it should be in choose phase.
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(getByTestId('options-container')).toBeTruthy();
  });

  it('raises the live WPM after eight consecutive correct answers', () => {
    const { getByLabelText, getByTestId, getByText } = render(
      <TimedWordRecognition
        words={['apple', 'bread', 'chair', 'dream', 'earth']}
        difficulty="easy"
        totalRounds={9}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    for (let round = 0; round < 8; round += 1) {
      const answer = getByTestId('word').props.children as string;
      act(() => {
        jest.advanceTimersByTime(510);
      });
      fireEvent.press(getByLabelText(answer));
      expect(getByTestId('word-choice-feedback')).toBeTruthy();
      act(() => {
        jest.advanceTimersByTime(501);
      });
    }

    expect(getByText('145')).toBeTruthy();
  });

  it('ends only after three consecutive misses and reports actual attempts', () => {
    const onReportResult = jest.fn();
    const words = ['apple', 'bread', 'chair', 'dream'];
    const view = render(
      <TimedWordRecognition
        words={words}
        displayMs={10}
        onReportResult={onReportResult}
      />
    );

    const answer = (correct: boolean) => {
      const shown = view.getByTestId('word').props.children as string;
      act(() => {
        jest.advanceTimersByTime(15);
      });
      if (correct) {
        fireEvent.press(view.getByLabelText(shown));
      } else {
        const wrongIndex = [0, 1, 2, 3].find(
          (index) =>
            view.getByTestId(`option-${index}`).props.accessibilityLabel !==
            shown
        );
        fireEvent.press(view.getByTestId(`option-${wrongIndex ?? 0}`));
        expect(
          view.getByTestId('word-choice-feedback-selected').props.children
        ).not.toBe(shown);
      }

      expect(
        view.getByTestId('word-choice-feedback-correct').props.children
      ).toBe(shown);
      const feedbackMs = getRecallFeedbackDurationMs(shown, correct);
      act(() => {
        jest.advanceTimersByTime(feedbackMs + 1);
      });
    };

    fireEvent.press(view.getByTestId('start-button'));
    answer(false);
    answer(true);
    answer(false);
    answer(false);
    expect(view.queryByTestId('end')).toBeNull();
    answer(false);

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 0.2,
        details: expect.objectContaining({
          rounds: 5,
          endingFailureStreak: 3,
          finishReason: 'three-misses',
        }),
      })
    );
  });

  it('continues the no-replacement word deck across replays', async () => {
    const words = ['amber', 'cabin', 'delta'];
    const view = render(
      <TimedWordRecognition
        words={words}
        displayMs={10}
        totalRounds={1}
        random={() => 0}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });
    const shownWords: string[] = [];

    for (let session = 0; session < 4; session += 1) {
      fireEvent.press(
        view.getByTestId(session === 0 ? 'start-button' : 'play-again')
      );
      if (session > 0) {
        act(() => jest.advanceTimersByTime(51));
      }
      const shown = view.getByTestId('word').props.children as string;
      shownWords.push(shown);
      act(() => jest.advanceTimersByTime(11));
      fireEvent.press(view.getByLabelText(shown));
      act(() =>
        jest.advanceTimersByTime(getRecallFeedbackDurationMs(shown, true) + 1)
      );
      expect(view.getByTestId('end')).toBeTruthy();
    }

    expect(new Set(shownWords.slice(0, words.length)).size).toBe(words.length);
    expect(shownWords[3]).not.toBe(shownWords[2]);
  });
});
