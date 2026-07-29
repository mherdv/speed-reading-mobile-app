import {
  createRecognitionOptions,
  createVariedSequence,
  generatePhrasePool,
  getPhraseCombinationCount,
  getFlashWordPool,
  selectSimilarDistractors,
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
    expect(getFlashWordPool('easy')).toHaveLength(272);
    expect(getFlashWordPool('medium')).toHaveLength(230);
    expect(getFlashWordPool('hard')).toHaveLength(307);
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
    expect(options.every((option) => option.length === 'pattern'.length)).toBe(
      true
    );
  });

  it('prefers close spelling shapes after matching visible length', () => {
    const closeShapes = [
      'stoke',
      'store',
      'shone',
      'atone',
      'phone',
      'stale',
    ];
    const distractors = selectSimilarDistractors(
      'stone',
      [...closeShapes, 'quick', 'zebra', 'fuzzy', 'vivid', 'plant', 'crown'],
      3,
      seededRandom(19)
    );

    expect(distractors).toHaveLength(3);
    expect(distractors.every((word) => closeShapes.includes(word))).toBe(true);
  });

  it('matches phrase word count and length before randomizing choices', () => {
    const answer = 'careful readers notice subtle patterns';
    const sameShape = [
      'patient readers follow useful signals',
      'focused readers compare clear details',
      'curious readers remember hidden changes',
      'skilled readers examine quiet evidence',
      'active readers question simple claims',
      'steady readers observe small differences',
    ];
    const options = createRecognitionOptions(
      answer,
      [
        ...sameShape,
        'short phrase',
        'a much longer phrase with many extra visible words',
      ],
      4,
      seededRandom(23)
    );

    expect(options).toContain(answer);
    expect(options.every((option) => option.split(/\s+/).length === 5)).toBe(
      true
    );
  });

  it('generates hundreds of different phrase combinations', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(getPhraseCombinationCount(difficulty)).toBe(5_832);
      const phrases = generatePhrasePool(
        difficulty,
        200,
        seededRandom(difficulty.length * 13)
      );
      expect(phrases).toHaveLength(200);
      expect(new Set(phrases).size).toBe(200);
    }
  });

  it('fills a phrase pool even when an injected random source never changes', () => {
    const phrases = generatePhrasePool('hard', 240, () => 0);
    expect(phrases).toHaveLength(240);
    expect(new Set(phrases).size).toBe(240);
  });
});
