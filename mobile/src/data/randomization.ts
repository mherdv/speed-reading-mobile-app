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

/**
 * Produces a randomized recognition deck made of independently oriented
 * target/non-target pairs. Every even prefix is exactly 50/50 and every odd
 * prefix differs by only one trial, so neither repeated response can reach the
 * progression threshold once both trial types have appeared.
 */
export function interleaveBalancedTrials<T>(
  targets: readonly T[],
  nonTargets: readonly T[],
  random: RandomSource = Math.random
): T[] {
  if (targets.length !== nonTargets.length) {
    throw new RangeError(
      'interleaveBalancedTrials requires equal target and non-target counts'
    );
  }

  const shuffledTargets = shuffleItems(targets, random);
  const shuffledNonTargets = shuffleItems(nonTargets, random);
  const result: T[] = [];

  shuffledTargets.forEach((target, index) => {
    const nonTarget = shuffledNonTargets[index]!;
    if (randomIndex(2, random) === 0) {
      result.push(target, nonTarget);
    } else {
      result.push(nonTarget, target);
    }
  });

  return result;
}
