import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadGameProgress,
  saveGameProgress,
  updateProgress,
  waitForProgressUpdates,
  updateTwoSessionDifficultySuggestion,
  clearProgress,
  levelToDifficulty,
  difficultyToLevel,
  levelToStars,
  MAX_LEVEL,
  beginNonCalibratingProgressSession,
  describeAdaptiveProgress,
  type GameProgress,
} from '../progressStore';
import { saveDifficultyPreference } from '../difficultyPreferences';

describe('progressStore', () => {
  async function enableAdaptive(gameId: string) {
    await saveDifficultyPreference(gameId, {
      mode: 'adaptive',
      difficulty: 'easy',
    });
  }

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('loadGameProgress', () => {
    it('returns default progress for new game', async () => {
      const progress = await loadGameProgress('TestGame');
      expect(progress).toEqual({
        level: 1,
        streak: 0,
        totalPlays: 0,
      });
    });

    it('uses default progress when local storage is unavailable', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(
        new Error('storage unavailable')
      );

      await expect(loadGameProgress('TestGame')).resolves.toEqual({
        level: 1,
        streak: 0,
        totalPlays: 0,
      });
    });

    it('returns saved progress for existing game', async () => {
      const savedProgress: GameProgress = {
        level: 5,
        streak: 3,
        totalPlays: 10,
        bestScore: 100,
      };
      await saveGameProgress('TestGame', savedProgress);

      const progress = await loadGameProgress('TestGame');
      expect(progress.level).toBe(5);
      expect(progress.streak).toBe(3);
      expect(progress.totalPlays).toBe(10);
      expect(progress.bestScore).toBe(100);
    });
  });

  describe('updateProgress', () => {
    it('explains exactly how adaptive level changes work', () => {
      expect(
        describeAdaptiveProgress({ level: 1, streak: 1, totalPlays: 8 })
      ).toBe('1 more at-target session in a row to raise the difficulty');
      expect(
        describeAdaptiveProgress({ level: 6, streak: -1, totalPlays: 8 })
      ).toBe(
        '1 more below-target session in a row before the difficulty is reduced'
      );
    });

    it('increments the qualification run for an adaptive session', async () => {
      await enableAdaptive('TestGame');
      const { progress } = await updateProgress('TestGame', true);
      expect(progress.streak).toBe(1);
      expect(progress.totalPlays).toBe(1);
    });

    it('serializes concurrent completions so neither progress update is lost', async () => {
      await enableAdaptive('TestGame');

      await Promise.all([
        updateProgress('TestGame', true, 40, 'easy'),
        updateProgress('TestGame', true, 60, 'easy'),
      ]);
      await waitForProgressUpdates();

      await expect(loadGameProgress('TestGame')).resolves.toEqual(
        expect.objectContaining({
          level: 6,
          streak: 0,
          totalPlays: 2,
          bestScore: 60,
        })
      );
    });

    it('keeps one-off exact replay out of the saved Adaptive run', async () => {
      await enableAdaptive('TestGame');
      await saveGameProgress('TestGame', {
        level: 6,
        streak: 1,
        totalPlays: 4,
        bestScore: 40,
        adaptiveQualificationDifficulty: 'medium',
      });

      const endSession = beginNonCalibratingProgressSession('TestGame');
      const { progress, levelChanged } = await updateProgress(
        'TestGame',
        true,
        90,
        'medium'
      );
      endSession();

      expect(progress).toMatchObject({
        level: 6,
        streak: 1,
        totalPlays: 5,
        bestScore: 90,
        adaptiveQualificationDifficulty: 'medium',
      });
      expect(levelChanged).toBe(false);

      const nextAdaptive = await updateProgress(
        'TestGame',
        true,
        95,
        'medium'
      );
      expect(nextAdaptive.progress).toMatchObject({
        level: 11,
        streak: 0,
        totalPlays: 6,
        bestScore: 95,
      });
    });

    it('bounds navigation waits when a progress write stalls', async () => {
      jest.useFakeTimers();
      const originalSetItem = (
        AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>
      ).getMockImplementation();
      if (!originalSetItem) {
        throw new Error('AsyncStorage test mock must provide setItem');
      }
      let signalWrite: (() => void) | undefined;
      let releaseWrite: (() => void) | undefined;
      const writeStarted = new Promise<void>((resolve) => {
        signalWrite = resolve;
      });
      jest.spyOn(AsyncStorage, 'setItem').mockImplementation(
        async (key, value) => {
          if (key === 'speed-reading:progress:v1' && !releaseWrite) {
            signalWrite?.();
            await new Promise<void>((resolve) => {
              releaseWrite = resolve;
            });
          }
          await originalSetItem(key, value);
        }
      );

      const update = updateProgress('TestGame', true, 20);
      await writeStarted;
      const wait = waitForProgressUpdates(25);
      jest.advanceTimersByTime(25);
      await expect(wait).resolves.toBeUndefined();

      releaseWrite?.();
      await update;
      jest.useRealTimers();
    });

    it('raises the difficulty band after two consecutive at-target sessions', async () => {
      await enableAdaptive('TestGame');
      await updateProgress('TestGame', true);
      const { progress, levelChanged, levelDelta } = await updateProgress('TestGame', true);
      
      expect(progress.level).toBe(6);
      expect(progress.streak).toBe(0);
      expect(levelChanged).toBe(true);
      expect(levelDelta).toBe(1);
    });

    it('does not exceed MAX_LEVEL', async () => {
      await enableAdaptive('TestGame');
      await saveGameProgress('TestGame', {
        level: MAX_LEVEL,
        streak: 1,
        totalPlays: 100,
      });

      const { progress } = await updateProgress('TestGame', true);
      expect(progress.level).toBeLessThanOrEqual(MAX_LEVEL);
      expect(levelToDifficulty(progress.level)).toBe('hard');
    });

    it('starts a below-target run after an adaptive miss', async () => {
      await enableAdaptive('TestGame');
      await saveGameProgress('TestGame', {
        level: 6,
        streak: 1,
        totalPlays: 10,
      });

      const { progress } = await updateProgress('TestGame', false, undefined, 'medium');
      expect(progress.streak).toBe(-1);
    });

    it('reduces the difficulty band after two consecutive below-target sessions', async () => {
      await enableAdaptive('TestGame');
      await saveGameProgress('TestGame', {
        level: 6,
        streak: 0,
        totalPlays: 10,
      });

      await updateProgress('TestGame', false, undefined, 'medium');
      const { progress, levelChanged, levelDelta } = await updateProgress(
        'TestGame',
        false,
        undefined,
        'medium'
      );

      expect(progress.level).toBe(1);
      expect(levelChanged).toBe(true);
      expect(levelDelta).toBe(-1);
      expect(progress.streak).toBe(0);
    });

    it('does not go below level 1', async () => {
      await enableAdaptive('TestGame');
      await saveGameProgress('TestGame', {
        level: 1,
        streak: -1,
        totalPlays: 10,
      });

      const { progress } = await updateProgress('TestGame', false);
      expect(progress.level).toBe(1);
    });

    it('never changes the adaptive band after a manual session', async () => {
      await saveDifficultyPreference('TestGame', {
        mode: 'manual',
        difficulty: 'hard',
      });
      await saveGameProgress('TestGame', {
        level: 6,
        streak: 1,
        totalPlays: 4,
        bestScore: 80,
        adaptiveQualificationDifficulty: 'easy',
      });

      const { progress, levelChanged } = await updateProgress(
        'TestGame',
        true,
        100,
        'hard'
      );

      expect(levelChanged).toBe(false);
      expect(progress).toEqual(
        expect.objectContaining({
          level: 6,
          streak: 1,
          totalPlays: 5,
          bestScore: 100,
          adaptiveQualificationDifficulty: 'easy',
          lastPlayedAt: expect.any(String),
        })
      );
    });

    it('updates best score when higher', async () => {
      await updateProgress('TestGame', true, 50);
      let { progress } = await updateProgress('TestGame', true, 100);
      expect(progress.bestScore).toBe(100);

      ({ progress } = await updateProgress('TestGame', true, 80));
      expect(progress.bestScore).toBe(100); // Still 100 (higher)
    });

    it('sets lastPlayedAt timestamp', async () => {
      const before = new Date().toISOString();
      const { progress } = await updateProgress('TestGame', true);
      const after = new Date().toISOString();

      expect(progress.lastPlayedAt).toBeDefined();
      expect(progress.lastPlayedAt! >= before).toBe(true);
      expect(progress.lastPlayedAt! <= after).toBe(true);
    });

    it.each([
      'FlashReading',
      'NumberRecognition',
      'NumberSearch',
      'SymbolRecognition',
      'TimedPhraseRecognition',
      'WordPairs',
    ])(
      'moves %s across the persisted Easy-to-Medium threshold for its next session',
      async (gameId) => {
        await enableAdaptive(gameId);
        await saveGameProgress(gameId, {
          level: 1,
          streak: 1,
          totalPlays: 24,
          adaptiveQualificationDifficulty: 'easy',
        });

        const { progress, levelChanged } = await updateProgress(
          gameId,
          true,
          100
        );

        expect(levelChanged).toBe(true);
        expect(progress.level).toBe(6);
        expect(levelToDifficulty(progress.level)).toBe('medium');
        await expect(loadGameProgress(gameId)).resolves.toEqual(
          expect.objectContaining({ level: 6, totalPlays: 25 })
        );
      }
    );
  });

  describe('two-session reading-skill suggestion', () => {
    it('suggests the next band only after two threshold sessions', async () => {
      await enableAdaptive('EvidenceHunt');
      const first = await updateTwoSessionDifficultySuggestion(
        'EvidenceHunt',
        'easy',
        true,
        85
      );
      expect(first.suggestedDifficulty).toBe('easy');
      const second = await updateTwoSessionDifficultySuggestion(
        'EvidenceHunt',
        'easy',
        true,
        90
      );
      expect(second.suggestedDifficulty).toBe('medium');
      expect(second.progress.level).toBe(6);
    });

    it('resets the qualifying run after a below-threshold session', async () => {
      await enableAdaptive('ContextBuilder');
      await updateTwoSessionDifficultySuggestion(
        'ContextBuilder',
        'easy',
        true
      );
      await updateTwoSessionDifficultySuggestion(
        'ContextBuilder',
        'easy',
        false
      );
      const third = await updateTwoSessionDifficultySuggestion(
        'ContextBuilder',
        'easy',
        true
      );
      expect(third.suggestedDifficulty).toBe('easy');
      expect(third.progress.streak).toBe(1);
    });

    it('does not combine qualifying sessions played at different difficulties', async () => {
      await enableAdaptive('ContextBuilder');
      const easy = await updateTwoSessionDifficultySuggestion(
        'ContextBuilder',
        'easy',
        true
      );
      expect(easy.progress.streak).toBe(1);
      const medium = await updateTwoSessionDifficultySuggestion(
        'ContextBuilder',
        'medium',
        true
      );
      expect(medium.suggestedDifficulty).toBe('medium');
      expect(medium.progress.streak).toBe(1);
      expect(medium.progress.adaptiveQualificationDifficulty).toBe('medium');
      const secondMedium = await updateTwoSessionDifficultySuggestion(
        'ContextBuilder',
        'medium',
        true
      );
      expect(secondMedium.suggestedDifficulty).toBe('hard');
    });
  });

  describe('levelToDifficulty', () => {
    it('returns easy for levels 1-5', () => {
      expect(levelToDifficulty(1)).toBe('easy');
      expect(levelToDifficulty(3)).toBe('easy');
      expect(levelToDifficulty(5)).toBe('easy');
    });

    it('returns medium for levels 6-10', () => {
      expect(levelToDifficulty(6)).toBe('medium');
      expect(levelToDifficulty(8)).toBe('medium');
      expect(levelToDifficulty(10)).toBe('medium');
    });

    it('returns hard for levels 11-15', () => {
      expect(levelToDifficulty(11)).toBe('hard');
      expect(levelToDifficulty(13)).toBe('hard');
      expect(levelToDifficulty(15)).toBe('hard');
    });
  });

  describe('difficultyToLevel', () => {
    it('returns base level for each difficulty', () => {
      expect(difficultyToLevel('easy')).toBe(1);
      expect(difficultyToLevel('medium')).toBe(6);
      expect(difficultyToLevel('hard')).toBe(11);
    });
  });

  describe('levelToStars', () => {
    it('returns 0 stars for level 1', () => {
      expect(levelToStars(1)).toBe(0);
    });

    it('returns 1 star for levels 2-4', () => {
      expect(levelToStars(2)).toBe(1);
      expect(levelToStars(3)).toBe(1);
      expect(levelToStars(4)).toBe(1);
    });

    it('returns 2 stars for levels 5-7', () => {
      expect(levelToStars(5)).toBe(2);
      expect(levelToStars(6)).toBe(2);
      expect(levelToStars(7)).toBe(2);
    });

    it('returns 3 stars for levels 8-10', () => {
      expect(levelToStars(8)).toBe(3);
      expect(levelToStars(9)).toBe(3);
      expect(levelToStars(10)).toBe(3);
    });

    it('returns 4 stars for levels 11-13', () => {
      expect(levelToStars(11)).toBe(4);
      expect(levelToStars(12)).toBe(4);
      expect(levelToStars(13)).toBe(4);
    });

    it('returns 5 stars for levels 14-15', () => {
      expect(levelToStars(14)).toBe(5);
      expect(levelToStars(15)).toBe(5);
    });
  });

  describe('clearProgress', () => {
    it('removes all progress data', async () => {
      await updateProgress('TestGame1', true);
      await updateProgress('TestGame2', true);

      await clearProgress();

      const progress1 = await loadGameProgress('TestGame1');
      const progress2 = await loadGameProgress('TestGame2');

      expect(progress1.totalPlays).toBe(0);
      expect(progress2.totalPlays).toBe(0);
    });

    it('orders racing updates around clearProgress by invocation', async () => {
      const originalSetItem = (
        AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>
      ).getMockImplementation();
      if (!originalSetItem) {
        throw new Error('AsyncStorage test mock must provide setItem');
      }
      let releaseFirstWrite: (() => void) | undefined;
      let signalFirstWrite: (() => void) | undefined;
      const firstWriteStarted = new Promise<void>((resolve) => {
        signalFirstWrite = resolve;
      });
      let shouldBlockFirstProgressWrite = true;

      jest.spyOn(AsyncStorage, 'setItem').mockImplementation(
        async (key, value) => {
          if (
            key === 'speed-reading:progress:v1' &&
            shouldBlockFirstProgressWrite
          ) {
            shouldBlockFirstProgressWrite = false;
            signalFirstWrite?.();
            await new Promise<void>((resolve) => {
              releaseFirstWrite = resolve;
            });
          }
          await originalSetItem(key, value);
        }
      );

      const beforeClear = updateProgress('TestGame', true, 10);
      await firstWriteStarted;
      const clear = clearProgress();
      const afterClear = updateProgress('TestGame', true, 20);

      releaseFirstWrite?.();
      await Promise.all([beforeClear, clear, afterClear]);
      await waitForProgressUpdates();

      await expect(loadGameProgress('TestGame')).resolves.toEqual(
        expect.objectContaining({
          totalPlays: 1,
          bestScore: 20,
        })
      );
    });
  });
});
