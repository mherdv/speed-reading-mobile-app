import {
  ADVANCED_WORDS,
  BEGINNER_WORDS,
  INTERMEDIATE_WORDS,
  WORD_PAIRS,
  getRandomWordPairs,
  getRandomWords,
} from './vocabulary';

describe('reviewed vocabulary pools', () => {
  it.each([
    ['easy', BEGINNER_WORDS],
    ['medium', INTERMEDIATE_WORDS],
    ['hard', ADVANCED_WORDS],
  ])('%s pool has no case-insensitive duplicates', (_name, words) => {
    expect(new Set(words.map((word) => word.toLocaleLowerCase('en'))).size).toBe(
      words.length
    );
  });

  it('removes forward/reverse duplicate pairs from the legacy pair export', () => {
    const keys = WORD_PAIRS.map(([first, second]) =>
      [first, second].sort().join('\u0000')
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('meets the expanded reviewed inventory at every level', () => {
    expect(BEGINNER_WORDS.length).toBeGreaterThanOrEqual(360);
    expect(INTERMEDIATE_WORDS.length).toBeGreaterThanOrEqual(300);
    expect(ADVANCED_WORDS.length).toBeGreaterThanOrEqual(380);
  });

  it('keeps difficulty banks disjoint so progression introduces fresh words', () => {
    const easy = new Set(
      BEGINNER_WORDS.map((word) => word.toLocaleLowerCase('en'))
    );
    const medium = new Set(
      INTERMEDIATE_WORDS.map((word) => word.toLocaleLowerCase('en'))
    );
    const hard = new Set(
      ADVANCED_WORDS.map((word) => word.toLocaleLowerCase('en'))
    );

    expect([...easy].filter((word) => medium.has(word) || hard.has(word))).toEqual(
      []
    );
    expect([...medium].filter((word) => hard.has(word))).toEqual([]);
  });

  it('draws deterministic samples without random-sort bias or source mutation', () => {
    const easySnapshot = [...BEGINNER_WORDS];
    const words = getRandomWords(25, 'easy', () => 0);
    const pairs = getRandomWordPairs(25, () => 1);

    expect(words).toHaveLength(25);
    expect(new Set(words).size).toBe(25);
    expect(pairs).toHaveLength(25);
    expect(new Set(pairs.map((pair) => pair.join('\u0000'))).size).toBe(25);
    expect(BEGINNER_WORDS).toEqual(easySnapshot);
  });
});
