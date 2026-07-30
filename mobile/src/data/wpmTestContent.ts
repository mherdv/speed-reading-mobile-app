import type { TextSample } from '../domain/types';
import {
  getCuratedComprehensionPool,
  validateCuratedComprehensionContent,
} from './curatedComprehensionContent';
import type { Difficulty } from './difficultyPreferences';
import { BASELINE_TEXT_SAMPLES } from './textSamples';

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

function withCorrectChoiceAt(
  question: WpmQuestion,
  targetIndex: number
): WpmQuestion {
  const answer = question.choices[question.correctIndex];
  if (answer === undefined || question.choices.length === 0) return question;
  const choices = question.choices.filter(
    (_choice, index) => index !== question.correctIndex
  );
  const safeIndex = Math.min(
    Math.max(0, targetIndex),
    question.choices.length - 1
  );
  choices.splice(safeIndex, 0, answer);
  return {
    ...question,
    choices,
    correctIndex: safeIndex,
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
  const choiceCount =
    difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  return BASELINE_TEXT_SAMPLES.map((sample, sampleIndex) => ({
    sample,
    questions: questionsFor(sample)
      .slice(0, 3)
      .map((question, questionIndex) =>
        withCorrectChoiceAt(
          withDifficultyChoices(question, difficulty),
          (sampleIndex * 3 + questionIndex) % choiceCount
        )
      ),
  }));
}

/**
 * The paced-comprehension exercise retains its graduated one-, two-, and
 * three-question pools. Baseline Reading uses getBaselineReadingPool instead.
 */
export function getWpmTestPool(difficulty: Difficulty): WpmTestItem[] {
  const questionCount =
    difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  return getCuratedComprehensionPool(difficulty).map(
    ({ sample, questions }, sampleIndex) => ({
      sample,
      questions: questions.map((question, questionIndex) =>
        withCorrectChoiceAt(
          question,
          (sampleIndex * questionCount + questionIndex) %
            question.choices.length
        )
      ),
    })
  );
}

function validateBalancedAnswerPositions(
  questions: readonly WpmQuestion[],
  choiceCount: number,
  label: string,
  errors: string[]
): void {
  const counts = Array.from({ length: choiceCount }, () => 0);
  for (const question of questions) {
    if (question.correctIndex >= 0 && question.correctIndex < choiceCount) {
      counts[question.correctIndex] += 1;
    }
  }
  if (Math.max(...counts) - Math.min(...counts) > 1) {
    errors.push(`${label}: correct-answer positions are not balanced`);
  }
}

export function validateBaselineReadingPool(): string[] {
  const errors: string[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const items = getBaselineReadingPool(difficulty);
    const expectedChoices =
      difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    if (items.length !== 18) {
      errors.push(
        `${difficulty}: exactly eighteen baseline passages required`
      );
    }
    if (
      new Set(items.map((item) => item.sample.id)).size !== items.length
    ) {
      errors.push(`${difficulty}: baseline passage IDs must be unique`);
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
    validateBalancedAnswerPositions(
      items.flatMap((item) => item.questions),
      expectedChoices,
      difficulty,
      errors
    );
  }
  return errors;
}

export function validateWpmTestPool(): string[] {
  const errors = validateCuratedComprehensionContent().map(
    (error) => `curated content: ${error}`
  );
  const baselineIds = new Set(
    BASELINE_TEXT_SAMPLES.map((sample) => sample.id)
  );
  const allIds = new Set<string>();
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const items = getWpmTestPool(difficulty);
    const expectedQuestions =
      difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    if (
      items.length !== 10 ||
      new Set(items.map((item) => item.sample.id)).size !== 10
    ) {
      errors.push(`${difficulty}: exactly ten unique passages required`);
    }
    for (const item of items) {
      if (baselineIds.has(item.sample.id)) {
        errors.push(
          `${difficulty}/${item.sample.id}: baseline passage cannot enter paced comprehension`
        );
      }
      if (allIds.has(item.sample.id)) {
        errors.push(
          `${difficulty}/${item.sample.id}: passage cannot appear in multiple levels`
        );
      }
      allIds.add(item.sample.id);
      if (item.questions.length !== expectedQuestions) {
        errors.push(
          `${difficulty}/${item.sample.id}: expected ${expectedQuestions} questions`
        );
      }
      if (
        item.questions.some(
          (question) =>
            question.answerDependency !== 'passage-required' ||
            !question.id.trim() ||
            !question.prompt.trim() ||
            !question.rationale.trim() ||
            question.choices.length !== 4 ||
            new Set(
              question.choices.map((choice) =>
                choice.trim().toLocaleLowerCase('en')
              )
            ).size !== 4 ||
            question.correctIndex < 0 ||
            question.correctIndex >= question.choices.length
        )
      ) {
        errors.push(`${difficulty}/${item.sample.id}: invalid dependent question`);
      }
    }
    const allQuestions = items.flatMap((item) => item.questions);
    const choiceCount = allQuestions[0]?.choices.length ?? 0;
    if (choiceCount > 0) {
      validateBalancedAnswerPositions(
        allQuestions,
        choiceCount,
        difficulty,
        errors
      );
    }
  }
  if (allIds.size !== 30) {
    errors.push('paced comprehension requires thirty disjoint passages');
  }
  return errors;
}
