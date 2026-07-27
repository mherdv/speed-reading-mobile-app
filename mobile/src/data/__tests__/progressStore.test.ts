import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadGameProgress,
  saveGameProgress,
  updateProgress,
  updateTwoSessionDifficultySuggestion,
  clearProgress,
  levelToDifficulty,
  difficultyToLevel,
  levelToStars,
  MAX_LEVEL,
  type GameProgress,
} from '../progressStore';

describe('progressStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
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
    it('increments streak on correct answer', async () => {
      const { progress } = await updateProgress('TestGame', true);
      expect(progress.streak).toBe(1);
      expect(progress.totalPlays).toBe(1);
    });

    it('levels up after 5 consecutive correct answers', async () => {
      // Play 5 correct games
      for (let i = 0; i < 4; i++) {
        await updateProgress('TestGame', true);
      }
      const { progress, levelChanged, levelDelta } = await updateProgress('TestGame', true);
      
      expect(progress.level).toBe(2);
      expect(progress.streak).toBe(0); // Reset after level up
      expect(levelChanged).toBe(true);
      expect(levelDelta).toBe(1);
    });

    it('does not exceed MAX_LEVEL', async () => {
      // Set progress to max level
      await saveGameProgress('TestGame', {
        level: MAX_LEVEL,
        streak: 4,
        totalPlays: 100,
      });

      const { progress } = await updateProgress('TestGame', true);
      expect(progress.level).toBe(MAX_LEVEL); // Still at max
    });

    it('decrements streak on wrong answer', async () => {
      // Start with some positive streak
      await saveGameProgress('TestGame', {
        level: 5,
        streak: 2,
        totalPlays: 10,
      });

      const { progress } = await updateProgress('TestGame', false);
      expect(progress.streak).toBe(-1); // Positive streak resets to -1
    });

    it('levels down after 3 consecutive failures', async () => {
      await saveGameProgress('TestGame', {
        level: 5,
        streak: 0,
        totalPlays: 10,
      });

      // 3 failures should trigger level down
      await updateProgress('TestGame', false); // streak: -1
      await updateProgress('TestGame', false); // streak: -2
      const { progress, levelChanged, levelDelta } = await updateProgress('TestGame', false); // streak: -3, level down

      expect(progress.level).toBe(4);
      expect(levelChanged).toBe(true);
      expect(levelDelta).toBe(-1);
      expect(progress.streak).toBe(0); // Reset after level down
    });

    it('does not go below level 1', async () => {
      await saveGameProgress('TestGame', {
        level: 1,
        streak: -2,
        totalPlays: 10,
      });

      const { progress } = await updateProgress('TestGame', false);
      expect(progress.level).toBe(1); // Cannot go below 1
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
        await saveGameProgress(gameId, {
          level: 5,
          streak: 4,
          totalPlays: 24,
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
    });

    it('does not combine qualifying sessions played at different difficulties', async () => {
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
      expect(medium.suggestedDifficulty).toBe('easy');
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
  });
});
