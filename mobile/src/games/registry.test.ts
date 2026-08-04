import {
  ALL_GAME_LIST,
  CORE_GAME_LIST,
  EYE_COMFORT_GAME_LIST,
  GAME_LIST,
  SCANNING_GAME_LIST,
  SUPPORTING_GAME_LIST,
} from './registry';

describe('game catalog hierarchy', () => {
  it('keeps supporting visual-search labs separate from core reading practice', () => {
    expect(CORE_GAME_LIST.map((game) => game.id)).toEqual([
      'RepeatedReading',
      'WpmTest',
      'MainIdeaSprint',
      'PageGlimpse',
      'StructureScan',
      'EvidenceHunt',
      'ContextBuilder',
      'ComprehensionTest',
      'CenterLineReader',
      'TextSearch',
    ]);
    expect(SUPPORTING_GAME_LIST.map((game) => game.id)).toEqual([
      'WordSearchGame',
      'SchulteNumbers',
      'SchulteLetters',
      'ReadingSaccades',
      'PreviewCatch',
      'PeripheralLetterCatch',
      'PeripheralWordCatch',
      'EyeMovementTraining',
    ]);
    expect(SCANNING_GAME_LIST).toHaveLength(7);
    expect(EYE_COMFORT_GAME_LIST.map((game) => game.title)).toEqual([
      'Eye Reset',
    ]);
    expect(GAME_LIST).toHaveLength(18);
    expect(ALL_GAME_LIST).toHaveLength(37);
  });
});
