import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadGamePins,
  recordRecentGame,
  toggleFavoriteGame,
} from '../gamePinsStore';

describe('game pins persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('adds and removes favorites', async () => {
    await toggleFavoriteGame('LastWordRecall');
    await toggleFavoriteGame('TimedWordRecognition');
    expect((await loadGamePins()).favorites).toEqual([
      'TimedWordRecognition',
      'LastWordRecall',
    ]);

    await toggleFavoriteGame('LastWordRecall');
    expect((await loadGamePins()).favorites).toEqual([
      'TimedWordRecognition',
    ]);
  });

  it('keeps the six most recent unique games in newest-first order', async () => {
    for (const gameId of [
      'RepeatedReading',
      'MainIdeaSprint',
      'StructureScan',
      'TextSearch',
      'FlashReading',
      'TimedWordRecognition',
      'LastWordRecall',
      'TextSearch',
    ]) {
      await recordRecentGame(gameId);
    }

    expect((await loadGamePins()).recent).toEqual([
      'TextSearch',
      'LastWordRecall',
      'TimedWordRecognition',
      'FlashReading',
      'StructureScan',
      'MainIdeaSprint',
    ]);
  });

  it('normalizes legacy IDs and drops unknown saved games', async () => {
    await AsyncStorage.setItem(
      'speed-reading:game-pins:v1',
      JSON.stringify({
        favorites: ['timed-word-recognition', 'missing'],
        recent: ['word-search-game', null],
      })
    );

    await expect(loadGamePins()).resolves.toEqual({
      favorites: ['TimedWordRecognition'],
      recent: ['WordSearchGame'],
    });
  });
});
