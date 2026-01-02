import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import WordPairs from './WordPairs';

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
