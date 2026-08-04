import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { getRecallFeedbackDurationMs } from '../recallFeedback';
import PeripheralWordCatch, {
  createPeripheralMeaningOptions,
  createPeripheralWordOptions,
  getPeripheralWordConfig,
  getPeripheralWordEntries,
  getPeripheralWordExposureMs,
  getPeripheralWordOffset,
  getPeripheralWordTargetWidth,
  validatePeripheralWordEntries,
  type PeripheralWordEntry,
} from './PeripheralWordCatch';

async function settleStorage() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

const ENTRIES: readonly PeripheralWordEntry[] = [
  { word: 'stone', definition: 'a hard piece of rock', category: 'noun' },
  { word: 'stove', definition: 'an appliance used for cooking', category: 'noun' },
  { word: 'store', definition: 'a place where goods are sold', category: 'noun' },
  { word: 'shore', definition: 'land along the edge of water', category: 'noun' },
  { word: 'score', definition: 'a number of points earned', category: 'noun' },
  { word: 'slope', definition: 'a surface that rises or falls', category: 'noun' },
];

describe('PeripheralWordCatch content and difficulty', () => {
  it('keeps the published validated vocabulary inventory exact', () => {
    const expectedCounts = { easy: 43, medium: 117, hard: 85 } as const;
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const entries = getPeripheralWordEntries(difficulty);
      expect(entries).toHaveLength(expectedCounts[difficulty]);
      expect(validatePeripheralWordEntries(entries)).toEqual([]);
    }
  });

  it('builds unique, close-looking options without revealing the answer length', () => {
    const options = createPeripheralWordOptions(
      'stone',
      ENTRIES,
      'hard',
      5,
      () => 0
    );
    expect(options).toHaveLength(5);
    expect(new Set(options).size).toBe(5);
    expect(options).toContain('stone');
    expect(options.every((option) => option.length === 5)).toBe(true);
  });

  it('builds a unique keyed meaning check from same-category definitions', () => {
    const options = createPeripheralMeaningOptions(
      ENTRIES[0]!,
      ENTRIES,
      4,
      () => 0
    );
    expect(options).toHaveLength(4);
    expect(new Set(options.map((option) => option.id)).size).toBe(4);
    expect(options.map((option) => option.text)).toContain(
      ENTRIES[0]!.definition
    );
  });

  it('meaningfully changes exposure, choices, semantic frequency, and offset', () => {
    expect(getPeripheralWordExposureMs('easy', 1)).toBeGreaterThan(
      getPeripheralWordExposureMs('medium', 1)
    );
    expect(getPeripheralWordExposureMs('medium', 1)).toBeGreaterThan(
      getPeripheralWordExposureMs('hard', 1)
    );
    expect(getPeripheralWordExposureMs('hard', 15)).toBeLessThan(
      getPeripheralWordExposureMs('hard', 1)
    );
    expect(getPeripheralWordConfig('easy').optionCount).toBeLessThan(
      getPeripheralWordConfig('hard').optionCount
    );
    expect(getPeripheralWordConfig('easy').meaningEvery).toBeGreaterThan(
      getPeripheralWordConfig('hard').meaningEvery
    );
    expect(getPeripheralWordOffset('easy', 1, 600)).toBeLessThan(
      getPeripheralWordOffset('hard', 1, 600)
    );
  });

  it('keeps long peripheral words inside an iPhone 14 Pro width', () => {
    const boardWidth = 337;
    const targetWidth = getPeripheralWordTargetWidth(boardWidth);
    const easyOffset = getPeripheralWordOffset('easy', 1, boardWidth);
    const offset = getPeripheralWordOffset('hard', 15, boardWidth);
    expect(targetWidth).toBe(132);
    expect(easyOffset).toBeGreaterThanOrEqual(targetWidth / 2 + 28);
    expect(offset + targetWidth / 2).toBeLessThanOrEqual(
      boardWidth / 2 - 8
    );
    expect(offset).toBe(94);
  });
});

