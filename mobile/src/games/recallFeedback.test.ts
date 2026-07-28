import {
  CORRECT_RECALL_FEEDBACK_MS,
  getRecallFeedbackDurationMs,
  MAX_INCORRECT_RECALL_FEEDBACK_MS,
  MIN_INCORRECT_RECALL_FEEDBACK_MS,
} from './recallFeedback';

describe('recall feedback timing', () => {
  it('keeps correct feedback brief and incorrect feedback readable', () => {
    expect(getRecallFeedbackDurationMs('focus', true)).toBe(
      CORRECT_RECALL_FEEDBACK_MS
    );
    expect(getRecallFeedbackDurationMs('focus', false)).toBe(
      MIN_INCORRECT_RECALL_FEEDBACK_MS
    );
  });

  it('adds review time for sentences and caps very long answers', () => {
    expect(
      getRecallFeedbackDurationMs(
        'Careful readers compare the strongest evidence.',
        false
      )
    ).toBeGreaterThan(MIN_INCORRECT_RECALL_FEEDBACK_MS);
    expect(
      getRecallFeedbackDurationMs(
        Array.from({ length: 100 }, () => 'word').join(' '),
        false
      )
    ).toBe(MAX_INCORRECT_RECALL_FEEDBACK_MS);
  });

  it('adds comparison time for long compact number sequences', () => {
    expect(getRecallFeedbackDurationMs('1234567890', false)).toBeGreaterThan(
      MIN_INCORRECT_RECALL_FEEDBACK_MS
    );
  });
});
