import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  getShellPadding,
  getWindowClass,
  ReadingColumn,
  READING_COLUMN_MAX_WIDTH,
} from './ResponsiveShell';
import { ResponsiveLineChart } from './ResponsiveLineChart';

describe('responsive and accessible visualization contracts', () => {
  it('uses the agreed compact, medium, and expanded boundaries', () => {
    expect(getWindowClass(320)).toBe('compact');
    expect(getWindowClass(599)).toBe('compact');
    expect(getWindowClass(600)).toBe('medium');
    expect(getWindowClass(839)).toBe('medium');
    expect(getWindowClass(840)).toBe('expanded');
    expect(getShellPadding('compact')).toBeLessThan(
      getShellPadding('expanded')
    );
  });

  it('uses one fluid 700-pixel measure at compact and expanded widths', () => {
    const { getByTestId } = render(
      <ReadingColumn testID="test-reading-column">
        <Text>Connected passage</Text>
      </ReadingColumn>
    );
    expect(getByTestId('test-reading-column')).toHaveStyle({
      width: '100%',
      maxWidth: READING_COLUMN_MAX_WIDTH,
      alignSelf: 'center',
    });
    expect(READING_COLUMN_MAX_WIDTH).toBe(700);
  });

  it('resizes a chart from its actual container and exposes its data in text', () => {
    const { getByTestId, getByLabelText } = render(
      <ResponsiveLineChart
        data={[180, 210, 205]}
        metricLabel="WPM"
        color="#0E4979"
      />
    );
    fireEvent(getByTestId('responsive-chart-container'), 'layout', {
      nativeEvent: { layout: { width: 512, height: 180, x: 0, y: 0 } },
    });
    expect(getByTestId('line-chart-svg').props.width).toBe(512);
    expect(getByTestId('chart-data-summary')).toHaveTextContent(
      'Data: 1: 180 · 2: 210 · 3: 205'
    );
    expect(
      getByLabelText(
        'WPM trend with 3 data points. Attempt 1: 180. Attempt 2: 210. Attempt 3: 205'
      )
    ).toBeTruthy();
  });
});
