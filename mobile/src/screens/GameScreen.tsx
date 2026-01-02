import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { saveResult } from '../data/resultsStore';
import { Button } from '../ui/Button';

import PowerReader from '../games/PowerReader/PowerReader';
import LetterRecognition from '../games/LetterRecognition/LetterRecognition';
import TextSearch from '../games/TextSearch/TextSearch';
import EyeMovementTraining from '../games/EyeMovementTraining/EyeMovementTraining';
import VisualSpanExpansion from '../games/VisualSpanExpansion/VisualSpanExpansion';
import FlashReading from '../games/FlashReading/FlashReading';
import ComprehensionTest from '../games/ComprehensionTest/ComprehensionTest';
import MemoryRecall from '../games/MemoryRecall/MemoryRecall';
import NumberRecognition from '../games/NumberRecognition/NumberRecognition';
import SymbolRecognition from '../games/SymbolRecognition/SymbolRecognition';
import PatternScanning from '../games/PatternScanning/PatternScanning';
import TimedPhraseRecognition from '../games/TimedPhraseRecognition/TimedPhraseRecognition';
import TimedWordRecognition from '../games/TimedWordRecognition/TimedWordRecognition';
import WordMismatchGrid from '../games/WordMismatchGrid/WordMismatchGrid';
import WordPairs from '../games/WordPairs/WordPairs';
import LetterJumble from '../games/LetterJumble/LetterJumble';
import SchulteNumbers from '../games/SchulteNumbers/SchulteNumbers';
import SchulteLetters from '../games/SchulteLetters/SchulteLetters';
import SchulteMix from '../games/SchulteMix/SchulteMix';
import WordSearchGame from '../games/WordSearchGame/WordSearchGame';
import NumberSearch from '../games/NumberSearch/NumberSearch';
import EvenNumbers from '../games/EvenNumbers/EvenNumbers';

type GameReportPayload = {
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

type Props = {
  gameId: string;
  sessionKey?: string;
  autoStart?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  onBack: () => void;
  onFinish: (result: AttemptResult) => void;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const GAME_COMPONENTS: Record<string, React.ComponentType<{
  autoStart?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  onReportResult?: (payload: GameReportPayload) => void;
}>> = {
  PowerReader,
  LetterRecognition,
  TextSearch,
  EyeMovementTraining,
  VisualSpanExpansion,
  FlashReading,
  ComprehensionTest,
  MemoryRecall,
  NumberRecognition,
  SymbolRecognition,
  PatternScanning,
  TimedPhraseRecognition,
  TimedWordRecognition,
  WordMismatchGrid,
  WordPairs,
  LetterJumble,
  SchulteNumbers,
  SchulteLetters,
  SchulteMix,
  WordSearchGame,
  NumberSearch,
  EvenNumbers,
};

export function GameScreen({ gameId, sessionKey, autoStart, difficulty, onBack, onFinish }: Props) {
  console.log('[GameScreen] Mounted with sessionKey:', sessionKey, 'autoStart:', autoStart, 'difficulty:', difficulty);
  
  const handleGameReport = async (payload: GameReportPayload) => {
    console.log('[GameScreen] handleGameReport called with score:', payload.score);
    const finishedAtIso = payload.finishedAtIso ?? new Date().toISOString();
    const elapsedMs = payload.elapsedMs ?? 0;
    const startedAtIso = payload.startedAtIso ?? new Date(Date.now() - elapsedMs).toISOString();

    const result: AttemptResult = {
      id: makeId(),
      sampleId: gameId,
      sampleTitle: gameId,
      startedAtIso,
      finishedAtIso,
      elapsedMs,
      wordCount: payload.details?.wordCount ?? 0,
      wpm: payload.details?.wpm ?? 0,
      comprehensionCorrect: payload.accuracy === undefined ? true : payload.accuracy >= 0.8,
      score: payload.score,
      accuracy: payload.accuracy,
      details: payload.details,
    };

    console.log('[GameScreen] Calling onFinish with result id:', result.id, 'score:', result.score);
    await saveResult(result);
    onFinish(result);
  };

  const GameComponent = GAME_COMPONENTS[gameId];

  if (!GameComponent) {
    return (
      <View style={styles.container}>
        <View style={styles.backContainer}>
          <Button label="← Back" onPress={onBack} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
      <View style={styles.container}>
        <View style={styles.gameContainer}>
          <GameComponent
            key={sessionKey ?? gameId}
            autoStart={autoStart}
            difficulty={difficulty}
            onReportResult={(p: GameReportPayload) => void handleGameReport(p)}
          />
        </View>
        <View style={styles.backContainer}>
          <Button label="← Back" onPress={onBack} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 12,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  gameContainer: {
    flex: 1,
  },
  backContainer: {
    marginTop: 12,
  },
});
