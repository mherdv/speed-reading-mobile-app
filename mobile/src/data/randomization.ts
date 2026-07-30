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
 * Selects a contiguous session-sized window and advances by a complete window
 * on every session. Adjacent sessions therefore do not overlap while enough
 * unused items remain in the source.
 */
export function selectRotatingWindow<T>(
  values: readonly T[],
  count: number,
  sessionOrdinal: number
): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(
      'selectRotatingWindow requires a non-negative integer count'
    );
  }
  if (!Number.isInteger(sessionOrdinal) || sessionOrdinal < 0) {
    throw new RangeError(
      'selectRotatingWindow requires a non-negative integer session ordinal'
    );
  }
  if (values.length === 0 || count === 0) return [];

  const safeCount = Math.min(count, values.length);
  const offset = (sessionOrdinal * safeCount) % values.length;
  return Array.from(
    { length: safeCount },
    (_, index) => values[(offset + index) % values.length]!
  );
}

/**
 * Builds a shuffled practice deck from the next rotating session window.
 * Selection and presentation order are independent, and the source is never
 * mutated.
 */
export function buildRotatingDeck<T>(
  values: readonly T[],
  count: number,
  sessionOrdinal: number,
  random: RandomSource = Math.random
): T[] {
  return shuffleItems(
    selectRotatingWindow(values, count, sessionOrdinal),
    random
  );
}

/**
 * Creates one shuffled no-replacement cycle and protects the join with the
 * previous cycle from an immediate duplicate.
 */
export function buildNoReplacementDeck<T>(
  values: readonly T[],
  getIdentity: (value: T) => string,
  avoidFirstIdentity = '',
  random: RandomSource = Math.random
): T[] {
  const deck = shuffleItems(values, random);
  if (
    deck.length > 1 &&
    getIdentity(deck[0]!) === avoidFirstIdentity
  ) {
    [deck[0], deck[1]] = [deck[1], deck[0]];
  }
  return deck;
}

/**
 * Shuffles answer options and remaps the correct index to the same original
 * option. Original positions are tagged so duplicate option text is safe.
 */
export function shuffleAnswerOptions<T>(
  values: readonly T[],
  correctIndex: number,
  random: RandomSource = Math.random
): { options: T[]; correctIndex: number } {
  if (
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= values.length
  ) {
    throw new RangeError(
      'shuffleAnswerOptions received an invalid correct index'
    );
  }

  const taggedOptions = shuffleItems(
    values.map((value, originalIndex) => ({ value, originalIndex })),
    random
  );
  const remappedCorrectIndex = taggedOptions.findIndex(
    (option) => option.originalIndex === correctIndex
  );

  return {
    options: taggedOptions.map((option) => option.value),
    correctIndex: remappedCorrectIndex,
  };
}

/** Order-independent signature for comparing the exact members of two sets. */
export function canonicalItemSetSignature(values: readonly string[]): string {
  return [...values]
    .sort((first, second) => first.localeCompare(second, 'en'))
    .join('\u0000');
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
