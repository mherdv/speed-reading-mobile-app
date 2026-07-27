import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  /** Current level (1-15) */
  level: number;
  /** Maximum level (default 15) */
  maxLevel?: number;
  /** Number of stars to display (default 5) */
  starCount?: number;
  /** Size of each star */
  size?: 'small' | 'medium' | 'large';
  /** Show level text */
  showLevel?: boolean;
  /** Orientation of stars */
  orientation?: 'horizontal' | 'vertical';
};

/**
 * Displays difficulty as stars.
 *
 * Level 1-15 maps to 0 to 5 stars:
 * - Level 1 = 0 stars
 * - Level 2-4 = 1 star
 * - Level 5-7 = 2 stars
 * - Level 8-10 = 3 stars
 * - Level 11-13 = 4 stars
 * - Level 14-15 = 5 stars
 */
export function DifficultyStars({
  level,
  maxLevel = 15,
  starCount = 5,
  size = 'medium',
  showLevel = false,
  orientation = 'horizontal',
}: Props) {
  // Convert level to star rating (0 to 5)
  // Level 1 = 0 stars, Level 15 = 5 stars
  const clampedLevel = Math.min(maxLevel, Math.max(1, level));
  const fullStars = clampedLevel <= 1
    ? 0
    : Math.min(starCount, Math.floor((clampedLevel - 1) / 3) + 1);
  const emptyStars = starCount - fullStars;

  const sizeConfig = {
    small: { fontSize: 10, height: 12 },
    medium: { fontSize: 14, height: 16 },
    large: { fontSize: 18, height: 20 },
  }[size];

  const renderStars = () => {
    const stars: React.ReactNode[] = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Text
          key={`full-${i}`}
          style={[
            styles.star,
            styles.starFull,
            { fontSize: sizeConfig.fontSize }
          ]}
        >
          ★
        </Text>
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Text
          key={`empty-${i}`}
          style={[
            styles.star,
            styles.starEmpty,
            { fontSize: sizeConfig.fontSize }
          ]}
        >
          ★
        </Text>
      );
    }

    return stars;
  };

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${fullStars} of ${starCount} difficulty stars, level ${clampedLevel}`}
      style={[styles.container, orientation === 'vertical' && styles.containerVertical]}
    >
      <View style={[styles.starsRow, orientation === 'vertical' && styles.starsColumn]}>
        {renderStars()}
      </View>
      {showLevel && (
        <Text style={[styles.levelText, { fontSize: sizeConfig.fontSize - 2 }]}>
          Lv.{clampedLevel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerVertical: {
    flexDirection: 'column',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starsColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  star: {
    marginHorizontal: 0,
    lineHeight: 14,
  },
  starFull: {
    color: '#F5A623', // Orange filled star (matching design)
  },
  starEmpty: {
    color: '#E1E8ED', // Light gray for empty stars
  },
  halfStarContainer: {
    position: 'relative',
    marginHorizontal: 1,
  },
  halfStarMask: {
    overflow: 'hidden',
  },
  levelText: {
    marginLeft: 6,
    color: '#5D6D7E',
    fontWeight: '600',
  },
});
