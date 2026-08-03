import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, Text } from 'react-native';

import {
  DEFAULT_READING_DISPLAY_PREFERENCES,
  loadReadingDisplayPreferences,
  READING_DISPLAY_STORAGE_KEY,
} from '../data/readingDisplayPreferences';
import {
  getReadingDisplayTokens,
  ReadingDisplayControl,
  ReadingDisplayProvider,
  useReadingDisplay,
} from './ReadingDisplayPreferences';

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    );
  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit color, received ${hex}`);
  }
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function ReloadHarness() {
  const { preferences, reload } = useReadingDisplay();
  return (
    <>
      <Text testID="active-reading-theme">{preferences.theme}</Text>
      <Pressable testID="reload-reading-display" onPress={() => void reload?.()}>
        <Text>Reload</Text>
      </Pressable>
    </>
  );
}

describe('reading display controls', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('maps presets to readable passage styles', () => {
    expect(
      getReadingDisplayTokens({
        ...DEFAULT_READING_DISPLAY_PREFERENCES,
        fontSize: 'large',
        lineSpacing: 'airy',
        measure: 'narrow',
        theme: 'dark',
      })
    ).toEqual(
      expect.objectContaining({
        text: expect.objectContaining({ fontSize: 21, lineHeight: 37 }),
        subtleText: expect.objectContaining({ color: '#9AAAB2' }),
        surface: expect.objectContaining({ backgroundColor: '#17252D' }),
        column: expect.objectContaining({ maxWidth: 560 }),
      })
    );
  });

  it.each(['light', 'warm', 'dark'] as const)(
    'keeps %s secondary passage text readable without opacity',
    (theme) => {
      const tokens = getReadingDisplayTokens({
        ...DEFAULT_READING_DISPLAY_PREFERENCES,
        theme,
      });
      const foreground = tokens.subtleText.color;
      const background = tokens.surface.backgroundColor;
      if (typeof foreground !== 'string' || typeof background !== 'string') {
        throw new Error('Reading palette colors must be concrete strings.');
      }
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  );

  it('persists accessible 44-point preference choices', async () => {
    const view = render(
      <ReadingDisplayProvider>
        <ReadingDisplayControl />
      </ReadingDisplayProvider>
    );

    fireEvent.press(view.getByLabelText('Text size: A+'));
    fireEvent.press(view.getByLabelText('Page tone: Warm'));

    await waitFor(async () => {
      await expect(loadReadingDisplayPreferences()).resolves.toEqual(
        expect.objectContaining({ fontSize: 'large', theme: 'warm' })
      );
    });
    expect(view.getByLabelText('Text size: A+')).toHaveStyle({ minHeight: 44 });
  });

  it('reloads externally restored settings without remounting the provider', async () => {
    const view = render(
      <ReadingDisplayProvider>
        <ReloadHarness />
      </ReadingDisplayProvider>
    );

    await waitFor(() =>
      expect(view.getByTestId('active-reading-theme')).toHaveTextContent('light')
    );
    await AsyncStorage.setItem(
      READING_DISPLAY_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_READING_DISPLAY_PREFERENCES,
        theme: 'dark',
      })
    );
    fireEvent.press(view.getByTestId('reload-reading-display'));

    await waitFor(() =>
      expect(view.getByTestId('active-reading-theme')).toHaveTextContent('dark')
    );
  });
});