describe('PeripheralWordCatch lifecycle', () => {
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

  function shownWord(view: ReturnType<typeof render>): string {
    return view.getByTestId('peripheral-word-target').props.children as string;
  }

  function chooseCurrentWord(view: ReturnType<typeof render>, word: string) {
    fireEvent.press(view.getByLabelText(word));
  }

  it('fixates, flashes a single-line word, then reports exact recognition', async () => {
    let monotonicTime = 2_000;
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralWordCatch
        clock={() => monotonicTime}
        displayMs={10}
        entries={ENTRIES}
        fixationMs={5}
        totalRounds={1}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('peripheral-word-fixation')).toBeTruthy();
    fireEvent(
      view.getByTestId('peripheral-word-board'),
      'layout',
      { nativeEvent: { layout: { width: 337 } } }
    );
    act(() => jest.advanceTimersByTime(5));
    const target = shownWord(view);
    expect(view.getByTestId('peripheral-word-target-slot')).toHaveStyle({
      width: 132,
    });
    expect(view.getByTestId('peripheral-word-target')).toHaveProp(
      'numberOfLines',
      1
    );
    act(() => jest.advanceTimersByTime(10));
    expect(view.getAllByTestId(/peripheral-word-option-/)).toHaveLength(3);
    expect(view.getByTestId('peripheral-word-option-0')).toHaveStyle({
      minHeight: 50,
    });
    chooseCurrentWord(view, target);
    expect(view.getByTestId('peripheral-word-feedback')).toBeTruthy();
    monotonicTime = 6_250;
    act(() => jest.advanceTimersByTime(501));
    await settleStorage();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 4_250,
        score: 10,
        accuracy: 1,
        details: expect.objectContaining({
          activityType: 'peripheral-word-recognition',
          rounds: 1,
          correct: 1,
          meaningChecks: 0,
          meaningQualificationMet: false,
          adaptiveQualificationEligible: false,
          timingMethod: 'monotonic-elapsed',
        }),
      })
    );
  });

  it('adds a periodic meaning check and reports it separately', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralWordCatch
        difficulty="hard"
        displayMs={10}
        entries={ENTRIES}
        fixationMs={5}
        random={() => 0}
        totalRounds={3}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    for (let round = 0; round < 3; round += 1) {
      act(() => jest.advanceTimersByTime(5));
      const target = shownWord(view);
      act(() => jest.advanceTimersByTime(10));
      chooseCurrentWord(view, target);
      if (round < 2) {
        act(() => jest.advanceTimersByTime(500));
      }
    }

    expect(view.getByTestId('peripheral-meaning-options')).toBeTruthy();
    const currentWord = view.getByText(/^(stone|stove|store|shore|score|slope)$/)
      .props.children as string;
    const definition = ENTRIES.find((entry) => entry.word === currentWord)!
      .definition;
    fireEvent.press(view.getByLabelText(definition));
    act(() => jest.advanceTimersByTime(500));
    await settleStorage();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 35,
        accuracy: 1,
        details: expect.objectContaining({
          meaningChecks: 1,
          meaningCorrect: 1,
          meaningAccuracy: 1,
          meaningQualificationMet: true,
          adaptiveQualificationEligible: true,
        }),
      })
    );
  });

  it('holds an incorrect meaning long enough to compare both definitions', async () => {
    const view = render(
      <PeripheralWordCatch
        difficulty="hard"
        displayMs={10}
        entries={ENTRIES}
        fixationMs={5}
        random={() => 0}
        totalRounds={3}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    for (let round = 0; round < 3; round += 1) {
      act(() => jest.advanceTimersByTime(5));
      const target = shownWord(view);
      act(() => jest.advanceTimersByTime(10));
      chooseCurrentWord(view, target);
      if (round < 2) act(() => jest.advanceTimersByTime(500));
    }

    const correctDefinition = ENTRIES.find(
      (candidate) =>
        candidate.word ===
        (view.getByText(/^(stone|stove|store|shore|score|slope)$/).props
          .children as string)
    )!.definition;
    const wrongOption = view
      .getAllByTestId(/peripheral-meaning-option-/)
      .find(
        (option) => option.props.accessibilityLabel !== correctDefinition
      )!;
    fireEvent.press(wrongOption);
    expect(
      view.getByTestId('peripheral-meaning-feedback-correct')
    ).toHaveTextContent(`Meaning: ${correctDefinition}`);

    const reviewMs = getRecallFeedbackDurationMs(correctDefinition, false);
    act(() => jest.advanceTimersByTime(reviewMs - 1));
    expect(view.getByTestId('peripheral-word-feedback')).toBeTruthy();
    act(() => jest.advanceTimersByTime(2));
    await settleStorage();
    expect(view.getByTestId('end')).toBeTruthy();
  });

  it.each([true, false])(
    'keeps %s word feedback available for VoiceOver until Continue',
    async (chooseCorrectly) => {
      jest
        .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
        .mockResolvedValue(true);
      const onReportResult = jest.fn();
      const view = render(
        <PeripheralWordCatch
          displayMs={10}
          entries={ENTRIES}
          fixationMs={5}
          totalRounds={1}
          onReportResult={onReportResult}
        />
      );
      await settleStorage();

      fireEvent.press(view.getByTestId('start-button'));
      act(() => jest.advanceTimersByTime(5));
      const target = shownWord(view);
      act(() => jest.advanceTimersByTime(10));
      const option = chooseCorrectly
        ? view.getByLabelText(target)
        : view
            .getAllByTestId(/peripheral-word-option-/)
            .find(
              (candidate) => candidate.props.accessibilityLabel !== target
            )!;
      fireEvent.press(option);

      expect(
        AccessibilityInfo.announceForAccessibility
      ).toHaveBeenCalled();
      expect(
        view.getByTestId('peripheral-word-feedback-continue')
      ).toHaveStyle({ minHeight: 48 });
      act(() => jest.advanceTimersByTime(10_000));
      expect(view.getByTestId('peripheral-word-feedback')).toBeTruthy();

      fireEvent.press(
        view.getByTestId('peripheral-word-feedback-continue')
      );
      await settleStorage();
      expect(view.getByTestId('end')).toBeTruthy();
      expect(onReportResult.mock.calls[0]?.[0].details).toEqual(
        expect.objectContaining({ screenReaderManualFeedback: true })
      );
    }
  );

  it('subtracts points for misses and ends after three consecutive misses', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralWordCatch
        displayMs={10}
        entries={ENTRIES}
        fixationMs={5}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    for (let miss = 0; miss < 3; miss += 1) {
      act(() => jest.advanceTimersByTime(5));
      const target = shownWord(view);
      act(() => jest.advanceTimersByTime(10));
      const wrongOption = view
        .getAllByTestId(/peripheral-word-option-/)
        .find((option) => option.props.accessibilityLabel !== target)!;
      fireEvent.press(wrongOption);
      expect(
        view.getByTestId('peripheral-word-feedback-correct')
      ).toHaveTextContent(target);
      act(() =>
        jest.advanceTimersByTime(getRecallFeedbackDurationMs(target, false))
      );
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

  it('balances sides, replays cleanly, and reports once per attempt', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralWordCatch
        displayMs={10}
        entries={ENTRIES}
        fixationMs={5}
        random={() => 0}
        totalRounds={2}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    const completeAttempt = () => {
      for (let round = 0; round < 2; round += 1) {
        act(() => jest.advanceTimersByTime(5));
        const target = shownWord(view);
        act(() => jest.advanceTimersByTime(10));
        chooseCurrentWord(view, target);
        act(() => jest.advanceTimersByTime(500));
      }
    };

    fireEvent.press(view.getByTestId('start-button'));
    completeAttempt();
    await settleStorage();
    fireEvent.press(view.getByTestId('play-again'));
    act(() => jest.advanceTimersByTime(50));
    completeAttempt();
    await settleStorage();

    expect(onReportResult).toHaveBeenCalledTimes(2);
    for (const [payload] of onReportResult.mock.calls) {
      expect(payload.details).toMatchObject({ leftTrials: 1, rightTrials: 1 });
    }
    expect(view.getByTestId('play-again')).toHaveStyle({ minHeight: 48 });
  });

  it('auto-starts after progress is ready and cancels pending flashes on unmount', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PeripheralWordCatch
        autoStart
        displayMs={100}
        entries={ENTRIES}
        fixationMs={100}
        totalRounds={1}
        onReportResult={onReportResult}
      />
    );

    await settleStorage();
    expect(view.getByTestId('peripheral-word-fixation')).toBeTruthy();
    view.unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(onReportResult).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
