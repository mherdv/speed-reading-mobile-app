export type RandomSource = () => number;

/**
 * Keeps injected random sources inside the same half-open interval as
 * Math.random. This makes seeded and boundary-focused tests safe as well.
 */
export function boundedRandom(random: RandomSource = Math.random): number {
  const value = random();
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999_999_999, value));
}

export function randomIndex(
  length: number,
  random: RandomSource = Math.random
): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError('randomIndex requires a positive integer length');
  }
  return Math.floor(boundedRandom(random) * length);
}

/** Unbiased Fisher–Yates copy; the input array is never mutated. */
export function shuffleItems<T>(
  values: readonly T[],
  random: RandomSource = Math.random
): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1, random);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
