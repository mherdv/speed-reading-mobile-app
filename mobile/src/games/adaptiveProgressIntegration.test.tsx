import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import FlashReading from './FlashReading/FlashReading';
import NumberRecognition from './NumberRecognition/NumberRecognition';
import NumberSearch from './NumberSearch/NumberSearch';
import SymbolRecognition from './SymbolRecognition/SymbolRecognition';
import TimedPhraseRecognition from './TimedPhraseRecognition/TimedPhraseRecognition';
import WordPairs from './WordPairs/WordPairs';

const PROGRESS_KEY = 'speed-reading:progress:v1';

async function expectPersistedPlay(gameId: string) {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  expect(raw).not.toBeNull();
  expect(JSON.parse(raw ?? '{}')[gameId]).toEqual(
    expect.objectContaining({ totalPlays: 1 })
  );
}

describe('adaptive-eligible game progress integration', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T08:00:00.000Z'));
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('persists Flash Recall progress through the shared controller contract', async () => {
    const { getByTestId } = render(
      <FlashReading words={['focus']} displayMs={10} totalRounds={1} />
    );
    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(10);
    });
    fireEvent.changeText(getByTestId('recall-input'), 'focus');
    fireEvent.press(getByTestId('submit-btn'));
    act(() => {
      jest.advanceTimersByTime(800);
    });
    await expectPersistedPlay('FlashReading');
  });

  it.each([
    ['NumberRecognition', <NumberRecognition durationMs={100} />],
    ['NumberSearch', <NumberSearch durationMs={100} />],
    ['SymbolRecognition', <SymbolRecognition durationMs={100} />],
    ['WordPairs', <WordPairs durationMs={100} />],
  ])('persists %s progress after a timed attempt', async (gameId, component) => {
    const { getByTestId } = render(component);
    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(100);
    });
    await expectPersistedPlay(gameId);
  });

  it('persists Phrase Flash progress after a completed recall', async () => {
    const { getByTestId } = render(
      <TimedPhraseRecognition
        phrases={['Focus now', 'Read smoothly', 'Keep meaning', 'Scan first']}
        displayMs={10}
        totalRounds={1}
      />
    );
    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(10);
    });
    fireEvent.press(getByTestId('option-0'));
    await expectPersistedPlay('TimedPhraseRecognition');
  });
});
