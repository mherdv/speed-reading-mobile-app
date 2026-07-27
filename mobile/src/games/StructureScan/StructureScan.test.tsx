import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import type { StructureScanRound } from '../../data/structureScanPassages';
import { STRUCTURE_SCAN_ROUNDS } from '../../data/structureScanPassages';
import StructureScan, { prepareStructureScanSections } from './StructureScan';

const ROUND: StructureScanRound = {
  id: 'test-round',
  title: 'A useful guide',
  goal: 'Find the application deadline.',
  sections: [
    { heading: 'Overview', body: 'The program supports local projects.' },
    { heading: 'Applications', body: 'Send the form by Friday.' },
    { heading: 'Results', body: 'Applicants hear back in June.' },
  ],
  correctHeading: 'Applications',
  evidence: 'The applications section contains the deadline.',
};

describe('StructureScan', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function loadProgress() {
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('always includes the answer at reduced difficulty and varies its position', () => {
    const answerFirst = prepareStructureScanSections(ROUND, 2, () => 0.999);
    const answerLast = prepareStructureScanSections(ROUND, 2, () => 0);

    expect(answerFirst).toHaveLength(2);
    expect(answerLast).toHaveLength(2);
    expect(answerFirst.map((section) => section.heading)).toContain(
      ROUND.correctHeading
    );
    expect(answerLast.map((section) => section.heading)).toContain(
      ROUND.correctHeading
    );
    expect(
      answerFirst.findIndex(
        (section) => section.heading === ROUND.correctHeading
      )
    ).not.toBe(
      answerLast.findIndex(
        (section) => section.heading === ROUND.correctHeading
      )
    );
  });

  it('has a replayable passage bank and can place answers in three positions', () => {
    const sequence = (...values: number[]) => {
      let index = 0;
      return () => values[index++] ?? values[values.length - 1] ?? 0;
    };
    const prepared = [
      prepareStructureScanSections(ROUND, 3, () => 0.999),
      prepareStructureScanSections(
        ROUND,
        3,
        sequence(0.999, 0.999, 0)
      ),
      prepareStructureScanSections(ROUND, 3, () => 0),
    ];
    const answerPositions = new Set(
      prepared.map((sections) =>
        sections.findIndex(
          (section) => section.heading === ROUND.correctHeading
        )
      )
    );

    expect(STRUCTURE_SCAN_ROUNDS.length).toBeGreaterThanOrEqual(15);
    expect(answerPositions).toEqual(new Set([0, 1, 2]));
    expect(
      prepared.every((sections) => sections[1]?.heading === ROUND.correctHeading)
    ).toBe(false);
  });

  it('hides the article before asking the user to choose a section', async () => {
    const { getByTestId, queryByTestId } = render(
      <StructureScan rounds={[ROUND]} roundCount={1} />
    );
    await loadProgress();

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('structure-scan-article')).toBeTruthy();
    fireEvent.press(getByTestId('show-structure-choices'));

    expect(queryByTestId('structure-scan-article')).toBeNull();
    expect(getByTestId('structure-scan-choices')).toBeTruthy();
  });

  it('moves a timed preview to the heading choices', async () => {
    const { getByTestId, queryByTestId } = render(
      <StructureScan
        rounds={[ROUND]}
        roundCount={1}
        previewLimitMs={1_000}
      />
    );
    await loadProgress();
    fireEvent.press(getByTestId('start-button'));

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(queryByTestId('structure-scan-article')).toBeNull();
    expect(getByTestId('structure-scan-choices')).toBeTruthy();
  });

  it('reports a completed result once and supports replay', async () => {
    const onReportResult = jest.fn();
    const { getByTestId, getByText } = render(
      <StructureScan
        rounds={[ROUND]}
        roundCount={1}
        random={() => 0.999}
        onReportResult={onReportResult}
      />
    );
    await loadProgress();
    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('show-structure-choices'));
    fireEvent.press(getByTestId('structure-choice-0'));
    expect(getByTestId('structure-scan-feedback')).toBeTruthy();
    expect(getByText('Applications')).toBeTruthy();
    fireEvent.press(getByTestId('continue-structure-scan'));

    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        accuracy: 1,
        details: expect.objectContaining({
          activityType: 'structure-scan',
          rounds: 1,
          correct: 1,
        }),
      })
    );

    fireEvent.press(getByTestId('play-again'));
    expect(getByTestId('structure-scan-article')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
  });

  it('clears a preview timer when unmounted', async () => {
    const onReportResult = jest.fn();
    const { getByTestId, unmount } = render(
      <StructureScan
        rounds={[ROUND]}
        previewLimitMs={1_000}
        onReportResult={onReportResult}
      />
    );
    await loadProgress();
    fireEvent.press(getByTestId('start-button'));
    unmount();

    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onReportResult).not.toHaveBeenCalled();
  });
});
