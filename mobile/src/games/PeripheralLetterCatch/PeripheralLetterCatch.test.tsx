import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { getRecallFeedbackDurationMs } from '../recallFeedback';
import PeripheralLetterCatch, {
  createPeripheralTrigramPool,
  getPeripheralLetterConfig,
  getPeripheralLetterExposureMs,
  getPeripheralLetterOffset,
  validatePeripheralTrigramPool,
} from './PeripheralLetterCatch';

async function settleStorage() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('PeripheralLetterCatch content and difficulty', () => {
  it('generates large unique, valid trigram pools at every difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const pool = createPeripheralTrigramPool(difficulty, 15);
      expect(pool.length).toBeGreaterThanOrEqual(300);
      expect(validatePeripheralTrigramPool(pool)).toEqual([]);
    }
  });

  it('meaningfully changes exposure, spacing, and eccentric offset', () => {
    expect(getPeripheralLetterExposureMs('easy', 1)).toBeGreaterThan(
      getPeripheralLetterExposureMs('medium', 1)
    );
    expect(getPeripheralLetterExposureMs('medium', 1)).toBeGreaterThan(
      getPeripheralLetterExposureMs('hard', 1)
    );
    expect(getPeripheralLetterExposureMs('hard', 15)).toBeLessThan(
      getPeripheralLetterExposureMs('hard', 1)
    );
    expect(getPeripheralLetterConfig('easy').letterSpacing).toBeGreaterThan(
      getPeripheralLetterConfig('hard').letterSpacing
    );
    expect(getPeripheralLetterOffset('easy', 1, 393)).toBeLessThan(
      getPeripheralLetterOffset('hard', 1, 393)
    );
  });

  it('keeps the complete target inside an iPhone 14 Pro width', () => {
    const easyOffset = getPeripheralLetterOffset('easy', 1, 393);
    const offset = getPeripheralLetterOffset('hard', 15, 393);
    expect(easyOffset).toBeGreaterThanOrEqual(74);
    expect(offset).toBeLessThanOrEqual(131);
    expect(offset).toBeGreaterThanOrEqual(100);
  });
});

