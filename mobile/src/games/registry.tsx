import React from 'react';

import PowerReader from './PowerReader/PowerReader';
import LetterRecognition from './LetterRecognition/LetterRecognition';
import TextSearch from './TextSearch/TextSearch';
import EyeMovementTraining from './EyeMovementTraining/EyeMovementTraining';
import VisualSpanExpansion from './VisualSpanExpansion/VisualSpanExpansion';
import FlashReading from './FlashReading/FlashReading';
import ComprehensionTest from './ComprehensionTest/ComprehensionTest';
import MemoryRecall from './MemoryRecall/MemoryRecall';
import NumberRecognition from './NumberRecognition/NumberRecognition';
import SymbolRecognition from './SymbolRecognition/SymbolRecognition';
import PatternScanning from './PatternScanning/PatternScanning';
import TimedPhraseRecognition from './TimedPhraseRecognition/TimedPhraseRecognition';
import TimedWordRecognition from './TimedWordRecognition/TimedWordRecognition';
import WordMismatchGrid from './WordMismatchGrid/WordMismatchGrid';
import WordPairs from './WordPairs/WordPairs';
import LetterJumble from './LetterJumble/LetterJumble';
import SchulteNumbers from './SchulteNumbers/SchulteNumbers';
import SchulteLetters from './SchulteLetters/SchulteLetters';
import SchulteMix from './SchulteMix/SchulteMix';
import WordSearchGame from './WordSearchGame/WordSearchGame';
import NumberSearch from './NumberSearch/NumberSearch';
import EvenNumbers from './EvenNumbers/EvenNumbers';
import { GAME_IDS, type GameId } from '../data/gameIds';

export type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: {
    wordCount?: number;
    wpm?: number;
    [key: string]: any;
  };
};

export type GameComponentProps = {
  autoStart?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  onReportResult?: (payload: GameReportPayload) => void;
};

export type GameMeta = {
  id: GameId;
  title: string;
  shortDescription: string;
  component: React.ComponentType<GameComponentProps>;
};

export const GAME_REGISTRY = {
  PowerReader: {
    id: 'PowerReader',
    title: 'Power Read',
    shortDescription: 'Read faster by processing word chunks.',
    component: PowerReader,
  },
  FlashReading: {
    id: 'FlashReading',
    title: 'Flash',
    shortDescription: 'Flash words to train instant recognition.',
    component: FlashReading,
  },
  ComprehensionTest: {
    id: 'ComprehensionTest',
    title: 'Comprehend',
    shortDescription: 'Check understanding while reading faster.',
    component: ComprehensionTest,
  },
  SchulteNumbers: {
    id: 'SchulteNumbers',
    title: 'Schulte',
    shortDescription: 'Find numbers fast in a grid.',
    component: SchulteNumbers,
  },
  SchulteLetters: {
    id: 'SchulteLetters',
    title: 'Letters',
    shortDescription: 'Scan letters quickly in order.',
    component: SchulteLetters,
  },
  SchulteMix: {
    id: 'SchulteMix',
    title: 'Mix',
    shortDescription: 'Alternate numbers and letters fast.',
    component: SchulteMix,
  },
  EyeMovementTraining: {
    id: 'EyeMovementTraining',
    title: 'Eyes',
    shortDescription: 'Smooth tracking to reduce fixations.',
    component: EyeMovementTraining,
  },
  VisualSpanExpansion: {
    id: 'VisualSpanExpansion',
    title: 'Span',
    shortDescription: 'Expand your peripheral word span.',
    component: VisualSpanExpansion,
  },
  PatternScanning: {
    id: 'PatternScanning',
    title: 'Patterns',
    shortDescription: 'Spot patterns faster with focus.',
    component: PatternScanning,
  },
  TimedWordRecognition: {
    id: 'TimedWordRecognition',
    title: 'Words',
    shortDescription: 'Recognize words under time pressure.',
    component: TimedWordRecognition,
  },
  TimedPhraseRecognition: {
    id: 'TimedPhraseRecognition',
    title: 'Phrases',
    shortDescription: 'Process multi-word phrases quickly.',
    component: TimedPhraseRecognition,
  },
  WordPairs: {
    id: 'WordPairs',
    title: 'Pairs',
    shortDescription: 'Match related word pairs fast.',
    component: WordPairs,
  },
  TextSearch: {
    id: 'TextSearch',
    title: 'Text',
    shortDescription: 'Scan passages for target words.',
    component: TextSearch,
  },
  WordSearchGame: {
    id: 'WordSearchGame',
    title: 'Search',
    shortDescription: 'Find hidden words in a grid.',
    component: WordSearchGame,
  },
  NumberSearch: {
    id: 'NumberSearch',
    title: 'Numbers',
    shortDescription: 'Find target numbers quickly.',
    component: NumberSearch,
  },
  LetterRecognition: {
    id: 'LetterRecognition',
    title: 'Letters',
    shortDescription: 'Pick target letters in a grid.',
    component: LetterRecognition,
  },
  NumberRecognition: {
    id: 'NumberRecognition',
    title: 'Digits',
    shortDescription: 'Identify target digits quickly.',
    component: NumberRecognition,
  },
  SymbolRecognition: {
    id: 'SymbolRecognition',
    title: 'Symbols',
    shortDescription: 'Recognize symbols at speed.',
    component: SymbolRecognition,
  },
  LetterJumble: {
    id: 'LetterJumble',
    title: 'Jumble',
    shortDescription: 'Unscramble letters into words.',
    component: LetterJumble,
  },
  WordMismatchGrid: {
    id: 'WordMismatchGrid',
    title: 'Mismatch',
    shortDescription: 'Spot the word that does not fit.',
    component: WordMismatchGrid,
  },
  EvenNumbers: {
    id: 'EvenNumbers',
    title: 'Even',
    shortDescription: 'Find even numbers quickly.',
    component: EvenNumbers,
  },
  MemoryRecall: {
    id: 'MemoryRecall',
    title: 'Memory',
    shortDescription: 'Recall sequences to build memory.',
    component: MemoryRecall,
  },
} as const satisfies Record<GameId, GameMeta>;

export const GAME_LIST: GameMeta[] = GAME_IDS
  .filter((id) => id !== 'MemoryRecall')
  .map((id) => GAME_REGISTRY[id]);


export function getGameMeta(gameId: string): GameMeta | null {
  return (GAME_REGISTRY as Record<string, GameMeta>)[gameId] ?? null;
}

export function getGameTitle(gameId: string): string {
  return getGameMeta(gameId)?.title ?? gameId;
}
