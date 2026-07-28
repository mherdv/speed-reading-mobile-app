import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  clearProgress,
  levelToDifficulty,
  loadAllProgress,
  type GameProgress,
} from '../data/progressStore';
import {
  getDefaultDifficultyPreference,
  loadAllDifficultyPreferences,
  type DifficultyPreference,
} from '../data/difficultyPreferences';
import { getGameCatalogEntry } from '../data/gameCatalog';
import type { GameId } from '../data/gameIds';
import {
  loadGamePins,
  toggleFavoriteGame,
  type GamePins,
} from '../data/gamePinsStore';
import { loadResults } from '../data/resultsStore';
import { TEXT_SAMPLES } from '../data/textSamples';
import {
  loadOrCreateTodayPlanSnapshot,
  replaceTodayPlanReading,
  replaceTodayPlanSkill,
  restoreTodayPlanItems,
  saveTodayPlanSnapshot,
  setTodayPlanItemSkipped,
  type TodayPlanSnapshot,
  type TodayPlanItemId,
} from '../data/todayPlanStore';
import type { AttemptResult, TextSample } from '../domain/types';
import {
  calculateDailyStreak,
  formatAttemptSummary,
} from '../domain/results';
import {
  buildTodayPlan,
  calculateReadingPerformanceProfile,
  getTodayReadingCandidates,
  resolveTodayPlanSnapshot,
} from '../domain/readingPlan';
import {
  borderRadius,
  colors,
  gameGradients,
  gradients,
  shadows,
  spacing,
} from '../theme/colors';
import { GameIcon } from '../ui/GameIcon';
import { ReadingDisplayControl } from '../ui/ReadingDisplayPreferences';
import { ResponsiveShell } from '../ui/ResponsiveShell';
import {
  ALL_GAME_LIST,
  type GameMeta,
} from '../games/registry';

export const HOME_GAME_ICON_COLUMNS = 3;
export const HOME_GAME_ICON_COLUMNS_WIDE = 4;
export const HOME_GAME_TILE_MIN_WIDTH = 80;
export const HOME_GAME_GRID_HORIZONTAL_PADDING = 12;
const HOME_SHELL_MAX_WIDTH = 1200;

export function getHomeGameIconColumns(availableWidth: number): 3 | 4 {
  return availableWidth >=
    HOME_GAME_TILE_MIN_WIDTH * HOME_GAME_ICON_COLUMNS_WIDE
    ? HOME_GAME_ICON_COLUMNS_WIDE
    : HOME_GAME_ICON_COLUMNS;
}

type Props = {
  onStart: (sample: TextSample) => void;
  onOpenHistory: () => void;
  refreshToken: number;
  onOpenGame: (gameId: string) => void;
};

function progressLabel(
  gameId: string,
  level: number,
  preference: DifficultyPreference
): string {
  if (preference.mode === 'manual') {
    const label =
      getGameCatalogEntry(gameId)?.difficulty[preference.difficulty].label ??
      preference.difficulty;
    return `${label} · Manual`;
  }
  const difficulty = levelToDifficulty(level);
  const label =
    getGameCatalogEntry(gameId)?.difficulty[difficulty].label ?? difficulty;
  return `${label} · Adaptive`;
}

type GameGridProps = {
  games: readonly GameMeta[];
  progress: Record<string, GameProgress>;
  preferences: Record<string, DifficultyPreference>;
  favorites: readonly string[];
  onOpenGame: (gameId: GameId) => void;
  onToggleFavorite: (gameId: GameId) => void;
};

