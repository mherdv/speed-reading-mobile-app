import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  /** Rating from 0 to 5 */
  rating: number;
  /** Size of each star */
  size?: number;
  /** Show the numeric rating */
  showValue?: boolean;
  /** Color for filled stars */
  activeColor?: string;
  /** Color for empty stars */
  inactiveColor?: string;
};

export function StarRating({
  rating,
  size = 24,
  showValue = false,
  activeColor = '#FBBF24',
  inactiveColor = '#E5E7EB',
}: Props) {
  const clampedRating = Math.min(5, Math.max(0, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starStyle = { fontSize: size, lineHeight: size * 1.2 };

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Text key={`full-${i}`} style={[starStyle, { color: activeColor }]}>★</Text>
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <View style={styles.halfStarContainer}>
            <Text style={[starStyle, { color: inactiveColor }]}>★</Text>
            <View style={[styles.halfStarOverlay, { width: size / 2 }]}>
              <Text style={[starStyle, { color: activeColor }]}>★</Text>
            </View>
          </View>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Text key={`empty-${i}`} style={[starStyle, { color: inactiveColor }]}>★</Text>
        ))}
      </View>
      {showValue && (
        <Text style={styles.valueText}>{clampedRating.toFixed(1)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfStarContainer: {
    position: 'relative',
  },
  halfStarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  valueText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
