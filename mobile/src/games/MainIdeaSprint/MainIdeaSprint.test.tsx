import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  MAIN_IDEA_PASSAGES,
  type MainIdeaPassage,
} from '../../data/mainIdeaPassages';
import MainIdeaSprint from './MainIdeaSprint';

const PASSAGE: MainIdeaPassage = {
  id: 'main-idea-test',
  title: 'Small breaks',
  text: 'Brief breaks can restore attention during a long task. The pause works best before concentration has completely faded.',
  choices: [
    'Long tasks should never be paused.',
    'A timely brief break can help sustain attention.',
    'Attention disappears after every break.',
    'Only the length of a task matters.',
  ],
  correctIndex: 1,
  feedback: 'Both sentences explain how a well-timed break supports attention.',
};

describe('MainIdeaSprint', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('has at least five authored scenarios at every difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const passages = MAIN_IDEA_PASSAGES.filter(
        (passage) => passage.difficulty === difficulty
      );
      expect(passages.length).toBeGreaterThanOrEqual(5);
      expect(
        passages.every(
          (passage) =>
            passage.correctIndex >= 0 &&
            passage.correctIndex < passage.choices.length
        )
      ).toBe(true);
    }
  });

  it('hides the passage before retrieval and reports the answer', async () => {
    const onReportResult = jest.fn();
    const { getByTestId, queryByTestId, getByText } = render(
      <MainIdeaSprint
        passages={[PASSAGE]}
        roundCount={1}
        onReportResult={onReportResult}
      />
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('main-idea-passage')).toHaveTextContent(PASSAGE.text);

    fireEvent.press(getByTestId('hide-passage'));
    expect(queryByTestId('main-idea-passage')).toBeNull();

    fireEvent.press(getByTestId('main-idea-choice-1'));
    fireEvent.press(getByTestId('check-main-idea'));
    expect(getByTestId('main-idea-feedback')).toBeTruthy();
    expect(getByText('Correct central idea')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('continue-main-idea'));
      await Promise.resolve();
    });
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        accuracy: 1,
        details: expect.objectContaining({
          activityType: 'retrieval-comprehension',
          questionsTotal: 1,
          correctCount: 1,
        }),
      })
    );
  });

  it('shows corrective feedback before the session can continue', async () => {
    const { getByTestId, getByText } = render(
      <MainIdeaSprint passages={[PASSAGE]} roundCount={1} />
    );
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('hide-passage'));
    fireEvent.press(getByTestId('main-idea-choice-0'));
    fireEvent.press(getByTestId('check-main-idea'));

    expect(getByText('Review the central idea')).toBeTruthy();
    expect(getByText(`Best answer: ${PASSAGE.choices[1]}`)).toBeTruthy();
    expect(getByText(PASSAGE.feedback)).toBeTruthy();
  });
});
