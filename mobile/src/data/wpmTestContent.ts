import type { TextSample } from '../domain/types';
import type { Difficulty } from './difficultyPreferences';
import { BASELINE_TEXT_SAMPLES, TEXT_SAMPLES } from './textSamples';

export type WpmQuestion = {
  id: string;
  prompt: string;
  choices: readonly string[];
  correctIndex: number;
  type: 'main-idea' | 'detail-evidence' | 'inference-purpose';
  rationale: string;
  answerDependency: 'passage-required';
};

export type WpmTestItem = {
  sample: TextSample;
  questions: readonly WpmQuestion[];
};

function legacyQuestion(sample: TextSample): WpmQuestion {
  return {
    id: `${sample.id}-legacy-question`,
    prompt: sample.question.prompt,
    choices: sample.question.choices,
    correctIndex: sample.question.correctIndex,
    type: sample.question.type ?? 'main-idea',
    rationale:
      sample.question.rationale ??
      'The keyed answer follows from the connected passage.',
    answerDependency: 'passage-required',
  };
}

function questionsFor(sample: TextSample): readonly WpmQuestion[] {
  return sample.questions ?? [legacyQuestion(sample)];
}

/**
 * WPM Test reuses the app's original reviewed TEXT_SAMPLES. Easy uses a broad
 * one-question passage pool; medium and hard use the versioned baseline set
 * with two and three passage-dependent questions respectively.
 */
export function getWpmTestPool(difficulty: Difficulty): WpmTestItem[] {
  if (difficulty === 'easy') {
    return TEXT_SAMPLES.slice(3, 12).map((sample) => ({
      sample,
      questions: [legacyQuestion(sample)],
    }));
  }

  const questionCount = difficulty === 'medium' ? 2 : 3;
  return BASELINE_TEXT_SAMPLES.map((sample) => ({
    sample,
    questions: questionsFor(sample).slice(0, questionCount),
  }));
}

export function validateWpmTestPool(): string[] {
  const errors: string[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const items = getWpmTestPool(difficulty);
    const expectedQuestions =
      difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    if (new Set(items.map((item) => item.sample.id)).size < 3) {
      errors.push(`${difficulty}: at least three passages required`);
    }
    for (const item of items) {
      if (item.questions.length !== expectedQuestions) {
        errors.push(
          `${difficulty}/${item.sample.id}: expected ${expectedQuestions} questions`
        );
      }
      if (
        item.questions.some(
          (question) =>
            question.answerDependency !== 'passage-required' ||
            question.correctIndex < 0 ||
            question.correctIndex >= question.choices.length
        )
      ) {
        errors.push(`${difficulty}/${item.sample.id}: invalid dependent question`);
      }
    }
  }
  return errors;
}
