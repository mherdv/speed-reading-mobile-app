import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import {
  FLASH_CHALLENGE_MAX_LEVEL,
  describeNextFlashChallenge,
  getFlashChallengeProfile,
} from '../games/flashChallenge';

type Props = {
  level: number;
  highestLevel?: number;
  compact?: boolean;
};

export function FlashChallengeStatus({
  level,
  highestLevel,
  compact = false,
}: Props) {
  const profile = getFlashChallengeProfile(level);
  if (compact) {
    return (
      <View
        accessibilityRole="summary"
        testID="flash-challenge-status"
        style={[styles.container, styles.compact]}
      >
        <Text numberOfLines={1} style={styles.level}>
          Stage {profile.level}/{FLASH_CHALLENGE_MAX_LEVEL} ·{' '}
          {profile.label}
        </Text>
      </View>
    );
  }
  return (
    <View
      accessibilityRole="summary"
      testID="flash-challenge-status"
      style={styles.container}
    >
      <Text style={styles.level}>
        Challenge stage {profile.level}/{FLASH_CHALLENGE_MAX_LEVEL} · saved for this setting
      </Text>
      <Text numberOfLines={2} style={styles.detail}>
        {profile.label}
        {highestLevel != null && highestLevel > profile.level
          ? ` · best ${highestLevel}`
          : ''}{' '}
        · {describeNextFlashChallenge(profile.level)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    backgroundColor: colors.infoSurface,
    borderRadius: 10,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compact: {
    marginTop: 0,
    paddingVertical: 6,
  },
  level: {
    color: colors.infoForeground,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
});
