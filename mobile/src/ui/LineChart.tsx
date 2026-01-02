import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

type Props = {
  /** Array of numeric values to plot */
  data: number[];
  /** Width of the chart */
  width?: number;
  /** Height of the chart */
  height?: number;
  /** Line color */
  color?: string;
  /** Gradient end color (for area fill) */
  gradientColor?: string;
  /** Show data point dots */
  showDots?: boolean;
  /** Show area fill under the line */
  showArea?: boolean;
  /** Labels for x-axis (optional) */
  labels?: string[];
  /** Show Y-axis values */
  showYAxis?: boolean;
  /** Show X-axis values (index or labels) */
  showXAxis?: boolean;
  /** Number of Y-axis ticks */
  yAxisTicks?: number;
};

export function LineChart({
  data,
  width = 280,
  height = 120,
  color = '#6366F1',
  gradientColor = '#6366F1',
  showDots = true,
  showArea = true,
  labels,
  showYAxis = true,
  showXAxis = true,
  yAxisTicks = 4,
}: Props) {
  if (data.length === 0) return null;

  const padding = { top: 15, right: 15, bottom: 25, left: showYAxis ? 40 : 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  
  // Round min/max to nice values for Y-axis
  const niceMin = Math.floor(minValue / 10) * 10;
  const niceMax = Math.ceil(maxValue / 10) * 10;
  const niceRange = niceMax - niceMin || 1;

  // Generate Y-axis tick values
  const yTicks: number[] = [];
  for (let i = 0; i <= yAxisTicks; i++) {
    yTicks.push(Math.round(niceMin + (niceRange / yAxisTicks) * i));
  }

  // Generate points using nice range for consistent scaling
  const points = data.map((value, index) => {
    const x = padding.left + (index / Math.max(1, data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((value - niceMin) / niceRange) * chartHeight;
    return { x, y, value };
  });

  // Create smooth curve path using cardinal spline
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Create area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const gradientId = `line-chart-gradient-${Math.random().toString(36).substr(2, 9)}`;

  // X-axis labels (use provided labels or generate indices)
  const xLabels = labels || data.map((_, i) => `${i + 1}`);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={gradientColor} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {showYAxis && yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - niceMin) / niceRange) * chartHeight;
          return (
            <Line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Area fill */}
        {showArea && (
          <Path
            d={areaPath}
            fill={`url(#${gradientId})`}
          />
        )}

        {/* Line */}
        <Path
          d={linePath}
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots with values */}
        {showDots && points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill="white"
              stroke={color}
              strokeWidth={2}
            />
            {/* Value label above dot */}
            <SvgText
              x={p.x}
              y={p.y - 8}
              fontSize={9}
              fontWeight="600"
              fill={color}
              textAnchor="middle"
            >
              {p.value}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Y-axis labels */}
        {showYAxis && yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - ((tick - niceMin) / niceRange) * chartHeight;
          return (
            <SvgText
              key={`y-${i}`}
              x={padding.left - 8}
              y={y + 4}
              fontSize={10}
              fill="#6B7280"
              textAnchor="end"
            >
              {tick}
            </SvgText>
          );
        })}

        {/* X-axis labels */}
        {showXAxis && points.map((p, i) => (
          <SvgText
            key={`x-${i}`}
            x={p.x}
            y={height - 6}
            fontSize={9}
            fill="#6B7280"
            textAnchor="middle"
          >
            {xLabels[i] || i + 1}
          </SvgText>
        ))}

        {/* Axis lines */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#D1D5DB"
          strokeWidth={1}
        />
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#D1D5DB"
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
