import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import * as progressStore from '../../data/progressStore';
import PageGlimpse, {
  buildPageGlimpseSession,
  getPageGlimpseConfig,
  preparePageGlimpseItem,
} from './PageGlimpse';
import {
  PAGE_GLIMPSE_EXPECTED_ITEM_COUNT,
  PAGE_GLIMPSE_ITEMS,
  PAGE_GLIMPSE_ITEMS_PER_DIFFICULTY,
  PAGE_GLIMPSE_LINE_COUNTS,
  validatePageGlimpseItems,
  type PageGlimpseItem,
} from './pageGlimpseContent';

const TEST_ITEM: PageGlimpseItem = {
  id: 'page-glimpse-easy-99',
  difficulty: 'easy',
  title: 'Test glimpse',
  lines: ['The lamp glowed beside the window.'],
  questionKind: 'missing-phrase',
  prompt: 'Which phrase was shown?',
  options: [
    'above the doorway',
    'beside the window',
    'under the table',
    'beyond the garden',
  ],
  correctIndex: 1,
  explanation: 'The lamp glowed beside the window.',
};

async function flushProgressLoad() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('PageGlimpse content', () => {
  it('passes the executable authored-content contract', () => {
    expect(validatePageGlimpseItems(PAGE_GLIMPSE_ITEMS)).toEqual([]);
    expect(PAGE_GLIMPSE_ITEMS).toHaveLength(
      PAGE_GLIMPSE_EXPECTED_ITEM_COUNT
    );

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const items = PAGE_GLIMPSE_ITEMS.filter(
        (item) => item.difficulty === difficulty
      );
      expect(items).toHaveLength(PAGE_GLIMPSE_ITEMS_PER_DIFFICULTY);
      expect(items.every((item) => item.lines.length === PAGE_GLIMPSE_LINE_COUNTS[difficulty])).toBe(true);
      expect(new Set(items.map((item) => item.questionKind))).toEqual(
        new Set(['missing-phrase', 'detail', 'main-idea'])
      );
    }
  });

  it('rejects duplicate IDs and a missing authored phrase answer', () => {
    const first = PAGE_GLIMPSE_ITEMS[0]!;
    const invalid: PageGlimpseItem[] = [
      ...PAGE_GLIMPSE_ITEMS,
      {
        ...first,
        options: ['not shown', ...first.options.slice(1)] as [
          string,
          string,
          string,
          string,
        ],
      },
    ];
    const errors = validatePageGlimpseItems(invalid);

    expect(errors.some((error) => error.includes('duplicate id'))).toBe(true);
    expect(
      errors.some((error) => error.includes('absent from the glimpse'))
    ).toBe(true);
  });

  it('makes line load, exposure, complexity, and distractor similarity meaningfully harder', () => {
    expect(getPageGlimpseConfig('easy')).toEqual({
      lineCount: 1,
      exposureMs: 2_600,
      roundCount: 3,
      complexity: 'direct',
      distractorSimilarity: 'broad',
    });
    expect(getPageGlimpseConfig('medium')).toEqual({
      lineCount: 2,
      exposureMs: 2_100,
      roundCount: 4,
      complexity: 'connected',
      distractorSimilarity: 'related',
    });
    expect(getPageGlimpseConfig('hard')).toEqual({
      lineCount: 4,
      exposureMs: 1_700,
      roundCount: 5,
      complexity: 'dense',
      distractorSimilarity: 'close',
    });
  });

  it('preserves the correct answer while shuffling choices', () => {
    const prepared = preparePageGlimpseItem(TEST_ITEM, () => 0);

    expect(prepared.options[prepared.correctIndex]).toBe(
      TEST_ITEM.options[TEST_ITEM.correctIndex]
    );
    expect(prepared.correctIndex).not.toBe(TEST_ITEM.correctIndex);
    expect(TEST_ITEM.correctIndex).toBe(1);
  });

  it('builds a unique mixed-task session and avoids a repeated first item', () => {
    const firstSession = buildPageGlimpseSession(
      PAGE_GLIMPSE_ITEMS,
      'easy',
      3,
      0,
      () => 0.999
    );
    expect(firstSession).toHaveLength(3);
    expect(new Set(firstSession.map((item) => item.id)).size).toBe(3);
    expect(new Set(firstSession.map((item) => item.questionKind))).toEqual(
      new Set(['missing-phrase', 'detail', 'main-idea'])
    );

    const protectedSession = buildPageGlimpseSession(
      PAGE_GLIMPSE_ITEMS,
      'easy',
      3,
      0,
      () => 0.999,
      firstSession[0]!.id
    );
    expect(protectedSession[0]!.id).not.toBe(firstSession[0]!.id);
  });
});

