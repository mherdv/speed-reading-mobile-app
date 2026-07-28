import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { validateVocabularyPracticeContent } from '../../data/vocabularyPracticeContent';
import WordPairs, { getWordPairChallenge } from './WordPairs';

describe('WordPairs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows start button initially', () => {
    const { getByTestId } = render(<WordPairs />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows options after start', () => {
    const { getByTestId, queryByTestId } = render(<WordPairs />);
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
    expect(getByTestId('option-0')).toBeTruthy();
    expect(getByTestId('option-1')).toBeTruthy();
  });

  it('provides expanded, de-duplicated reviewed challenges', () => {
    expect(validateVocabularyPracticeContent()).toEqual([]);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const challenge = getWordPairChallenge(difficulty);
      expect(challenge.items.length).toBeGreaterThanOrEqual(18);
    }
  });

  it('holds feedback and ignores a rapid second answer', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <WordPairs durationMs={1_000} onReportResult={onReportResult} />
    );
    fireEvent.press(getByTestId('start-button'));

    fireEvent.press(getByTestId('option-0'));
    fireEvent.press(getByTestId('option-1'));
    expect(getByTestId('opposites-feedback')).toBeTruthy();
    expect(getByTestId('option-0')).toBeDisabled();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(getByTestId('opposites-feedback')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ rounds: 1 }),
      })
    );
    expect(onReportResult.mock.calls[0][0].details).not.toHaveProperty(
      'partOfSpeechMatchedOptions'
    );
  });

  it('reports result on end', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(<WordPairs durationMs={100} onReportResult={onReportResult} />);
    
    fireEvent.press(getByTestId('start-button'));
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalled();
  });
});
