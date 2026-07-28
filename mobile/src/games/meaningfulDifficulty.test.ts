import { getComprehensionChallenge } from './ComprehensionTest/ComprehensionTest';
import { getMainIdeaChallenge } from './MainIdeaSprint/MainIdeaSprint';
import { getNumberRecognitionChallenge } from './NumberRecognition/NumberRecognition';
import { getSymbolRecognitionChallenge } from './SymbolRecognition/SymbolRecognition';
import { getWordPairChallenge } from './WordPairs/WordPairs';
import { getVisualSpanConfig } from './VisualSpanExpansion/visualSpanContent';

describe('meaningful difficulty contracts', () => {
  it('changes Main Idea reasoning depth without changing the work count', () => {
    const easy = getMainIdeaChallenge('easy');
    const medium = getMainIdeaChallenge('medium');
    const hard = getMainIdeaChallenge('hard');

    expect([easy.roundCount, medium.roundCount, hard.roundCount]).toEqual([
      2, 2, 2,
    ]);
    expect([easy.inferenceDepth, medium.inferenceDepth, hard.inferenceDepth]).toEqual([
      'explicit',
      'synthesis',
      'qualification',
    ]);
  });

  it('changes comprehension reasoning, pace, and question depth by level', () => {
    const easy = getComprehensionChallenge('easy');
    const medium = getComprehensionChallenge('medium');
    const hard = getComprehensionChallenge('hard');

    expect([easy.questions.length, medium.questions.length, hard.questions.length]).toEqual([
      1, 2, 3,
    ]);
    expect([easy.challenge, medium.challenge, hard.challenge]).toEqual([
      'explicit-detail',
      'idea-linking',
      'inference',
    ]);
    expect(new Set([easy.id, medium.id, hard.id])).toHaveProperty('size', 3);
    expect([easy.targetWpm, medium.targetWpm, hard.targetWpm]).toEqual([
      180, 260, 340,
    ]);
  });

  it('changes Word Pairs vocabulary and distractor similarity, not duration', () => {
    const easy = getWordPairChallenge('easy');
    const medium = getWordPairChallenge('medium');
    const hard = getWordPairChallenge('hard');

    expect([easy.optionCount, medium.optionCount, hard.optionCount]).toEqual([
      2, 3, 4,
    ]);
    expect([
      easy.distractorSimilarity,
      medium.distractorSimilarity,
      hard.distractorSimilarity,
    ]).toEqual(['low', 'medium', 'high']);
    expect([easy.familiarity, medium.familiarity, hard.familiarity]).toEqual([
      'common',
      'less-common',
      'advanced',
    ]);
  });

  it('changes number length and distractor similarity at a constant duration', () => {
    const easy = getNumberRecognitionChallenge('easy');
    const medium = getNumberRecognitionChallenge('medium');
    const hard = getNumberRecognitionChallenge('hard');

    expect([easy.durationMs, medium.durationMs, hard.durationMs]).toEqual([
      30_000, 30_000, 30_000,
    ]);
    expect([easy.digitCount, medium.digitCount, hard.digitCount]).toEqual([
      1, 2, 3,
    ]);
    expect([
      easy.distractorSimilarity,
      medium.distractorSimilarity,
      hard.distractorSimilarity,
    ]).toEqual(['low', 'medium', 'high']);
    expect([
      easy.displayCadenceMs,
      medium.displayCadenceMs,
      hard.displayCadenceMs,
    ]).toEqual([1_600, 1_100, 700]);
  });

  it('changes symbol confusability at a constant duration', () => {
    const easy = getSymbolRecognitionChallenge('easy');
    const medium = getSymbolRecognitionChallenge('medium');
    const hard = getSymbolRecognitionChallenge('hard');

    expect([easy.durationMs, medium.durationMs, hard.durationMs]).toEqual([
      30_000, 30_000, 30_000,
    ]);
    expect([
      easy.distractorSimilarity,
      medium.distractorSimilarity,
      hard.distractorSimilarity,
    ]).toEqual(['low', 'medium', 'high']);
    expect([
      easy.displayCadenceMs,
      medium.displayCadenceMs,
      hard.displayCadenceMs,
    ]).toEqual([1_600, 1_100, 700]);
    expect(hard.symbols).toEqual(expect.arrayContaining(['●', '○', '◉']));
  });

  it('widens Visual Span while reducing display time and adding choices', () => {
    const easy = getVisualSpanConfig('easy');
    const medium = getVisualSpanConfig('medium');
    const hard = getVisualSpanConfig('hard');

    expect([easy.spanSize, medium.spanSize, hard.spanSize]).toEqual([3, 5, 7]);
    expect([easy.displayMs, medium.displayMs, hard.displayMs]).toEqual([
      1_600, 1_200, 850,
    ]);
    expect([easy.optionCount, medium.optionCount, hard.optionCount]).toEqual([
      3, 4, 5,
    ]);
    expect([easy.spread, medium.spread, hard.spread]).toEqual([
      'compact',
      'standard',
      'wide',
    ]);
  });
});