describe('PageGlimpse lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-04T08:00:00.000Z'));
    jest
      .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
      .mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('hides the glimpse on time, reviews the answer, reports once, and saves progress', async () => {
    const updateProgressSpy = jest
      .spyOn(progressStore, 'updateProgress')
      .mockResolvedValue({
        progress: { level: 1, streak: 1, totalPlays: 1, bestScore: 100 },
        levelChanged: false,
        levelDelta: 0,
      });
    const onReportResult = jest.fn();
    const view = render(
      <PageGlimpse
        items={[TEST_ITEM]}
        roundCount={1}
        exposureMs={500}
        random={() => 0.999}
        onReportResult={onReportResult}
      />
    );
    await flushProgressLoad();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('page-glimpse-line-1')).toHaveTextContent(
      TEST_ITEM.lines[0]!
    );
    expect(view.queryByTestId('page-glimpse-question')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(view.getByTestId('page-glimpse-stage')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(view.queryByTestId('page-glimpse-stage')).toBeNull();
    expect(view.getByTestId('page-glimpse-question')).toBeTruthy();

    fireEvent.press(view.getByTestId('page-glimpse-option-1'));
    fireEvent.press(view.getByTestId('check-page-glimpse'));
    expect(view.getByTestId('page-glimpse-feedback')).toBeTruthy();
    expect(view.getByText('Captured accurately')).toBeTruthy();

    const finishButton = view.getByTestId('continue-page-glimpse');
    await act(async () => {
      fireEvent.press(finishButton);
      fireEvent.press(finishButton);
      await Promise.resolve();
    });
    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        accuracy: 1,
        details: expect.objectContaining({
          activityType: 'brief-connected-text-retrieval',
          contentLanguage: 'en',
          contentIds: [TEST_ITEM.id],
          questionsTotal: 1,
          correctCount: 1,
          completedRounds: 1,
          configuredRounds: 1,
          glimpsesShown: 1,
          exposureMs: 500,
          lineCount: 1,
          difficulty: 'easy',
          wpm: 0,
        }),
      })
    );
    expect(updateProgressSpy).toHaveBeenCalledWith(
      'PageGlimpse',
      true,
      100,
      'easy'
    );
    expect(onReportResult).toHaveBeenCalledTimes(1);
  });

  it('keeps the glimpse available until an explicit screen-reader continue', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
      .mockResolvedValue(true);
    const updateProgressSpy = jest
      .spyOn(progressStore, 'updateProgress')
      .mockResolvedValue({
        progress: { level: 1, streak: 0, totalPlays: 1 },
        levelChanged: false,
        levelDelta: 0,
      });
    const endNonCalibratingSession = jest.fn();
    const beginNonCalibratingSpy = jest
      .spyOn(progressStore, 'beginNonCalibratingProgressSession')
      .mockReturnValue(endNonCalibratingSession);
    const report = jest.fn();
    const view = render(
      <PageGlimpse
        items={[TEST_ITEM]}
        roundCount={1}
        exposureMs={100}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await flushProgressLoad();
    const readerCalls = (
      AccessibilityInfo.addEventListener as unknown as jest.Mock
    ).mock.calls.filter(([event]) => event === 'screenReaderChanged');
    const screenReaderChanged = readerCalls[readerCalls.length - 1]?.[1] as
      | ((enabled: boolean) => void)
      | undefined;
    expect(screenReaderChanged).toBeDefined();

    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(view.getByTestId('page-glimpse-stage')).toBeTruthy();
    expect(view.getByTestId('page-glimpse-manual-continue')).toBeTruthy();
    expect(view.queryByTestId('page-glimpse-question')).toBeNull();

    act(() => {
      screenReaderChanged?.(false);
    });
    expect(view.getByTestId('page-glimpse-manual-continue')).toBeTruthy();

    fireEvent.press(view.getByTestId('page-glimpse-manual-continue'));
    expect(view.queryByTestId('page-glimpse-stage')).toBeNull();
    expect(view.getByTestId('page-glimpse-question')).toBeTruthy();
    fireEvent.press(view.getByTestId('page-glimpse-option-1'));
    fireEvent.press(view.getByTestId('check-page-glimpse'));
    fireEvent.press(view.getByTestId('continue-page-glimpse'));
    await flushProgressLoad();

    expect(updateProgressSpy).toHaveBeenCalledWith(
      'PageGlimpse',
      false,
      100,
      'easy'
    );
    expect(beginNonCalibratingSpy).toHaveBeenCalledWith('PageGlimpse');
    expect(endNonCalibratingSession).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        comparisonBand: 'page-glimpse-easy-manual',
        exposureMode: 'manual',
        screenReaderManualMode: true,
        adaptiveQualificationEligible: false,
      })
    );
  });

  it('keeps the text hidden while giving durable corrective feedback', async () => {
    const view = render(
      <PageGlimpse
        items={[TEST_ITEM]}
        roundCount={1}
        exposureMs={100}
        random={() => 0.999}
      />
    );
    await flushProgressLoad();
    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(view.queryByTestId('page-glimpse-card')).toBeNull();
    fireEvent.press(view.getByTestId('page-glimpse-option-0'));
    fireEvent.press(view.getByTestId('check-page-glimpse'));

    expect(view.queryByTestId('page-glimpse-card')).toBeNull();
    expect(view.getByText('Review the glimpse')).toBeTruthy();
    expect(view.getByTestId('page-glimpse-correct-answer')).toHaveTextContent(
      /beside the window/
    );
    expect(view.getByText(TEST_ITEM.explanation)).toBeTruthy();
  });

  it('replays as a fresh attempt and reports once per attempt', async () => {
    jest.spyOn(progressStore, 'updateProgress').mockResolvedValue({
      progress: { level: 1, streak: 0, totalPlays: 1 },
      levelChanged: false,
      levelDelta: 0,
    });
    const onReportResult = jest.fn();
    const view = render(
      <PageGlimpse
        items={[TEST_ITEM]}
        roundCount={1}
        exposureMs={100}
        random={() => 0.999}
        onReportResult={onReportResult}
      />
    );
    await flushProgressLoad();

    const finishAttempt = async () => {
      act(() => {
        jest.advanceTimersByTime(100);
      });
      fireEvent.press(view.getByTestId('page-glimpse-option-1'));
      fireEvent.press(view.getByTestId('check-page-glimpse'));
      await act(async () => {
        fireEvent.press(view.getByTestId('continue-page-glimpse'));
        await Promise.resolve();
      });
    };

    fireEvent.press(view.getByTestId('start-button'));
    await finishAttempt();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(view.getByTestId('end')).toBeTruthy();

    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByTestId('page-glimpse-stage')).toBeTruthy();
    await finishAttempt();
    expect(onReportResult).toHaveBeenCalledTimes(2);
    expect(view.getByTestId('end')).toBeTruthy();
  });

  it('auto-starts once after progress is ready', async () => {
    const view = render(
      <PageGlimpse
        autoStart
        items={[TEST_ITEM]}
        roundCount={1}
        exposureMs={1_000}
        random={() => 0.999}
      />
    );
    await flushProgressLoad();

    expect(view.getByTestId('page-glimpse-stage')).toBeTruthy();
    expect(view.getAllByTestId('page-glimpse-line-1')).toHaveLength(1);
  });

  it('cancels a pending glimpse without reporting after unmount', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <PageGlimpse
        items={[TEST_ITEM]}
        roundCount={1}
        exposureMs={5_000}
        onReportResult={onReportResult}
      />
    );
    await flushProgressLoad();
    fireEvent.press(view.getByTestId('start-button'));
    view.unmount();

    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    expect(onReportResult).not.toHaveBeenCalled();
  });

  it('allows four hard phrases to wrap without ellipsis and keeps answer targets phone-friendly', async () => {
    const hardItem = PAGE_GLIMPSE_ITEMS.find(
      (item) => item.difficulty === 'hard'
    )!;
    const view = render(
      <PageGlimpse
        items={[hardItem]}
        roundCount={1}
        exposureMs={100}
        difficulty="hard"
        random={() => 0.999}
      />
    );
    await flushProgressLoad();
    fireEvent.press(view.getByTestId('start-button'));

    expect(view.getByTestId('page-glimpse-card')).toHaveStyle({
      width: '100%',
      overflow: 'hidden',
    });
    for (let line = 1; line <= 4; line += 1) {
      const lineNode = view.getByTestId(`page-glimpse-line-${line}`);
      expect(lineNode).not.toHaveProp('numberOfLines');
      expect(lineNode).toHaveStyle({ flexShrink: 1, width: '100%' });
      expect(lineNode).toHaveTextContent(hardItem.lines[line - 1]!);
    }

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(view.getByTestId('page-glimpse-option-0')).toHaveStyle({
      width: '100%',
      minHeight: 52,
    });
  });
});
