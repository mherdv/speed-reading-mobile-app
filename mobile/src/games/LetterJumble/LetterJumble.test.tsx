import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  MIXUP_WORDS,
  validateVocabularyPracticeContent,
} from '../../data/vocabularyPracticeContent';
import LetterJumble, { transposeWord } from './LetterJumble';

describe('LetterJumble', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows start button initially', () => {
    const { getByTestId } = render(<LetterJumble />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows input after start', () => {
    const { getByTestId, queryByTestId } = render(
      <LetterJumble
        words={[
          {
            word: 'planet',
            definition: 'a large body orbiting a star',
            partOfSpeech: 'noun',
          },
        ]}
      />
    );
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
    expect(getByTestId('answer-input')).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
    fireEvent.press(getByTestId('hint-button'));
    expect(
      String(getByTestId('definition-hint').props.children.join(''))
    ).toContain('a large body orbiting a star');
  });

  it('uses one controlled adjacent transposition rather than an arbitrary shuffle', () => {
    const source = 'reading';
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const mixed = transposeWord(source, difficulty, () => 0);
      const changed = [...source].flatMap((letter, index) =>
        mixed[index] === letter ? [] : [index]
      );
      expect(changed).toHaveLength(2);
      expect(changed[1] - changed[0]).toBe(1);
      expect(mixed[changed[0]]).toBe(source[changed[1]]);
      expect(mixed[changed[1]]).toBe(source[changed[0]]);
    }
  });

  it('uses reviewed unique word definitions at every difficulty', () => {
    expect(validateVocabularyPracticeContent()).toEqual([]);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(MIXUP_WORDS[difficulty]).toHaveLength(32);
    }
  });

  it('reports result on end', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(<LetterJumble durationMs={100} onReportResult={onReportResult} />);
    
    fireEvent.press(getByTestId('start-button'));
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    expect(onReportResult.mock.calls[0][0].details).toMatchObject({
      mutation: 'one-adjacent-transposition',
      hints: 'definition-and-part-of-speech',
    });
  });
});
