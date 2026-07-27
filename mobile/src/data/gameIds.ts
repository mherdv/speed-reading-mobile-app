export const GAME_IDS = [
  'RepeatedReading',
  'WpmTest',
  'MainIdeaSprint',
  'StructureScan',
  'EvidenceHunt',
  'ContextBuilder',
  'PowerReader',
  'FlashReading',
  'WordsRecall',
  'SentenceRecall',
  'ComprehensionTest',
  'SchulteNumbers',
  'SchulteLetters',
  'SchulteMix',
  'EyeMovementTraining',
  'VisualSpanExpansion',
  'PatternScanning',
  'TimedWordRecognition',
  'TimedPhraseRecognition',
  'LastWordRecall',
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

export const CORE_GAME_IDS = [
  'RepeatedReading',
  'WpmTest',
  'MainIdeaSprint',
  'StructureScan',
  'EvidenceHunt',
  'ContextBuilder',
  'ComprehensionTest',
  'TextSearch',
] as const satisfies readonly GameId[];

export const SCANNING_GAME_IDS = [
  'WordSearchGame',
  'SchulteNumbers',
  'SchulteLetters',
] as const satisfies readonly GameId[];

export const EYE_COMFORT_GAME_IDS = [
  'EyeMovementTraining',
] as const satisfies readonly GameId[];

export const SUPPORTING_GAME_IDS = [
  ...SCANNING_GAME_IDS,
  ...EYE_COMFORT_GAME_IDS,
] as const satisfies readonly GameId[];

export const CURATED_GAME_IDS = [
  ...CORE_GAME_IDS,
  ...SUPPORTING_GAME_IDS,
] as const satisfies readonly GameId[];

export const LEGACY_GAME_ID_MAP: Record<string, GameId> = {
  'timed-word-recognition': 'TimedWordRecognition',
  'word-search-game': 'WordSearchGame',
};

export function normalizeGameId(gameId: string): string {
  return LEGACY_GAME_ID_MAP[gameId] ?? gameId;
}
