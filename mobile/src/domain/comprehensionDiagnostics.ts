import { TEXT_SAMPLES } from '../data/textSamples';
import type { AttemptResult, TextSample } from './types';

export type ComprehensionQuestionType =
  | 'main-idea'
  | 'detail-evidence'
  | 'inference-purpose';

export type StoredQuestionOutcome = {
  questionId: string;
  type: ComprehensionQuestionType;
  selectedIndex: number;
  selectedAnswer: string;
  correct: boolean;
};

type DiagnosticQuestion = {
  id: string;
  prompt: string;
  choices: readonly string[];
  correctIndex: number;
  type: ComprehensionQuestionType;
  rationale: string;
};

export type WrongAnswerDiagnostic = {
  questionId: string;
  type: ComprehensionQuestionType;
  typeLabel: string;
  prompt: string;
  selectedAnswer: string;
  correctAnswer: string;
  rationale: string;
};

export type ComprehensionDiagnostic = {
  available: boolean;
  correct: number;
  total: number;
  strongestType?: ComprehensionQuestionType;
  weakestType?: ComprehensionQuestionType;
  wrongAnswers: WrongAnswerDiagnostic[];
  nextAction: string;
};

const TYPE_LABELS: Record<ComprehensionQuestionType, string> = {
  'main-idea': 'Main idea',
  'detail-evidence': 'Detail and evidence',
  'inference-purpose': 'Inference and purpose',
};

function legacyQuestion(sample: TextSample): DiagnosticQuestion {
  return {
    id: `${sample.id}-legacy-question`,
    prompt: sample.question.prompt,
    choices: sample.question.choices,
    correctIndex: sample.question.correctIndex,
    type: sample.question.type ?? 'main-idea',
    rationale:
      sample.question.rationale ??
      'The correct answer follows from the connected passage.',
  };
}

function questionsForSample(sample: TextSample): readonly DiagnosticQuestion[] {
  if (!sample.questions?.length) return [legacyQuestion(sample)];
  return sample.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    choices: question.choices,
    correctIndex: question.correctIndex,
    type: question.type,
    rationale: question.rationale,
  }));
}

function isQuestionType(value: unknown): value is ComprehensionQuestionType {
  return (
    value === 'main-idea' ||
    value === 'detail-evidence' ||
    value === 'inference-purpose'
  );
}

function readOutcomes(result: AttemptResult): StoredQuestionOutcome[] {
  const value = result.details?.questionOutcomes;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StoredQuestionOutcome => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<StoredQuestionOutcome>;
    return (
      typeof candidate.questionId === 'string' &&
      isQuestionType(candidate.type) &&
      typeof candidate.selectedIndex === 'number' &&
      Number.isInteger(candidate.selectedIndex) &&
      typeof candidate.selectedAnswer === 'string' &&
      typeof candidate.correct === 'boolean'
    );
  });
}

export function createQuestionOutcomes(
  questions: readonly {
    id: string;
    choices: readonly string[];
    correctIndex: number;
    type: ComprehensionQuestionType;
  }[],
  answers: Readonly<Record<number, number>>
): StoredQuestionOutcome[] {
  return questions.flatMap((question, index) => {
    const selectedIndex = answers[index];
    const selectedAnswer =
      selectedIndex === undefined ? undefined : question.choices[selectedIndex];
    if (selectedIndex === undefined || selectedAnswer === undefined) return [];
    return [
      {
        questionId: question.id,
        type: question.type,
        selectedIndex,
        selectedAnswer,
        correct: selectedIndex === question.correctIndex,
      },
    ];
  });
}

function rankedType(
  outcomes: readonly StoredQuestionOutcome[],
  direction: 'strongest' | 'weakest'
): ComprehensionQuestionType | undefined {
  const scored = (
    ['main-idea', 'detail-evidence', 'inference-purpose'] as const
  )
    .map((type) => {
      const matching = outcomes.filter((outcome) => outcome.type === type);
      return {
        type,
        attempts: matching.length,
        accuracy:
          matching.length === 0
            ? undefined
            : matching.filter((outcome) => outcome.correct).length /
              matching.length,
      };
    })
    .filter(
      (
        item
      ): item is {
        type: ComprehensionQuestionType;
        attempts: number;
        accuracy: number;
      } => item.accuracy !== undefined
    )
    .sort((first, second) => {
      const accuracyDifference =
        direction === 'strongest'
          ? second.accuracy - first.accuracy
          : first.accuracy - second.accuracy;
      return accuracyDifference || second.attempts - first.attempts;
    });
  return scored[0]?.type;
}

export function getComprehensionDiagnostic(
  result: AttemptResult,
  samples: readonly TextSample[] = TEXT_SAMPLES
): ComprehensionDiagnostic {
  const outcomes = readOutcomes(result);
  const contentId = result.details?.contentId;
  const contentVersion = result.details?.contentVersion;
  const sample =
    typeof contentId === 'string'
      ? samples.find((candidate) => candidate.id === contentId)
      : undefined;
  const versionMatches =
    sample !== undefined &&
    typeof contentVersion === 'number' &&
    (sample.version ?? 1) === contentVersion;
  const sourceQuestions = versionMatches
    ? questionsForSample(sample)
    : [];

  const wrongAnswers = outcomes.flatMap((outcome) => {
    if (outcome.correct) return [];
    const source = sourceQuestions.find(
      (question) => question.id === outcome.questionId
    );
    const correctAnswer = source?.choices[source.correctIndex];
    if (!source || correctAnswer === undefined) return [];
    return [
      {
        questionId: outcome.questionId,
        type: outcome.type,
        typeLabel: TYPE_LABELS[outcome.type],
        prompt: source.prompt,
        selectedAnswer: outcome.selectedAnswer,
        correctAnswer,
        rationale: source.rationale,
      },
    ];
  });

  const correct = outcomes.filter((outcome) => outcome.correct).length;
  const total = outcomes.length;
  const weakestType = rankedType(outcomes, 'weakest');
  const strongestType = rankedType(outcomes, 'strongest');
  const nextAction =
    wrongAnswers.length === 0 && total > 0
      ? 'Meaning held. Keep this pace for one more comparable passage before increasing it.'
      : weakestType === 'main-idea'
        ? 'Before reading faster, pause after each paragraph and state its point in a few words.'
        : weakestType === 'detail-evidence'
          ? 'Hold the current pace and mark names, quantities, causes, and conditions as you read.'
          : weakestType === 'inference-purpose'
            ? 'Hold the current pace and connect each conclusion to the sentence that supports it.'
            : 'Complete another reviewed passage to unlock question-level coaching.';

  return {
    available: total > 0,
    correct,
    total,
    strongestType,
    weakestType,
    wrongAnswers,
    nextAction,
  };
}

