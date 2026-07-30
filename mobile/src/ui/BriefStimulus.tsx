import React, { type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { Difficulty } from '../data/difficultyPreferences';
import { colors } from '../theme/colors';

const MASK_FRACTIONS: Record<Difficulty, number> = {
  easy: 0,
  medium: 0.18,
  hard: 0.38,
};

export const BRIEF_STIMULUS_MARKER_COLOR = '#111111';

export function getBriefStimulusMaskFraction(
  difficulty: Difficulty
): number {
  return MASK_FRACTIONS[difficulty];
}

function glyphWidthUnits(character: string): number {
  if (/\s/.test(character)) return 0.34;
  if (/[ilI1.,'`|!:;]/.test(character)) return 0.3;
  if (/[mwMW@#%&]/.test(character)) return 0.92;
  if (/[A-Z0-9]/.test(character)) return 0.66;
  return 0.55;
}

/**
 * Estimates a conservative font size before the first paint. Native text still
 * receives adjustsFontSizeToFit, while this estimate keeps React Native Web and
 * mobile Safari from wrapping even when that native prop is unavailable.
 */
export function fitBriefStimulusFontSize(
  value: string,
  availableWidth: number,
  maxFontSize: number,
  minFontSize: number,
  letterSpacing = 0
): number {
  const safeMax = Math.max(1, maxFontSize);
  const safeMin = Math.min(safeMax, Math.max(1, minFontSize));
  const widthUnits = Array.from(value).reduce(
    (total, character) => total + glyphWidthUnits(character),
    0
  );
  const spacingWidth = Math.max(0, value.length - 1) * letterSpacing;
  // Keep a conservative width reserve because browser and native font metrics
  // vary, especially for long analytical phrases.
  const usableWidth = Math.max(1, availableWidth * 0.84 - spacingWidth);
  const estimatedSize =
    widthUnits > 0 ? usableWidth / widthUnits : safeMax;

  return Math.max(safeMin, Math.min(safeMax, estimatedSize));
}

export function estimateBriefStimulusLineCount(
  value: string,
  availableWidth: number,
  fontSize: number,
  maxLines: number,
  letterSpacing = 0
): number {
  const widthUnits = Array.from(value).reduce(
    (total, character) => total + glyphWidthUnits(character),
    0
  );
  const estimatedTextWidth =
    widthUnits * fontSize * 1.12 +
    Math.max(0, value.length - 1) * letterSpacing;
  const usableWidth = Math.max(1, availableWidth * 0.9);

  return Math.max(
    1,
    Math.min(Math.max(1, maxLines), Math.ceil(estimatedTextWidth / usableWidth))
  );
}

type Props = {
  value: string;
  difficulty: Difficulty;
  testID: string;
  children?: ReactNode;
  color?: string;
  backgroundColor?: string;
  maxFontSize?: number;
  minFontSize?: number;
  letterSpacing?: number;
  availableWidth?: number;
  allowWrap?: boolean;
  maxLines?: number;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function BriefStimulus({
  value,
  difficulty,
  testID,
  children,
  color = colors.textPrimary,
  backgroundColor = colors.background,
  maxFontSize = 44,
  minFontSize = 10,
  letterSpacing = 0,
  availableWidth,
  allowWrap = false,
  maxLines = 3,
  style,
  containerStyle,
}: Props) {
  const { width: viewportWidth } = useWindowDimensions();
  const stimulusWidth =
    availableWidth ?? Math.max(1, viewportWidth - 40);
  const fittedFontSize = allowWrap
    ? maxFontSize
    : fitBriefStimulusFontSize(
        value,
        stimulusWidth,
        maxFontSize,
        minFontSize,
        letterSpacing
      );
  const lineHeight = Math.ceil(fittedFontSize * (allowWrap ? 1.25 : 1.15));
  const lineCount = allowWrap
    ? estimateBriefStimulusLineCount(
        value,
        stimulusWidth,
        fittedFontSize,
        maxLines,
        letterSpacing
      )
    : 1;
  const maskFraction = getBriefStimulusMaskFraction(difficulty);

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor,
          height: lineHeight * lineCount,
        },
        containerStyle,
      ]}
    >
      <Text
        testID={testID}
        numberOfLines={allowWrap ? maxLines : 1}
        adjustsFontSizeToFit={!allowWrap}
        minimumFontScale={minFontSize / maxFontSize}
        selectable={false}
        style={[
          styles.text,
          {
            color,
            fontSize: fittedFontSize,
            letterSpacing,
            lineHeight,
          },
          style,
        ]}
      >
        {children ?? value}
      </Text>
      {maskFraction > 0 && (
        <View
          testID={`${testID}-mask`}
          accessible={false}
          pointerEvents="none"
          style={[
            styles.mask,
            {
              height: allowWrap
                ? lineHeight * maskFraction
                : `${maskFraction * 100}%`,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    borderWidth: 0,
    justifyContent: 'center',
    margin: 0,
    overflow: 'hidden',
    padding: 0,
    position: 'relative',
    width: '100%',
  },
  text: {
    flexShrink: 1,
    fontWeight: '800',
    margin: 0,
    padding: 0,
    textAlign: 'center',
    width: '100%',
  },
  mask: {
    backgroundColor: BRIEF_STIMULUS_MARKER_COLOR,
    bottom: 0,
    left: 0,
    opacity: 1,
    position: 'absolute',
    right: 0,
  },
});
