import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import ComprehensionTest from './ComprehensionTest';

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
          activityType: 'comprehension',
          questionsTotal: 1,
          correctCount: 1,
        }),
      })
    );
  });
});
