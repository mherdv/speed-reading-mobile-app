import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getContextBuilderRounds } from '../../data/contextBuilderContent';
import ContextBuilder from './ContextBuilder';

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Context Builder', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T08:00:00.000Z'));
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('records meaning, clue, confidence, and omissions separately', async () => {
    const rounds = getContextBuilderRounds('easy').slice(0, 4);
    const report = jest.fn();
    const view = render(
      <ContextBuilder
        rounds={rounds}
        roundCount={2}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    fireEvent.press(view.getByTestId('start-button'));

    expect(view.getByText(rounds[0]!.title)).toBeTruthy();
    fireEvent.press(view.getByTestId('context-meaning-1'));
    fireEvent.press(view.getByTestId('context-clue-1'));
    fireEvent.press(view.getByTestId('context-confidence-confident'));
    fireEvent.press(view.getByTestId('submit-context-round'));
    fireEvent.press(view.getByTestId('continue-context'));
    fireEvent.press(view.getByTestId('skip-context-round'));
    fireEvent.press(view.getByTestId('continue-context'));
    await settle();

    expect(view.getByTestId('end')).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        activityType: 'context-builder',
        attempts: 1,
        omittedRounds: 1,
        meaningAccuracy: 0,
        clueAccuracy: 1,
        confidenceRatings: 1,
        confidentCorrect: 0,
        adaptiveQualificationEligible: false,
      })
    );

    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByText(rounds[2]!.title)).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('keeps attempted accuracy truthful but does not qualify one answer plus four skips', async () => {
    const report = jest.fn();
    const view = render(
      <ContextBuilder
        rounds={getContextBuilderRounds('easy').slice(0, 5)}
        roundCount={5}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    fireEvent.press(view.getByTestId('start-button'));
    fireEvent.press(view.getByTestId('context-meaning-0'));
    fireEvent.press(view.getByTestId('context-clue-1'));
    fireEvent.press(view.getByTestId('submit-context-round'));
    fireEvent.press(view.getByTestId('continue-context'));
    for (let index = 0; index < 4; index += 1) {
      fireEvent.press(view.getByTestId('skip-context-round'));
      fireEvent.press(view.getByTestId('continue-context'));
    }
    await settle();

    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        attempts: 1,
        omittedRounds: 4,
        meaningAccuracy: 1,
        clueAccuracy: 1,
        adaptiveQualificationEligible: false,
      })
    );
  });

  it('does not report when an active untimed round unmounts', async () => {
    const report = jest.fn();
    const view = render(
      <ContextBuilder
        rounds={getContextBuilderRounds('hard').slice(0, 1)}
        roundCount={1}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    fireEvent.press(view.getByTestId('start-button'));
    view.unmount();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(report).not.toHaveBeenCalled();
  });

  it('keeps an immediate duplicate in results but excludes adaptive qualification', async () => {
    const report = jest.fn();
    const view = render(
      <ContextBuilder
        rounds={getContextBuilderRounds('easy').slice(0, 1)}
        roundCount={1}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    const completeRound = () => {
      fireEvent.press(view.getByTestId('context-meaning-0'));
      fireEvent.press(view.getByTestId('context-clue-1'));
      fireEvent.press(view.getByTestId('submit-context-round'));
      fireEvent.press(view.getByTestId('continue-context'));
    };

    fireEvent.press(view.getByTestId('start-button'));
    completeRound();
    await settle();
    fireEvent.press(view.getByTestId('play-again'));
    completeRound();
    await settle();

    expect(report).toHaveBeenCalledTimes(2);
    expect(report.mock.calls[1]?.[0].details).toEqual(
      expect.objectContaining({
        immediateReplayDuplicate: true,
        meaningAccuracy: 1,
        clueAccuracy: 1,
        adaptiveQualificationEligible: false,
      })
    );
  });

  it('qualifies a complete five-round nonduplicate session at both component thresholds', async () => {
    const report = jest.fn();
    const view = render(
      <ContextBuilder
        rounds={getContextBuilderRounds('easy').slice(0, 5)}
        roundCount={5}
        random={() => 0.999}
        onReportResult={report}
      />
    );
    await settle();
    fireEvent.press(view.getByTestId('start-button'));
    for (let index = 0; index < 5; index += 1) {
      fireEvent.press(view.getByTestId(`context-meaning-${index % 4}`));
      fireEvent.press(view.getByTestId(`context-clue-${(index + 1) % 4}`));
      fireEvent.press(view.getByTestId('submit-context-round'));
      fireEvent.press(view.getByTestId('continue-context'));
    }
    await settle();
    expect(report.mock.calls[0]?.[0].details).toEqual(
      expect.objectContaining({
        attempts: 5,
        omittedRounds: 0,
        meaningAccuracy: 1,
        clueAccuracy: 1,
        adaptiveQualificationEligible: true,
      })
    );
  });
});
