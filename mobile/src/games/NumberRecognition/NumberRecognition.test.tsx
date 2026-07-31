import React from 'react';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import * as progressStore from '../../data/progressStore';
import NumberRecognition, {
  generateNumberRecognitionStream,
  getNumberRecognitionChallenge,
  getNumberRecognitionStageChallenge,
} from './NumberRecognition';

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 48271) % 0x7fffffff;
    return value / 0x7fffffff;
  };
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

describe('NumberRecognition (TDD from spec)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('AC-2: preserves and evaluates a custom stream in its exact order', () => {
    const { getByTestId, queryByTestId } = render(
      <NumberRecognition target={37} stream={[37, 73]} durationMs={500} />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('current-number')).toHaveTextContent('37');
    expect(queryByTestId('current-number-mask')).toBeNull();
    expect(getByTestId('current-number')).toHaveProp('numberOfLines', 1);

    fireEvent.press(getByTestId('match'));
    expect(getByTestId('score')).toHaveTextContent('Score: 10');

    expect(getByTestId('current-number')).toHaveTextContent('73');
    fireEvent.press(getByTestId('no'));
    expect(getByTestId('score')).toHaveTextContent('Score: 20');
  });

  it.each(DIFFICULTIES)(
    'generates a deterministic balanced %s stream with only real distractors',
    (difficulty) => {
      const challenge = getNumberRecognitionChallenge(difficulty);
      const target = challenge.defaultTarget;
      const first = generateNumberRecognitionStream(
        target,
        challenge,
        seededRandom(17)
      );
      const repeated = generateNumberRecognitionStream(
        target,
        challenge,
        seededRandom(17)
      );
      const differentShuffle = generateNumberRecognitionStream(
        target,
        challenge,
        seededRandom(29)
      );
      const targetPositions = first.flatMap((value, index) =>
        value === target ? [index] : []
      );
      const differentTargetPositions = differentShuffle.flatMap(
        (value, index) => (value === target ? [index] : [])
      );
      const nonTargets = first.filter((value) => value !== target);
      const alwaysNoAccuracy = nonTargets.length / first.length;

      expect(first).toEqual(repeated);
      expect(first).toHaveLength(challenge.stimulusCount);
      expect(targetPositions).toHaveLength(challenge.stimulusCount / 2);
      expect(nonTargets).toHaveLength(challenge.stimulusCount / 2);
      expect(nonTargets.every((value) => value !== target)).toBe(true);
      expect(targetPositions).not.toEqual(differentTargetPositions);
      expect(first).not.toEqual(differentShuffle);
      expect(alwaysNoAccuracy).toBe(0.5);
      expect(alwaysNoAccuracy).toBeLessThan(0.7);
      first.forEach((_value, index) => {
        const prefix = first.slice(0, index + 1);
        const targetCount = prefix.filter((value) => value === target).length;
        const nonTargetCount = prefix.length - targetCount;
        expect(Math.abs(targetCount - nonTargetCount)).toBeLessThanOrEqual(1);
        if (prefix.length % 2 === 0) {
          expect(targetCount).toBe(nonTargetCount);
        }
      });
    }
  );

  it('keeps level-one defaults, then grows similarity and digit length by stage', () => {
    DIFFICULTIES.forEach((difficulty) => {
      expect(
        getNumberRecognitionStageChallenge(difficulty, 1)
      ).toEqual(getNumberRecognitionChallenge(difficulty));
    });

    expect(
      getNumberRecognitionStageChallenge('easy', 4)
    ).toMatchObject({
      digitCount: 1,
      distractorSimilarity: 'medium',
    });
    expect(
      getNumberRecognitionStageChallenge('easy', 5)
    ).toMatchObject({
      digitCount: 2,
      distractorSimilarity: 'medium',
    });
    expect(
      getNumberRecognitionStageChallenge('easy', 7)
    ).toMatchObject({
      digitCount: 2,
      distractorSimilarity: 'high',
    });
    expect(
      getNumberRecognitionStageChallenge('hard', 15)
    ).toMatchObject({
      digitCount: 6,
      distractorSimilarity: 'high',
    });
  });

  it('regenerates an unoverridden session with longer numbers after stage growth', async () => {
    const { getByTestId } = render(
      <NumberRecognition
        difficulty="easy"
        durationMs={60_000}
      />
    );

    await waitFor(() => {
      expect(
        getByTestId('start-button').props.accessibilityState.disabled
      ).toBe(false);
    });
    fireEvent.press(getByTestId('start-button'));
    for (let trial = 0; trial < 32; trial += 1) {
      const target = String(
        getByTestId('recognition-target').props.children
      );
      const current = String(
        getByTestId('current-number').props.children
      );
      fireEvent.press(
        getByTestId(current === target ? 'match' : 'no')
      );
    }

    expect(getByTestId('flash-challenge-status')).toHaveTextContent(
      /Stage 5\/15/
    );
    expect(
      String(getByTestId('recognition-target').props.children)
    ).toHaveLength(2);
    expect(
      String(getByTestId('current-number').props.children)
    ).toHaveLength(2);
  });

  it('keeps explicit target and stream unchanged across a flash stage boundary', () => {
    const { getByTestId } = render(
      <NumberRecognition
        target={37}
        stream={[37, 73]}
        durationMs={60_000}
        difficulty="medium"
      />
    );

    fireEvent.press(getByTestId('start-button'));
    for (let trial = 0; trial < 24; trial += 1) {
      const current = String(
        getByTestId('current-number').props.children
      );
      fireEvent.press(
        getByTestId(current === '37' ? 'match' : 'no')
      );
    }

    expect(getByTestId('flash-challenge-status')).toHaveTextContent(
      /Stage 4\/15/
    );
    expect(getByTestId('recognition-target')).toHaveTextContent('37');
    expect(['37', '73']).toContain(
      String(getByTestId('current-number').props.children)
    );
  });

  it('keeps the timed playable prefix balanced so always-No cannot pass', async () => {
    const challenge = getNumberRecognitionChallenge('medium');
    const onReportResult = jest.fn();
    const updateProgress = jest.spyOn(progressStore, 'updateProgress');
    const { getByTestId } = render(
      <NumberRecognition
        difficulty="medium"
        durationMs={5_000}
        onReportResult={onReportResult}
      />
    );

    await waitFor(() => {
      expect(
        getByTestId('start-button').props.accessibilityState.disabled
      ).toBe(false);
    });
    fireEvent.press(getByTestId('start-button'));
    for (let trial = 0; trial < 6; trial += 1) {
      fireEvent.press(getByTestId('no'));
      if (trial < 5) {
        act(() => {
          jest.advanceTimersByTime(900);
        });
      }
    }
    act(() => {
      jest.advanceTimersByTime(500);
    });

    const reported = onReportResult.mock.calls[0]![0];
    expect(reported.accuracy).toBeLessThanOrEqual(0.5);
    expect(reported.details).toMatchObject({ attempts: 6 });
    expect(
      reported.details.targetTrials + reported.details.nonTargetTrials
    ).toBe(6);
    expect(reported.details.targetTrials).toBeGreaterThanOrEqual(
      reported.details.nonTargetTrials
    );
    expect(updateProgress).toHaveBeenCalledWith(
      'NumberRecognition',
      false,
      reported.score
    );
    updateProgress.mockRestore();
  });

  it('records an always-No generated session as 50% and does not advance progress', () => {
    const challenge = getNumberRecognitionChallenge('hard');
    const generated = generateNumberRecognitionStream(
      challenge.defaultTarget,
      challenge,
      seededRandom(41)
    );
    const onReportResult = jest.fn();
    const updateProgress = jest.spyOn(progressStore, 'updateProgress');
    const { getByTestId } = render(
      <NumberRecognition
        difficulty="hard"
        stream={generated}
        durationMs={100}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    generated.forEach(() => fireEvent.press(getByTestId('no')));
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 0.5,
        details: expect.objectContaining({
          targetTrials: challenge.stimulusCount / 2,
          nonTargetTrials: challenge.stimulusCount / 2,
          calibrationEligible: true,
        }),
      })
    );
    expect(updateProgress).toHaveBeenCalledWith(
      'NumberRecognition',
      false,
      challenge.stimulusCount * 5
    );
    updateProgress.mockRestore();
  });

  it('does not calibrate from a one-sided custom trial stream', () => {
    const onReportResult = jest.fn();
    const updateProgress = jest.spyOn(progressStore, 'updateProgress');
    const { getByTestId } = render(
      <NumberRecognition
        target={37}
        stream={[37, 37, 37, 37]}
        durationMs={100}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    for (let trial = 0; trial < 4; trial += 1) {
      fireEvent.press(getByTestId('match'));
    }
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        accuracy: 1,
        details: expect.objectContaining({
          calibrationEligible: false,
          targetTrials: 4,
          nonTargetTrials: 0,
        }),
      })
    );
    expect(updateProgress).not.toHaveBeenCalled();
    updateProgress.mockRestore();
  });

  it('ends on timer', () => {
    const { getByTestId } = render(
      <NumberRecognition target={1} stream={[1]} durationMs={100} />
    );

    fireEvent.press(getByTestId('start-button'));
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(getByTestId('end')).toBeTruthy();
  });
});
