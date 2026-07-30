import {
  boundedRandom,
  buildNoReplacementDeck,
  buildRotatingDeck,
  canonicalItemSetSignature,
  randomIndex,
  selectRotatingWindow,
  shuffleAnswerOptions,
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

  it('rotates by a complete session so adjacent windows stay disjoint', () => {
    const source = Array.from({ length: 12 }, (_, index) => index);
    const first = selectRotatingWindow(source, 4, 0);
    const second = selectRotatingWindow(source, 4, 1);
    const third = selectRotatingWindow(source, 4, 2);

    expect(first).toEqual([0, 1, 2, 3]);
    expect(second).toEqual([4, 5, 6, 7]);
    expect(third).toEqual([8, 9, 10, 11]);
    expect(first.filter((value) => second.includes(value))).toEqual([]);
    expect(second.filter((value) => third.includes(value))).toEqual([]);
  });

  it('shuffles a rotating deck without changing its selected members', () => {
    const source = ['a', 'b', 'c', 'd', 'e', 'f'];

    expect(buildRotatingDeck(source, 3, 1, () => 0)).toEqual([
      'e',
      'f',
      'd',
    ]);
    expect(source).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('builds a unique cycle and protects its first item from the prior boundary', () => {
    const source = [
      { id: 'alpha' },
      { id: 'beta' },
      { id: 'gamma' },
      { id: 'delta' },
    ];
    const unprotected = buildNoReplacementDeck(
      source,
      (item) => item.id,
      '',
      () => 0
    );
    const boundaryId = unprotected[0]!.id;
    const protectedDeck = buildNoReplacementDeck(
      source,
      (item) => item.id,
      boundaryId,
      () => 0
    );

    expect(new Set(protectedDeck.map((item) => item.id)).size).toBe(
      source.length
    );
    expect(protectedDeck[0]!.id).not.toBe(boundaryId);
    expect(source.map((item) => item.id)).toEqual([
      'alpha',
      'beta',
      'gamma',
      'delta',
    ]);
  });

  it('preserves the correct answer while shuffling duplicate-safe options', () => {
    const source = ['same', 'correct', 'same', 'other'];
    const result = shuffleAnswerOptions(source, 1, () => 0);

    expect(result.options[result.correctIndex]).toBe('correct');
    expect(result.correctIndex).not.toBe(1);
    expect(result.options).toHaveLength(source.length);
    expect(source).toEqual(['same', 'correct', 'same', 'other']);
  });

  it('rejects invalid answer indexes', () => {
    expect(() => shuffleAnswerOptions([], 0)).toThrow(RangeError);
    expect(() => shuffleAnswerOptions(['only'], 1)).toThrow(RangeError);
  });

  it('compares session members independently of their shuffled order', () => {
    expect(canonicalItemSetSignature(['round-c', 'round-a', 'round-b'])).toBe(
      canonicalItemSetSignature(['round-b', 'round-c', 'round-a'])
    );
    expect(canonicalItemSetSignature(['round-a', 'round-b'])).not.toBe(
      canonicalItemSetSignature(['round-a', 'round-c'])
    );
  });
});
