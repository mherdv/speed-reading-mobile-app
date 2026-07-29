import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  CORRECT_RECALL_FEEDBACK_MS,
  getRecallFeedbackDurationMs,
} from '../recallFeedback';
import VisualSpanExpansion from './VisualSpanExpansion';
import {
  createVisualSpanTrial,
  getVisualSpanConfig,
  getVisualSpanWordPool,
  VISUAL_SPAN_FIXATION_CUE_MS,
} from './visualSpanContent';

const random = () => 0.25;

async function flushAsyncEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('VisualSpanExpansion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses distinct spatial, timing, and option demands at every difficulty', () => {
    const configs = (['easy', 'medium', 'hard'] as const).map(
      getVisualSpanConfig
    );
    expect(configs.map((config) => config.spanSize)).toEqual([3, 5, 7]);
    expect(configs.map((config) => config.displayMs)).toEqual([
      1_600, 1_200, 850,
    ]);
    expect(configs.map((config) => config.optionCount)).toEqual([3, 4, 5]);
    expect(configs.map((config) => config.spread)).toEqual([
      'compact',
      'standard',
      'wide',
    ]);

    const poolSizes = { easy: 71, medium: 194, hard: 75 };
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(getVisualSpanWordPool(difficulty)).toHaveLength(
        poolSizes[difficulty]
      );
      const trial = createVisualSpanTrial(difficulty, undefined, random);
      const config = getVisualSpanConfig(difficulty);
      expect(trial.items).toHaveLength(config.spanSize);
      expect(trial.options).toHaveLength(config.optionCount);
      expect(new Set(trial.items.map((item) => item.positionId)).size).toBe(
        config.spanSize
      );
      expect(new Set(trial.items.map((item) => item.word)).size).toBe(
        config.spanSize
      );
      expect(trial.options).toContain(trial.correctWord);
      expect(
        trial.options.filter((option) =>
          trial.items.some((item) => item.word === option)
        ).length
      ).toBeGreaterThan(1);
      expect(
        new Set([
          ...trial.items.map((item) => item.word.length),
          ...trial.options.map((option) => option.length),
        ]).size
      ).toBe(1);
    }
  });

  it('centers the eyes before flashing words around the fixation point', async () => {
    const view = render(
      <VisualSpanExpansion
        itemCount={3}
        displayMs={50}
        random={random}
      />
    );
    await flushAsyncEffects();
    expect(view.getByTestId('start-button')).toBeTruthy();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('span-fixation-cue')).toBeTruthy();
    expect(view.queryByTestId('span-board')).toBeNull();
    act(() => jest.advanceTimersByTime(VISUAL_SPAN_FIXATION_CUE_MS));

    const trial = createVisualSpanTrial('easy', 3, random);
    expect(view.getByTestId('span-board')).toBeTruthy();
    expect(view.getByTestId('span-fixation')).toBeTruthy();
    for (const item of trial.items) {
      expect(
        view.getByTestId(`span-item-${item.positionId}`)
      ).toHaveTextContent(item.word);
    }
    expect(view.queryByTestId('recall-input')).toBeNull();
  });

  it('asks for the word at one spatial position after the flash', async () => {
    const view = render(
      <VisualSpanExpansion
        itemCount={3}
        displayMs={50}
        random={random}
      />
    );
    await flushAsyncEffects();
    const trial = createVisualSpanTrial('easy', 3, random);

    fireEvent.press(view.getByTestId('start-button'));
    act(() =>
      jest.advanceTimersByTime(VISUAL_SPAN_FIXATION_CUE_MS + 60)
    );

    expect(view.getByTestId('span-recall')).toBeTruthy();
    expect(view.getByTestId('span-recall-board')).toBeTruthy();
    expect(
      view.getByText(`Which word was at ${trial.targetPositionLabel}?`)
    ).toBeTruthy();
    expect(view.getByTestId('span-options')).toBeTruthy();
    expect(view.queryByTestId('recall-input')).toBeNull();
  });

  it('shows the selected and correct words, then reduces the next span after a miss', async () => {
    const view = render(
      <VisualSpanExpansion
        difficulty="medium"
        itemCount={5}
        displayMs={30}
        totalRounds={4}
        random={random}
      />
    );
    await flushAsyncEffects();
    const trial = createVisualSpanTrial('medium', 5, random);
    const wrongIndex = trial.options.findIndex(
      (option) => option !== trial.correctWord
    );

    fireEvent.press(view.getByTestId('start-button'));
    act(() =>
      jest.advanceTimersByTime(VISUAL_SPAN_FIXATION_CUE_MS + 40)
    );
    fireEvent.press(view.getByTestId(`span-option-${wrongIndex}`));

    expect(view.getByTestId('visual-span-user-answer')).toHaveTextContent(
      trial.options[wrongIndex]!
    );
    expect(view.getByTestId('visual-span-correct-answer')).toHaveTextContent(
      trial.correctWord
    );
    expect(view.getByTestId('span-size')).toHaveTextContent('4');
    expect(view.getByTestId('span-misses')).toHaveTextContent('1/3');

    const reviewMs = getRecallFeedbackDurationMs(trial.correctWord, false);
    act(() => jest.advanceTimersByTime(reviewMs - 1));
    expect(view.getByTestId('visual-span-feedback')).toBeTruthy();
    act(() => jest.advanceTimersByTime(2));
    expect(view.getByTestId('span-fixation-cue')).toBeTruthy();
    act(() => jest.advanceTimersByTime(VISUAL_SPAN_FIXATION_CUE_MS));
    expect(view.getByTestId('span-board')).toBeTruthy();
    const reducedTrial = createVisualSpanTrial('medium', 4, random);
    for (const item of reducedTrial.items) {
      expect(
        view.getByTestId(`span-item-${item.positionId}`)
      ).toHaveTextContent(item.word);
    }
  });

  it('reviews the third consecutive miss before ending and reports the spatial activity', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <VisualSpanExpansion
        itemCount={3}
        displayMs={10}
        totalRounds={8}
        random={random}
        onReportResult={onReportResult}
      />
    );
    await flushAsyncEffects();
    const trial = createVisualSpanTrial('easy', 3, random);
    const wrongIndex = trial.options.findIndex(
      (option) => option !== trial.correctWord
    );
    const reviewMs = getRecallFeedbackDurationMs(trial.correctWord, false);

    fireEvent.press(view.getByTestId('start-button'));
    for (let miss = 0; miss < 3; miss += 1) {
      act(() =>
        jest.advanceTimersByTime(VISUAL_SPAN_FIXATION_CUE_MS + 20)
      );
      fireEvent.press(view.getByTestId(`span-option-${wrongIndex}`));
      expect(view.getByTestId('visual-span-feedback')).toBeTruthy();
      act(() => jest.advanceTimersByTime(reviewMs - 1));
      expect(view.queryByTestId('end')).toBeNull();
      act(() => jest.advanceTimersByTime(1));
    }

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 0,
        details: expect.objectContaining({
          activityType: 'spatial-word-position-recall',
          attempts: 3,
          failures: 3,
          finishReason: 'three-misses',
        }),
      })
    );
    await flushAsyncEffects();
  });

  it('finishes a one-round successful set after brief positive feedback', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <VisualSpanExpansion
        itemCount={3}
        displayMs={10}
        totalRounds={1}
        random={random}
        onReportResult={onReportResult}
      />
    );
    await flushAsyncEffects();
    const trial = createVisualSpanTrial('easy', 3, random);
    const correctIndex = trial.options.indexOf(trial.correctWord);

    fireEvent.press(view.getByTestId('start-button'));
    act(() =>
      jest.advanceTimersByTime(VISUAL_SPAN_FIXATION_CUE_MS + 20)
    );
    fireEvent.press(view.getByTestId(`span-option-${correctIndex}`));
    act(() => jest.advanceTimersByTime(CORRECT_RECALL_FEEDBACK_MS));

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({ accuracy: 1, score: 30 })
    );
    await flushAsyncEffects();
  });
});
