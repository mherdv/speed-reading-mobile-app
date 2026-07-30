import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ComprehensionTest, {
  buildComprehensionDeck,
  prepareComprehensionPassage,
} from './ComprehensionTest';
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

  it('builds a complete unique content cycle and protects its boundary', () => {
    const pool = COMPREHENSION_PASSAGE_POOLS.easy;
    const firstDeck = buildComprehensionDeck(pool, '', () => 0);
    const boundaryId = firstDeck[0]!.id;
    const protectedDeck = buildComprehensionDeck(
      pool,
      boundaryId,
      () => 0
    );

    expect(firstDeck).toHaveLength(pool.length);
    expect(new Set(firstDeck.map((item) => item.id))).toEqual(
      new Set(pool.map((item) => item.id))
    );
    expect(protectedDeck[0]!.id).not.toBe(boundaryId);
    expect(new Set(protectedDeck.map((item) => item.id))).toEqual(
      new Set(pool.map((item) => item.id))
    );
  });

  it('shuffles every answer set while keeping the keyed answer intact', () => {
    const source = COMPREHENSION_PASSAGE_POOLS.hard[0]!;
    const prepared = prepareComprehensionPassage(source, () => 0);

    for (const [index, question] of prepared.questions.entries()) {
      const original = source.questions[index]!;
      expect(question.options[question.correctIndex]).toBe(
        original.options[original.correctIndex]
      );
      expect(question.options).not.toEqual(original.options);
    }
  });

  it('covers the current pool before refilling and protects the cycle join', () => {
    const pool = COMPREHENSION_PASSAGE_POOLS.easy;
    let randomCalls = 0;
    const random = () => {
      randomCalls += 1;
      if (randomCalls <= pool.length - 1) return 0.999;
      if (randomCalls === pool.length) return 0;
      return 0.999;
    };
    const onReportResult = jest.fn();
    const view = render(
      <ComprehensionTest
        difficulty="easy"
        random={random}
        onReportResult={onReportResult}
      />
    );

    const completeSession = (startTestId: 'start-button' | 'play-again') => {
      fireEvent.press(view.getByTestId(startTestId));
      fireEvent.press(view.getByTestId('done-reading'));
      fireEvent.press(view.getByTestId('option-0'));
      act(() => {
        jest.advanceTimersByTime(1_000);
      });
    };

    for (let index = 0; index < pool.length; index += 1) {
      completeSession(index === 0 ? 'start-button' : 'play-again');
    }
    const firstCycleIds = onReportResult.mock.calls.map(
      ([payload]) => payload.details.pacedChallengeId
    );
    expect(new Set(firstCycleIds)).toEqual(
      new Set(pool.map((item) => item.id))
    );

    completeSession('play-again');
    const nextCycleId =
      onReportResult.mock.calls[pool.length]![0].details.pacedChallengeId;
    expect(nextCycleId).not.toBe(firstCycleIds.at(-1));
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

  it('reports the underlying training ID and stable question outcomes', () => {
    const selected = COMPREHENSION_PASSAGE_POOLS.easy[0]!;
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <ComprehensionTest
        difficulty="easy"
        random={() => 0.999}
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
          questionOutcomes: [
            expect.objectContaining({
              questionId: selected.questions[0]!.id,
              correct: true,
            }),
          ],
        }),
      })
    );
  });
});
