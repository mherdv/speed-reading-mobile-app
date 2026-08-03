import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Article } from '../../data/articles';
import CenterLineReader, {
  addFocusBreakOpportunity,
  chunkCenterLineText,
  getCenterLineConfig,
  getCenterLineDelayMs,
} from './CenterLineReader';

const ARTICLE: Article = {
  id: 'focus-lane-test',
  version: 1,
  title: 'A short connected thought',
  language: 'en',
  category: 'psychology',
  difficulty: 'easy',
  wordCount: 4,
  text: 'One two three four.',
  source: 'Original editorial content',
  license: 'Original content for this application',
  comprehensionQuestions: [
    {
      question: 'Which word came first?',
      options: ['One', 'Four'],
      correctIndex: 0,
    },
    {
      question: 'Which word came last?',
      options: ['Two', 'Four'],
      correctIndex: 1,
    },
  ],
};

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Focus Lane', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-03T08:00:00.000Z'));
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses 1, 2, and 4-word focus bands without losing text', () => {
    expect(getCenterLineConfig('easy').chunkWords).toBe(1);
    expect(getCenterLineConfig('medium').chunkWords).toBe(2);
    expect(getCenterLineConfig('hard').chunkWords).toBe(4);
    expect(chunkCenterLineText('one two three four five', 2)).toEqual([
      'one two',
      'three four',
      'five',
    ]);
    expect(
      chunkCenterLineText('one two three four five', 2).join(' ')
    ).toBe('one two three four five');
    const fitted = chunkCenterLineText(
      'encyclopedic communication supports focus',
      4,
      20
    );
    expect(fitted.join(' ')).toBe(
      'encyclopedic communication supports focus'
    );
    expect(fitted.every((chunk) => chunk.length <= 20)).toBe(true);

    const narrowPhoneChunks = chunkCenterLineText(
      'encyclopedic communication supports intentionally challenging focus',
      4
    );
    expect(
      narrowPhoneChunks.every(
        (chunk) => chunk.length <= 24 || !chunk.includes(' ')
      )
    ).toBe(true);
  });

  it('scales cadence by words and adds a sentence-boundary pause', () => {
    expect(getCenterLineDelayMs('one two', 120)).toBe(1_000);
    expect(getCenterLineDelayMs('one two.', 120)).toBe(1_500);
  });

  it('adds an invisible wrap point to long words without changing their text', () => {
    const original = 'electroencephalographically';
    const displayed = addFocusBreakOpportunity(original);

    expect(displayed).toContain('\u200B');
    expect(displayed.replaceAll('\u200B', '')).toBe(original);
    expect(addFocusBreakOpportunity('ordinary reading')).toBe(
      'ordinary reading'
    );
  });

  it('keeps the focus guides fixed and pause/back controls recover context', async () => {
    const view = render(
      <CenterLineReader
        article={ARTICLE}
        chunkWords={1}
        intervalMs={100}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('focus-guides')).toBeTruthy();
    expect(view.getByTestId('focus-current')).toHaveTextContent('One');
    expect(view.getByTestId('focus-current')).toHaveProp('numberOfLines', 2);
    expect(view.getByTestId('focus-current')).toHaveProp(
      'minimumFontScale',
      0.85
    );
    expect(view.getByTestId('focus-current')).toHaveProp(
      'adjustsFontSizeToFit',
      true
    );
    expect(view.getByTestId('focus-current')).toHaveProp(
      'accessibilityLabel',
      'One'
    );
    expect(view.getByTestId('focus-current')).toHaveStyle({
      fontSize: 18,
      lineHeight: 30,
    });
    expect(view.getByTestId('focus-previous')).toHaveProp('accessible', false);
    expect(view.getByTestId('focus-previous')).toHaveProp('numberOfLines', 2);
    expect(view.getByTestId('focus-previous')).toHaveStyle({
      fontSize: 12,
      lineHeight: 18,
    });
    expect(view.getByTestId('focus-next')).toHaveProp('accessible', false);
    expect(view.getByTestId('focus-next')).toHaveProp('numberOfLines', 2);
    expect(view.getByTestId('focus-current-slot')).toHaveStyle({ flex: 3 });

    advance(100);
    expect(view.getByTestId('focus-current')).toHaveTextContent('two');
    fireEvent.press(view.getByTestId('toggle-focus-pause'));
    advance(500);
    expect(view.getByTestId('focus-current')).toHaveTextContent('two');

    fireEvent.press(view.getByTestId('focus-back'));
    expect(view.getByTestId('focus-current')).toHaveTextContent('One');
    fireEvent.press(view.getByTestId('toggle-focus-pause'));
    advance(100);
    expect(view.getByTestId('focus-current')).toHaveTextContent('two');
  });

  it('checks meaning and reports configured pace separately from reading speed', async () => {
    const report = jest.fn();
    const view = render(
      <CenterLineReader
        article={ARTICLE}
        chunkWords={2}
        guideWpm={250}
        intervalMs={50}
        onReportResult={report}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    advance(110);
    expect(view.getByTestId('focus-question')).toBeTruthy();

    fireEvent.press(view.getByTestId('focus-option-0'));
    expect(view.getByTestId('focus-feedback')).toBeTruthy();
    fireEvent.press(view.getByTestId('continue-focus-feedback'));
    fireEvent.press(view.getByTestId('focus-option-1'));
    fireEvent.press(view.getByTestId('continue-focus-feedback'));
    await settle();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 1,
        score: 100,
        details: expect.objectContaining({
          activityType: 'focus-lane-guided-reading',
          chunkSize: 2,
          configuredPaceOnly: true,
          comprehensionCorrect: true,
          completionRate: 1,
          finalTargetWpm: 250,
          wordCount: 4,
          wpm: 0,
        }),
      })
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('lets the learner finish immediately without inventing comprehension credit', async () => {
    const report = jest.fn();
    const view = render(
      <CenterLineReader
        article={ARTICLE}
        chunkWords={1}
        intervalMs={1_000}
        onReportResult={report}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    fireEvent.press(view.getByTestId('finish-focus-early'));
    await settle();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: undefined,
        score: undefined,
        details: expect.objectContaining({
          completedNaturally: false,
          comprehensionCorrect: undefined,
        }),
      })
    );
  });

  it('keeps already presented coverage after stepping back', async () => {
    const report = jest.fn();
    const view = render(
      <CenterLineReader
        article={ARTICLE}
        chunkWords={1}
        intervalMs={100}
        onReportResult={report}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    advance(200);
    expect(view.getByTestId('focus-current')).toHaveTextContent('three');
    fireEvent.press(view.getByTestId('focus-back'));
    expect(view.getByTestId('focus-current')).toHaveTextContent('two');
    fireEvent.press(view.getByTestId('finish-focus-early'));
    await settle();

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          chunksPresented: 3,
          wordCount: 3,
          wordsPresented: 3,
          completionRate: 0.75,
        }),
      })
    );
  });

  it('keeps a learner-adjusted guide pace when reading another passage', async () => {
    const view = render(
      <CenterLineReader
        article={ARTICLE}
        intervalMs={1_000}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    fireEvent.press(view.getByTestId('focus-faster'));
    fireEvent.press(view.getByTestId('focus-faster'));
    expect(view.getByText('210')).toBeTruthy();
    fireEvent.press(view.getByTestId('finish-focus-early'));
    await settle();
    fireEvent.press(view.getByTestId('play-again'));
    advance(60);

    expect(view.getByTestId('focus-lane-active')).toBeTruthy();
    expect(view.getByText('210')).toBeTruthy();
  });

  it('excludes paused time from its active guide duration', async () => {
    const report = jest.fn();
    const view = render(
      <CenterLineReader
        article={ARTICLE}
        intervalMs={1_000}
        onReportResult={report}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    advance(40);
    fireEvent.press(view.getByTestId('toggle-focus-pause'));
    advance(500);
    fireEvent.press(view.getByTestId('toggle-focus-pause'));
    advance(30);
    fireEvent.press(view.getByTestId('finish-focus-early'));
    await settle();

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ elapsedMs: 70 })
    );
  });
});
