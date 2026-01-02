export function countWords(text: string): number {
  const normalized = text
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return 0;

  return normalized.split(' ').length;
}

export function computeWpm(wordCount: number, elapsedMs: number): number {
  if (wordCount <= 0) return 0;
  if (elapsedMs <= 0) return 0;

  const minutes = elapsedMs / 1000 / 60;
  const wpm = wordCount / minutes;

  if (!Number.isFinite(wpm) || wpm < 0) return 0;

  return Math.round(wpm);
}
