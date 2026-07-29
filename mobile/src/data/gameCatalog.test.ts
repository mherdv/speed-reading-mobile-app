import { GAME_CATALOG } from './gameCatalog';
import { GAME_IDS } from './gameIds';
import { BASELINE_TEXT_SAMPLES } from './textSamples';
import { getDifficultyOptions } from '../ui/GameDifficultyControl';

describe('game catalog', () => {
  it('exposes the baseline assessment as a clearly named standalone exercise', () => {
    expect(GAME_CATALOG.WpmTest).toMatchObject({
      id: 'WpmTest',
      title: 'Baseline Reading',
      shortDescription: expect.stringContaining('baseline'),
    });
  });

  it('keeps the advertised baseline passage inventory in sync with content', () => {
    const advertisedCount = `${BASELINE_TEXT_SAMPLES.length} reviewed passages`;
    expect(BASELINE_TEXT_SAMPLES).toHaveLength(12);
    expect(
      Object.values(GAME_CATALOG.WpmTest.difficulty).every((option) =>
        option.helper.includes(advertisedCount)
      )
    ).toBe(true);
  });

  it('describes the actual Number and Symbol Hunt challenge bands', () => {
    expect(GAME_CATALOG.NumberRecognition.difficulty).toEqual({
      easy: {
        label: 'Easy',
        helper: '1 digit · 30-item deck · 1.6s response window',
      },
      medium: {
        label: 'Medium',
        helper: '2 digits · 50-item deck · 1.1s response window',
      },
      hard: {
        label: 'Hard',
        helper: '3 similar digits · 70-item deck · 0.7s response window',
      },
    });
    expect(GAME_CATALOG.SymbolRecognition.difficulty).toEqual({
      easy: {
        label: 'Easy',
        helper: '4 distinct symbols · 30-item deck · 1.6s response window',
      },
      medium: {
        label: 'Medium',
        helper: '10 symbols · 50-item deck · 1.1s response window',
      },
      hard: {
        label: 'Hard',
        helper: '6 similar symbols · 70-item deck · 0.7s response window',
      },
    });
  });

  it('contains complete rules and difficulty metadata for every registered game', () => {
    expect(Object.keys(GAME_CATALOG)).toEqual([...GAME_IDS]);

    for (const gameId of GAME_IDS) {
      const entry = GAME_CATALOG[gameId];
      expect(entry.id).toBe(gameId);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.rules).toHaveLength(3);
      expect(entry.rules.every(Boolean)).toBe(true);
      expect(entry.difficulty.easy.label.length).toBeGreaterThan(0);
      expect(entry.difficulty.easy.helper.length).toBeGreaterThan(0);
      expect(entry.difficulty.medium.label.length).toBeGreaterThan(0);
      expect(entry.difficulty.medium.helper.length).toBeGreaterThan(0);
      expect(entry.difficulty.hard.label.length).toBeGreaterThan(0);
      expect(entry.difficulty.hard.helper.length).toBeGreaterThan(0);
      expect(getDifficultyOptions(gameId)).toEqual([
        { value: 'easy', ...entry.difficulty.easy },
        { value: 'medium', ...entry.difficulty.medium },
        { value: 'hard', ...entry.difficulty.hard },
      ]);
    }
  });
});
