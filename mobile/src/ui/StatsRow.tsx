import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';

export type StatItem = {
  key: string;
  value: React.ReactNode;
  label: string;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

type Props = {
  items: StatItem[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function StatsRow({ items, style, testID }: Props) {
  return (
    <View style={[styles.row, style]} testID={testID}>
      {items.map((item) => (
        <View key={item.key} style={item.containerStyle}>
          <Text testID={item.testID} style={[styles.value, item.valueStyle]}>
            {item.value}
          </Text>
          <Text style={[styles.label, item.labelStyle]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
  },
});
