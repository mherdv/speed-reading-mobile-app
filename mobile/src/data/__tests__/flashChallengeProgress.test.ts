import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  FLASH_CHALLENGE_STORAGE_KEY,
  clearFlashChallengeProgress,
  loadFlashChallengeProgress,
  qualifyFlashChallengeLevel,
  qualifyFlashChallengeWpm,
  saveFlashChallengeResumeLevel,
  saveFlashChallengeResumeWpm,
  waitForFlashChallengeUpdates,
} from '../flashChallengeProgress';

describe('flash challenge progress', () => {
  beforeEach(async () => {
    await waitForFlashChallengeUpdates();
    await AsyncStorage.clear();
  });

  it('starts new games at level one and isolates public difficulties', async () => {
    await expect(
      loadFlashChallengeProgress('FlashReading', 'easy')
    ).resolves.toEqual({
      resumeLevel: 1,
      highestLevel: 1,
      updatedAtIso: undefined,
    });

    await qualifyFlashChallengeLevel('FlashReading', 'easy', 6);
    await expect(
      loadFlashChallengeProgress('FlashReading', 'easy')
    ).resolves.toMatchObject({
      resumeLevel: 6,
      highestLevel: 6,
    });
    await expect(
      loadFlashChallengeProgress('FlashReading', 'hard')
    ).resolves.toMatchObject({
      resumeLevel: 1,
      highestLevel: 1,
    });
  });

  it('keeps the best level when a safer resume level is saved', async () => {
    await qualifyFlashChallengeLevel('MemoryRecall', 'medium', 9);
    await saveFlashChallengeResumeLevel('MemoryRecall', 'medium', 8);

    await expect(
      loadFlashChallengeProgress('MemoryRecall', 'medium')
    ).resolves.toMatchObject({
      resumeLevel: 8,
      highestLevel: 9,
    });
  });

  it('never lowers a stronger resume checkpoint through qualification', async () => {
    await qualifyFlashChallengeLevel('FlashReading', 'easy', 10);
    await qualifyFlashChallengeLevel('FlashReading', 'easy', 7);

    await expect(
      loadFlashChallengeProgress('FlashReading', 'easy')
    ).resolves.toMatchObject({
      resumeLevel: 10,
      highestLevel: 10,
    });
  });

  it('resumes sustained WPM and keeps the fastest pace after a rollback', async () => {
    await qualifyFlashChallengeWpm('FlashReading', 'hard', 2_725);
    await qualifyFlashChallengeWpm('FlashReading', 'hard', 2_600);
    await saveFlashChallengeResumeWpm('FlashReading', 'hard', 2_650);

    await expect(
      loadFlashChallengeProgress('FlashReading', 'hard')
    ).resolves.toMatchObject({
      resumeWpm: 2_650,
      highestWpm: 2_725,
    });
  });

  it('serializes writes and clamps invalid or out-of-range values', async () => {
    await Promise.all([
      qualifyFlashChallengeLevel('LastWordRecall', 'easy', 4),
      qualifyFlashChallengeLevel('LastWordRecall', 'easy', 7),
    ]);
    await expect(
      loadFlashChallengeProgress('LastWordRecall', 'easy')
    ).resolves.toMatchObject({
      resumeLevel: 7,
      highestLevel: 7,
    });

    await AsyncStorage.setItem(
      FLASH_CHALLENGE_STORAGE_KEY,
      JSON.stringify({
        FlashReading: {
          easy: { resumeLevel: 99, highestLevel: -4 },
        },
      })
    );
    await expect(
      loadFlashChallengeProgress('FlashReading', 'easy')
    ).resolves.toMatchObject({
      resumeLevel: 15,
      highestLevel: 15,
    });
  });

  it('clears every saved flash checkpoint', async () => {
    await qualifyFlashChallengeLevel(
      'TimedPhraseRecognition',
      'hard',
      12
    );
    await clearFlashChallengeProgress();
    await expect(
      AsyncStorage.getItem(FLASH_CHALLENGE_STORAGE_KEY)
    ).resolves.toBeNull();
  });

  it('fails closed when a mutation cannot read the existing store', async () => {
    await qualifyFlashChallengeLevel('MemoryRecall', 'medium', 9);
    const existing = await AsyncStorage.getItem(
      FLASH_CHALLENGE_STORAGE_KEY
    );
    const getItem = jest.mocked(AsyncStorage.getItem);
    getItem.mockRejectedValueOnce(new Error('temporary read failure'));

    await expect(
      qualifyFlashChallengeLevel('FlashReading', 'easy', 4)
    ).rejects.toThrow('temporary read failure');

    await expect(
      AsyncStorage.getItem(FLASH_CHALLENGE_STORAGE_KEY)
    ).resolves.toBe(existing);
  });
});
