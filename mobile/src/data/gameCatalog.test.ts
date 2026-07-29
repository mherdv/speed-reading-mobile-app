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
