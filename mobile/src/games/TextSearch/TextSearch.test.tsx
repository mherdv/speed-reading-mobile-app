import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import TextSearch from './TextSearch';
import {
  TEXT_SEARCH_VARIATIONS,
  validateTextSearchContent,
} from '../../data/textSearchContent';

describe('TextSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in idle phase and shows start button', () => {
    const { getByTestId } = render(<TextSearch />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows paragraph and target after pressing start', () => {
    const { getByTestId } = render(
      <TextSearch paragraph="The quick fox jumps over the fox" targetWord="fox" />
    );

    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('target-word')).toBeTruthy();
    expect(getByTestId('paragraph-display')).toBeTruthy();
  });

  it('uses reviewed natural passage pools at every difficulty', () => {
    expect(validateTextSearchContent()).toEqual([]);
    expect(TEXT_SEARCH_VARIATIONS.easy).toHaveLength(9);
    expect(TEXT_SEARCH_VARIATIONS.medium).toHaveLength(9);
    expect(TEXT_SEARCH_VARIATIONS.hard).toHaveLength(9);
  });

  it('does not immediately repeat a built-in passage on replay', () => {
    const report = jest.fn();
    const view = render(
      <TextSearch difficulty="medium" onReportResult={report} />
    );
    fireEvent.press(view.getByTestId('start-button'));
    act(() => jest.advanceTimersByTime(30_100));
    const firstId = report.mock.calls[0][0].details.contentId;
    fireEvent.press(view.getByTestId('play-again'));
    act(() => jest.advanceTimersByTime(30_100));
    const secondId = report.mock.calls[1][0].details.contentId;
    expect(secondId).not.toBe(firstId);
  });

  it('allows tapping words to find targets', () => {
    const { getByTestId, queryByTestId } = render(
      <TextSearch paragraph="Find the cat and cat" targetWord="cat" />
    );

    fireEvent.press(getByTestId('start-button'));
    
    // Tap first "cat" at index 2
    fireEvent.press(getByTestId('word-2'));
    
    // Game still running since there's another cat
    expect(getByTestId('score-display')).toBeTruthy();
    expect(getByTestId('word-2')).toHaveAccessibilityState({
      selected: true,
      disabled: true,
    });
    const wordStyle = StyleSheet.flatten(getByTestId('word-2').props.style);
    expect(wordStyle.minHeight).toBeGreaterThanOrEqual(44);
    expect(getByTestId('word-2').props.hitSlop).toBeUndefined();
  });

  it('ends when all targets are found', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <TextSearch paragraph="fox" targetWord="fox" onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('word-0'));

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 100,
        accuracy: 1,
        details: expect.objectContaining({
          activityType: 'scanning',
          totalTargets: 1,
          found: 1,
        }),
      })
    );
    expect(getByTestId('end-screen')).toBeTruthy();
  });

  it('shows play again button on end screen', () => {
    const { getByTestId } = render(
      <TextSearch paragraph="cat" targetWord="cat" />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('word-0'));

    expect(getByTestId('play-again')).toBeTruthy();
  });

  it('counts a wrong tap and cannot report 100% after all targets are found', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <TextSearch
        paragraph="cat dog cat"
        targetWord="cat"
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    fireEvent.press(getByTestId('word-1'));
    expect(getByTestId('text-search-error-feedback')).toBeTruthy();
    fireEvent.press(getByTestId('word-0'));
    fireEvent.press(getByTestId('word-2'));

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 67,
        accuracy: 2 / 3,
        details: expect.objectContaining({
          totalTargets: 2,
          found: 2,
          errors: 1,
          missed: 0,
        }),
      })
    );
  });
});
