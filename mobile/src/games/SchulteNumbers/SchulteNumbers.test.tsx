import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import SchulteNumbers from './SchulteNumbers';

type TestNode = {
  props: {
    testID?: unknown;
  };
};

function cellOrder(grid: ReturnType<ReturnType<typeof render>['getByTestId']>) {
  return grid
    .findAll(
      (node: TestNode) =>
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('cell-')
    )
    .map((node: TestNode) => node.props.testID);
}

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
    let monotonicTime = 1_000;
    const clock = () => monotonicTime;
    const wallClock = jest.spyOn(Date, 'now').mockReturnValue(10_000);
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <SchulteNumbers
        gridSize={2}
        clock={clock}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('start-button'));
    monotonicTime = 5_320;
    wallClock.mockReturnValue(999_999);
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
          timingMethod: 'monotonic-elapsed',
        }),
      })
    );
    wallClock.mockRestore();
  });

  it('reshuffles after correct taps without coloring completed cells', () => {
    const onReportResult = jest.fn();
    const { getByTestId } = render(
      <SchulteNumbers
        gridSize={2}
        random={() => 0}
        onReportResult={onReportResult}
      />
    );

    fireEvent.press(getByTestId('schulte-mode-reshuffle'));
    fireEvent.press(getByTestId('start-button'));
    const before = cellOrder(getByTestId('schulte-numbers-grid'));

    fireEvent.press(getByTestId('cell-1'));

    const after = cellOrder(getByTestId('schulte-numbers-grid'));
    expect(after).not.toEqual(before);
    expect(
      StyleSheet.flatten(getByTestId('cell-1').props.style).backgroundColor
    ).toBe(colors.cardBackground);
    expect(
      StyleSheet.flatten(getByTestId('cell-1').findByType('Text').props.style)
        .color
    ).toBe(colors.textPrimary);

    fireEvent.press(getByTestId('cell-2'));
    fireEvent.press(getByTestId('cell-3'));
    fireEvent.press(getByTestId('cell-4'));

    expect(onReportResult).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          gridMode: 'reshuffle',
          reshuffleCount: 3,
        }),
      })
    );
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
