import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AttemptResult } from '../../domain/types';
import { loadResults, saveResult } from '../resultsStore';

function makeResult(id: string): AttemptResult {
  return {
    id,
    sampleId: 'sample-1',
    sampleTitle: 'Focus & Pace',
    startedAtIso: '2026-07-26T08:00:00.000Z',
    finishedAtIso: '2026-07-26T08:01:00.000Z',
    elapsedMs: 60_000,
    wordCount: 200,
    wpm: 200,
    comprehensionCorrect: true,
  };
}

describe('resultsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stores newest results first', async () => {
    await saveResult(makeResult('first'));
    await saveResult(makeResult('second'));

    const results = await loadResults();
    expect(results.map((result) => result.id)).toEqual(['second', 'first']);
  });

  it('returns an empty history when local storage is unavailable', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(
      new Error('storage unavailable')
    );

    await expect(loadResults()).resolves.toEqual([]);
  });

  it('serializes concurrent saves so neither result is lost', async () => {
    await Promise.all([
      saveResult(makeResult('concurrent-a')),
      saveResult(makeResult('concurrent-b')),
    ]);

    const results = await loadResults();
    expect(results.map((result) => result.id).sort()).toEqual([
      'concurrent-a',
      'concurrent-b',
    ]);
  });

  it('upserts a repeated result ID instead of duplicating it', async () => {
    await saveResult(makeResult('same-id'));
    await saveResult({
      ...makeResult('same-id'),
      wpm: 321,
    });

    const results = await loadResults();
    expect(results).toHaveLength(1);
    expect(results[0].wpm).toBe(321);
  });
});
