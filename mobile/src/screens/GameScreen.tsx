import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { saveResult } from '../data/resultsStore';
import { normalizeGameId } from '../data/gameIds';
import { BackButton } from '../ui/BackButton';
import { colors } from '../theme/colors';
import { getGameMeta, type GameReportPayload } from '../games/registry';

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

export function GameScreen({ gameId, sessionKey, autoStart, difficulty, onBack, onFinish }: Props) {
  console.log('[GameScreen] Mounted with sessionKey:', sessionKey, 'autoStart:', autoStart, 'difficulty:', difficulty);
  const normalizedGameId = normalizeGameId(gameId);
  
  const cancelledRef = useRef(false);
  
  const handleBack = useCallback(() => {
    console.log('[GameScreen] Back pressed, cancelling game');
    cancelledRef.current = true;
    onBack();
  }, [onBack]);
  
  const handleGameReport = async (payload: GameReportPayload) => {
    console.log('[GameScreen] handleGameReport called with score:', payload.score, 'cancelled:', cancelledRef.current);
    
    // Don't report results if the game was cancelled
    if (cancelledRef.current) {
      console.log('[GameScreen] Game was cancelled, skipping result');
      return;
    }
    
    const finishedAtIso = payload.finishedAtIso ?? new Date().toISOString();
    const elapsedMs = payload.elapsedMs ?? 0;
    const startedAtIso = payload.startedAtIso ?? new Date(Date.now() - elapsedMs).toISOString();

    const gameMeta = getGameMeta(normalizedGameId);
    const result: AttemptResult = {
      id: makeId(),
      sampleId: normalizedGameId,
      sampleTitle: gameMeta?.title ?? normalizedGameId,
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

  const gameMeta = getGameMeta(normalizedGameId);
  const GameComponent = gameMeta?.component;

  if (!GameComponent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text style={styles.headerTitle}>Game</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>
    );
  }

  // Get game title for header
  const gameTitle = gameMeta?.title ?? normalizedGameId.replace(/([A-Z])/g, ' $1').trim();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text style={styles.headerTitle}>{gameTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.gameContainer}>
          <GameComponent
            key={sessionKey ?? normalizedGameId}
            autoStart={autoStart}
            difficulty={difficulty}
            onReportResult={(p: GameReportPayload) => void handleGameReport(p)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  gameContainer: {
    flex: 1,
  },
});
