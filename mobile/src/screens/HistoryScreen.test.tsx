import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AttemptResult } from '../domain/types';
import { saveResult } from '../data/resultsStore';
import {
  calculateAverageValidMeasuredSpeed,
  HistoryScreen,
} from './HistoryScreen';

function reading(
  id: string,
  wpm: number,
  measurementValid: boolean
): AttemptResult {
  return {
    id,
    sampleId: `sample-${id}`,
    sampleTitle: `Reading ${id}`,
    startedAtIso: '2026-07-26T08:00:00.000Z',
    finishedAtIso: '2026-07-26T08:01:00.000Z',
    elapsedMs: measurementValid ? 60_000 : 1,
    wordCount: 200,
    wpm,
    comprehensionCorrect: true,
    details: {
      activityType: 'measured-reading',
      measurementValid,
      qualityFlag: measurementValid ? undefined : 'too-short',
    },
  };
}

describe('HistoryScreen reading quality', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('averages only valid measured-reading attempts', () => {
    expect(
      calculateAverageValidMeasuredSpeed([
        reading('valid', 240, true),
        reading('invalid', 12_000, false),
      ])
    ).toBe('240 wpm');
  });

  it('labels invalid raw sessions as excluded from progress', async () => {
    await saveResult(reading('valid', 240, true));
    await saveResult(reading('invalid', 12_000, false));
    const { getByTestId, getByText } = render(
      <HistoryScreen
        refreshToken={0}
        onBack={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText('Not enough readings')).toBeTruthy();
    });
    fireEvent.press(getByText('Sessions'));
    expect(getByTestId('history-quality-invalid')).toHaveTextContent(
      'Not used for progress'
    );
  });

  it('shows an optimistic just-finished result before storage catches up', async () => {
    const optimistic = reading('optimistic', 275, true);
    const { getByText } = render(
      <HistoryScreen
        refreshToken={0}
        optimisticResult={optimistic}
        onBack={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText('Not enough readings')).toBeTruthy();
    });
    fireEvent.press(getByText('Sessions'));
    expect(getByText('Reading optimistic')).toBeTruthy();
  });

  it('defaults to Reading and keeps Practice and Labs explicitly separate', async () => {
    await saveResult(reading('reading', 230, true));
    await saveResult({
      ...reading('practice', 0, true),
      sampleId: 'EvidenceHunt',
      sampleTitle: 'Evidence Hunt',
      wordCount: 0,
      wpm: 0,
      score: 75,
      accuracy: 0.75,
      details: {
        schemaVersion: 1,
        activityType: 'evidence-hunt',
        answerCorrect: 3,
        rounds: 4,
        evidenceCorrect: 3,
        evidenceRequired: 4,
      },
    });
    await saveResult({
      ...reading('lab', 0, true),
      sampleId: 'NumberSearch',
      sampleTitle: 'Number Search',
      wordCount: 0,
      wpm: 0,
      score: 8,
      accuracy: 0.8,
      details: { activityType: 'number-search' },
    });

    const view = render(
      <HistoryScreen refreshToken={0} onBack={jest.fn()} />
    );
    await waitFor(() => {
      expect(view.getByText('Not enough readings')).toBeTruthy();
    });
    fireEvent.press(view.getByText('Sessions'));
    expect(view.getByText('Reading reading')).toBeTruthy();
    expect(view.queryByText('Evidence Hunt')).toBeNull();

    fireEvent.press(view.getByTestId('history-filter-practice'));
    expect(view.getByText('Evidence Hunt')).toBeTruthy();
    expect(view.queryByText('Number Search')).toBeNull();

    fireEvent.press(view.getByTestId('history-filter-labs'));
    expect(view.getByText('Number Search')).toBeTruthy();
    expect(view.queryByText('Evidence Hunt')).toBeNull();
  });
});
