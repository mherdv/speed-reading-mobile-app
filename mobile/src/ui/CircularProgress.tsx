import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

type Props = {
  /** Value from 0 to 100 */
  percentage: number;
  /** Size of the circle in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Primary color (or start of gradient) */
  color?: string;
  /** Optional end color for gradient */
  gradientEnd?: string;
  /** Show percentage text inside */
  showText?: boolean;
  /** Custom center content */
  centerLabel?: string;
  /** Secondary label below main value */
  subLabel?: string;
};

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = colors.primary,
  gradientEnd,
  showText = true,
  centerLabel,
  subLabel,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;
  
  const center = size / 2;
  const useGradient = !!gradientEnd;
  const gradientId = `progress-gradient-${size}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {useGradient && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={gradientEnd} />
            </LinearGradient>
          </Defs>
        )}
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={useGradient ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.valueText, { fontSize: size * 0.22 }]}>
            {centerLabel ?? `${Math.round(clampedPercentage)}%`}
          </Text>
          {subLabel && (
            <Text style={[styles.subLabel, { fontSize: size * 0.1 }]}>{subLabel}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subLabel: {
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
});
