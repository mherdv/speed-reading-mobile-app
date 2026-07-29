import {
  boundedRandom,
  randomIndex,
  shuffleItems,
} from './randomization';

describe('shared randomization', () => {
  it('clamps injected sources to the Math.random half-open interval', () => {
    expect(boundedRandom(() => -1)).toBe(0);
    expect(boundedRandom(() => 1)).toBeLessThan(1);
    expect(boundedRandom(() => Number.NaN)).toBe(0);
    expect(randomIndex(4, () => 1)).toBe(3);
  });

  it('shuffles a copy without losing, duplicating, or mutating items', () => {
    const source = ['alpha', 'beta', 'gamma', 'delta'];
    const shuffled = shuffleItems(source, () => 0);

    expect(source).toEqual(['alpha', 'beta', 'gamma', 'delta']);
    expect(shuffled).not.toBe(source);
    expect(shuffled).toHaveLength(source.length);
    expect(new Set(shuffled)).toEqual(new Set(source));
  });

  it('rejects invalid random-index ranges instead of returning undefined', () => {
    expect(() => randomIndex(0)).toThrow(RangeError);
    expect(() => randomIndex(1.5)).toThrow(RangeError);
  });
});
