import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import PowerReader, {
  createSerializedProgressWriter,
  getOfflinePowerReaderArticles,
  OFFLINE_POWER_READER_ARTICLES,
} from './PowerReader';
import * as progressStore from '../../data/progressStore';

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
    expect(OFFLINE_POWER_READER_ARTICLES).toHaveLength(16);
    expect(getOfflinePowerReaderArticles('easy')).toHaveLength(6);
    expect(getOfflinePowerReaderArticles('medium')).toHaveLength(8);
    expect(getOfflinePowerReaderArticles('hard')).toHaveLength(2);
  });

  it('shows every bundled article and selects one for the chosen difficulty', async () => {
    const { getAllByText, getByText } = render(
      <PowerReader difficulty="easy" />
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(getAllByText('SpeedRead library')).toHaveLength(6);
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

  it.each([
    ['line', 'line-display'],
    ['rsvp', 'rsvp-display'],
  ])('renders the %s presentation mode', (mode, displayTestId) => {
    const { getByTestId } = render(
      <PowerReader text="One two three four five six" chunkSize={2} intervalMs={100} />
    );

    fireEvent.press(getByTestId(`mode-${mode}`));
    fireEvent.press(getByTestId('start-button'));

    expect(getByTestId(displayTestId)).toBeTruthy();
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
});
