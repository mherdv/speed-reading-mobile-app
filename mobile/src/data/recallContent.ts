import type { Difficulty } from './difficultyPreferences';
import {
  generatePhrasePool,
  getFlashWordPool,
  uniqueStrings,
} from './flashPracticeContent';

export type RecallConfig = {
  displayMs: number;
  roundCount: number;
};

export const WORDS_RECALL_CONFIG: Record<Difficulty, RecallConfig> = {
  easy: { displayMs: 1_600, roundCount: 8 },
  medium: { displayMs: 1_100, roundCount: 8 },
  hard: { displayMs: 700, roundCount: 8 },
};

export const SENTENCE_RECALL_CONFIG: Record<Difficulty, RecallConfig> = {
  easy: { displayMs: 2_200, roundCount: 8 },
  medium: { displayMs: 1_600, roundCount: 8 },
  hard: { displayMs: 1_100, roundCount: 8 },
};

/**
 * Builds a no-replacement deck of prompts that always contain exactly two
 * English words. Difficulty changes vocabulary and exposure time, never the
 * number of words the learner must recall.
 */
export function createWordsRecallPool(
  difficulty: Difficulty,
  count = 120
): string[] {
  if (count <= 0) return [];
  const words = uniqueStrings(getFlashWordPool(difficulty)).filter(
    (word) => !/\s/u.test(word)
  );
  const pairs: string[] = [];
  for (
    let offset = 1;
    offset < words.length && pairs.length < count;
    offset += 1
  ) {
    for (
      let firstIndex = 0;
      firstIndex < words.length && pairs.length < count;
      firstIndex += 1
    ) {
      const secondIndex = (firstIndex + offset) % words.length;
      pairs.push(`${words[firstIndex]} ${words[secondIndex]}`);
    }
  }
  if (pairs.length !== count) {
    throw new RangeError(
      `${difficulty}: cannot build ${count} unique two-word recall prompts`
    );
  }
  return pairs;
}

/**
 * Original, generated English practice sentences assembled from the app's
 * reviewed phrase templates. The combinations are not copied from a course or
 * competitor, and each session draws without immediate repetition.
 */
export function createSentenceRecallPool(
  difficulty: Difficulty,
  count = 240
): string[] {
  return uniqueStrings(generatePhrasePool(difficulty, count)).map(
    (sentence) => `${sentence.replace(/[.!?]+$/u, '')}.`
  );
}

export function normalizeRecallAnswer(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateRecallPools(): string[] {
  const errors: string[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const wordPairs = createWordsRecallPool(difficulty);
    if (wordPairs.length !== 120) {
      errors.push(`${difficulty}: Words Recall requires exactly 120 prompts`);
    }
    if (new Set(wordPairs.map(normalizeRecallAnswer)).size !== 120) {
      errors.push(`${difficulty}: Words Recall prompts must be unique`);
    }
    if (
      wordPairs.some(
        (pair) => normalizeRecallAnswer(pair).split(' ').length !== 2
      )
    ) {
      errors.push(`${difficulty}: every Words Recall prompt must contain two words`);
    }

    const sentences = createSentenceRecallPool(difficulty);
    if (sentences.length < 100) {
      errors.push(`${difficulty}: sentence recall pool is too small`);
    }
    if (new Set(sentences.map(normalizeRecallAnswer)).size !== sentences.length) {
      errors.push(`${difficulty}: sentence recall prompts must be unique`);
    }
  }
  return errors;
}