describe('PeripheralLetterCatch lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    jest
      .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
      .mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('fixates, flashes once, accepts exact typed recall, and reports truthful metrics', async () => {
    let monotonicTime = 1_000;
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralLetterCatch
        clock={() => monotonicTime}
        displayMs={10}
        fixationMs={5}
        totalRounds={1}
        trigrams={['ARK']}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('peripheral-letter-fixation')).toBeTruthy();
    expect(view.queryByTestId('peripheral-letter-target')).toBeNull();

    act(() => jest.advanceTimersByTime(5));
    expect(view.getByTestId('peripheral-letter-target')).toHaveTextContent('ARK');
    expect(view.getByTestId('peripheral-letter-target')).toHaveProp(
      'numberOfLines',
      1
    );

    act(() => jest.advanceTimersByTime(10));
    expect(view.queryByTestId('peripheral-letter-board')).toBeNull();
    expect(
      view.getByTestId('peripheral-letter-recall-scroll')
    ).toHaveStyle({ flex: 1 });
    expect(view.getByTestId('peripheral-letter-input')).toBeTruthy();
    expect(view.getByTestId('peripheral-letter-input')).toHaveStyle({
      minHeight: 52,
    });
    expect(view.queryByTestId('peripheral-letter-target')).toBeNull();
    fireEvent.changeText(view.getByTestId('peripheral-letter-input'), 'ark');
    fireEvent.press(view.getByTestId('peripheral-letter-submit'));
    expect(view.getByTestId('peripheral-letter-feedback')).toBeTruthy();

    monotonicTime = 4_321;
    act(() => jest.advanceTimersByTime(501));
    await settleStorage();
    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 3_321,
        score: 10,
        accuracy: 1,
        details: expect.objectContaining({
          activityType: 'peripheral-trigram-recall',
          rounds: 1,
          correct: 1,
          adaptiveQualificationEligible: true,
          timingMethod: 'monotonic-elapsed',
        }),
      })
    );
  });

  it('holds mistakes for review and ends only after three consecutive misses', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralLetterCatch
        displayMs={10}
        fixationMs={5}
        trigrams={['ARK']}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    for (let miss = 0; miss < 3; miss += 1) {
      act(() => jest.advanceTimersByTime(15));
      fireEvent.changeText(view.getByTestId('peripheral-letter-input'), 'ZZZ');
      fireEvent.press(view.getByTestId('peripheral-letter-submit'));
      expect(
        view.getByTestId('peripheral-letter-feedback-correct')
      ).toHaveTextContent('ARK');
      const reviewMs = getRecallFeedbackDurationMs('ARK', false);
      act(() => jest.advanceTimersByTime(reviewMs - 1));
      expect(view.getByTestId('peripheral-letter-feedback')).toBeTruthy();
      act(() => jest.advanceTimersByTime(2));
    }

    await settleStorage();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 0,
        accuracy: 0,
        details: expect.objectContaining({
          finishReason: 'three-misses',
          adaptiveQualificationEligible: false,
          endingFailureStreak: 3,
          rounds: 3,
        }),
      })
    );
  });

  it.each([
    ['ARK', 'Correct. Letters ARK.'],
    ['ZZZ', 'Review. You entered ZZZ. Correct letters ARK.'],
  ])(
    'keeps %s feedback available for VoiceOver until Continue',
    async (submitted, announcement) => {
      jest
        .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
        .mockResolvedValue(true);
      const onReportResult = jest.fn();
      const view = render(
        <PeripheralLetterCatch
          displayMs={10}
          fixationMs={5}
          totalRounds={1}
          trigrams={['ARK']}
          onReportResult={onReportResult}
        />
      );
      await settleStorage();

      fireEvent.press(view.getByTestId('start-button'));
      act(() => jest.advanceTimersByTime(15));
      fireEvent.changeText(
        view.getByTestId('peripheral-letter-input'),
        submitted
      );
      fireEvent.press(view.getByTestId('peripheral-letter-submit'));

      expect(
        AccessibilityInfo.announceForAccessibility
      ).toHaveBeenCalledWith(announcement);
      expect(
        view.getByTestId('peripheral-letter-feedback-continue')
      ).toHaveStyle({ minHeight: 48 });
      act(() => jest.advanceTimersByTime(10_000));
      expect(view.getByTestId('peripheral-letter-feedback')).toBeTruthy();

      fireEvent.press(
        view.getByTestId('peripheral-letter-feedback-continue')
      );
      await settleStorage();
      expect(view.getByTestId('end')).toBeTruthy();
      expect(onReportResult.mock.calls[0]?.[0].details).toEqual(
        expect.objectContaining({ screenReaderManualFeedback: true })
      );
    }
  );

  it('alternates sides and consumes the trigram deck without replacement', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralLetterCatch
        displayMs={10}
        fixationMs={5}
        random={() => 0}
        totalRounds={4}
        trigrams={['ARK', 'BEX', 'CUP', 'DIF']}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();
    const shown: string[] = [];

    fireEvent.press(view.getByTestId('start-button'));
    for (let round = 0; round < 4; round += 1) {
      act(() => jest.advanceTimersByTime(5));
      const target = view.getByTestId('peripheral-letter-target').props
        .children as string;
      shown.push(target);
      act(() => jest.advanceTimersByTime(10));
      fireEvent.changeText(view.getByTestId('peripheral-letter-input'), target);
      fireEvent.press(view.getByTestId('peripheral-letter-submit'));
      act(() => jest.advanceTimersByTime(500));
    }

    await settleStorage();

    expect(new Set(shown).size).toBe(4);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ leftTrials: 2, rightTrials: 2 }),
      })
    );
  });

  it('replays as a new attempt and reports once per attempt', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralLetterCatch
        displayMs={10}
        fixationMs={5}
        totalRounds={1}
        trigrams={['ARK', 'BEX']}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    act(() => jest.advanceTimersByTime(5));
    const first = view.getByTestId('peripheral-letter-target').props
      .children as string;
    act(() => jest.advanceTimersByTime(10));
    fireEvent.changeText(view.getByTestId('peripheral-letter-input'), first);
    fireEvent.press(view.getByTestId('peripheral-letter-submit'));
    act(() => jest.advanceTimersByTime(500));
    await settleStorage();

    fireEvent.press(view.getByTestId('play-again'));
    act(() => jest.advanceTimersByTime(50));
    act(() => jest.advanceTimersByTime(5));
    const second = view.getByTestId('peripheral-letter-target').props
      .children as string;
    act(() => jest.advanceTimersByTime(10));
    fireEvent.changeText(view.getByTestId('peripheral-letter-input'), second);
    fireEvent.press(view.getByTestId('peripheral-letter-submit'));
    act(() => jest.advanceTimersByTime(500));
    await settleStorage();

    expect(onReportResult).toHaveBeenCalledTimes(2);
    expect(view.getByTestId('play-again')).toHaveStyle({ minHeight: 48 });
  });

  it('auto-starts only after progress is ready and clears timers on unmount', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralLetterCatch
        autoStart
        displayMs={100}
        fixationMs={100}
        totalRounds={1}
        trigrams={['ARK']}
        onReportResult={onReportResult}
      />
    );

    await settleStorage();
    expect(view.getByTestId('peripheral-letter-fixation')).toBeTruthy();
    view.unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(onReportResult).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
