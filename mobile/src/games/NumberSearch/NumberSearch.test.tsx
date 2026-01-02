import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import NumberSearch from './NumberSearch';

describe('NumberSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows start button initially', () => {
    const { getByTestId } = render(<NumberSearch />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows grid after start', () => {
    const { getByTestId, queryByTestId } = render(<NumberSearch gridSize={3} />);
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
    expect(getByTestId('cell-0-0')).toBeTruthy();
  });

  it('reports result on end', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(<NumberSearch durationMs={100} onReportResult={onReportResult} />);
    
    fireEvent.press(getByTestId('start-button'));
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalled();
  });
});
