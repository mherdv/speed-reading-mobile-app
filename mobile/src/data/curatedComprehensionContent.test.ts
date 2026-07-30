import {
  CURATED_COMPREHENSION_SAMPLE_IDS,
  getCuratedComprehensionPool,
  validateCuratedComprehensionContent,
} from './curatedComprehensionContent';
import { BASELINE_TEXT_SAMPLES } from './textSamples';

describe('curated paced-comprehension content', () => {
  it('keeps the exact reviewed ten-passage contract for every level', () => {
    expect(CURATED_COMPREHENSION_SAMPLE_IDS).toEqual({
      easy: [
        'sample-5',
        'sample-8',
        'sample-9',
        'sample-11',
        'sample-12',
        'sample-13',
        'sample-14',
        'sample-15',
        'sample-19',
        'sample-20',
      ],
      medium: [
        'sample-4',
        'sample-6',
        'sample-7',
        'sample-10',
        'sample-16',
        'sample-17',
        'sample-18',
        'repeated-training-01',
        'repeated-training-02',
        'repeated-training-03',
      ],
      hard: [
        'repeated-training-04',
        'repeated-training-05',
        'repeated-training-06',
        'repeated-training-07',
        'repeated-training-08',
        'repeated-training-09',
        'repeated-training-10',
        'repeated-training-11',
        'repeated-training-12',
        'repeated-training-13',
      ],
    });
    expect(validateCuratedComprehensionContent()).toEqual([]);
  });

  it.each([
    ['easy', 1],
    ['medium', 2],
    ['hard', 3],
  ] as const)(
    'builds ten %s passages with %i passage-dependent questions each',
    (difficulty, expectedQuestions) => {
      const pool = getCuratedComprehensionPool(difficulty);
      expect(pool).toHaveLength(10);
      expect(new Set(pool.map((item) => item.sample.id)).size).toBe(10);

      for (const item of pool) {
        expect(item.questions).toHaveLength(expectedQuestions);
        expect(item.questions[0]).toMatchObject({
          id: `${item.sample.id}-legacy-question`,
          prompt: item.sample.question.prompt,
          choices: item.sample.question.choices,
          correctIndex: item.sample.question.correctIndex,
          type: item.sample.question.type,
          rationale: item.sample.question.rationale,
          answerDependency: 'passage-required',
        });
        if (difficulty !== 'easy') {
          expect(
            new Set(item.questions.map((question) => question.type))
              .size
          ).toBe(expectedQuestions);
        }
        for (const question of item.questions) {
          expect(question.id).toBeTruthy();
          expect(question.prompt).toBeTruthy();
          expect(question.choices).toHaveLength(4);
          expect(
            new Set(
              question.choices.map((choice) =>
                choice.trim().toLocaleLowerCase('en')
              )
            ).size
          ).toBe(4);
          expect(question.choices[question.correctIndex]).toBeTruthy();
          expect(question.rationale).toBeTruthy();
          expect(question.answerDependency).toBe('passage-required');
        }
      }
    }
  );

  it('keeps all baseline forms out and all question IDs globally unique', () => {
    const baselineIds = new Set(
      BASELINE_TEXT_SAMPLES.map((sample) => sample.id)
    );
    const items = (['easy', 'medium', 'hard'] as const).flatMap((difficulty) =>
      getCuratedComprehensionPool(difficulty)
    );
    const questionIds = items.flatMap((item) =>
      item.questions.map((question) => question.id)
    );

    expect(items).toHaveLength(30);
    expect(items.some((item) => baselineIds.has(item.sample.id))).toBe(false);
    expect(new Set(questionIds).size).toBe(questionIds.length);
  });

  it('retains passage-specific evidence in representative supplemental keys', () => {
    const checksum = getCuratedComprehensionPool('hard').find(
      (item) => item.sample.id === 'repeated-training-06'
    );
    const archaeology = getCuratedComprehensionPool('hard').find(
      (item) => item.sample.id === 'repeated-training-12'
    );

    expect(
      checksum?.questions[2]?.choices[checksum.questions[2].correctIndex]
    ).toBe(
      'Repeated failures suggest that the data or radio link may be unreliable'
    );
    expect(
      archaeology?.questions[2]?.choices[
        archaeology.questions[2].correctIndex
      ]
    ).toBe(
      'To reconstruct the sequence of disturbances and deposits rather than relying on depth alone'
    );
  });
});
