import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import {
  qualifyFlashChallengeWpm,
  waitForFlashChallengeUpdates,
} from '../../data/flashChallengeProgress';
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

  it('starts clear even at Hard while preserving one-line fitting', () => {
    const view = render(
      <FlashReading words={['pattern']} displayMs={100} difficulty="hard" />
    );

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.queryByTestId('flash-word-mask')).toBeNull();
    expect(view.getByTestId('flash-word')).toHaveProp('numberOfLines', 1);
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

  it('continues the no-replacement word deck across replays', () => {
    const words = ['amber', 'cabin', 'delta'];
    const view = render(
      <FlashReading
        words={words}
        displayMs={10}
        totalRounds={1}
        random={() => 0}
      />
    );
    const shownWords: string[] = [];

    for (let session = 0; session < 4; session += 1) {
      fireEvent.press(
        view.getByTestId(session === 0 ? 'start-button' : 'play-again')
      );
      if (session > 0) {
        act(() => jest.advanceTimersByTime(51));
      }
      const shown = view.getByTestId('flash-word').props.children as string;
      shownWords.push(shown);
      act(() => jest.advanceTimersByTime(11));
      fireEvent.changeText(view.getByTestId('recall-input'), shown);
      fireEvent.press(view.getByTestId('submit-btn'));
      act(() =>
        jest.advanceTimersByTime(getRecallFeedbackDurationMs(shown, true) + 1)
      );
      expect(view.getByTestId('end')).toBeTruthy();
    }

    expect(new Set(shownWords.slice(0, words.length)).size).toBe(words.length);
    expect(shownWords[3]).not.toBe(shownWords[2]);
  });

  it('auto-starts at the saved sustained WPM without a base-pace frame', async () => {
    await waitForFlashChallengeUpdates();
    await AsyncStorage.clear();
    await qualifyFlashChallengeWpm('FlashReading', 'medium', 2_775);
    const view = render(
      <FlashReading autoStart difficulty="medium" totalRounds={1} />
    );

    await waitFor(() => {
      expect(view.getByTestId('flash-word')).toBeTruthy();
      expect(view.getByText('2775')).toBeTruthy();
    });

    view.unmount();
    await waitForFlashChallengeUpdates();
    await AsyncStorage.clear();
  });

  it('keeps manual Start disabled until the saved checkpoint is ready', async () => {
    await waitForFlashChallengeUpdates();
    await AsyncStorage.clear();
    let resolveLoad: ((value: string | null) => void) | undefined;
    jest.mocked(AsyncStorage.getItem).mockImplementationOnce(
      () =>
        new Promise<string | null>((resolve) => {
          resolveLoad = resolve;
        })
    );
    const view = render(<FlashReading />);
    const startButton = view.getByTestId('start-button');

    expect(startButton.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(startButton);
    expect(view.queryByTestId('flash-word')).toBeNull();

    await act(async () => {
      resolveLoad?.(null);
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(
        view.getByTestId('start-button').props.accessibilityState.disabled
      ).toBe(false);
    });
    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('flash-word')).toBeTruthy();

    view.unmount();
    await waitForFlashChallengeUpdates();
    await AsyncStorage.clear();
  });
});
