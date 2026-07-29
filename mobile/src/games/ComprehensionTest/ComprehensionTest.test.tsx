import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ComprehensionTest from './ComprehensionTest';
import {
  COMPREHENSION_PASSAGE_POOLS,
  validateComprehensionPassages,
} from '../../data/comprehensionPassages';

describe('ComprehensionTest', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<ComprehensionTest />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows passage after pressing start', () => {
    const { getByTestId } = render(
      <ComprehensionTest
        passage="Test passage content"
        questions={[{ question: 'Q1?', options: ['A', 'B'], correctIndex: 1 }]}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('passage')).toHaveTextContent('Test passage content');
    expect(getByTestId('paced-chunk-0')).toBeTruthy();
  });

  it('can pause and safely finish the configured pacing guide', () => {
    const view = render(
      <ComprehensionTest
        passage="One two three four five six."
        questions={[{ question: 'Q?', options: ['A'], correctIndex: 0 }]}
        targetWpm={300}
        chunkSize={2}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    fireEvent.press(view.getByTestId('toggle-pacing'));
    expect(view.getByText('Resume guide')).toBeTruthy();
    fireEvent.press(view.getByTestId('done-reading'));
    expect(view.getByTestId('question-text')).toBeTruthy();
  });

  it('provides at least three reviewed passages with 1, 2, and 3 questions', () => {
    expect(validateComprehensionPassages()).toEqual([]);
  });

  it('transitions to questions after done reading and allows answering', () => {
    const { getByTestId } = render(
      <ComprehensionTest
        passage="Test"
        questions={[{ question: 'What is the answer?', options: ['Wrong', 'Correct'], correctIndex: 1 }]}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('done-reading'));

    expect(getByTestId('question-text')).toHaveTextContent('What is the answer?');

    // Select correct answer
    fireEvent.press(getByTestId('option-1'));

    // Score should increase
    act(() => {
      jest.advanceTimersByTime(600);
    });
  });

  it('reports a normalized score and comprehension details when the game ends', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <ComprehensionTest
        passage="P"
        questions={[{ question: 'Q?', options: ['A'], correctIndex: 0 }]}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('done-reading'));
    fireEvent.press(getByTestId('option-0'));

    act(() => {
      jest.advanceTimersByTime(1100);  // Wait for the 1000ms delay before finish
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        accuracy: 1,
        details: expect.objectContaining({
          activityType: 'paced-comprehension',
          contentId: 'custom',
          pacedChallengeId: 'custom',
          questionsTotal: 1,
          correctCount: 1,
          targetWpm: 260,
          configuredPaceOnly: true,
          wordCount: 0,
          wpm: 0,
        }),
      })
    );
  });

  it('reports the underlying sample ID so the next baseline can exclude it', () => {
    const selected = COMPREHENSION_PASSAGE_POOLS.easy[0]!;
    const onReportResult = jest.fn();
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    const { getByTestId } = render(
      <ComprehensionTest
        difficulty="easy"
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('done-reading'));
    fireEvent.press(
      getByTestId(`option-${selected.questions[0]!.correctIndex}`)
    );
    act(() => {
      jest.advanceTimersByTime(1_100);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          activityType: 'paced-comprehension',
          contentId: selected.sampleId,
          pacedChallengeId: selected.id,
        }),
      })
    );
    random.mockRestore();
  });
});
