import React from 'react';

import RepeatedReading from './RepeatedReading/RepeatedReading';
import WpmTest from './WpmTest/WpmTest';
import MainIdeaSprint from './MainIdeaSprint/MainIdeaSprint';
import PageGlimpse from './PageGlimpse/PageGlimpse';
import StructureScan from './StructureScan/StructureScan';
import EvidenceHunt from './EvidenceHunt/EvidenceHunt';
import ContextBuilder from './ContextBuilder/ContextBuilder';
import PowerReader from './PowerReader/PowerReader';
import CenterLineReader from './CenterLineReader/CenterLineReader';
import LetterRecognition from './LetterRecognition/LetterRecognition';
import TextSearch from './TextSearch/TextSearch';
import EyeMovementTraining from './EyeMovementTraining/EyeMovementTraining';
import ReadingSaccades from './ReadingSaccades/ReadingSaccades';
import PreviewCatch from './PreviewCatch/PreviewCatch';
import PeripheralLetterCatch from './PeripheralLetterCatch/PeripheralLetterCatch';
import PeripheralWordCatch from './PeripheralWordCatch/PeripheralWordCatch';
import VisualSpanExpansion from './VisualSpanExpansion/VisualSpanExpansion';
import FlashReading from './FlashReading/FlashReading';
import WordsRecall from './WordsRecall/WordsRecall';
import SentenceRecall from './SentenceRecall/SentenceRecall';
import ComprehensionTest from './ComprehensionTest/ComprehensionTest';
import MemoryRecall from './MemoryRecall/MemoryRecall';
import NumberRecognition from './NumberRecognition/NumberRecognition';
import SymbolRecognition from './SymbolRecognition/SymbolRecognition';
import PatternScanning from './PatternScanning/PatternScanning';
import TimedPhraseRecognition from './TimedPhraseRecognition/TimedPhraseRecognition';
import TimedWordRecognition from './TimedWordRecognition/TimedWordRecognition';
import LastWordRecall from './LastWordRecall/LastWordRecall';
import WordMismatchGrid from './WordMismatchGrid/WordMismatchGrid';
import WordPairs from './WordPairs/WordPairs';
import LetterJumble from './LetterJumble/LetterJumble';
import SchulteNumbers from './SchulteNumbers/SchulteNumbers';
import SchulteLetters from './SchulteLetters/SchulteLetters';
import SchulteMix from './SchulteMix/SchulteMix';
import WordSearchGame from './WordSearchGame/WordSearchGame';
import NumberSearch from './NumberSearch/NumberSearch';
import EvenNumbers from './EvenNumbers/EvenNumbers';
import {
  CORE_GAME_IDS,
  CURATED_GAME_IDS,
  EYE_COMFORT_GAME_IDS,
  SCANNING_GAME_IDS,
  SUPPORTING_GAME_IDS,
  type GameId,
} from '../data/gameIds';
import { GAME_IDS } from '../data/gameIds';
import {
  GAME_CATALOG,
  type GameCatalogEntry,
} from '../data/gameCatalog';

export type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: {
    wordCount?: number;
    wpm?: number;
    comprehensionCorrect?: boolean;
    [key: string]: unknown;
  };
};

export type GameComponentProps = {
  autoStart?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  defaultGridMode?: 'stable' | 'reshuffle';
  excludedContentId?: string;
  suggestedWpm?: number;
  onReportResult?: (payload: GameReportPayload) => void;
};

export type GameMeta = GameCatalogEntry & {
  component: React.ComponentType<GameComponentProps>;
};

const GAME_COMPONENTS: Record<
  GameId,
  React.ComponentType<GameComponentProps>
> = {
  RepeatedReading,
  WpmTest,
  MainIdeaSprint,
  PageGlimpse,
  StructureScan,
  EvidenceHunt,
  ContextBuilder,
  PowerReader,
  CenterLineReader,
  FlashReading,
  WordsRecall,
  SentenceRecall,
  ComprehensionTest,
  SchulteNumbers,
  SchulteLetters,
  SchulteMix,
  EyeMovementTraining,
  ReadingSaccades,
  PreviewCatch,
  PeripheralLetterCatch,
  PeripheralWordCatch,
  VisualSpanExpansion,
  PatternScanning,
  TimedWordRecognition,
  TimedPhraseRecognition,
  LastWordRecall,
  WordPairs,
  TextSearch,
  WordSearchGame,
  NumberSearch,
  LetterRecognition,
  NumberRecognition,
  SymbolRecognition,
  LetterJumble,
  WordMismatchGrid,
  EvenNumbers,
  MemoryRecall,
};

export const GAME_REGISTRY = Object.fromEntries(
  GAME_IDS.map((id) => [
    id,
    {
      ...GAME_CATALOG[id],
      component: GAME_COMPONENTS[id],
    },
  ])
) as Record<GameId, GameMeta>;

export const CORE_GAME_LIST: GameMeta[] = CORE_GAME_IDS.map(
  (id) => GAME_REGISTRY[id]
);

export const SUPPORTING_GAME_LIST: GameMeta[] = SUPPORTING_GAME_IDS.map(
  (id) => GAME_REGISTRY[id]
);

export const SCANNING_GAME_LIST: GameMeta[] = SCANNING_GAME_IDS.map(
  (id) => GAME_REGISTRY[id]
);

export const EYE_COMFORT_GAME_LIST: GameMeta[] = EYE_COMFORT_GAME_IDS.map(
  (id) => GAME_REGISTRY[id]
);

export const GAME_LIST: GameMeta[] = CURATED_GAME_IDS.map(
  (id) => GAME_REGISTRY[id]
);

export const ALL_GAME_LIST: GameMeta[] = GAME_IDS.map(
  (id) => GAME_REGISTRY[id]
);

export function getGameMeta(gameId: string): GameMeta | null {
  return (GAME_REGISTRY as Record<string, GameMeta>)[gameId] ?? null;
}

export function getGameTitle(gameId: string): string {
  return getGameMeta(gameId)?.title ?? gameId;
}
