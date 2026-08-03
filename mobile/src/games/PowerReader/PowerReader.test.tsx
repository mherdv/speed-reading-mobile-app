import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet } from 'react-native';
import PowerReader, {
  alignPowerReaderHighlightIndex,
  buildPowerReaderSweepLines,
  clampPowerReaderProgress,
  createSerializedProgressWriter,
  getOfflinePowerReaderArticles,
  getPowerReaderPresentationConfig,
  getPowerReaderReadingWordStyles,
  OFFLINE_POWER_READER_ARTICLES,
  parsePowerReaderPresentationMode,
  POWER_READER_PRESENTATION_MODE_KEY,
  sanitizePowerReaderPresentationMode,
} from './PowerReader';
import { ARTICLES } from '../../data/articles';
import * as progressStore from '../../data/progressStore';
import { colors } from '../../theme/colors';

describe('PowerReader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('exposes the full bundled article library by difficulty', () => {
    expect(OFFLINE_POWER_READER_ARTICLES).toHaveLength(24);
    expect(getOfflinePowerReaderArticles('easy')).toHaveLength(8);
    expect(getOfflinePowerReaderArticles('medium')).toHaveLength(8);
    expect(getOfflinePowerReaderArticles('hard')).toHaveLength(8);
    expect(
      OFFLINE_POWER_READER_ARTICLES.map((article) => article.id)
    ).toEqual(
      ARTICLES.map((article) => `offline-${article.id}-v${article.version}`)
    );
  });

  it('shows every bundled article and selects one for the chosen difficulty', async () => {
    const { getAllByText, getByText } = render(
      <PowerReader difficulty="easy" />
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(getAllByText('SpeedRead library')).toHaveLength(8);
    expect(getByText('Read now')).toBeTruthy();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<PowerReader />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows chunk display after pressing start', () => {
    const { getByTestId } = render(
      <PowerReader text="The quick brown fox jumps" chunkSize={2} intervalMs={300} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('power-reader-running-scroll')).toBeTruthy();
    expect(getByTestId('chunk-display')).toBeTruthy();
  });

  it('auto-advances chunks based on interval', () => {
    const { getByTestId } = render(
      <PowerReader text="One two three four" chunkSize={2} intervalMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should have advanced to next chunk
    expect(getByTestId('chunk-display')).toBeTruthy();
  });

  it('ends when all chunks are displayed', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <PowerReader text="One two" chunkSize={2} intervalMs={50} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(onReportResult).toHaveBeenCalled();
    expect(getByTestId('end-screen')).toBeTruthy();
  });

  it('shows play again button on end screen', () => {
    const { getByTestId } = render(
      <PowerReader text="A B" chunkSize={2} intervalMs={30} />
    );

    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(getByTestId('play-again')).toBeTruthy();
  });

  it('uses pasted text without requiring a network book', () => {
    const { getByTestId, getByText } = render(<PowerReader />);

    fireEvent.changeText(
      getByTestId('custom-text-input'),
      '  Pasted   study notes can be trained offline.  '
    );
    fireEvent.press(getByTestId('use-custom-text'));

    expect(getByText('START TRAINING')).toBeTruthy();
    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('flow-display')).toBeTruthy();
  });

  it('uses the matching pace and chunk configuration for each presentation', () => {
    expect(getPowerReaderPresentationConfig('flow', 'hard')).toEqual({
      chunkSize: 5,
      wpm: 500,
    });
    expect(getPowerReaderPresentationConfig('focus-lane', 'hard')).toEqual({
      chunkSize: 4,
      wpm: 360,
    });
    expect(getPowerReaderPresentationConfig('return-sweep', 'hard')).toEqual({
      chunkSize: 3,
      wpm: 320,
    });
    expect(sanitizePowerReaderPresentationMode('return-sweep')).toBe(
      'return-sweep'
    );
    expect(sanitizePowerReaderPresentationMode('retired-mode')).toBe('flow');
    expect(parsePowerReaderPresentationMode('"focus-lane"')).toBe(
      'focus-lane'
    );
    expect(parsePowerReaderPresentationMode('return-sweep')).toBe(
      'return-sweep'
    );
  });

  it('restores the selected presentation before an exact replay auto-starts', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async (key) =>
      key === POWER_READER_PRESENTATION_MODE_KEY
        ? JSON.stringify('return-sweep')
        : null
    );
    const view = render(
      <PowerReader
        autoStart
        difficulty="hard"
        intervalMs={1_000}
        text="One two three four five six"
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(view.getByTestId('return-sweep-display')).toBeTruthy();
    expect(view.getByText('320')).toBeTruthy();
  });

  it('keeps Return-Sweep anchors intact while fitting them into lines', () => {
    const lines = buildPowerReaderSweepLines(
      'one two three four five six seven eight nine ten'.split(' '),
      2,
      4,
      100
    );

    expect(lines).toHaveLength(3);
    expect(lines.flatMap((line) => line.anchors)).toEqual([
      { id: 'anchor-0', startWordIndex: 0, words: ['one', 'two'] },
      { id: 'anchor-2', startWordIndex: 2, words: ['three', 'four'] },
      { id: 'anchor-4', startWordIndex: 4, words: ['five', 'six'] },
      { id: 'anchor-6', startWordIndex: 6, words: ['seven', 'eight'] },
      { id: 'anchor-8', startWordIndex: 8, words: ['nine', 'ten'] },
    ]);
  });

  it('renders a book-sized, two-line Focus Lane with side context', () => {
    const { getByTestId, getByText } = render(
      <PowerReader
        text="electroencephalographically reading stays connected here"
        chunkSize={2}
        intervalMs={100}
      />
    );

    fireEvent.press(getByTestId('mode-focus-lane'));
    expect(getByText('Focus Lane')).toBeTruthy();
    fireEvent.press(getByTestId('start-button'));

    expect(getByTestId('focus-lane-display')).toBeTruthy();
    expect(getByTestId('power-focus-current')).toHaveProp('numberOfLines', 2);
    expect(getByTestId('power-focus-current')).toHaveProp(
      'accessibilityLabel',
      'electroencephalographically reading'
    );
    expect(getByTestId('power-focus-current')).toHaveStyle({
      fontSize: 18,
      lineHeight: 30,
    });
    expect(getByTestId('power-focus-previous')).toHaveProp('numberOfLines', 2);
    expect(getByTestId('power-focus-next')).toHaveTextContent(
      'stays connected'
    );
  });

  it('renders Return-Sweep Flow as stable fitted lines with one active anchor', () => {
    const { getAllByTestId, getByTestId, getByText } = render(
      <PowerReader
        text="One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four"
        chunkSize={2}
        intervalMs={100}
      />
    );

    fireEvent.press(getByTestId('mode-return-sweep'));
    expect(getByText('Return-Sweep Flow')).toBeTruthy();
    fireEvent.press(getByTestId('start-button'));

    expect(getByTestId('return-sweep-display')).toBeTruthy();
    expect(getByTestId('power-return-active-anchor')).toHaveTextContent(
      'One two'
    );
    const renderedLines = getAllByTestId(/^power-return-line-\d+$/);
    expect(renderedLines.length).toBeGreaterThan(1);
    expect(renderedLines[0]).toHaveStyle({
      justifyContent: 'space-between',
    });
    expect(renderedLines[renderedLines.length - 1]).toHaveStyle({
      justifyContent: 'flex-start',
    });

    fireEvent.press(getByTestId('speed-increase'));
    expect(getByText('255')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(110);
    });
    expect(getByTestId('power-return-active-anchor')).toHaveTextContent(
      'three four'
    );
  });

  it('uses accessible dark reading highlight and selection pairs', () => {
    expect(getPowerReaderReadingWordStyles('dark')).toEqual({
      highlight: {
        color: colors.white,
        backgroundColor: colors.secondary,
      },
      selected: {
        color: colors.warningForeground,
        backgroundColor: colors.warningSurface,
      },
    });
  });

  it('reports configured guided pace instead of inferring measured WPM', () => {
    const onReportResult = jest.fn();
    const { getByText, getByTestId } = render(
      <PowerReader text="One two" chunkSize={2} intervalMs={50} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 2,
        details: expect.objectContaining({
          activityType: 'paced-reading',
          configuredPaceOnly: true,
          targetWpm: 300,
          wpm: 0,
          wordsPresented: 2,
          chunksPresented: 1,
          pagesPresented: 1,
          presentationMode: 'flow',
        }),
      })
    );
    expect(getByText('Guide: 300 WPM')).toBeTruthy();
  });

  it('reports Focus Lane as a distinct presentation comparison band', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <PowerReader
        text="One two"
        chunkSize={2}
        intervalMs={50}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('mode-focus-lane'));
    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          comparisonBand: 'power-reader-focus-lane-medium',
          presentationMode: 'focus-lane',
          targetWpm: 250,
        }),
      })
    );
  });

  it('reports only unique chunks presented when page controls skip content', () => {
    const updateProgress = jest
      .spyOn(progressStore, 'updateProgress')
      .mockResolvedValue({
        progress: { level: 1, streak: -1, totalPlays: 1, bestScore: 6 },
        levelChanged: false,
        levelDelta: 0,
      });
    const onReportResult = jest.fn();
    const text = Array.from({ length: 184 }, (_, index) => `word${index}`).join(' ');
    const { getByText, getByTestId } = render(
      <PowerReader
        text={text}
        chunkSize={2}
        intervalMs={50}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByText('Next Page'));
    act(() => {
      jest.advanceTimersByTime(120);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 6,
        details: expect.objectContaining({
          wordCount: 6,
          wordsPresented: 6,
          chunksPresented: 3,
          pagesPresented: 2,
          totalWords: 184,
          completedEnoughForProgress: false,
          completionThreshold: 0.9,
          wpm: 0,
        }),
      })
    );
    expect(onReportResult.mock.calls[0][0].details.completionRate)
      .toBeCloseTo(6 / 184);
    expect(updateProgress).toHaveBeenCalledWith('PowerReader', false, 6);
  });

  it('keeps the original attempt timestamp while excluding paused time', () => {
    const onReportResult = jest.fn();
    const { getByText, getByTestId } = render(
      <PowerReader
        text="One two"
        chunkSize={2}
        intervalMs={50}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(20);
    });
    fireEvent.press(getByText('Pause'));
    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    fireEvent.press(getByText('Resume'));
    act(() => {
      jest.advanceTimersByTime(60);
    });

    expect(onReportResult.mock.calls[0][0]).toMatchObject({
      startedAtIso: '2020-01-01T00:00:00.000Z',
      elapsedMs: 70,
    });
  });

  it('renders language controls as genuine 44-point targets while paused', () => {
    const { getByText, getByTestId } = render(
      <PowerReader text="One two three four" chunkSize={2} intervalMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByText('Pause'));

    const languageStyle = StyleSheet.flatten(
      getByTestId('source-language-en').props.style
    );
    expect(languageStyle.minWidth).toBeGreaterThanOrEqual(44);
    expect(languageStyle.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('serializes progress writes so the newest position wins', async () => {
    let stored = '{}';
    let releaseFirstWrite: (value?: void | PromiseLike<void>) => void = () => {};
    const firstWriteGate = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });
    let writeCount = 0;
    const storage = {
      getItem: jest.fn(async () => stored),
      setItem: jest.fn(async (_key: string, value: string) => {
        writeCount += 1;
        if (writeCount === 1) {
          await firstWriteGate;
        }
        stored = value;
      }),
    };
    const writer = createSerializedProgressWriter(storage);

    writer.update({ bookId: 'book', pageIndex: 1, highlightIndex: 4 });
    const first = writer.flush();
    writer.update({ bookId: 'book', pageIndex: 3, highlightIndex: 12 });
    const second = writer.flush();
    releaseFirstWrite();
    await first;
    await second;

    expect(JSON.parse(stored).book).toEqual({
      pageIndex: 3,
      highlightIndex: 12,
    });
  });

  it('clamps restored progress to the pages and words in the current book', () => {
    expect(
      clampPowerReaderProgress(
        { pageIndex: 99, highlightIndex: 99 },
        365
      )
    ).toEqual({ pageIndex: 2, highlightIndex: 4 });
    expect(
      clampPowerReaderProgress(
        { pageIndex: 1.9, highlightIndex: 7.8 },
        365
      )
    ).toEqual({ pageIndex: 1, highlightIndex: 7 });
    expect(
      clampPowerReaderProgress(
        { pageIndex: Number.NaN, highlightIndex: Number.POSITIVE_INFINITY },
        365
      )
    ).toEqual({ pageIndex: 0, highlightIndex: 0 });
    expect(clampPowerReaderProgress('invalid', 0)).toEqual({
      pageIndex: 0,
      highlightIndex: 0,
    });
    expect(
      clampPowerReaderProgress(
        { pageIndex: 1, highlightIndex: 99 },
        12,
        10
      )
    ).toEqual({ pageIndex: 1, highlightIndex: 1 });
    expect(alignPowerReaderHighlightIndex(7, 3, 20)).toBe(6);
    expect(alignPowerReaderHighlightIndex(99, 4, 10)).toBe(8);
  });
});
