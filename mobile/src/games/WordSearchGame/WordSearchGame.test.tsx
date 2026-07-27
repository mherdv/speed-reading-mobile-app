import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import WordSearchGame, { getWordSearchPool } from './WordSearchGame';

describe('WordSearchGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows start button initially', () => {
    const { getByTestId } = render(<WordSearchGame />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('uses large difficulty-specific target pools instead of a short fixed list', () => {
    expect(getWordSearchPool('easy').length).toBeGreaterThan(20);
    expect(getWordSearchPool('medium').length).toBeGreaterThan(40);
    expect(getWordSearchPool('hard').length).toBeGreaterThan(40);
    expect(
      getWordSearchPool('hard').every((word) => word.length <= 6)
    ).toBe(true);
  });

  it.each([
    ['easy', 16],
    ['medium', 25],
    ['hard', 36],
  ] as const)('renders a non-overlapping %s grid with %i cells', (difficulty, count) => {
    const { getAllByTestId, getByTestId } = render(
      <WordSearchGame difficulty={difficulty} />
    );
    fireEvent.press(getByTestId('start-button'));

    expect(getAllByTestId(/^cell-/)).toHaveLength(count);
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
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { getByTestId } = render(
      <WordSearchGame difficulty="easy" />
    );

    fireEvent.press(getByTestId('start-button'));
    const targetWord = getByTestId('target-word').props.children as string;

    for (let index = 0; index < targetWord.length; index += 1) {
      fireEvent.press(getByTestId(`cell-0-${index}`));
    }

    expect(getByTestId('words-found-value').props.children).toBe(1);
  });

  it('does not reveal target membership or order to assistive technology', () => {
    const { getAllByRole, getByTestId } = render(
      <WordSearchGame difficulty="easy" />
    );

    fireEvent.press(getByTestId('start-button'));
    const cellLabels = getAllByRole('button')
      .map((element) => element.props.accessibilityLabel)
      .filter((label): label is string => typeof label === 'string');

    expect(cellLabels.some((label) => /target|distractor|position/i.test(label))).toBe(false);
    expect(cellLabels.some((label) => /row 1, column 1, letter/i.test(label))).toBe(true);
  });

  it('renders genuine 44-point cells without overlapping hit slop at hard difficulty', () => {
    const { getByTestId } = render(
      <WordSearchGame difficulty="hard" />
    );
    fireEvent.press(getByTestId('start-button'));
    const cell = getByTestId('cell-0-0');
    const style = StyleSheet.flatten(cell.props.style);
    const gridStyle = StyleSheet.flatten(getByTestId('word-search-grid').props.style);

    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
    expect(cell.props.hitSlop).toBeUndefined();
    expect(gridStyle.width).toBeLessThanOrEqual(320);
    expect(cell).toHaveAccessibilityState({ selected: false });
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
