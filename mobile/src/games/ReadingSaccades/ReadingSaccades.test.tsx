import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Article } from '../../data/articles';
import * as progressStore from '../../data/progressStore';
import ReadingSaccades, {
  buildSaccadeLines,
  getReadingSaccadesConfig,
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
      lineWords: 6,
      guideWpm: 150,
    });
    expect(getReadingSaccadesConfig('medium')).toEqual({
      anchorWords: 3,
      lineWords: 8,
      guideWpm: 230,
    });
    expect(getReadingSaccadesConfig('hard')).toEqual({
      anchorWords: 3,
      lineWords: 10,
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

  it('steps anchors left to right, shows a return cue, and enters the next line', async () => {
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
    expect(view.getByTestId('saccades-current-announcement')).toHaveTextContent(
      'Current phrase: one two'
    );
    expect(view.getByTestId('saccades-line-0')).toHaveProp(
      'accessible',
      false
    );

    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.getByTestId('active-anchor').props.children).toBe('three four');

    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.getByTestId('return-sweep-cue')).toBeTruthy();
    expect(view.getByTestId('saccades-current-announcement')).toHaveTextContent(
      'Return to line 2'
    );

    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(view.getByTestId('active-anchor').props.children).toBe('five six');
    expect(view.getByText('2 lines visited · 1 return sweeps')).toBeTruthy();
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
        elapsedMs: 100,
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
          linesPresented: 4,
          returnSweepsCompleted: 3,
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
    expect(view.getByTestId('finish-early')).toHaveStyle({ minHeight: 48 });

    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).not.toHaveBeenCalled();
  });
});
