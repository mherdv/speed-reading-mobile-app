import {
  ADVANCED_WORDS,
  BEGINNER_WORDS,
  INTERMEDIATE_WORDS,
  WORD_PAIRS,
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
});
