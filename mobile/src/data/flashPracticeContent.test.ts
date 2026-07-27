import {
  createRecognitionOptions,
  createVariedSequence,
  generatePhrasePool,
  getFlashWordPool,
  uniqueStrings,
} from './flashPracticeContent';

function seededRandom(seed = 1) {
  let value = seed;
  return () => {
    value = (value * 48271) % 0x7fffffff;
    return value / 0x7fffffff;
  };
}

describe('flash practice content', () => {
  it('deduplicates source words without changing their first spelling', () => {
    expect(uniqueStrings(['Focus', 'focus', '', ' read '])).toEqual([
      'Focus',
      'read',
    ]);
  });

  it('creates long varied sequences without immediate repeats', () => {
    const sequence = createVariedSequence(
      ['alpha', 'beta', 'gamma'],
      12,
      'alpha',
      seededRandom(7)
    );

    expect(sequence).toHaveLength(12);
    for (let index = 1; index < sequence.length; index += 1) {
      expect(sequence[index]).not.toBe(sequence[index - 1]);
    }
    expect(sequence[0]).not.toBe('alpha');
  });

  it('provides large unique word banks for every difficulty', () => {
    expect(getFlashWordPool('easy').length).toBeGreaterThan(80);
    expect(getFlashWordPool('medium').length).toBeGreaterThan(100);
    expect(getFlashWordPool('hard').length).toBeGreaterThan(180);
  });

  it('builds four unique, length-similar recognition options', () => {
    const options = createRecognitionOptions(
      'pattern',
      ['pattern'],
      4,
      seededRandom(11)
    );
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain('pattern');
  });

  it('generates hundreds of different phrase combinations', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const phrases = generatePhrasePool(
        difficulty,
        200,
        seededRandom(difficulty.length * 13)
      );
      expect(phrases).toHaveLength(200);
      expect(new Set(phrases).size).toBe(200);
    }
  });
});
