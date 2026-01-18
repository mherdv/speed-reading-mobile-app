export const GAME_IDS = [
  'PowerReader',
  'FlashReading',
  'ComprehensionTest',
  'SchulteNumbers',
  'SchulteLetters',
  'SchulteMix',
  'EyeMovementTraining',
  'VisualSpanExpansion',
  'PatternScanning',
  'TimedWordRecognition',
  'TimedPhraseRecognition',
  'WordPairs',
  'TextSearch',
  'WordSearchGame',
  'NumberSearch',
  'LetterRecognition',
  'NumberRecognition',
  'SymbolRecognition',
  'LetterJumble',
  'WordMismatchGrid',
  'EvenNumbers',
  'MemoryRecall',
] as const;

export type GameId = typeof GAME_IDS[number];

export const LEGACY_GAME_ID_MAP: Record<string, GameId> = {
  'timed-word-recognition': 'TimedWordRecognition',
  'word-search-game': 'WordSearchGame',
};

export function normalizeGameId(gameId: string): string {
  return LEGACY_GAME_ID_MAP[gameId] ?? gameId;
}
