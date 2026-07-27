import type { PropsWithChildren } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { spacing } from '../theme/colors';

export type WindowClass = 'compact' | 'medium' | 'expanded';
export const READING_COLUMN_MAX_WIDTH = 700;

export function getWindowClass(width: number): WindowClass {
  if (width < 600) return 'compact';
  if (width < 840) return 'medium';
  return 'expanded';
}

export function getShellPadding(windowClass: WindowClass): number {
  if (windowClass === 'compact') return spacing.md;
  if (windowClass === 'medium') return spacing.lg;
  return spacing.xl;
}

export function ResponsiveShell({
  children,
  style,
  testID = 'responsive-shell',
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>) {
  const { width } = useWindowDimensions();
  const windowClass = getWindowClass(width);
  return (
    <View
      testID={testID}
      style={[
        styles.shell,
        { paddingHorizontal: getShellPadding(windowClass) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ReadingColumn({
  children,
  style,
  testID = 'reading-column',
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>) {
  return (
    <View testID={testID} style={[styles.readingColumn, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  readingColumn: {
    width: '100%',
    maxWidth: READING_COLUMN_MAX_WIDTH,
    alignSelf: 'center',
  },
});
