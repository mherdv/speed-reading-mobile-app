import { getCuratedComprehensionPool } from '../data/curatedComprehensionContent';
import { TEXT_SAMPLES } from '../data/textSamples';
import type { AttemptResult } from './types';
import {
  createQuestionOutcomes,
  getComprehensionDiagnostic,
} from './comprehensionDiagnostics';

const sample = TEXT_SAMPLES.find((candidate) => candidate.questions?.length === 3)!;
const questions = sample.questions!;

function resultWith(outcomes: ReturnType<typeof createQuestionOutcomes>): AttemptResult {
  return {
    id: 'result-1',
    sampleId: sample.id,
    sampleTitle: sample.title,
    startedAtIso: '2026-07-28T10:00:00.000Z',
    finishedAtIso: '2026-07-28T10:02:00.000Z',
    elapsedMs: 120_000,
    wordCount: 150,
    wpm: 75,
    details: {
      contentId: sample.id,
      contentVersion: sample.version ?? 1,
      questionOutcomes: outcomes,
    },
  };
}

describe('comprehension diagnostics', () => {
  it('stores only completed question outcomes with stable identifiers', () => {
    expect(
      createQuestionOutcomes(questions, {
        0: questions[0]!.correctIndex,
        1: 0,
      })
    ).toEqual([
      expect.objectContaining({
        questionId: questions[0]!.id,
        correct: true,
      }),
      expect.objectContaining({
        questionId: questions[1]!.id,
        selectedIndex: 0,
      }),
    ]);
  });

  it('resolves a wrong answer and gives skill-specific coaching', () => {
    const detailQuestion = questions.find(
      (question) => question.type === 'detail-evidence'
    )!;
    const detailIndex = questions.indexOf(detailQuestion);
    const wrongIndex =
      detailQuestion.correctIndex === 0 ? 1 : 0;
    const diagnostic = getComprehensionDiagnostic(
      resultWith(
        createQuestionOutcomes(questions, {
          0: questions[0]!.correctIndex,
          1: questions[1]!.correctIndex,
          2: questions[2]!.correctIndex,
          [detailIndex]: wrongIndex,
        })
      )
    );

    expect(diagnostic.available).toBe(true);
    expect(diagnostic.wrongAnswers).toEqual([
      expect.objectContaining({
        questionId: detailQuestion.id,
        typeLabel: 'Detail and evidence',
        selectedAnswer: detailQuestion.choices[wrongIndex],
        correctAnswer: detailQuestion.choices[detailQuestion.correctIndex],
      }),
    ]);
    expect(diagnostic.nextAction).toContain('names, quantities');
  });

  it('does not resolve rationales against a changed content version', () => {
    const outcomes = createQuestionOutcomes(questions, {
      0: questions[0]!.correctIndex === 0 ? 1 : 0,
    });
    const result = resultWith(outcomes);
    result.details = {
      ...result.details,
      contentVersion: (sample.version ?? 1) + 1,
    };

    const diagnostic = getComprehensionDiagnostic(result);

    expect(diagnostic.available).toBe(true);
    expect(diagnostic.wrongAnswers).toEqual([]);
  });

  it('resolves supplemental paced-comprehension questions in History', () => {
    const item = getCuratedComprehensionPool('hard').find(
      (candidate) => candidate.sample.id === 'repeated-training-06'
    )!;
    const supplemental = item.questions[2]!;
    const wrongIndex = supplemental.correctIndex === 0 ? 1 : 0;
    const outcome = createQuestionOutcomes(item.questions, {
      2: wrongIndex,
    });
    const result: AttemptResult = {
      id: 'paced-result',
      sampleId: item.sample.id,
      sampleTitle: item.sample.title,
      startedAtIso: '2026-07-28T10:00:00.000Z',
      finishedAtIso: '2026-07-28T10:02:00.000Z',
      elapsedMs: 120_000,
      wordCount: 0,
      wpm: 0,
      details: {
        contentId: item.sample.id,
        contentVersion: item.sample.version ?? 1,
        questionOutcomes: outcome,
      },
    };

    expect(getComprehensionDiagnostic(result).wrongAnswers).toEqual([
      expect.objectContaining({
        questionId: supplemental.id,
        correctAnswer:
          supplemental.choices[supplemental.correctIndex],
        rationale: supplemental.rationale,
      }),
    ]);
  });
});
