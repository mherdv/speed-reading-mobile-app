import React from 'react';
import { render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AttemptResult } from '../domain/types';
import { TEXT_SAMPLES } from '../data/textSamples';
import { ResultScreen } from './ResultScreen';

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
