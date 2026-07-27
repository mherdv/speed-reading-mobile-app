import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { validateWpmTestPool, type WpmQuestion } from '../../data/wpmTestContent';
import type { TextSample } from '../../domain/types';
import WpmTest from './WpmTest';

const SAMPLE: TextSample = {
  id: 'wpm-test-sample',
  version: 1,
  comparisonBand: 'wpm-test-band',
  title: 'Test passage',
  text: 'One two three four five six.',
  question: {
    prompt: 'Which word came last?',
    choices: ['five', 'six'],
    correctIndex: 1,
  },
};

const QUESTIONS: readonly WpmQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which word came last?',
    choices: ['five', 'six'],
    correctIndex: 1,
    type: 'detail-evidence',
    rationale: 'Six is last.',
    answerDependency: 'passage-required',
  },
  {
    id: 'q2',
    prompt: 'Which word came first?',
    choices: ['one', 'two'],
    correctIndex: 0,
    type: 'detail-evidence',
    rationale: 'One is first.',
    answerDependency: 'passage-required',
  },
  {
    id: 'q3',
    prompt: 'How many words are present?',
    choices: ['five', 'six'],
    correctIndex: 1,
    type: 'inference-purpose',
    rationale: 'There are six words.',
    answerDependency: 'passage-required',
  },
];

describe('WpmTest', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the passage hidden until timing starts and stops time before questions', () => {
    const onReportResult = jest.fn();
    const view = render(
      <WpmTest
        sample={SAMPLE}
        questions={QUESTIONS}
        difficulty="hard"
        onReportResult={onReportResult}
      />
    );
    expect(view.queryByTestId('wpm-passage')).toBeNull();
    fireEvent.press(view.getByTestId('start-button'));
    expect(view.getByTestId('wpm-passage')).toBeTruthy();

    act(() => jest.advanceTimersByTime(60_000));
    fireEvent.press(view.getByTestId('finish-wpm-reading'));
    expect(view.getByTestId('wpm-questions')).toBeTruthy();
    act(() => jest.advanceTimersByTime(30_000));
    fireEvent.press(view.getByTestId('wpm-question-0-option-1'));
    fireEvent.press(view.getByTestId('wpm-question-1-option-0'));
    fireEvent.press(view.getByTestId('wpm-question-2-option-1'));
    fireEvent.press(view.getByTestId('submit-wpm-questions'));

    expect(view.getByTestId('end')).toBeTruthy();
    expect(view.getByTestId('wpm-result')).toHaveTextContent('6 WPM');
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult.mock.calls[0][0]).toMatchObject({
      elapsedMs: 60_000,
      score: 3,
      accuracy: 1,
      details: {
        activityType: 'measured-reading',
        contentId: 'wpm-test-sample',
        wordCount: 6,
        wpm: 6,
        comprehensionCorrect: true,
        comprehensionQuestionCount: 3,
        measurementValid: true,
        difficulty: 'hard',
        source: 'TEXT_SAMPLES',
      },
    });
  });

  it('flags an attempt that is too brief and can replay without duplicate reports', () => {
    const report = jest.fn();
    const view = render(
      <WpmTest
        sample={SAMPLE}
        questions={[QUESTIONS[0]]}
        difficulty="easy"
        onReportResult={report}
      />
    );
    fireEvent.press(view.getByTestId('start-button'));
    act(() => jest.advanceTimersByTime(1_000));
    fireEvent.press(view.getByTestId('finish-wpm-reading'));
    fireEvent.press(view.getByTestId('wpm-question-0-option-1'));
    fireEvent.press(view.getByTestId('submit-wpm-questions'));
    expect(view.getByTestId('quality-flag')).toBeTruthy();
    expect(report.mock.calls[0][0].details).toMatchObject({
      measurementValid: false,
      qualityFlag: 'too-short',
    });
    fireEvent.press(view.getByTestId('play-again'));
    expect(view.getByTestId('wpm-reading')).toBeTruthy();
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('provides multiple reviewed passages with 1, 2, and 3 questions by difficulty', () => {
    expect(validateWpmTestPool()).toEqual([]);
  });

  it('falls back to the sample question when an empty override is supplied', () => {
    const view = render(
      <WpmTest sample={SAMPLE} questions={[]} difficulty="easy" />
    );

    fireEvent.press(view.getByTestId('start-button'));
    act(() => jest.advanceTimersByTime(4_000));
    fireEvent.press(view.getByTestId('finish-wpm-reading'));

    expect(view.getByTestId('wpm-question-0-option-0')).toBeTruthy();
    expect(view.queryByTestId('submit-wpm-questions')).toBeDisabled();
  });
});
