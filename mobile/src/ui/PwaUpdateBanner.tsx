import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, shadows } from '../theme/colors';

export const PWA_UPDATE_EVENT = 'speedread:update-ready';

export function PwaUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const showUpdate = () => setVisible(true);
    window.addEventListener(PWA_UPDATE_EVENT, showUpdate);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, showUpdate);
  }, []);

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View accessibilityLiveRegion="polite" style={styles.banner}>
        <View style={styles.copy}>
          <Text style={styles.title}>A new version is ready</Text>
          <Text style={styles.description}>
            Reload when you are between exercises. Your saved data will stay.
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={styles.laterButton}
          >
            <Text style={styles.laterText}>Later</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => window.location.reload()}
            style={styles.reloadButton}
          >
            <Text style={styles.reloadText}>Reload</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    padding: 12,
  },
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  copy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 220,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  laterButton: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  laterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  reloadButton: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: colors.interactivePrimary,
  },
  reloadText: {
    color: colors.onInteractive,
    fontSize: 12,
    fontWeight: '800',
  },
});
