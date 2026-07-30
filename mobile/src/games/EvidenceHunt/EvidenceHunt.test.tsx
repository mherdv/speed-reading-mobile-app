import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getEvidenceHuntRounds } from '../../data/evidenceHuntContent';
import EvidenceHunt from './EvidenceHunt';

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Evidence Hunt', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T08:00:00.000Z'));
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps answer and penalized evidence metrics separate and replays fresh', async () => {
    const rounds = getEvidenceHuntRounds('easy').slice(0, 3);
    const report = jest.fn();
    const view = render(
      <EvidenceHunt
        rounds={rounds}
        roundCount={1}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByText(rounds[0]!.title)).toBeTruthy();

    fireEvent.press(
      view.getByTestId(`evidence-sentence-${rounds[0]!.sentences[0]!.id}`)
    );
    fireEvent.press(
      view.getByTestId(`evidence-sentence-${rounds[0]!.sentences[0]!.id}`)
    );
    fireEvent.press(
      view.getByTestId(
        `evidence-sentence-${rounds[0]!.evidenceSentenceIds[0]}`
      )
    );
    fireEvent.press(view.getByTestId('evidence-option-0'));
    fireEvent.press(view.getByTestId('submit-evidence-round'));
    fireEvent.press(view.getByTestId('continue-evidence'));
    await settle();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        activityType: 'evidence-hunt',
        answerAccuracy: 1,
        evidenceAccuracy: 0,
        wrongSelections: 1,
      })
    );

    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByText(rounds[1]!.title)).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('starts from the persisted fresh-content window after remount', async () => {
    const rounds = getEvidenceHuntRounds('easy').slice(0, 6);
    await AsyncStorage.setItem(
      'speed-reading:progress:v1',
      JSON.stringify({
        EvidenceHunt: { level: 1, streak: 0, totalPlays: 1 },
      })
    );
    const view = render(
      <EvidenceHunt
        rounds={rounds}
        roundCount={2}
        random={() => 0.999}
      />
    );
    await settle();

    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByText(rounds[2]!.title)).toBeTruthy();
  });

  it('supports an optional timer without reporting after active unmount', async () => {
    const report = jest.fn();
    const view = render(
      <EvidenceHunt
        rounds={getEvidenceHuntRounds('medium').slice(0, 1)}
        roundCount={1}
        initialTimed
        roundDurationMs={100}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    fireEvent.press(view.getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(view.getByTestId('evidence-feedback')).toBeTruthy();
    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(report).not.toHaveBeenCalled();
  });

  it('captures evidence completion at five seconds instead of answer submission at fifteen', async () => {
    const round = getEvidenceHuntRounds('easy')[0]!;
    const report = jest.fn();
    const view = render(
      <EvidenceHunt
        rounds={[round]}
        roundCount={1}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(5_000);
    });
    fireEvent.press(
      view.getByTestId(`evidence-sentence-${round.evidenceSentenceIds[0]}`)
    );
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    fireEvent.press(view.getByTestId('evidence-option-0'));
    fireEvent.press(view.getByTestId('submit-evidence-round'));
    fireEvent.press(view.getByTestId('continue-evidence'));
    await settle();

    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        medianLocateMs: 5_000,
        locatedRounds: 1,
      })
    );
  });

  it('omits expired unanswered rounds from locate timing', async () => {
    const report = jest.fn();
    const view = render(
      <EvidenceHunt
        rounds={getEvidenceHuntRounds('medium').slice(0, 1)}
        roundCount={1}
        initialTimed
        roundDurationMs={100}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    fireEvent.press(view.getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    fireEvent.press(view.getByTestId('continue-evidence'));
    await settle();
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        medianLocateMs: 0,
        locatedRounds: 0,
      })
    );
  });
});