function GameGrid({
  games,
  progress,
  preferences,
  favorites,
  onOpenGame,
  onToggleFavorite,
}: GameGridProps) {
  const { width: windowWidth } = useWindowDimensions();
  const availableWidth =
    Math.min(windowWidth, HOME_SHELL_MAX_WIDTH) -
    HOME_GAME_GRID_HORIZONTAL_PADDING * 2;
  const columns = getHomeGameIconColumns(availableWidth);
  const tileWidth = columns === 4 ? '25%' : '33.3333%';

  return (
    <View style={styles.gamesGrid}>
      {games.map((game) => {
        const gameProgress = progress[game.id];
        const level = gameProgress?.level ?? 1;
        const preference =
          preferences[game.id] ?? getDefaultDifficultyPreference(game.id);
        const displayedDifficulty =
          preference.mode === 'adaptive'
            ? levelToDifficulty(level)
            : preference.difficulty;
        const progressPercent =
          displayedDifficulty === 'easy'
            ? 33.333
            : displayedDifficulty === 'medium'
              ? 66.667
              : 100;
        const iconGradient = gameGradients[game.id] ?? gradients.cardIcon.colors;
        const compactTitle =
          game.id === 'ComprehensionTest'
            ? 'Comprehension Check'
            : game.title;

        const favorite = favorites.includes(game.id);

        return (
          <View
            key={game.id}
            style={[styles.gameTile, { width: tileWidth }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${game.title}. ${game.shortDescription}. ${progressLabel(game.id, level, preference)}`}
              testID={`open-game-${game.id}`}
              style={({ pressed }) => [
                styles.gameTileButton,
                pressed && styles.gameCardPressed,
              ]}
              onPress={() => onOpenGame(game.id)}
            >
              <LinearGradient
                colors={iconGradient}
                start={gradients.cardIcon.start}
                end={gradients.cardIcon.end}
                style={styles.gameIconContainer}
              >
                <GameIcon name={game.id} size={26} color={colors.white} />
              </LinearGradient>
              <Text style={styles.gameTitle} numberOfLines={2}>
                {compactTitle}
              </Text>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={gradients.progress.colors}
                  start={gradients.progress.start}
                  end={gradients.progress.end}
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.levelText}>
                {progressLabel(game.id, level, preference)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${game.title} ${favorite ? 'from' : 'to'} favorites`}
              accessibilityState={{ selected: favorite }}
              hitSlop={4}
              testID={`favorite-game-${game.id}`}
              style={({ pressed }) => [
                styles.favoriteButton,
                favorite && styles.favoriteButtonSelected,
                pressed && styles.gameCardPressed,
              ]}
              onPress={() => onToggleFavorite(game.id)}
            >
              <Text
                style={[
                  styles.favoriteIcon,
                  favorite && styles.favoriteIconSelected,
                ]}
              >
                {favorite ? '★' : '☆'}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export function HomeScreen({
  onStart,
  onOpenHistory,
  refreshToken,
  onOpenGame,
}: Props) {
  const [latest, setLatest] = useState<AttemptResult | null>(null);
  const [progress, setProgress] = useState<Record<string, GameProgress>>({});
  const [preferences, setPreferences] = useState<
    Record<string, DifficultyPreference>
  >({});
  const [dailyStreak, setDailyStreak] = useState(0);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [todayPlanSnapshot, setTodayPlanSnapshot] =
    useState<TodayPlanSnapshot | null>(null);
  const [todayIndex, setTodayIndex] = useState(0);
  const [gameSearch, setGameSearch] = useState('');
  const [showReadingDisplay, setShowReadingDisplay] = useState(false);
  const [gamePins, setGamePins] = useState<GamePins>({
    favorites: [],
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const resolvedTodayPlan = useMemo(
    () =>
      todayPlanSnapshot
        ? resolveTodayPlanSnapshot({
            snapshot: todayPlanSnapshot,
            results,
            samples: TEXT_SAMPLES,
          })
        : {
            items: [],
            pendingItems: [],
            completedCount: 0,
            skippedCount: 0,
            isComplete: false,
          },
    [results, todayPlanSnapshot]
  );
  const todayPlan = resolvedTodayPlan.pendingItems;
  const readingProfile = useMemo(
    () => calculateReadingPerformanceProfile(results),
    [results]
  );
  const visibleTodayIndex =
    todayPlan.length > 0
      ? Math.min(todayIndex, todayPlan.length - 1)
      : 0;
  const activeTodayItem = todayPlan[visibleTodayIndex];
  const favoriteGames = gamePins.favorites
    .map((id) => ALL_GAME_LIST.find((game) => game.id === id))
    .filter((game): game is GameMeta => Boolean(game));
  const recentGames = gamePins.recent
    .filter((id) => !gamePins.favorites.includes(id))
    .map((id) => ALL_GAME_LIST.find((game) => game.id === id))
    .filter((game): game is GameMeta => Boolean(game))
    .slice(0, 4);
  const filteredGames = useMemo(() => {
    const query = gameSearch.trim().toLocaleLowerCase();
    if (!query) return ALL_GAME_LIST;

    return ALL_GAME_LIST.filter((game) =>
      [
        game.title,
        game.shortDescription,
        game.category,
        game.tier,
        ...game.keywords,
        ...game.rules,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query)
    );
  }, [gameSearch]);

  const handleResetDifficulty = async () => {
    const doReset = async () => {
      await clearProgress();
      setProgress({});
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm('Reset every game to level 1? Your results history will stay intact.')) {
        await doReset();
      }
      return;
    }

    Alert.alert(
      'Reset game levels?',
      'Every game will return to level 1. Your results history will stay intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset levels', style: 'destructive', onPress: doReset },
      ]
    );
  };

  const skipTodayItem = (itemId: TodayPlanItemId) => {
    setTodayPlanSnapshot((current) => {
      if (!current) return current;
      const next = setTodayPlanItemSkipped(current, itemId, true);
      void saveTodayPlanSnapshot(next);
      return next;
    });
  };

  const restoreTodayPlan = () => {
    setTodayPlanSnapshot((current) => {
      if (!current) return current;
      const next = restoreTodayPlanItems(current);
      void saveTodayPlanSnapshot(next);
      return next;
    });
  };

  const swapTodayReading = () => {
    setTodayPlanSnapshot((current) => {
      if (!current) return current;
      let nextOffset = current.reading.swapOffset + 1;
      let nextSampleId = current.reading.sampleId;
      for (
        let attempt = 0;
        attempt < TEXT_SAMPLES.length && nextSampleId === current.reading.sampleId;
        attempt += 1
      ) {
        const candidate = buildTodayPlan({
          results,
          samples: TEXT_SAMPLES,
          readingSwapOffset: nextOffset,
        }).find((item) => item.kind === 'reading');
        if (candidate?.kind === 'reading') {
          nextSampleId = candidate.sample.id;
        }
        if (nextSampleId === current.reading.sampleId) nextOffset += 1;
      }
      if (nextSampleId === current.reading.sampleId) return current;
      const next = replaceTodayPlanReading(
        current,
        nextSampleId,
        nextOffset
      );
      void saveTodayPlanSnapshot(next);
      return next;
    });
  };

  const swapTodaySkill = () => {
    setTodayPlanSnapshot((current) => {
      if (!current) return current;
      let nextOffset = current.skill.swapOffset + 1;
      let nextGameId = current.skill.gameId;
      for (
        let attempt = 0;
        attempt < ALL_GAME_LIST.length && nextGameId === current.skill.gameId;
        attempt += 1
      ) {
        const candidate = buildTodayPlan({
          results,
          samples: TEXT_SAMPLES,
          swapOffset: nextOffset,
        }).find((item) => item.kind === 'skill');
        if (candidate?.kind === 'skill') {
          nextGameId = candidate.gameId;
        }
        if (nextGameId === current.skill.gameId) nextOffset += 1;
      }
      if (nextGameId === current.skill.gameId) return current;
      const next = replaceTodayPlanSkill(current, nextGameId, nextOffset);
      void saveTodayPlanSnapshot(next);
      return next;
    });
  };

  const handleToggleFavorite = (gameId: GameId) => {
    setGamePins((current) => ({
      ...current,
      favorites: current.favorites.includes(gameId)
        ? current.favorites.filter((id) => id !== gameId)
        : [gameId, ...current.favorites],
    }));
    void toggleFavoriteGame(gameId)
      .then(setGamePins)
      .catch(() => undefined);
  };

  const handleOpenGame = (gameId: GameId) => {
    onOpenGame(gameId);
  };

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      setLoading(true);
      const [results, allProgress, allPreferences, pins] = await Promise.all([
        loadResults(),
        loadAllProgress(),
        loadAllDifficultyPreferences(),
        loadGamePins(),
      ]);
      const generatedPlan = buildTodayPlan({
        results,
        samples: TEXT_SAMPLES,
      });
      const reading = generatedPlan.find(
        (item) => item.kind === 'reading'
      );
      const skill = generatedPlan.find((item) => item.kind === 'skill');
      const eligibleReadingSampleIds = getTodayReadingCandidates(
        TEXT_SAMPLES
      ).map((sample) => sample.id);
      const snapshot =
        reading?.kind === 'reading' && skill?.kind === 'skill'
          ? await loadOrCreateTodayPlanSnapshot({
              readingSampleId: reading.sample.id,
              eligibleReadingSampleIds,
              skillGameId: skill.gameId,
              includeComfort: generatedPlan.some(
                (item) => item.kind === 'comfort'
              ),
            })
          : null;
      if (cancelled) return;

      setLatest(results[0] ?? null);
      setResults(results);
      setProgress(allProgress);
      setPreferences(allPreferences);
      setTodayPlanSnapshot(snapshot);
      setGamePins(pins);
      setDailyStreak(calculateDailyStreak(results));
      setLoading(false);
    }

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    if (todayPlan.length === 0) {
      setTodayIndex(0);
    } else if (todayIndex >= todayPlan.length) {
      setTodayIndex(todayPlan.length - 1);
    }
  }, [todayIndex, todayPlan.length]);

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.gradientContainer}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveShell style={styles.shell}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="SpeedRead"
          />
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.eyebrow}>YOUR READING GYM</Text>
              <Text style={styles.welcomeText}>Welcome back</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <View>
                <Text style={styles.streakValue}>{dailyStreak}</Text>
                <Text style={styles.streakLabel}>
                  {dailyStreak === 1 ? 'day' : 'days'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.trainingCard}>
          <Text style={styles.trainingEyebrow}>TODAY</Text>
          <Text style={styles.trainingTitle}>A short reading-first plan</Text>
          <Text
            testID="personal-estimate"
            accessibilityLiveRegion="polite"
            style={styles.trainingDescription}
          >
            {readingProfile.sustainableWpm !== undefined
              ? `Sustainable pace: ${readingProfile.sustainableWpm} WPM · ${readingProfile.sustainablePassageCount} understood of ${readingProfile.eligiblePassageCount} eligible passages · last ${readingProfile.benchmarkWindowDays} days · ${readingProfile.confidence} confidence`
              : readingProfile.ready
                ? `Measured pace: ${readingProfile.measuredMedianWpm} WPM · ${readingProfile.sustainablePassageCount} of ${readingProfile.eligiblePassageCount} passages reached 80% comprehension · last ${readingProfile.benchmarkWindowDays} days`
                : `Not enough readings for a personal estimate · ${readingProfile.eligiblePassageCount} of 3 eligible same-band passages · last ${readingProfile.benchmarkWindowDays} days · ${readingProfile.confidence} confidence`}
          </Text>

          {activeTodayItem && (() => {
            const item = activeTodayItem;
            const gameId =
              item.kind === 'reading' ? 'ComprehensionTest' : item.gameId;
            return (
              <View key={item.id} testID={`today-card-${item.id}`} style={styles.todayCard}>
                <View style={styles.todayCardHeader}>
                  <View style={styles.todayIcon}>
                    <GameIcon name={gameId} size={20} color={colors.onInteractive} />
                  </View>
                  <View style={styles.todayHeading}>
                    <Text style={styles.todayOrder}>
                      {visibleTodayIndex + 1} OF {todayPlan.length} · {item.kind === 'reading' ? 'DIRECT READING' : item.kind === 'skill' ? 'FOCUSED SKILL' : 'OPTIONAL COMFORT'}
                    </Text>
                    <Text style={styles.todayTitle}>{item.title}</Text>
                  </View>
                </View>
                <Text style={styles.todayReason}>Why this: {item.reason}</Text>
                <Text style={styles.todayDuration}>{item.durationLabel}</Text>
                <View style={styles.todayActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Start ${item.title}`}
                    testID={item.id === 'reading' ? 'start-reading-exercise' : `start-today-${item.id}`}
                    style={({ pressed }) => [
                      styles.todayStart,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      item.kind === 'reading'
                        ? onStart(item.sample)
                        : handleOpenGame(item.gameId)
                    }
                  >
                    <Text style={styles.todayStartText}>Start</Text>
                  </Pressable>
                  {item.kind !== 'comfort' && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Swap ${item.title}`}
                      testID={`swap-today-${item.id}`}
                      style={({ pressed }) => [
                        styles.todaySecondaryAction,
                        pressed && styles.pressed,
                      ]}
                      onPress={
                        item.kind === 'reading'
                          ? swapTodayReading
                          : swapTodaySkill
                      }
                    >
                      <Text style={styles.todaySecondaryText}>Swap</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Skip ${item.title}. Skipping does not affect your streak.`}
                    testID={`skip-today-${item.id}`}
                    style={({ pressed }) => [
                      styles.todaySecondaryAction,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => skipTodayItem(item.id)}
                  >
                    <Text style={styles.todaySecondaryText}>Skip</Text>
                  </Pressable>
                </View>
              </View>
            );
          })()}
          {todayPlan.length > 1 && (
            <View style={styles.todayNavigation}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous plan item"
                accessibilityState={{ disabled: visibleTodayIndex === 0 }}
                disabled={visibleTodayIndex === 0}
                testID="today-previous"
                style={({ pressed }) => [
                  styles.todayNavButton,
                  visibleTodayIndex === 0 && styles.todayNavButtonDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setTodayIndex((current) => Math.max(0, current - 1))
                }
              >
                <Text style={styles.todayNavText}>‹</Text>
              </Pressable>
              <View style={styles.todayDots}>
                {todayPlan.map((item, index) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Show plan item ${index + 1}: ${item.title}`}
                    accessibilityState={{ selected: index === visibleTodayIndex }}
                    key={item.id}
                    testID={`today-dot-${index}`}
                    style={[
                      styles.todayDotButton,
                      index === visibleTodayIndex && styles.todayDotButtonActive,
                    ]}
                    onPress={() => setTodayIndex(index)}
                  />
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next plan item"
                accessibilityState={{
                  disabled: visibleTodayIndex === todayPlan.length - 1,
                }}
                disabled={visibleTodayIndex === todayPlan.length - 1}
                testID="today-next"
                style={({ pressed }) => [
                  styles.todayNavButton,
                  visibleTodayIndex === todayPlan.length - 1 &&
                    styles.todayNavButtonDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setTodayIndex((current) =>
                    Math.min(todayPlan.length - 1, current + 1)
                  )
                }
              >
                <Text style={styles.todayNavText}>›</Text>
              </Pressable>
            </View>
          )}
          {!loading && todayPlan.length === 0 && todayPlanSnapshot && (
            <View
              testID={
                resolvedTodayPlan.completedCount > 0
                  ? 'today-complete'
                  : 'today-empty'
              }
              style={styles.todayEmpty}
            >
              <Text style={styles.todayTitle}>
                {resolvedTodayPlan.completedCount > 0
                  ? 'Today’s plan is complete'
                  : 'Plan skipped for today'}
              </Text>
              <Text style={styles.todayReason}>
                {resolvedTodayPlan.completedCount > 0
                  ? `${resolvedTodayPlan.completedCount} completed · ${resolvedTodayPlan.skippedCount} skipped. No new items will be added until tomorrow.`
                  : 'Skipping does not change your streak or progress.'}
              </Text>
              {resolvedTodayPlan.skippedCount > 0 && (
                <Pressable
                  accessibilityRole="button"
                  testID="restore-today-plan"
                  style={styles.todaySecondaryAction}
                  onPress={restoreTodayPlan}
                >
                  <Text style={styles.todaySecondaryText}>Restore skipped items</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {!loading &&
          (favoriteGames.length > 0 || recentGames.length > 0) && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Favorites & recent</Text>
                <Text style={styles.sectionSubtitle}>
                  Keep your preferred and last-played exercises close
                </Text>
              </View>
            </View>
            {favoriteGames.length > 0 && (
              <>
                <Text style={styles.pinGroupLabel}>FAVORITES</Text>
                <GameGrid
                  games={favoriteGames}
                  progress={progress}
                  preferences={preferences}
                  favorites={gamePins.favorites}
                  onOpenGame={handleOpenGame}
                  onToggleFavorite={handleToggleFavorite}
                />
              </>
            )}
            {recentGames.length > 0 && (
              <>
                <Text style={styles.pinGroupLabel}>RECENTLY PLAYED</Text>
                <GameGrid
                  games={recentGames}
                  progress={progress}
                  preferences={preferences}
                  favorites={gamePins.favorites}
                  onOpenGame={handleOpenGame}
                  onToggleFavorite={handleToggleFavorite}
                />
              </>
            )}
          </>
        )}

        <View style={styles.catalogTools}>
          <Text style={styles.catalogCount}>
            {gameSearch.trim()
              ? `${filteredGames.length} matching ${filteredGames.length === 1 ? 'exercise' : 'exercises'}`
              : `${ALL_GAME_LIST.length} exercises`}
          </Text>
          <View style={styles.searchField}>
            <View style={styles.searchIcon}>
              <GameIcon name="TextSearch" size={20} color={colors.primaryDark} />
            </View>
            <TextInput
              accessibilityLabel="Search exercises"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={setGameSearch}
              placeholder="Search exercises"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              testID="home-game-search"
              value={gameSearch}
            />
            {gameSearch.length > 0 && Platform.OS !== 'ios' && (
              <Pressable
                accessibilityLabel="Clear exercise search"
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => setGameSearch('')}
                style={({ pressed }) => [
                  styles.clearSearchButton,
                  pressed && styles.pressed,
                ]}
                testID="clear-home-game-search"
              >
                <Text style={styles.clearSearchText}>×</Text>
              </Pressable>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading your training plan…</Text>
          </View>
        ) : (
          filteredGames.length > 0 ? (
            <GameGrid
              games={filteredGames}
              progress={progress}
              preferences={preferences}
              favorites={gamePins.favorites}
              onOpenGame={handleOpenGame}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchTitle}>No exercises found</Text>
              <Text style={styles.emptySearchText}>
                Try a skill such as reading, words, scanning, memory, or WPM.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setGameSearch('')}
                style={({ pressed }) => [
                  styles.emptySearchButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emptySearchButtonText}>Clear search</Text>
              </Pressable>
            </View>
          )
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressSectionHeader}>
            <Text style={styles.sectionTitle}>Your progress</Text>
            <Pressable
              accessibilityRole="button"
              testID="open-history"
              onPress={onOpenHistory}
              hitSlop={8}
            >
              <Text style={styles.historyLink}>View history</Text>
            </Pressable>
          </View>

          <View style={styles.latestResult}>
            <View style={styles.latestIcon}>
              <Text style={styles.latestIconText}>{latest ? '↗' : '•'}</Text>
            </View>
            <View style={styles.latestCopy}>
              <Text style={styles.latestLabel}>
                {latest ? 'Latest session' : 'Ready when you are'}
              </Text>
              <Text style={styles.latestText} numberOfLines={2}>
                {latest
                  ? formatAttemptSummary(latest)
                  : 'Complete a measured read to set your baseline.'}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showReadingDisplay }}
            accessibilityLabel={`Reading display settings, ${showReadingDisplay ? 'expanded' : 'collapsed'}`}
            testID="toggle-reading-display"
            style={({ pressed }) => [
              styles.displaySettingsToggle,
              pressed && styles.pressed,
            ]}
            onPress={() => setShowReadingDisplay((current) => !current)}
          >
            <View>
              <Text style={styles.displaySettingsTitle}>Reading display</Text>
              <Text style={styles.displaySettingsMeta}>
                Text size, spacing, line width, and page tone
              </Text>
            </View>
            <Text style={styles.displaySettingsChevron}>
              {showReadingDisplay ? '−' : '+'}
            </Text>
          </Pressable>
          {showReadingDisplay && (
            <View style={styles.displaySettingsPanel}>
              <ReadingDisplayControl />
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset game levels"
            style={styles.resetButton}
            onPress={handleResetDifficulty}
          >
            <Text style={styles.resetButtonText}>Reset game levels</Text>
          </Pressable>
        </View>
        </ResponsiveShell>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  shell: {
    paddingHorizontal: 0,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  logoImage: {
    width: 119,
    height: 141,
    alignSelf: 'center',
    marginBottom: spacing.sm,
    borderRadius: 16,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  welcomeText: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  streakBadge: {
    minWidth: 78,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  streakIcon: {
    fontSize: 20,
  },
  streakValue: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 19,
  },
  streakLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 12,
  },
  trainingCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: 20,
    borderRadius: 26,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  trainingEyebrow: {
    color: colors.secondaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  trainingTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trainingDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  todayCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.interactivePrimary,
  },
  todayHeading: {
    flex: 1,
    marginLeft: 12,
  },
  todayOrder: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  todayTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    marginTop: 2,
  },
  todayReason: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  todayDuration: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  todayActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  todayStart: {
    minWidth: 96,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: colors.interactivePrimary,
  },
  todayStartText: {
    color: colors.onInteractive,
    fontSize: 14,
    fontWeight: '800',
  },
  todaySecondaryAction: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  todaySecondaryText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  todayEmpty: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  todayNavigation: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  todayNavButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surfaceTonal,
  },
  todayNavButtonDisabled: {
    opacity: 0.35,
  },
  todayNavText: {
    color: colors.primaryDark,
    fontSize: 31,
    fontWeight: '500',
    lineHeight: 34,
  },
  todayDots: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  todayDotButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 17,
    borderColor: 'transparent',
    backgroundColor: colors.border,
  },
  todayDotButtonActive: {
    backgroundColor: colors.primary,
  },
  measuredReadButton: {
    marginTop: spacing.md,
    minHeight: 68,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  measuredReadButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  measuredReadButtonMeta: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
  },
  powerReaderButton: {
    minHeight: 60,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceTonal,
  },
  powerReaderIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  powerReaderCopy: {
    flex: 1,
    marginLeft: 11,
  },
  powerReaderTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  powerReaderMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 26,
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  pinGroupLabel: {
    paddingHorizontal: spacing.md,
    marginBottom: 8,
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  catalogTools: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  catalogCount: {
    marginBottom: 9,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  searchField: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  searchIcon: {
    width: 28,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    minHeight: 50,
    flex: 1,
    paddingHorizontal: 10,
    color: colors.textPrimary,
    fontSize: 16,
  },
  clearSearchButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  clearSearchText: {
    color: colors.textSecondary,
    fontSize: 28,
    lineHeight: 30,
  },
  loadingCard: {
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  gamesGrid: {
    paddingHorizontal: HOME_GAME_GRID_HORIZONTAL_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gameTile: {
    position: 'relative',
    minWidth: HOME_GAME_TILE_MIN_WIDTH,
    minHeight: 138,
    marginBottom: 12,
  },
  gameTileButton: {
    width: '100%',
    minHeight: 138,
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 6,
    borderRadius: 18,
  },
  gameCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  gameIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  favoriteButton: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  favoriteButtonSelected: {
    backgroundColor: colors.warningSurface,
  },
  favoriteIcon: {
    color: colors.textMuted,
    fontSize: 22,
  },
  favoriteIconSelected: {
    color: colors.starActive,
  },
  gameTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
    minHeight: 30,
    marginTop: 8,
    textAlign: 'center',
  },
  progressTrack: {
    width: '76%',
    height: 4,
    overflow: 'hidden',
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 7,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 5,
  },
  emptySearch: {
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  emptySearchTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySearchText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptySearchButton: {
    minHeight: 44,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.interactivePrimary,
  },
  emptySearchButtonText: {
    color: colors.onInteractive,
    fontSize: 14,
    fontWeight: '800',
  },
  progressSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  progressSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLink: {
    minHeight: 44,
    paddingVertical: 12,
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  latestResult: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.surfaceTonal,
  },
  latestIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.cardBackground,
  },
  latestIconText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
  },
  latestCopy: {
    flex: 1,
    marginLeft: 11,
  },
  latestLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  latestText: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  resetButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  displaySettingsToggle: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  displaySettingsTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  displaySettingsMeta: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 11,
  },
  displaySettingsChevron: {
    minWidth: 44,
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  displaySettingsPanel: {
    marginTop: 8,
  },
  resetButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
