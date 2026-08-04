import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';

import * as progressStore from '../../data/progressStore';
import PreviewCatch, {
  buildBalancedMatchFlags,
  getPreviewCatchConfig,
  getPreviewCatchStageLayout,
} from './PreviewCatch';
import {
  PREVIEW_CATCH_PASSAGES,
  getPreviewCatchPassages,
  validatePreviewCatchContent,
} from './previewCatchContent';

async function settleStorage() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function exposePreview() {
  act(() => {
    jest.advanceTimersByTime(20);
  });
}

describe('Preview Catch', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-04T08:00:00.000Z'));
    jest
      .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
      .mockResolvedValue(false);
    await AsyncStorage.clear();
    jest.spyOn(progressStore, 'updateProgress').mockResolvedValue({
      progress: { level: 1, streak: 1, totalPlays: 1, bestScore: 100 },
      levelChanged: false,
      levelDelta: 0,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('validates a substantial original connected-text inventory', () => {
    expect(validatePreviewCatchContent()).toEqual([]);
    expect(PREVIEW_CATCH_PASSAGES).toHaveLength(9);
    expect(
      PREVIEW_CATCH_PASSAGES.reduce(
        (sum, passage) => sum + passage.trials.length,
        0
      )
    ).toBe(45);
    expect(getPreviewCatchPassages('easy')).toHaveLength(3);
    expect(getPreviewCatchPassages('medium')).toHaveLength(3);
    expect(getPreviewCatchPassages('hard')).toHaveLength(3);
  });

  it('makes exposure, distance, word similarity, rounds, and response mode harder', () => {
    expect(getPreviewCatchConfig('easy')).toEqual({
      exposureMs: 900,
      previewOffsetPercent: 60,
      rounds: 4,
      responseMode: 'match',
      similarity: 'distinct',
    });
    expect(getPreviewCatchConfig('medium')).toEqual({
      exposureMs: 600,
      previewOffsetPercent: 67,
      rounds: 5,
      responseMode: 'match',
      similarity: 'similar',
    });
    expect(getPreviewCatchConfig('hard')).toEqual({
      exposureMs: 380,
      previewOffsetPercent: 72,
      rounds: 5,
      responseMode: 'exact',
      similarity: 'very-similar',
    });

    const easyPhone = getPreviewCatchStageLayout(393, 60);
    const hardPhone = getPreviewCatchStageLayout(393, 72);
    expect(easyPhone.previewLeft).toBe('60%');
    expect(hardPhone.previewLeft).toBe('70%');
    expect(hardPhone.previewWidth).toBe('26%');
    expect(hardPhone.stageMinHeight).toBe(190);
  });

  it('balances same and changed trials in every representative session', () => {
    expect(buildBalancedMatchFlags(4, () => 0.999)).toEqual([
      true,
      false,
      true,
      false,
    ]);
    const five = buildBalancedMatchFlags(5, () => 0.999);
    expect(five.filter(Boolean)).toHaveLength(3);
    expect(five.filter((flag) => !flag)).toHaveLength(2);
  });

  it('runs a complete balanced preview session and checks passage meaning', async () => {
    const report = jest.fn();
    const view = render(
      <PreviewCatch
        difficulty="easy"
        exposureMs={20}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('preview-catch-preview-word')).toHaveTextContent(
      'water'
    );
    expect(view.getByTestId('preview-catch-focus-word')).toHaveTextContent(
      'packs'
    );
    for (let round = 0; round < 4; round += 1) {
      exposePreview();
      expect(view.queryByTestId('preview-catch-preview-word')).toBeNull();
      fireEvent.press(
        view.getByTestId(
          round % 2 === 0 ? 'preview-answer-same' : 'preview-answer-changed'
        )
      );
      expect(view.getByTestId('preview-catch-feedback')).toBeTruthy();
      fireEvent.press(view.getByTestId('preview-continue'));
    }

    expect(view.getByTestId('preview-catch-comprehension')).toBeTruthy();
    expect(view.getByText('The Morning Trail')).toBeTruthy();
    fireEvent.press(view.getByTestId('preview-comprehension-0'));
    await settleStorage();

    expect(view.getByTestId('preview-catch-end')).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ score: 100, accuracy: 1 })
    );
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        activityType: 'preview-catch',
        passageId: 'hill-trail-markers',
        rounds: 4,
        attempts: 4,
        previewCorrect: 4,
        comprehensionCorrect: true,
        responseMode: 'match',
        exposureMs: 20,
        sameTrials: 2,
        changedTrials: 2,
        representativeSample: true,
        adaptiveQualificationEligible: true,
        comparisonBand: 'preview-catch-match-easy-timed',
        exposureMode: 'timed',
        screenReaderManualMode: false,
      })
    );
    expect(progressStore.updateProgress).toHaveBeenCalledWith(
      'PreviewCatch',
      true,
      100,
      'easy'
    );
  });

  it('keeps the preview available until an explicit screen-reader continue', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
      .mockResolvedValue(true);
    const endNonCalibratingSession = jest.fn();
    const beginNonCalibratingSpy = jest
      .spyOn(progressStore, 'beginNonCalibratingProgressSession')
      .mockReturnValue(endNonCalibratingSession);
    const report = jest.fn();
    const view = render(
      <PreviewCatch
        difficulty="easy"
        exposureMs={20}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(view.getByTestId('preview-catch-preview-word')).toBeTruthy();
    expect(view.getByTestId('preview-catch-manual-continue')).toBeTruthy();
    expect(view.queryByTestId('preview-answer-same')).toBeNull();

    for (let round = 0; round < 4; round += 1) {
      fireEvent.press(view.getByTestId('preview-catch-manual-continue'));
      expect(view.queryByTestId('preview-catch-preview-word')).toBeNull();
      fireEvent.press(
        view.getByTestId(
          round % 2 === 0 ? 'preview-answer-same' : 'preview-answer-changed'
        )
      );
      fireEvent.press(view.getByTestId('preview-continue'));
    }
    fireEvent.press(view.getByTestId('preview-comprehension-0'));
    await settleStorage();

    expect(view.getByTestId('preview-catch-end')).toBeTruthy();
    expect(progressStore.updateProgress).toHaveBeenCalledWith(
      'PreviewCatch',
      false,
      100,
      'easy'
    );
    expect(beginNonCalibratingSpy).toHaveBeenCalledWith('PreviewCatch');
    expect(endNonCalibratingSession).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        representativeSample: true,
        adaptiveQualificationEligible: false,
        comparisonBand: 'preview-catch-match-easy-manual',
        exposureMode: 'manual',
        screenReaderManualMode: true,
      })
    );
  });

  it('uses exact recognition with four 48-point options on hard', async () => {
    const view = render(
      <PreviewCatch
        difficulty="hard"
        exposureMs={20}
        random={() => 0.999}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));

    expect(view.getByTestId('preview-catch-preview-word')).toHaveTextContent(
      'preserve'
    );
    exposePreview();
    expect(view.queryByTestId('preview-answer-same')).toBeNull();
    expect(view.getAllByTestId(/preview-exact-/)).toHaveLength(4);
    expect(view.getByTestId('preview-exact-0')).toHaveStyle({ minHeight: 48 });
    fireEvent.press(view.getByTestId('preview-exact-0'));
    expect(view.getByText('PREVIEW CAUGHT')).toBeTruthy();
  });

  it('replays with fresh passage rotation without double-reporting', async () => {
    const report = jest.fn();
    const view = render(
      <PreviewCatch
        totalRounds={1}
        exposureMs={20}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));
    exposePreview();
    fireEvent.press(view.getByTestId('preview-answer-same'));
    fireEvent.press(view.getByTestId('preview-continue'));
    fireEvent.press(view.getByTestId('preview-comprehension-0'));
    await settleStorage();

    expect(report).toHaveBeenCalledTimes(1);
    fireEvent.press(view.getByTestId('preview-play-again'));
    expect(view.getByTestId('preview-catch-preview-word')).toHaveTextContent(
      'workshop'
    );
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('shuffles comprehension choices and keeps the correct-answer mapping', async () => {
    const report = jest.fn();
    const view = render(
      <PreviewCatch
        totalRounds={1}
        exposureMs={20}
        random={() => 0}
        onReportResult={report}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));
    exposePreview();
    fireEvent.press(view.getByTestId('preview-answer-same'));
    fireEvent.press(view.getByTestId('preview-continue'));

    expect(view.getByTestId('preview-comprehension-0')).not.toHaveTextContent(
      'Blue markers'
    );
    expect(view.getByTestId('preview-comprehension-3')).toHaveTextContent(
      'Blue markers'
    );
    fireEvent.press(view.getByTestId('preview-comprehension-3'));
    await settleStorage();
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({ comprehensionCorrect: true })
    );
  });

  it('auto-starts once after progress loads and cancels its timer on unmount', async () => {
    const report = jest.fn();
    const view = render(
      <PreviewCatch
        autoStart
        exposureMs={500}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    expect(view.queryByTestId('preview-catch-active')).toBeNull();
    await settleStorage();
    expect(view.getByTestId('preview-catch-active')).toBeTruthy();
    expect(view.getAllByTestId('preview-catch-preview-word')).toHaveLength(1);

    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(report).not.toHaveBeenCalled();
  });
});
