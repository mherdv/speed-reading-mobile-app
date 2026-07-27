import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export type AccessibilityPreferences = {
  reduceMotion: boolean;
  screenReader: boolean;
  boldText: boolean;
};

const DEFAULTS: AccessibilityPreferences = {
  reduceMotion: false,
  screenReader: false,
  boldText: false,
};

export async function queryAccessibilityPreference(
  query: (() => Promise<boolean>) | undefined
): Promise<boolean> {
  if (!query) return false;

  try {
    return await query();
  } catch {
    return false;
  }
}

export function useAccessibilityPreferences(): AccessibilityPreferences {
  const [preferences, setPreferences] =
    useState<AccessibilityPreferences>(DEFAULTS);

  useEffect(() => {
    let active = true;
    const optionalAccessibilityInfo =
      AccessibilityInfo as Partial<typeof AccessibilityInfo>;
    void Promise.all([
      queryAccessibilityPreference(() =>
        AccessibilityInfo.isReduceMotionEnabled()
      ),
      queryAccessibilityPreference(() =>
        AccessibilityInfo.isScreenReaderEnabled()
      ),
      queryAccessibilityPreference(
        optionalAccessibilityInfo.isBoldTextEnabled
          ? () => optionalAccessibilityInfo.isBoldTextEnabled!()
          : undefined
      ),
    ]).then(([reduceMotion, screenReader, boldText]) => {
      if (active) setPreferences({ reduceMotion, screenReader, boldText });
    });

    const reduceSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (reduceMotion) =>
        setPreferences((current) => ({ ...current, reduceMotion }))
    );
    const readerSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (screenReader) =>
        setPreferences((current) => ({ ...current, screenReader }))
    );
    const boldSubscription = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      (boldText) =>
        setPreferences((current) => ({ ...current, boldText }))
    );

    return () => {
      active = false;
      reduceSubscription.remove();
      readerSubscription.remove();
      boldSubscription.remove();
    };
  }, []);

  return preferences;
}
