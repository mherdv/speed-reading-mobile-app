import type { AttemptResult, TextSample } from './types';
import {
  getNextSessionAction,
  selectFreshComparableSample,
} from './nextSession';

function result(
  overrides: Partial<AttemptResult> = {}
): AttemptResult {
  return {
    id: 'result-1',
    sampleId: 'sample-1',
    sampleTitle: 'Measured passage',
    startedAtIso: '2026-07-29T08:00:00.000Z',
    finishedAtIso: '2026-07-29T08:01:00.000Z',
    elapsedMs: 60_000,
    wordCount: 240,
    wpm: 240,
    comprehensionCorrect: false,
    details: {
      activityType: 'measured-reading',
      contentId: 'sample-1',
      comparisonBand: 'brief-v1',
      comprehensionCorrectCount: 2,
      comprehensionQuestionCount: 3,
    },
    ...overrides,
  };
}

describe('next-session coaching', () => {
  it('turns weak comprehension into a fresh-passage action with a lower pace', () => {
    expect(getNextSessionAction(result())).toEqual({
      kind: 'fresh-reading',
      title: 'Protect meaning next',
      body:
        'Try about 215 WPM on a different comparable passage. Increase pace only after comprehension returns to at least 80%.',
      label: 'Read a fresh passage',
      targetWpm: 215,
    });
  });

  it('turns a low-accuracy Manual result into a visible one-band reduction', () => {
    const action = getNextSessionAction(
      result({
        sampleId: 'TimedWordRecognition',
        wordCount: 0,
        wpm: 0,
        accuracy: 0.55,
        details: {
          difficulty: 'hard',
          difficultyMode: 'manual',
        },
      })
    );

    expect(action).toMatchObject({
      kind: 'replay',
      label: 'Try Medium',
      difficulty: 'medium',
      autoStart: false,
    });
  });

  it('does not reduce below Easy and opens setup for review', () => {
    const action = getNextSessionAction(
      result({
        sampleId: 'TimedWordRecognition',
        wordCount: 0,
        wpm: 0,
        accuracy: 0.45,
        details: {
          difficulty: 'easy',
          difficultyMode: 'manual',
        },
      })
    );

    expect(action).toMatchObject({
      kind: 'replay',
      label: 'Review Easy setup',
      difficulty: 'easy',
      autoStart: false,
    });
  });

  it('reviews the persisted Adaptive level after the result is applied', () => {
    const action = getNextSessionAction(
      result({
        sampleId: 'WordsRecall',
        wordCount: 0,
        wpm: 0,
        accuracy: 0.6,
        details: {
          difficulty: 'medium',
          difficultyMode: 'adaptive',
        },
      })
    );

    expect(action).toMatchObject({
      kind: 'replay',
      label: 'Review next level',
      autoStart: false,
    });
    expect(action.body).toContain('stayed, increased, or decreased');
  });

  it.each([0.6, 0.9])(
    'does not promise a stale Adaptive level at an %.0f%% threshold result',
    (accuracy) => {
      const action = getNextSessionAction(
        result({
          sampleId: 'WordsRecall',
          wordCount: 0,
          wpm: 0,
          accuracy,
          details: {
            difficulty: 'medium',
            difficultyMode: 'adaptive',
          },
        })
      );

      expect(action).toMatchObject({
        kind: 'replay',
        label: 'Review next level',
        autoStart: false,
      });
      expect(action.body).not.toMatch(/current challenge|one more signal/i);
    }
  );

  it('does not derive pace coaching from an invalid measured attempt', () => {
    const action = getNextSessionAction(
      result({
        elapsedMs: 3_000,
        wpm: 4_800,
        details: {
          activityType: 'measured-reading',
          measurementValid: false,
          contentId: 'sample-1',
          comparisonBand: 'brief-v1',
          comprehensionCorrectCount: 3,
          comprehensionQuestionCount: 3,
        },
      })
    );

    expect(action).toMatchObject({
      kind: 'fresh-reading',
      title: 'Retake a clean measurement',
      label: 'Retake measured reading',
    });
    if (action.kind !== 'fresh-reading') {
      throw new Error('Expected fresh-reading action');
    }
    expect(action.targetWpm).toBeUndefined();
    expect(action.body).not.toContain('4800');
  });

  it('routes configured pacing to a measured understanding check', () => {
    expect(
      getNextSessionAction(
        result({
          sampleId: 'PowerReader',
          wordCount: 200,
          wpm: 500,
          details: { activityType: 'paced-reading', targetWpm: 500 },
        })
      )
    ).toMatchObject({
      kind: 'measured-reading',
      label: 'Check with measured reading',
    });
  });

  it('finishes eye-comfort sessions without inventing an accuracy target', () => {
    const action = getNextSessionAction(
      result({
        sampleId: 'EyeMovementTraining',
        wordCount: 0,
        wpm: 0,
        accuracy: undefined,
        details: {
          activityType: 'eye-comfort',
          comfort: 'comfortable',
        },
      })
    );

    expect(action).toMatchObject({
      kind: 'finish',
      label: 'Done for now',
    });
    expect(action.body).not.toMatch(/accuracy/i);
  });
});

describe('fresh comparable passage selection', () => {
  const samples: TextSample[] = ['sample-1', 'sample-2', 'sample-3'].map(
    (id) => ({
      id,
      comparisonBand: 'brief-v1',
      title: id,
      text: 'A connected passage.',
      question: {
        prompt: 'Question?',
        choices: ['Yes', 'No'],
        correctIndex: 0,
      },
    })
  );
  samples.push({
    id: 'other-band',
    comparisonBand: 'long-v1',
    title: 'Other band',
    text: 'A longer connected passage.',
    question: {
      prompt: 'Question?',
      choices: ['Yes', 'No'],
      correctIndex: 0,
    },
  });

  it('never repeats the completed content or crosses its comparison band', () => {
    const selected = selectFreshComparableSample(
      result(),
      samples,
      [],
      () => 0
    );

    expect(selected?.id).toBe('sample-2');
    expect(selected?.comparisonBand).toBe('brief-v1');
  });

  it('prefers unseen content, then the least recently used passage', () => {
    const recent = [
      result({
        id: 'recent-2',
        sampleId: 'WpmTest',
        details: { contentId: 'sample-2', comparisonBand: 'brief-v1' },
      }),
    ];
    expect(
      selectFreshComparableSample(result(), samples, recent, () => 0)?.id
    ).toBe('sample-3');

    const allSeen = [
      ...recent,
      result({
        id: 'older-3',
        sampleId: 'WpmTest',
        details: { contentId: 'sample-3', comparisonBand: 'brief-v1' },
      }),
    ];
    expect(
      selectFreshComparableSample(result(), samples, allSeen, () => 0)?.id
    ).toBe('sample-3');
  });
});
