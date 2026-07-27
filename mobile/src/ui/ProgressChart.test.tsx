import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { saveResult } from '../data/resultsStore';
import type { AttemptResult } from '../domain/types';
import { ProgressChart } from './ProgressChart';

const CURRENT: AttemptResult = {
  id: 'current-pending',
  sampleId: 'TextSearch',
  sampleTitle: 'Text Search',
  startedAtIso: '2026-07-26T08:00:00.000Z',
  finishedAtIso: '2026-07-26T08:00:10.000Z',
  elapsedMs: 10_000,
  wordCount: 0,
  wpm: 0,
  score: 0,
  accuracy: 0,
  details: {
    activityType: 'scanning',
    difficulty: 'easy',
  },
};

describe('ProgressChart optimistic current result', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows the just-finished attempt before its background save resolves', async () => {
    const { getByText } = render(
      <ProgressChart gameId="TextSearch" currentResult={CURRENT} />
    );

    await waitFor(() => {
      expect(getByText('1')).toBeTruthy();
      expect(getByText('Attempt')).toBeTruthy();
    });
  });

  it('keeps repeated-passage practice out of the cross-passage baseline', async () => {
    const current: AttemptResult = {
      ...CURRENT,
      id: 'current-reading',
      sampleId: 'sample-3',
      wordCount: 120,
      wpm: 240,
      score: undefined,
      accuracy: undefined,
      details: {
        activityType: 'measured-reading',
        contentId: 'sample-3',
        comparisonBand: 'general-practice-brief-v1',
        measurementValid: true,
      },
    };
    await saveResult({
      ...current,
      id: 'same-passage',
      wpm: 260,
      finishedAtIso: '2026-07-25T08:00:10.000Z',
    });
    await saveResult({
      ...current,
      id: 'different-passage',
      sampleId: 'sample-7',
      sampleTitle: 'A genuinely different passage',
      wpm: 220,
      details: {
        ...current.details,
        contentId: 'sample-7',
      },
      finishedAtIso: '2026-07-24T08:00:10.000Z',
    });

    const { getByTestId, getByText } = render(
      <ProgressChart gameId="sample-3" currentResult={current} />
    );

    await waitFor(() => {
      expect(getByText('2')).toBeTruthy();
      expect(getByText('Attempts')).toBeTruthy();
      expect(getByTestId('same-passage-practice')).toHaveTextContent(
        'Same-passage practice: 1 attempt kept separate from the baseline trend'
      );
    });
  });
});
