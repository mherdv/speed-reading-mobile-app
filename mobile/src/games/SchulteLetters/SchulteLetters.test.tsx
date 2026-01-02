import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SchulteLetters from './SchulteLetters';

describe('SchulteLetters', () => {
  it('shows start button initially', () => {
    const { getByTestId } = render(<SchulteLetters />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows grid after start', () => {
    const { getByTestId, queryByTestId } = render(<SchulteLetters gridSize={3} />);
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
    expect(getByTestId('cell-A')).toBeTruthy();
  });

  it('completes when all letters tapped in order', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(<SchulteLetters gridSize={2} onReportResult={onReportResult} />);
    
    fireEvent.press(getByTestId('start-button'));
    
    fireEvent.press(getByTestId('cell-A'));
    fireEvent.press(getByTestId('cell-B'));
    fireEvent.press(getByTestId('cell-C'));
    fireEvent.press(getByTestId('cell-D'));
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalled();
  });

  it('uses consistent grid padding and row gaps (no extra bottom gap)', () => {
    const { getByTestId } = render(<SchulteLetters gridSize={3} />);

    fireEvent.press(getByTestId('start-button'));

    const grid = getByTestId('schulte-letters-grid');
    const gridStyle = StyleSheet.flatten(grid.props.style);
    expect(gridStyle.padding).toBe(4);

    const row0 = getByTestId('schulte-letters-row-0');
    const row1 = getByTestId('schulte-letters-row-1');
    const row2 = getByTestId('schulte-letters-row-2');
    expect(StyleSheet.flatten(row0.props.style).marginBottom).toBe(4);
    expect(StyleSheet.flatten(row1.props.style).marginBottom).toBe(4);
    expect(StyleSheet.flatten(row2.props.style).marginBottom).toBeUndefined();
  });
});
