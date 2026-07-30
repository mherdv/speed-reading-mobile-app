import type { Difficulty } from './difficultyPreferences';
import {
  getWpmTestPool,
  validateWpmTestPool,
} from './wpmTestContent';

export type ComprehensionQuestion = {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
  type?: 'main-idea' | 'detail-evidence' | 'inference-purpose';
  rationale?: string;
  answerDependency?: 'passage-required';
};

export type ComprehensionPassage = {
  /** Stable ID of the underlying non-baseline training TextSample. */
  sampleId: string;
  contentVersion: number;
  /** Difficulty-specific paced variant ID used only inside this exercise. */
  id: string;
  difficulty: Difficulty;
  challenge: 'explicit-detail' | 'idea-linking' | 'inference';
  targetWpm: number;
  chunkSize: number;
  text: string;
  questions: ComprehensionQuestion[];
  source: 'TEXT_SAMPLES';
};

const CHALLENGE_BY_DIFFICULTY = {
  easy: 'explicit-detail',
  medium: 'idea-linking',
  hard: 'inference',
} as const;

const TARGET_WPM = {
  easy: 180,
  medium: 260,
  hard: 340,
} as const;

const CHUNK_SIZE = {
  easy: 3,
  medium: 4,
  hard: 5,
} as const;

function buildPool(difficulty: Difficulty): ComprehensionPassage[] {
  return getWpmTestPool(difficulty).map(({ sample, questions }) => ({
    sampleId: sample.id,
    contentVersion: sample.version ?? 1,
    id: `comprehension-${difficulty}-${sample.id}`,
    difficulty,
    challenge: CHALLENGE_BY_DIFFICULTY[difficulty],
    targetWpm: TARGET_WPM[difficulty],
    chunkSize: CHUNK_SIZE[difficulty],
    text: sample.text,
    questions: questions.map((question) => ({
      id: question.id,
      question: question.prompt,
      options: [...question.choices],
      correctIndex: question.correctIndex,
      type: question.type,
      rationale: question.rationale,
      answerDependency: question.answerDependency,
    })),
    source: 'TEXT_SAMPLES' as const,
  }));
}

export const COMPREHENSION_PASSAGE_POOLS: Record<
  Difficulty,
  readonly ComprehensionPassage[]
> = {
  easy: buildPool('easy'),
  medium: buildPool('medium'),
  hard: buildPool('hard'),
};

/** First item retained as a compatibility view for older imports/tests. */
export const COMPREHENSION_PASSAGES: Record<Difficulty, ComprehensionPassage> = {
  easy: COMPREHENSION_PASSAGE_POOLS.easy[0]!,
  medium: COMPREHENSION_PASSAGE_POOLS.medium[0]!,
  hard: COMPREHENSION_PASSAGE_POOLS.hard[0]!,
};

export function validateComprehensionPassages(): string[] {
  const errors = validateWpmTestPool().map(
    (error) => `source pool: ${error}`
  );
  const allSampleIds = new Set<string>();
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const pool = COMPREHENSION_PASSAGE_POOLS[difficulty];
    const expectedQuestions =
      difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    if (
      pool.length !== 10 ||
      new Set(pool.map((item) => item.id)).size !== 10
    ) {
      errors.push(`${difficulty}: exactly ten distinct passages required`);
    }
    for (const item of pool) {
      if (allSampleIds.has(item.sampleId)) {
        errors.push(`${item.id}: passage cannot appear in multiple levels`);
      }
      allSampleIds.add(item.sampleId);
      if (!item.sampleId || !item.id.endsWith(item.sampleId)) {
        errors.push(`${item.id}: missing underlying sample identity`);
      }
      if (item.questions.length !== expectedQuestions) {
        errors.push(`${item.id}: expected ${expectedQuestions} questions`);
      }
      if (
        item.questions.some(
          (question) =>
            !question.id ||
            !question.type ||
            !question.rationale?.trim() ||
            question.answerDependency !== 'passage-required' ||
            question.options.length !== 4 ||
            new Set(
              question.options.map((option) =>
                option.trim().toLocaleLowerCase('en')
              )
            ).size !== 4 ||
            question.correctIndex < 0 ||
            question.correctIndex >= question.options.length
        )
      ) {
        errors.push(`${item.id}: invalid passage-dependent question`);
      }
    }
  }
  if (allSampleIds.size !== 30) {
    errors.push('Paced Comprehension requires thirty disjoint passage IDs');
  }
  return errors;
}
