import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AttemptResult } from '../domain/types';
import { TEXT_SAMPLES } from '../data/textSamples';
import type { TodayPlanLaunchContext } from '../data/todayPlanStore';
import { ResultScreen } from './ResultScreen';

jest.mock('../ui/ProgressChart', () => ({
  ProgressChart: () => null,
}));

function result(overrides: Partial<AttemptResult>): AttemptResult {
  return {
    id: 'result-1',
    sampleId: 'sample-1',
    sampleTitle: 'Measured passage',
    startedAtIso: '2026-07-26T08:00:00.000Z',
    finishedAtIso: '2026-07-26T08:01:00.000Z',
    elapsedMs: 60_000,
    wordCount: 240,
    wpm: 240,
    comprehensionCorrect: false,
    details: {
      activityType: 'measured-reading',
      measurementValid: true,
      contentId: 'sample-1',
      comparisonBand: 'general-practice-brief-v1',
      comprehensionCorrectCount: 2,
      comprehensionQuestionCount: 3,
    },
    ...overrides,
  };
}

const actions = {
  onDone: jest.fn(),
  onOpenHistory: jest.fn(),
  onPlayAgain: jest.fn(),
};

describe('ResultScreen truthful metric cards', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('shows measured reading rate and comprehension as separate labeled values', () => {
    const view = render(<ResultScreen result={result({})} {...actions} />);
    expect(view.getByTestId('result-metric-cards')).toBeTruthy();
    expect(view.getByText('Personal practice WPM')).toBeTruthy();
    expect(view.getByText('240')).toBeTruthy();
    expect(view.getByText('2/3')).toBeTruthy();
    expect(view.getByText('Comprehension')).toBeTruthy();
  });

  it('labels only active-clock guided results as active guide time', () => {
    const comprehensionView = render(
      <ResultScreen
        {...actions}
        result={result({
          sampleId: 'ComprehensionTest',
          wordCount: 0,
          wpm: 0,
          score: 100,
          accuracy: 1,
          details: {
            activityType: 'paced-comprehension',
            targetWpm: 250,
          },
        })}
      />
    );
    expect(comprehensionView.getByText('Session time')).toBeTruthy();
    expect(comprehensionView.queryByText('Active guide time')).toBeNull();
    comprehensionView.unmount();

    const activeView = render(
      <ResultScreen
        {...actions}
        result={result({
          sampleId: 'CenterLineReader',
          wordCount: 0,
          wpm: 0,
          score: 100,
          accuracy: 1,
          details: {
            activityType: 'focus-lane-guided-reading',
            targetWpm: 250,
            timingMethod: 'monotonic-active-elapsed',
          },
        })}
      />
    );
    expect(activeView.getByText('Active guide time')).toBeTruthy();
  });

  it('shows Evidence Hunt metrics without turning them into one index', () => {
    const view = render(
      <ResultScreen
        {...actions}
        result={result({
          sampleId: 'EvidenceHunt',
          sampleTitle: 'Evidence Hunt',
          wordCount: 0,
          wpm: 0,
          score: 63,
          accuracy: 0.75,
          details: {
            schemaVersion: 1,
            activityType: 'evidence-hunt',
            rounds: 4,
            answerCorrect: 3,
            evidenceCorrect: 2,
            evidenceRequired: 4,
            wrongSelections: 2,
            medianLocateMs: 12_000,
          },
        })}
      />
    );
    expect(view.getByText('3/4')).toBeTruthy();
    expect(view.getByText('Answers correct')).toBeTruthy();
    expect(view.getByText('2/4')).toBeTruthy();
    expect(view.getByText('Evidence credit')).toBeTruthy();
    expect(view.getByText('Median locate time')).toBeTruthy();
  });

  it('shows a next-session action and question-level correction', () => {
    const sample = TEXT_SAMPLES.find(
      (candidate) => candidate.questions?.length === 3
    )!;
    const question = sample.questions![0]!;
    const wrongIndex = question.correctIndex === 0 ? 1 : 0;
    const view = render(
      <ResultScreen
        {...actions}
        result={result({
          sampleId: sample.id,
          sampleTitle: sample.title,
          details: {
            activityType: 'measured-reading',
            measurementValid: true,
            contentId: sample.id,
            contentVersion: sample.version ?? 1,
            comparisonBand: sample.comparisonBand,
            comprehensionCorrectCount: 0,
            comprehensionQuestionCount: 1,
            questionOutcomes: [
              {
                questionId: question.id,
                type: question.type,
                selectedIndex: wrongIndex,
                selectedAnswer: question.choices[wrongIndex],
                correct: false,
              },
            ],
          },
        })}
      />
    );

    expect(view.getByTestId('next-session-coaching')).toBeTruthy();
    expect(view.getByTestId('comprehension-review')).toBeTruthy();
    expect(view.getByText(`Your answer: ${question.choices[wrongIndex]}`)).toBeTruthy();
    expect(
      view.getByText(
        `Correct answer: ${question.choices[question.correctIndex]}`
      )
    ).toBeTruthy();
  });

  it('makes the fresh-passage recommendation primary and preserves exact replay', async () => {
    const onNextSession = jest.fn();
    const onPlayAgain = jest.fn();
    const view = render(
      <ResultScreen
        result={result({})}
        {...actions}
        onNextSession={onNextSession}
        onPlayAgain={onPlayAgain}
      />
    );

    await act(async () => {
      fireEvent.press(view.getByTestId('recommended-next-action'));
      await Promise.resolve();
    });
    expect(onNextSession).toHaveBeenCalledTimes(1);
    expect(view.getByText('Read a fresh passage')).toBeTruthy();

    await act(async () => {
      fireEvent.press(view.getByTestId('repeat-same-setup'));
      await Promise.resolve();
    });
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it('blocks duplicate next-session taps while navigation is pending', async () => {
    let releaseNavigation!: () => void;
    const onNextSession = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseNavigation = resolve;
        })
    );
    const view = render(
      <ResultScreen
        result={result({})}
        {...actions}
        onNextSession={onNextSession}
      />
    );

    fireEvent.press(view.getByTestId('recommended-next-action'));
    fireEvent.press(view.getByTestId('recommended-next-action'));

    expect(onNextSession).toHaveBeenCalledTimes(1);
    expect(view.getByTestId('recommended-next-action')).toHaveAccessibilityState({
      busy: true,
      disabled: true,
    });
    expect(view.getByTestId('next-action-spinner')).toBeTruthy();
    expect(view.getByLabelText('Go back')).toHaveAccessibilityState({
      busy: true,
      disabled: true,
    });
    expect(view.getByLabelText('View full history')).toHaveAccessibilityState({
      disabled: true,
    });
    fireEvent.press(view.getByLabelText('Go back'));
    fireEvent.press(view.getByLabelText('View full history'));
    expect(actions.onDone).not.toHaveBeenCalled();
    expect(actions.onOpenHistory).not.toHaveBeenCalled();

    await act(async () => {
      releaseNavigation();
      await Promise.resolve();
    });
    expect(view.getByTestId('recommended-next-action')).toHaveAccessibilityState({
      busy: false,
      disabled: false,
    });
  });

  it('makes continuing the assigned Today plan the primary action', async () => {
    const onNextSession = jest.fn();
    const todayPlanContext: TodayPlanLaunchContext = {
      itemId: 'reading',
      snapshot: {
        schemaVersion: 2,
        localDate: '2026-6-29',
        createdAtIso: '2026-07-29T08:00:00.000Z',
        reading: {
          sampleId: 'sample-1',
          assignedAtIso: '2026-07-29T08:00:00.000Z',
          swapOffset: 0,
        },
        skill: {
          gameId: 'ContextBuilder',
          assignedAtIso: '2026-07-29T08:00:00.000Z',
          swapOffset: 0,
        },
        skipped: [],
      },
    };
    const view = render(
      <ResultScreen
        result={result({})}
        {...actions}
        todayPlanContext={todayPlanContext}
        onNextSession={onNextSession}
      />
    );

    expect(view.getAllByText('Continue today’s plan')).toHaveLength(2);
    await act(async () => {
      fireEvent.press(view.getByTestId('recommended-next-action'));
      await Promise.resolve();
    });
    expect(onNextSession).toHaveBeenCalledTimes(1);
  });

  it('uses activity-aware eye-comfort coaching without a duplicate home action', () => {
    const view = render(
      <ResultScreen
        {...actions}
        result={result({
          sampleId: 'EyeMovementTraining',
          sampleTitle: 'Eye Reset',
          wordCount: 0,
          wpm: 0,
          accuracy: undefined,
          details: {
            activityType: 'eye-comfort',
            breakSeconds: 60,
            comfort: 'comfortable',
          },
        })}
      />
    );

    expect(view.getByText('Done for now')).toBeTruthy();
    expect(view.queryByText('Back to home')).toBeNull();
    expect(view.queryByTestId('repeat-same-setup')).toBeNull();
    expect(view.queryByText(/85% accuracy/)).toBeNull();
  });

  it('keeps the safety exit primary for a Today-plan Eye Reset', () => {
    const todayPlanContext: TodayPlanLaunchContext = {
      itemId: 'comfort',
      snapshot: {
        schemaVersion: 2,
        localDate: '2026-6-29',
        createdAtIso: '2026-07-29T08:00:00.000Z',
        reading: {
          sampleId: 'sample-1',
          assignedAtIso: '2026-07-29T08:00:00.000Z',
          swapOffset: 0,
        },
        skill: {
          gameId: 'ContextBuilder',
          assignedAtIso: '2026-07-29T08:00:00.000Z',
          swapOffset: 0,
        },
        comfort: {
          gameId: 'EyeMovementTraining',
          assignedAtIso: '2026-07-29T08:00:00.000Z',
        },
        skipped: [],
      },
    };
    const view = render(
      <ResultScreen
        {...actions}
        todayPlanContext={todayPlanContext}
        result={result({
          sampleId: 'EyeMovementTraining',
          sampleTitle: 'Eye Reset',
          wordCount: 0,
          wpm: 0,
          details: {
            activityType: 'eye-comfort',
            comfort: 'uncomfortable',
          },
        })}
      />
    );

    expect(view.getByText('Done for now')).toBeTruthy();
    expect(view.queryByText('Continue today’s plan')).toBeNull();
    expect(view.queryByTestId('repeat-same-setup')).toBeNull();
  });

  it('keeps an invalid Today reading on neutral clean-retake coaching', () => {
    const todayPlanContext: TodayPlanLaunchContext = {
      itemId: 'reading',
      snapshot: {
        schemaVersion: 2,
        localDate: '2026-6-29',
        createdAtIso: '2026-07-29T08:00:00.000Z',
        reading: {
          sampleId: 'sample-1',
          assignedAtIso: '2026-07-29T08:00:00.000Z',
          swapOffset: 0,
        },
        skill: {
          gameId: 'ContextBuilder',
          assignedAtIso: '2026-07-29T08:00:00.000Z',
          swapOffset: 0,
        },
        skipped: [],
      },
    };
    const view = render(
      <ResultScreen
        {...actions}
        todayPlanContext={todayPlanContext}
        result={result({
          elapsedMs: 1,
          wpm: 4_800,
          comprehensionCorrect: true,
          details: {
            activityType: 'measured-reading',
            measurementValid: false,
            contentId: 'sample-1',
            comparisonBand: 'general-practice-brief-v1',
            comprehensionCorrectCount: 3,
            comprehensionQuestionCount: 3,
          },
        })}
      />
    );

    expect(view.getByText('Clean retake needed')).toBeTruthy();
    expect(view.getByText('Retake measured reading')).toBeTruthy();
    expect(view.queryByText('Continue today’s plan')).toBeNull();
    expect(view.queryByText('Strong pace, meaning intact')).toBeNull();
  });

  it('keeps adaptive exact replay distinct from reviewing the updated level', () => {
    const view = render(
      <ResultScreen
        {...actions}
        result={result({
          sampleId: 'WordsRecall',
          sampleTitle: 'Words Recall',
          wordCount: 0,
          wpm: 0,
          accuracy: 0.9,
          details: {
            difficulty: 'medium',
            difficultyMode: 'adaptive',
          },
        })}
      />
    );

    expect(view.getByText('Review next level')).toBeTruthy();
    expect(view.getByText('Repeat completed level once')).toBeTruthy();
  });

  it('keeps fresh-passage coaching consistent in the hero', () => {
    const view = render(<ResultScreen result={result({})} {...actions} />);

    expect(
      view.getByText(
        'Read the next passage a little slower and focus on its main claim.'
      )
    ).toBeTruthy();
    expect(view.queryByText(/Repeat the passage a little slower/)).toBeNull();
  });

  it('shows the exact Schulte grid variation used', () => {
    const view = render(
      <ResultScreen
        {...actions}
        result={result({
          sampleId: 'SchulteNumbers',
          sampleTitle: 'Schulte Numbers',
          wordCount: 0,
          wpm: 0,
          score: 42,
          accuracy: 1,
          details: {
            difficulty: 'easy',
            gridMode: 'reshuffle',
            itemsPerMinute: 42,
            mistakes: 1,
          },
        })}
      />
    );

    expect(view.getByTestId('schulte-grid-mode')).toHaveTextContent(
      'Shuffle after each tap'
    );
    expect(view.getByText('Items/min')).toBeTruthy();
    expect(view.getByText('Mistake')).toBeTruthy();
  });
});
