import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import TextSearch from './TextSearch';

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

  it('allows tapping words to find targets', () => {
    const { getByTestId, queryByTestId } = render(
      <TextSearch paragraph="Find the cat and cat" targetWord="cat" />
    );

    fireEvent.press(getByTestId('start-button'));
    
    // Tap first "cat" at index 2
    fireEvent.press(getByTestId('word-2'));
    
    // Game still running since there's another cat
    expect(getByTestId('score-display')).toBeTruthy();
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
