import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Article } from '../../data/articles';
import * as progressStore from '../../data/progressStore';
import ReadingSaccades, {
  buildSaccadeLines,
  getReadingSaccadesConfig,
  getReturnSweepCharacterLimit,
  getReturnSweepWindowLineCount,
} from './ReadingSaccades';

const ARTICLE: Article = {
  id: 'return-sweep-test',
  version: 3,
  title: 'A short test article',
  language: 'en',
  category: 'science',
  difficulty: 'easy',
  wordCount: 12,
  text: 'one two three four five six seven eight nine ten eleven twelve',
  source: 'Original editorial content',
  license: 'Original content for this application',
  comprehensionQuestions: [
    {
      question: 'What kind of article is this?',
      options: ['A long article', 'A short article', 'A recipe', 'A poem'],
      correctIndex: 1,
    },
  ],
};

const LONG_ARTICLE: Article = {
  ...ARTICLE,
  id: 'return-sweep-long-test',
  wordCount: 96,
  text: Array.from({ length: 96 }, (_, index) => `word${index + 1}`).join(' '),
};

async function settleStorage() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('ReadingSaccades', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-03T08:00:00.000Z'));
    await AsyncStorage.clear();
    jest.spyOn(progressStore, 'updateProgress').mockResolvedValue({
      progress: { level: 1, streak: 1, totalPlays: 1, bestScore: 12 },
      levelChanged: false,
      levelDelta: 0,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('defines the requested difficulty progression', () => {
    expect(getReadingSaccadesConfig('easy')).toEqual({
      anchorWords: 2,
      lineWords: 12,
      guideWpm: 150,
    });
    expect(getReadingSaccadesConfig('medium')).toEqual({
      anchorWords: 3,
      lineWords: 14,
      guideWpm: 230,
    });
    expect(getReadingSaccadesConfig('hard')).toEqual({
      anchorWords: 3,
      lineWords: 16,
      guideWpm: 320,
    });
  });

  it('splits every word into stable lines and final partial anchors', () => {
    const lines = buildSaccadeLines('one two three four five six seven', 4, 3);

    expect(lines.map((line) => line.anchors.map((anchor) => anchor.words))).toEqual([
      [['one', 'two'], ['three', 'four']],
      [['five', 'six', 'seven']],
    ]);
    expect(
      lines.flatMap((line) => line.anchors).map((anchor) => anchor.startWordIndex)
    ).toEqual([0, 2, 4]);

    const fitted = buildSaccadeLines(
      'encyclopedic communication supports focused reading',
      10,
      3,
      22
    );
    expect(
      fitted.flatMap((line) => line.anchors).flatMap((anchor) => anchor.words)
    ).toEqual([
      'encyclopedic',
      'communication',
      'supports',
      'focused',
      'reading',
    ]);
    expect(
      fitted.every(
        (line) =>
          line.anchors.flatMap((anchor) => anchor.words).join(' ').length <= 22
      )
    ).toBe(true);

    const narrowPhoneLines = buildSaccadeLines(
      'encyclopedic communication supports intentionally challenging focused reading',
      10,
      3
    );
    expect(
      narrowPhoneLines.every((line) => {
        const lineText = line.anchors
          .flatMap((anchor) => anchor.words)
          .join(' ');
        return lineText.length <= 30 || !lineText.includes(' ');
      })
    ).toBe(true);
  });

  it('uses more of a wide reading column without overfilling a phone', () => {
    const phoneLimit = getReturnSweepCharacterLimit(393, 18, 700);
    const wideLimit = getReturnSweepCharacterLimit(1200, 18, 700);
    const largeTextLimit = getReturnSweepCharacterLimit(1200, 21, 700);

    expect(phoneLimit).toBeGreaterThanOrEqual(30);
    expect(wideLimit).toBeGreaterThan(phoneLimit);
    expect(largeTextLimit).toBeLessThan(wideLimit);

    const text =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen';
    const narrowLines = buildSaccadeLines(text, 10, 2, 24);
    const wideLines = buildSaccadeLines(text, 10, 2, 72);
    const originalWords = text.split(' ');

    expect(wideLines.length).toBeLessThan(narrowLines.length);
    expect(
      wideLines.flatMap((line) =>
        line.anchors.flatMap((anchor) => anchor.words)
      )
    ).toEqual(originalWords);
    expect(
      narrowLines.flatMap((line) =>
        line.anchors.flatMap((anchor) => anchor.words)
      )
    ).toEqual(originalWords);

    expect(phoneLimit).toBe(35);
    expect(getReturnSweepWindowLineCount(852, 18)).toBe(8);
    expect(getReturnSweepWindowLineCount(568, 21)).toBe(6);
  });

  it('steps anchors left to right and enters the next centered line without arrow UI', async () => {
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        lineWords={4}
        tickMs={10}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('active-anchor').props.children).toBe('one two');
    expect(view.queryByTestId('saccades-direction')).toBeNull();
    expect(view.queryByTestId('return-sweep-cue')).toBeNull();
    expect(view.getByTestId('saccades-progress-fill')).toHaveStyle({
      width: `${(2 / 12) * 100}%`,
    });
    expect(view.getByTestId('saccades-current-announcement')).toHaveTextContent(
      'Current phrase: one two'
    );
    expect(view.getByTestId('saccades-line-0')).toHaveProp(
      'accessible',
      false
    );
    expect(view.getByTestId('saccades-line-0')).toHaveStyle({
      justifyContent: 'space-between',
    });

    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.getByTestId('active-anchor').props.children).toBe('three four');

    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.queryByTestId('return-sweep-cue')).toBeNull();
    expect(view.queryByTestId('saccades-direction')).toBeNull();
    expect(view.getByTestId('saccades-current-announcement')).toHaveTextContent(
      'Return to line 2'
    );

    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.getByTestId('active-anchor').props.children).toBe('five six');
    expect(view.getByTestId('saccades-progress-note')).toHaveTextContent(
      '2 lines visited · line 2 of 3'
    );
  });

  it('changes pace immediately and reports its initial and final guide rates', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        guideWpm={240}
        lineWords={4}
        tickMs={10}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByText('240')).toBeTruthy();
    fireEvent.press(view.getByTestId('saccades-faster'));
    expect(view.getByText('265')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.getByTestId('active-anchor')).toHaveTextContent('three four');

    fireEvent.press(view.getByTestId('finish-early'));
    fireEvent.press(view.getByTestId('question-option-1'));
    fireEvent.press(view.getByTestId('continue-saccades-feedback'));
    await settleStorage();

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          targetWpm: 265,
          initialTargetWpm: 240,
          finalTargetWpm: 265,
        }),
      })
    );

    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByText('265')).toBeTruthy();
    expect(view.getByTestId('active-anchor')).toHaveTextContent('one two');
  });

  it('reschedules the current phrase as soon as the guide pace changes', async () => {
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        guideWpm={240}
        lineWords={4}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(250);
    });
    fireEvent.press(view.getByTestId('saccades-faster'));
    act(() => {
      jest.advanceTimersByTime(452);
    });
    expect(view.getByTestId('active-anchor')).toHaveTextContent('one two');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(view.getByTestId('active-anchor')).toHaveTextContent('three four');
  });

  it('renders an eight-line book window for the iPhone 14 Pro layout contract', async () => {
    const view = render(
      <ReadingSaccades
        article={LONG_ARTICLE}
        anchorWords={2}
        lineWords={4}
        tickMs={1_000}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));

    expect(view.getAllByTestId(/^saccades-line-\d+$/)).toHaveLength(8);
    expect(view.getByTestId('saccades-line-window')).toHaveStyle({
      minHeight: 240,
    });
    expect(view.getByTestId('saccades-controls')).toHaveStyle({
      flexWrap: 'wrap',
    });
    expect(view.getByTestId('saccades-faster')).toHaveStyle({
      flexBasis: '45%',
      minHeight: 48,
    });
  });

  it('pauses, resumes, and moves back by one anchor without double counting', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        lineWords={4}
        tickMs={10}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));
    fireEvent.press(view.getByTestId('toggle-guide'));
    expect(view.getByTestId('saccades-paused-pill')).toHaveTextContent(
      'PAUSED'
    );

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(view.getByTestId('active-anchor').props.children).toBe('one two');

    fireEvent.press(view.getByTestId('toggle-guide'));
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.getByTestId('active-anchor').props.children).toBe('three four');

    fireEvent.press(view.getByTestId('back-anchor'));
    expect(view.getByTestId('active-anchor').props.children).toBe('one two');
    expect(view.getByText('4/12')).toBeTruthy();

    fireEvent.press(view.getByTestId('finish-early'));
    fireEvent.press(view.getByTestId('question-option-1'));
    fireEvent.press(view.getByTestId('continue-saccades-feedback'));
    await settleStorage();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({ elapsedMs: 10 })
    );
  });

  it('shows the first comprehension question after the full article and reports truthfully once', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        lineWords={4}
        guideWpm={240}
        tickMs={10}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(110);
    });
    expect(view.getByTestId('saccades-question')).toBeTruthy();
    expect(view.getByText('What kind of article is this?')).toBeTruthy();
    expect(onReportResult).not.toHaveBeenCalled();

    fireEvent.press(view.getByTestId('question-option-1'));
    expect(view.getByTestId('saccades-feedback')).toBeTruthy();
    fireEvent.press(view.getByTestId('continue-saccades-feedback'));
    await settleStorage();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 80,
        score: 12,
        accuracy: 1,
        details: expect.objectContaining({
          schemaVersion: 1,
          activityType: 'reading-saccade-guide',
          contentId: 'return-sweep-test',
          contentVersion: 3,
          difficulty: 'easy',
          targetWpm: 240,
          configuredPaceOnly: true,
          anchorWords: 2,
          lineWords: 4,
          totalWords: 12,
          wordCount: 12,
          wordsPresented: 12,
          completionRate: 1,
          linesPresented: 3,
          returnSweepsCompleted: 2,
          comprehensionCorrect: true,
          comprehensionAccuracy: 1,
          wpm: 0,
        }),
      })
    );
    expect(progressStore.updateProgress).toHaveBeenCalledWith(
      'ReadingSaccades',
      true,
      12,
      'easy'
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).toHaveBeenCalledTimes(1);
  });

  it('supports an honest early finish and does not qualify partial coverage', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        lineWords={4}
        tickMs={10}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(10);
    });
    fireEvent.press(view.getByTestId('finish-early'));

    expect(view.getByTestId('saccades-question')).toBeTruthy();
    expect(onReportResult).not.toHaveBeenCalled();
    fireEvent.press(view.getByTestId('question-option-1'));
    fireEvent.press(view.getByTestId('continue-saccades-feedback'));
    await settleStorage();

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 4,
        accuracy: 1,
        details: expect.objectContaining({
          totalWords: 12,
          wordsPresented: 4,
          completionRate: 4 / 12,
          completedEnoughForProgress: false,
        }),
      })
    );
    expect(progressStore.updateProgress).toHaveBeenCalledWith(
      'ReadingSaccades',
      false,
      4,
      'easy'
    );
  });

  it('replays from the first anchor and clears pending work on unmount', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        lineWords={4}
        tickMs={10}
        onReportResult={onReportResult}
      />
    );
    await settleStorage();
    fireEvent.press(view.getByTestId('start-button'));
    fireEvent.press(view.getByTestId('finish-early'));
    fireEvent.press(view.getByTestId('question-option-0'));
    fireEvent.press(view.getByTestId('continue-saccades-feedback'));
    await settleStorage();
    expect(onReportResult).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByTestId('saccades-active')).toBeTruthy();
    expect(view.getByTestId('active-anchor').props.children).toBe('one two');
    expect(view.getByText('2/12')).toBeTruthy();

    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).toHaveBeenCalledTimes(1);
  });

  it('auto-starts once after stored progress loads and exposes 44-point controls', async () => {
    const onReportResult = jest.fn();
    const view = render(
      <ReadingSaccades
        article={ARTICLE}
        anchorWords={2}
        lineWords={4}
        tickMs={10}
        autoStart
        onReportResult={onReportResult}
      />
    );

    await settleStorage();
    expect(view.queryByTestId('start-button')).toBeNull();
    expect(view.getByTestId('saccades-active')).toBeTruthy();
    expect(view.getByTestId('toggle-guide')).toHaveStyle({ minHeight: 48 });
    expect(view.getByTestId('saccades-slower')).toHaveStyle({ minHeight: 48 });
    expect(view.getByTestId('saccades-faster')).toHaveStyle({ minHeight: 48 });
    expect(view.getByTestId('finish-early')).toHaveStyle({ minHeight: 48 });

    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).not.toHaveBeenCalled();
  });
});
