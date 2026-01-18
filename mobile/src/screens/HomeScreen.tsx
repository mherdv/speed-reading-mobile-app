import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { loadAllProgress, clearProgress, type GameProgress } from '../data/progressStore';
import { loadResults } from '../data/resultsStore';
import type { AttemptResult, TextSample } from '../domain/types';
import { colors, gradients, gameGradients, spacing, borderRadius, shadows } from '../theme/colors';
import { GameIcon } from '../ui/GameIcon';
import { GAME_LIST } from '../games/registry';

type Props = {
  onStart: (sample: TextSample) => void;
  onOpenHistory: () => void;
  refreshToken: number;
  onOpenGame: (gameId: string) => void;
};

const GRID_COLUMNS = 3;
const GRID_GAP = 15;

function formatLatest(result: AttemptResult): string {
  const hasWpm = result.wordCount > 0 && result.wpm > 0;
  if (hasWpm) {
    return `${result.sampleTitle}: ${result.wpm} WPM · ${result.comprehensionCorrect ? 'Correct' : 'Incorrect'}`;
  }

  const parts: string[] = [result.sampleTitle];
  if (typeof result.score === 'number') parts.push(`Score: ${result.score}`);
  if (typeof result.accuracy === 'number') parts.push(`${Math.round(result.accuracy * 100)}%`);
  if (parts.length === 1) parts.push('Completed');
  return parts.join(' · ');
}

export function HomeScreen({ onStart, onOpenHistory, refreshToken, onOpenGame }: Props) {
  const [latest, setLatest] = useState<AttemptResult | null>(null);
  const [progress, setProgress] = useState<Record<string, GameProgress>>({});
  const [dailyStreak, setDailyStreak] = useState(5); // TODO: Calculate from results

  const handleResetDifficulty = async () => {
    const doReset = async () => {
      await clearProgress();
      setProgress({});
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('This will reset all games to level 1. Are you sure?')) {
        await doReset();
      }
    } else {
      Alert.alert(
        'Reset Difficulty',
        'This will reset all games to level 1. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: doReset,
          },
        ]
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [results, allProgress] = await Promise.all([
        loadResults(),
        loadAllProgress(),
      ]);
      if (cancelled) return;
      setLatest(results[0] ?? null);
      setProgress(allProgress);
      
      // Calculate daily streak from results
      if (results.length > 0) {
        // Simple streak calculation - count consecutive days with activity
        const today = new Date().toDateString();
        const lastActivity = new Date(results[0].finishedAtIso).toDateString();
        if (today === lastActivity) {
          setDailyStreak(prev => Math.max(prev, 1));
        }
      }
    }

    refresh();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.gradientContainer}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>Daily Streak: {dailyStreak} Days 🔥</Text>
          </View>
        </View>

      {/* Quick Start Button */}
      <Pressable 
        style={styles.quickStartButton}
        onPress={() => onOpenGame('PowerReader')}
      >
        <LinearGradient
          colors={gradients.button.colors}
          start={gradients.button.start}
          end={gradients.button.end}
          style={styles.quickStartGradient}
        >
          <Text style={styles.quickStartText}>Quick-start</Text>
          <Text style={styles.quickStartSubtext}>Recommended Exercise</Text>
        </LinearGradient>
      </Pressable>

      {/* Games Grid */}
      <View style={styles.section}>
        <View style={styles.gamesGrid}>
          {GAME_LIST.map((g) => {
            const gameProgress = progress[g.id];
            const level = gameProgress?.level ?? 1;
            const progressPercent = Math.min(100, level * 20) / 100;
            
            // Get game-specific gradient or fallback to default
            const iconGradient = gameGradients[g.id] ?? gradients.cardIcon.colors;
            
            return (
              <Pressable
                key={g.id}
                testID={`open-game-${g.id}`}
                style={styles.gameCard}
                onPress={() => onOpenGame(g.id)}
              >
                {/* Icon Container with Game-specific Gradient Background */}
                <LinearGradient
                  colors={iconGradient}
                  start={gradients.cardIcon.start}
                  end={gradients.cardIcon.end}
                  style={styles.gameIconContainer}
                >
                  <GameIcon name={g.id} size={24} color="#FFFFFF" />
                </LinearGradient>
                
                {/* Title */}
                <Text style={styles.gameTitle} numberOfLines={2}>{g.title}</Text>
                
                {/* Description */}
                <Text style={styles.gameDescription} numberOfLines={2}>{g.shortDescription}</Text>
                
                {/* Progress Bar */}
                <View style={styles.progressRing}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={gradients.progress.colors}
                      start={gradients.progress.start}
                      end={gradients.progress.end}
                      style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonsRow}>
          <Pressable style={styles.actionButton} onPress={onOpenHistory} testID="open-history">
            <Text style={styles.actionButtonIcon}>📊</Text>
            <Text style={styles.actionButtonText}>History</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleResetDifficulty}>
            <Text style={styles.actionButtonIcon}>⚙️</Text>
            <Text style={styles.actionButtonText}>Reset</Text>
          </Pressable>
        </View>
        
        {latest && (
          <View style={styles.latestResult}>
            <Text style={styles.latestLabel}>Latest:</Text>
            <Text style={styles.latestText} numberOfLines={1}>
              {formatLatest(latest)}
            </Text>
          </View>
        )}
      </View>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  logoContainer: {
    width: 356,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  streakBadge: {
    backgroundColor: colors.cardBackground,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    alignSelf: 'center',
    ...shadows.medium,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickStartButton: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 35,
    overflow: 'hidden',
    ...shadows.medium,
  },
  quickStartGradient: {
    height: 70,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStartText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  quickStartSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.md,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: spacing.sm,
    marginBottom: GRID_GAP,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 160,
    ...shadows.small,
    width: '31%',
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  gameDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 28,
    lineHeight: 14,
  },
  starsRow: {
    marginTop: 'auto',
    marginBottom: spacing.xs,
  },
  progressRing: {
    width: '80%',
    marginTop: spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.small,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  latestResult: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  latestText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
});
