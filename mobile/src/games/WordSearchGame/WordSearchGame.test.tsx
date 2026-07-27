import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import WordSearchGame, { getWordSearchPool } from './WordSearchGame';

describe('WordSearchGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows start button initially', () => {
    const { getByTestId } = render(<WordSearchGame />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('uses large difficulty-specific target pools instead of a short fixed list', () => {
    expect(getWordSearchPool('easy').length).toBeGreaterThan(80);
    expect(getWordSearchPool('medium').length).toBeGreaterThan(100);
    expect(getWordSearchPool('hard').length).toBeGreaterThan(100);
    expect(
      getWordSearchPool('hard').every((word) => word.length <= 9)
    ).toBe(true);
  });

  it('shows grid after start', () => {
    const { getByTestId, queryByTestId } = render(<WordSearchGame difficulty="easy" />);
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
    expect(getByTestId('cell-0-0')).toBeTruthy();
  });

  it('reports once, shows an ended state, and can replay', () => {
    const onReportResult = jest.fn();
    const { getByTestId, getByText, queryByTestId } = render(
      <WordSearchGame durationMs={100} onReportResult={onReportResult} />
    );
    
    fireEvent.press(getByTestId('start-button'));
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Play again'));

    expect(queryByTestId('end')).toBeNull();
    expect(getByTestId('word-search-grid')).toBeTruthy();
  });

  it('requires every target letter in order before counting a word', () => {
    const { getByLabelText, getByTestId } = render(
      <WordSearchGame difficulty="easy" />
    );

    fireEvent.press(getByTestId('start-button'));
    const targetWord = getByTestId('target-word').props.children as string;

    for (let index = 0; index < targetWord.length; index += 1) {
      fireEvent.press(
        getByLabelText(
          `${targetWord[index]}, target position ${index + 1}`
        )
      );
    }

    expect(getByTestId('words-found-value').props.children).toBe(1);
  });

  it('cleans up its timer without reporting after unmount', () => {
    const onReportResult = jest.fn();
    const { getByTestId, unmount } = render(
      <WordSearchGame durationMs={100} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));
    unmount();
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(onReportResult).not.toHaveBeenCalled();
  });
});
