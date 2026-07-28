export const CORRECT_RECALL_FEEDBACK_MS = 500;
export const MIN_INCORRECT_RECALL_FEEDBACK_MS = 2_800;
export const MAX_INCORRECT_RECALL_FEEDBACK_MS = 5_200;

/**
 * Correct answers keep the exercise moving. Incorrect answers stay visible
 * long enough to compare the submitted response with the expected text.
 * Longer sentences receive additional review time, with a bounded maximum.
 */
export function getRecallFeedbackDurationMs(
  expectedAnswer: string,
  correct: boolean
): number {
  if (correct) return CORRECT_RECALL_FEEDBACK_MS;

  const normalized = expectedAnswer.trim();
  const wordUnits = normalized ? normalized.split(/\s+/u).length : 1;
  const compactUnits = /^\d+$/u.test(normalized)
    ? Math.max(1, Math.ceil(normalized.length / 4))
    : 1;
  const readingUnits = Math.max(wordUnits, compactUnits);

  return Math.min(
    MAX_INCORRECT_RECALL_FEEDBACK_MS,
    MIN_INCORRECT_RECALL_FEEDBACK_MS +
      Math.max(0, readingUnits - 1) * 180
  );
}
