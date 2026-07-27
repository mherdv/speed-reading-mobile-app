import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  allowsAdaptiveDifficulty,
  getDefaultDifficultyPreference,
  loadDifficultyPreference,
  saveDifficultyPreference,
} from '../difficultyPreferences';

describe('difficulty preferences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps Schulte and Eye Reset manually controlled', () => {
    expect(allowsAdaptiveDifficulty('SchulteNumbers')).toBe(false);
    expect(allowsAdaptiveDifficulty('SchulteLetters')).toBe(false);
    expect(allowsAdaptiveDifficulty('SchulteMix')).toBe(false);
    expect(allowsAdaptiveDifficulty('EyeMovementTraining')).toBe(false);
    expect(getDefaultDifficultyPreference('SchulteNumbers')).toEqual({
      mode: 'manual',
      difficulty: 'easy',
    });
  });

  it('allows adaptive difficulty for other games', () => {
    expect(allowsAdaptiveDifficulty('RepeatedReading')).toBe(true);
    expect(getDefaultDifficultyPreference('RepeatedReading').mode).toBe(
      'adaptive'
    );
  });

  it('starts optional labs in manual mode while reading practice starts adaptive', () => {
    expect(getDefaultDifficultyPreference('PatternScanning').mode).toBe(
      'manual'
    );
    expect(getDefaultDifficultyPreference('StructureScan').mode).toBe(
      'adaptive'
    );
    expect(getDefaultDifficultyPreference('EvidenceHunt').mode).toBe('manual');
    expect(getDefaultDifficultyPreference('ContextBuilder').mode).toBe(
      'manual'
    );
    expect(allowsAdaptiveDifficulty('EvidenceHunt')).toBe(true);
    expect(allowsAdaptiveDifficulty('ContextBuilder')).toBe(true);
  });

  it('persists a manual selection', async () => {
    await saveDifficultyPreference('SchulteNumbers', {
      mode: 'manual',
      difficulty: 'hard',
    });

    await expect(
      loadDifficultyPreference('SchulteNumbers')
    ).resolves.toEqual({
      mode: 'manual',
      difficulty: 'hard',
    });
  });

  it('rejects an adaptive value for a manual-only game', async () => {
    await saveDifficultyPreference('SchulteLetters', {
      mode: 'adaptive',
      difficulty: 'medium',
    });

    await expect(
      loadDifficultyPreference('SchulteLetters')
    ).resolves.toEqual({
      mode: 'manual',
      difficulty: 'medium',
    });
  });
});
