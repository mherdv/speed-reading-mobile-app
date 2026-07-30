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
  requestedCount?: number
): string[] {
  const words = uniqueStrings(getFlashWordPool(difficulty)).filter(
    (word) => !/\s/u.test(word)
  );
  const count = requestedCount ?? words.length;
  if (count <= 0) return [];
  if (words.length < 2 || count > words.length * (words.length - 1)) {
    throw new RangeError(
      `${difficulty}: cannot build ${count} unique two-word recall prompts`
    );
  }

  const pairs: string[] = [];
  const cycles = Math.ceil(count / words.length);
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const itemsInCycle = Math.min(words.length, count - pairs.length);
    for (let position = 0; position < itemsInCycle; position += 1) {
      // A shortened requested pool samples first words evenly across the full
      // source instead of exposing only an early vocabulary prefix.
      const firstIndex =
        itemsInCycle === words.length
          ? position
          : itemsInCycle === 1
            ? 0
            : Math.round(
                (position * (words.length - 1)) / (itemsInCycle - 1)
              );
      const secondIndex = (firstIndex + cycle + 1) % words.length;
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
    const sourceWords = uniqueStrings(getFlashWordPool(difficulty)).filter(
      (word) => !/\s/u.test(word)
    );
    if (wordPairs.length !== sourceWords.length) {
      errors.push(
        `${difficulty}: Words Recall requires one rotating prompt per source word`
      );
    }
    if (
      new Set(wordPairs.map(normalizeRecallAnswer)).size !== wordPairs.length
    ) {
      errors.push(`${difficulty}: Words Recall prompts must be unique`);
    }
    if (
      wordPairs.some(
        (pair) => normalizeRecallAnswer(pair).split(' ').length !== 2
      )
    ) {
      errors.push(`${difficulty}: every Words Recall prompt must contain two words`);
    }
    const coveredWords = new Set(
      wordPairs.flatMap((pair) => normalizeRecallAnswer(pair).split(' '))
    );
    if (
      sourceWords.some(
        (word) => !coveredWords.has(normalizeRecallAnswer(word))
      )
    ) {
      errors.push(
        `${difficulty}: Words Recall prompts must cover the full source vocabulary`
      );
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
