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

function withDifficultyChoices(
  question: WpmQuestion,
  difficulty: Difficulty
): WpmQuestion {
  const choiceLimit = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  if (question.choices.length <= choiceLimit) return question;

  const selectedIndexes = [
    question.correctIndex,
    ...question.choices
      .map((_, index) => index)
      .filter((index) => index !== question.correctIndex),
  ]
    .slice(0, choiceLimit)
    .sort((first, second) => first - second);

  return {
    ...question,
    choices: selectedIndexes.map((index) => question.choices[index]!),
    correctIndex: selectedIndexes.indexOf(question.correctIndex),
  };
}

/**
 * The standalone baseline keeps three comprehension checks at every level so a
 * valid attempt can contribute to the personal estimate. Difficulty changes
 * distractor load without changing the comparable connected-passage pool.
 */
export function getBaselineReadingPool(
  difficulty: Difficulty
): WpmTestItem[] {
  return BASELINE_TEXT_SAMPLES.map((sample) => ({
    sample,
    questions: questionsFor(sample)
      .slice(0, 3)
      .map((question) => withDifficultyChoices(question, difficulty)),
  }));
}

/**
 * The paced-comprehension exercise retains its graduated one-, two-, and
 * three-question pools. Baseline Reading uses getBaselineReadingPool instead.
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

export function validateBaselineReadingPool(): string[] {
  const errors: string[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const items = getBaselineReadingPool(difficulty);
    const expectedChoices =
      difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    if (new Set(items.map((item) => item.sample.id)).size < 9) {
      errors.push(`${difficulty}: at least nine baseline passages required`);
    }
    for (const item of items) {
      if (item.questions.length !== 3) {
        errors.push(`${difficulty}/${item.sample.id}: three questions required`);
      }
      if (
        item.questions.some(
          (question) =>
            question.answerDependency !== 'passage-required' ||
            question.choices.length !== expectedChoices ||
            question.correctIndex < 0 ||
            question.correctIndex >= question.choices.length
        )
      ) {
        errors.push(
          `${difficulty}/${item.sample.id}: invalid ${expectedChoices}-choice question`
        );
      }
    }
  }
  return errors;
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
