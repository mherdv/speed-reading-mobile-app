import {
  measuredElapsedMs,
  reshuffleSchulteGrid,
  shuffleSchulteGrid,
} from './schulteShared';

describe('Schulte shared helpers', () => {
  it('shuffles without mutating the source grid', () => {
    const source = [1, 2, 3, 4];

    expect(shuffleSchulteGrid(source, () => 0)).toEqual([2, 3, 4, 1]);
    expect(source).toEqual([1, 2, 3, 4]);
  });

  it('guarantees a different layout when a random shuffle repeats the grid', () => {
    const source = [1, 2, 3, 4];

    expect(reshuffleSchulteGrid(source, () => 0.999)).toEqual([2, 3, 4, 1]);
  });

  it('measures a rounded, nonnegative monotonic duration', () => {
    expect(measuredElapsedMs(100, () => 1432.4)).toBe(1332);
    expect(measuredElapsedMs(100, () => 90)).toBe(0);
  });
});
