import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SchulteNumbers from './SchulteNumbers';

describe('SchulteNumbers', () => {
  it('shows start button initially', () => {
    const { getByTestId } = render(<SchulteNumbers />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows grid after start', () => {
    const { getByTestId, queryByTestId } = render(<SchulteNumbers gridSize={3} />);
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
    expect(getByTestId('cell-1')).toBeTruthy();
  });

  it('completes when all numbers tapped in order', () => {
    const onReportResult = jest.fn();
    const { getByTestId, getByText, queryByTestId } = render(
      <SchulteNumbers gridSize={2} onReportResult={onReportResult} />
    );
    
    fireEvent.press(getByTestId('start-button'));
    
    fireEvent.press(getByTestId('cell-1'));
    fireEvent.press(getByTestId('cell-2'));
    fireEvent.press(getByTestId('cell-3'));
    fireEvent.press(getByTestId('cell-4'));
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Play again'));

    expect(queryByTestId('end')).toBeNull();
    expect(getByTestId('cell-1')).toBeTruthy();
  });

  it('records a wrong tap without changing the measured session time', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <SchulteNumbers gridSize={2} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));
    now.mockReturnValue(5_320);
    fireEvent.press(getByTestId('cell-2'));
    fireEvent.press(getByTestId('cell-1'));
    fireEvent.press(getByTestId('cell-2'));
    fireEvent.press(getByTestId('cell-3'));
    fireEvent.press(getByTestId('cell-4'));

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 4_320,
        details: expect.objectContaining({
          mistakes: 1,
          timePenaltyMs: 0,
        }),
      })
    );
    now.mockRestore();
  });

  it('uses consistent grid padding and row gaps (no extra bottom gap)', () => {
    const { getByTestId } = render(<SchulteNumbers gridSize={3} />);

    fireEvent.press(getByTestId('start-button'));

    const grid = getByTestId('schulte-numbers-grid');
    const gridStyle = StyleSheet.flatten(grid.props.style);
    expect(gridStyle.padding).toBe(4);

    const row0 = getByTestId('schulte-numbers-row-0');
    const row1 = getByTestId('schulte-numbers-row-1');
    const row2 = getByTestId('schulte-numbers-row-2');
    expect(StyleSheet.flatten(row0.props.style).marginBottom).toBe(4);
    expect(StyleSheet.flatten(row1.props.style).marginBottom).toBe(4);
    expect(StyleSheet.flatten(row2.props.style).marginBottom).toBeUndefined();
  });
});
