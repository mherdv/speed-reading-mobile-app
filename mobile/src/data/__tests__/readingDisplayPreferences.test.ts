import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_READING_DISPLAY_PREFERENCES,
  loadReadingDisplayPreferences,
  saveReadingDisplayPreferences,
  sanitizeReadingDisplayPreferences,
} from '../readingDisplayPreferences';

describe('reading display preferences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loads readable defaults', async () => {
    await expect(loadReadingDisplayPreferences()).resolves.toEqual(
      DEFAULT_READING_DISPLAY_PREFERENCES
    );
  });

  it('persists every reading-canvas control', async () => {
    await saveReadingDisplayPreferences({
      fontSize: 'large',
      lineSpacing: 'airy',
      measure: 'narrow',
      theme: 'dark',
    });

    await expect(loadReadingDisplayPreferences()).resolves.toEqual({
      fontSize: 'large',
      lineSpacing: 'airy',
      measure: 'narrow',
      theme: 'dark',
    });
  });

  it('repairs unsupported stored values', () => {
    expect(
      sanitizeReadingDisplayPreferences({
        fontSize: 'huge',
        lineSpacing: 'airy',
        measure: 200,
        theme: 'neon',
      })
    ).toEqual({
      ...DEFAULT_READING_DISPLAY_PREFERENCES,
      lineSpacing: 'airy',
    });
  });
});
