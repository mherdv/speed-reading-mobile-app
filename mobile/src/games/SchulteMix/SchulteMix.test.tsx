import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SchulteMix from './SchulteMix';

type TestNode = {
  props: {
    testID?: unknown;
  };
};

describe('SchulteMix', () => {
  it('shows start button initially', () => {
    const { getByTestId } = render(<SchulteMix />);
    expect(getByTestId('start-button')).toBeTruthy();
  });

  it('shows grid after start', () => {
    const { getByTestId, queryByTestId } = render(<SchulteMix gridSize={2} />);
    fireEvent.press(getByTestId('start-button'));
    
    expect(queryByTestId('start-button')).toBeNull();
  });

  it('completes when all items tapped in alternating order', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(<SchulteMix gridSize={2} onReportResult={onReportResult} />);
    
    fireEvent.press(getByTestId('start-button'));
    
    // 2x2 grid: 2 numbers (1,2) and 2 letters (A,B)
    // Sequence: 1, A, 2, B
    fireEvent.press(getByTestId('cell-number-1'));
    fireEvent.press(getByTestId('cell-letter-A'));
    fireEvent.press(getByTestId('cell-number-2'));
    fireEvent.press(getByTestId('cell-letter-B'));
    
    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalled();
  });

  it('records a wrong tap without changing the measured session time', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const onReportResult = jest.fn();
    const { getByTestId, getByText } = render(
      <SchulteMix gridSize={2} onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));
    now.mockReturnValue(5_320);
    fireEvent.press(getByTestId('cell-letter-A'));
    fireEvent.press(getByTestId('cell-number-1'));
    fireEvent.press(getByTestId('cell-letter-A'));
    fireEvent.press(getByTestId('cell-number-2'));
    fireEvent.press(getByTestId('cell-letter-B'));

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedMs: 4_320,
        details: expect.objectContaining({
          mistakes: 1,
          timePenaltyMs: 0,
        }),
      })
    );
    expect(getByText('4.32s')).toBeTruthy();
    now.mockRestore();
  });

  it('uses consistent grid padding and row gaps (no extra bottom gap)', () => {
    const { getByTestId } = render(<SchulteMix gridSize={3} />);

    fireEvent.press(getByTestId('start-button'));

    const grid = getByTestId('schulte-mix-grid');
    const gridStyle = StyleSheet.flatten(grid.props.style);
    expect(gridStyle.padding).toBe(4);

    const row0 = getByTestId('schulte-mix-row-0');
    const row1 = getByTestId('schulte-mix-row-1');
    const row2 = getByTestId('schulte-mix-row-2');
    expect(StyleSheet.flatten(row0.props.style).marginBottom).toBe(4);
    expect(StyleSheet.flatten(row1.props.style).marginBottom).toBe(4);
    expect(StyleSheet.flatten(row2.props.style).marginBottom).toBeUndefined();
  });

  it.each([
    ['easy', 9],
    ['medium', 16],
    ['hard', 25],
  ] as const)('uses the controlled %s grid size', (difficulty, cellCount) => {
    const { getByTestId } = render(<SchulteMix difficulty={difficulty} />);

    fireEvent.press(getByTestId('start-button'));
    const grid = getByTestId('schulte-mix-grid');
    const cells = grid.findAll(
      (node: TestNode) =>
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('cell-')
    );
    const uniqueCellIds = new Set(
      cells.map((node: TestNode) => node.props.testID)
    );

    expect(uniqueCellIds.size).toBe(cellCount);
  });
});
