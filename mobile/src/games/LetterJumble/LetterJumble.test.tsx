import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import LetterJumble from './LetterJumble';

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
    const { getByTestId, queryByTestId } = render(<LetterJumble />);
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
    expect(getByTestId('answer-input')).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
  });

  it('reports result on end', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(<LetterJumble durationMs={100} onReportResult={onReportResult} />);
    
    fireEvent.press(getByTestId('start-button'));
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalled();
  });
});
