import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
} from 'react-native';

import type { AttemptResult } from '../domain/types';
import { saveResult } from '../data/resultsStore';
import { normalizeGameId } from '../data/gameIds';
import { recordRecentGame } from '../data/gamePinsStore';
import {
  allowsAdaptiveDifficulty,
  getDefaultDifficultyPreference,
  loadDifficultyPreference,
  saveDifficultyPreference,
  type Difficulty,
  type DifficultyMode,
  type DifficultyPreference,
} from '../data/difficultyPreferences';
import {
  describeAdaptiveProgress,
  levelToDifficulty,
  loadGameProgress,
} from '../data/progressStore';
import { BackButton } from '../ui/BackButton';
import { colors } from '../theme/colors';
import { getGameMeta, type GameReportPayload } from '../games/registry';
import {
  GameDifficultyProvider,
  getDifficultyOptions,
} from '../ui/GameDifficultyControl';
import { ResponsiveShell } from '../ui/ResponsiveShell';

type Props = {
  gameId: string;
  sessionKey?: string;
  autoStart?: boolean;
  difficulty?: Difficulty;
  schulteGridMode?: 'stable' | 'reshuffle';
  onBack: () => void;
  onFinish: (result: AttemptResult) => void;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function GameScreen({
  gameId,
  sessionKey,
  autoStart,
  difficulty,
  schulteGridMode,
  onBack,
  onFinish,
}: Props) {
  const normalizedGameId = normalizeGameId(gameId);
  const [controlLoaded, setControlLoaded] = useState(false);
  const [adaptiveDifficulty, setAdaptiveDifficulty] =
    useState<Difficulty>('easy');
  const [adaptiveHelper, setAdaptiveHelper] = useState(() =>
    describeAdaptiveProgress({ level: 1, streak: 0, totalPlays: 0 })
  );
  const [preference, setPreference] = useState<DifficultyPreference>({
    mode: getDefaultDifficultyPreference(normalizedGameId).mode,
    difficulty: difficulty ?? 'easy',
  });

  const cancelledRef = useRef(false);
  const finishingRef = useRef(false);

  useEffect(() => {
    void recordRecentGame(normalizedGameId).catch(() => undefined);
  }, [normalizedGameId]);

  useEffect(() => {
    let active = true;
    setControlLoaded(false);
    setAdaptiveHelper(
      describeAdaptiveProgress({ level: 1, streak: 0, totalPlays: 0 })
    );

    Promise.all([
      loadDifficultyPreference(normalizedGameId),
      loadGameProgress(normalizedGameId),
    ])
      .then(([savedPreference, progress]) => {
        if (!active) return;
        const nextAdaptiveDifficulty = levelToDifficulty(progress.level);
        setAdaptiveDifficulty(nextAdaptiveDifficulty);
        setAdaptiveHelper(describeAdaptiveProgress(progress));
        setPreference({
          mode: savedPreference.mode,
          difficulty:
            savedPreference.mode === 'adaptive'
              ? nextAdaptiveDifficulty
              : difficulty ?? savedPreference.difficulty,
        });
      })
      .catch(() => {
        if (!active) return;
        setPreference({
          mode: getDefaultDifficultyPreference(normalizedGameId).mode,
          difficulty: difficulty ?? 'easy',
        });
      })
      .finally(() => {
        if (active) setControlLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [difficulty, normalizedGameId]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const handleDifficultyChange = useCallback(
    (mode: DifficultyMode, nextDifficulty: Difficulty) => {
      const nextPreference = {
        mode:
          mode === 'adaptive' && allowsAdaptiveDifficulty(normalizedGameId)
            ? 'adaptive'
            : 'manual',
        difficulty:
          mode === 'adaptive' ? adaptiveDifficulty : nextDifficulty,
      } satisfies DifficultyPreference;

      setPreference(nextPreference);
      void saveDifficultyPreference(normalizedGameId, nextPreference).catch(
        () => undefined
      );
    },
    [adaptiveDifficulty, normalizedGameId]
  );

  const difficultyControl = useMemo(
    () => ({
      gameId: normalizedGameId,
      mode: preference.mode,
      difficulty:
        preference.mode === 'adaptive'
          ? adaptiveDifficulty
          : preference.difficulty,
      adaptiveDifficulty,
      adaptiveHelper,
      allowsAdaptive: allowsAdaptiveDifficulty(normalizedGameId),
      options: getDifficultyOptions(normalizedGameId),
      onChange: handleDifficultyChange,
    }),
    [
      adaptiveDifficulty,
      adaptiveHelper,
      handleDifficultyChange,
      normalizedGameId,
      preference,
    ]
  );
  
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);
  
  const handleGameReport = async (payload: GameReportPayload) => {
    if (cancelledRef.current || finishingRef.current) return;
    finishingRef.current = true;
    
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
      comprehensionCorrect:
        typeof payload.details?.comprehensionCorrect === 'boolean'
          ? payload.details.comprehensionCorrect
          : undefined,
      score: payload.score,
      accuracy: payload.accuracy,
      details: payload.details,
    };

    // Persistence is intentionally backgrounded: storage latency or failure
    // must not trap the user on a completed game screen.
    void saveResult(result).catch(() => undefined);
    onFinish(result);
  };

  const gameMeta = getGameMeta(normalizedGameId);
  const GameComponent = gameMeta?.component;

  if (!GameComponent) {
    return (
      <View style={styles.container}>
        <View testID="game-screen-header" style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text style={styles.headerTitle}>Training</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.unavailableCard}>
          <Text style={styles.unavailableTitle}>This drill is unavailable</Text>
          <Text style={styles.unavailableText}>
            Return home and choose another exercise.
          </Text>
        </View>
      </View>
    );
  }

  if (!controlLoaded) {
    return (
      <View style={styles.container}>
        <View testID="game-screen-header" style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text style={styles.headerTitle}>Training</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Preparing your difficulty…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.scroll}>
      <ResponsiveShell style={styles.container}>
        <View testID="game-screen-header" style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text style={styles.headerTitle}>Training</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.gameContainer}>
          <GameDifficultyProvider value={difficultyControl}>
            <GameComponent
              key={`${sessionKey ?? normalizedGameId}-${difficultyControl.mode}-${difficultyControl.difficulty}`}
              autoStart={autoStart}
              difficulty={difficultyControl.difficulty}
              defaultGridMode={schulteGridMode}
              onReportResult={(p: GameReportPayload) =>
                void handleGameReport({
                  ...p,
                  details: {
                    ...p.details,
                    difficulty: difficultyControl.difficulty,
                    difficultyMode: difficultyControl.mode,
                  },
                })
              }
            />
          </GameDifficultyProvider>
        </View>
      </ResponsiveShell>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
    userSelect: 'none',
  },
  header: {
    position: 'relative',
    zIndex: 20,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    marginBottom: 8,
    paddingVertical: 8,
    backgroundColor: colors.background,
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
    minHeight: 0,
    position: 'relative',
    zIndex: 0,
  },
  unavailableCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
  },
  unavailableTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  unavailableText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  loadingCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
