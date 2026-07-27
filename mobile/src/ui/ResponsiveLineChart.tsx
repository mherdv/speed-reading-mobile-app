import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LineChart } from './LineChart';

type Props = {
  data: number[];
  metricLabel: string;
  height?: number;
  color: string;
  gradientColor?: string;
  showDots?: boolean;
  yAxisTicks?: number;
};

export function ResponsiveLineChart({
  data,
  metricLabel,
  height = 140,
  color,
  gradientColor,
  showDots,
  yAxisTicks = 4,
}: Props) {
  const [containerWidth, setContainerWidth] = useState(280);

  return (
    <View
      testID="responsive-chart-container"
      style={styles.container}
      onLayout={(event) => {
        const measured = Math.floor(event.nativeEvent.layout.width);
        if (measured > 0 && measured !== containerWidth) {
          setContainerWidth(measured);
        }
      }}
    >
      <LineChart
        data={data}
        width={Math.max(160, containerWidth)}
        height={height}
        color={color}
        gradientColor={gradientColor ?? color}
        showDots={showDots}
        showArea
        showYAxis
        showXAxis
        yAxisTicks={yAxisTicks}
        metricLabel={metricLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
