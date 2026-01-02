import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { loadAllProgress, clearProgress, type GameProgress } from '../data/progressStore';
import { loadResults } from '../data/resultsStore';
import type { AttemptResult, TextSample } from '../domain/types';
import { colors, gameColors } from '../theme/colors';
import { Button } from '../ui/Button';
import { GameIcon } from '../ui/GameIcon';
import { DifficultyStars } from '../ui/DifficultyStars';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  onStart: (sample: TextSample) => void;
  onOpenHistory: () => void;
  refreshToken: number;
  onOpenGame: (gameId: string) => void;
};

type GameCardModel = {
  id: string;
  title: string;
  description: string;
};

const GRID_COLUMNS = 3;
const GRID_GAP = 10;

const GAMES: GameCardModel[] = [
  // === CORE SPEED READING (Most useful) ===
  {
    id: 'PowerReader',
    title: 'Power Read',
    description: 'Boosts reading speed visual processing.',
  },
  {
    id: 'FlashReading',
    title: 'Flash',
    description: 'Reading reading exercises',
  },
  {
    id: 'ComprehensionTest',
    title: 'Comprehend',
    description: 'Comprehension Test',
  },
  
  // === FOCUS & ATTENTION ===
  {
    id: 'SchulteNumbers',
    title: 'Schulte',
    description: 'Commands of numbers',
  },
  {
    id: 'SchulteLetters',
    title: 'Letters',
    description: 'Comprehise of Letters',
  },
  {
    id: 'SchulteMix',
    title: 'Mix',
    description: 'Number exercise',
  },
  
  // === EYE TRAINING ===
  {
    id: 'EyeMovementTraining',
    title: 'Eyes',
    description: 'Comrate eyes',
  },
  {
    id: 'VisualSpanExpansion',
    title: 'Span',
    description: 'Gander span',
  },
  {
    id: 'PatternScanning',
    title: 'Patterns',
    description: 'Comprestions',
  },
  
  // === WORD RECOGNITION ===
  {
    id: 'TimedWordRecognition',
    title: 'Words',
    description: 'Spences reading and words',
  },
  {
    id: 'TimedPhraseRecognition',
    title: 'Phrases',
    description: 'Boosts phrases & visual proceeding.',
  },
  {
    id: 'WordPairs',
    title: 'Pairs',
    description: 'Reections and word & pairs',
  },
  
  // === SEARCH & SCAN ===
  {
    id: 'TextSearch',
    title: 'Text',
    description: 'Writens your text message',
  },
  {
    id: 'WordSearchGame',
    title: 'Search',
    description: 'Search your search',
  },
  {
    id: 'NumberSearch',
    title: 'Numbers',
    description: 'Connection of numbers',
  },
  
  // === RECOGNITION & MEMORY ===
  {
    id: 'LetterRecognition',
    title: 'Letters',
    description: 'Humeon of Letters',
  },
  {
    id: 'NumberRecognition',
    title: 'Digits',
    description: 'Concern sri digits',
  },
  {
    id: 'SymbolRecognition',
    title: 'Symbols',
    description: 'Comonesand symbols',
  },
  
  // === BRAIN TEASERS ===
  {
    id: 'LetterJumble',
    title: 'Jumble',
    description: 'Hand your jukler Jumble',
  },
  {
    id: 'WordMismatchGrid',
    title: 'Mismatch',
    description: 'Compared or mismatch',
  },
  {
    id: 'EvenNumbers',
    title: 'Even',
    description: 'Containrs 2 even',
  },
];

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
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const [dailyStreak, setDailyStreak] = useState(5); // TODO: Calculate from results

  const cardWidth = useMemo(() => {
    if (gridWidth == null) return null;
    const totalGaps = GRID_GAP * (GRID_COLUMNS - 1);
    const width = Math.floor((gridWidth - totalGaps) / GRID_COLUMNS);
    return width > 0 ? width : null;
  }, [gridWidth]);

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
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.quickStartGradient}
        >
          <Text style={styles.quickStartText}>Quick-start</Text>
          <Text style={styles.quickStartSubtext}>Recommended Exercise</Text>
        </LinearGradient>
      </Pressable>

      {/* Games Grid */}
      <View style={styles.section}>
        <View
          style={styles.gamesGrid}
          onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
        >
          {GAMES.map((g, index) => {
            const gameProgress = progress[g.id];
            const level = gameProgress?.level ?? 1;
            const progressPercent = Math.min(100, level * 20) / 100;
            const iconColor = gameColors[g.id] || colors.primary;
            const iconBgColor = iconColor + '15'; // 15% opacity
            const circumference = 2 * Math.PI * 8;
            const strokeDashoffset = circumference - (circumference * progressPercent);
            
            return (
              <Pressable
                key={g.id}
                testID={`open-game-${g.id}`}
                style={[
                  styles.gameCard,
                  cardWidth != null && { width: cardWidth },
                ]}
                onPress={() => onOpenGame(g.id)}
              >
                {/* Icon Container with Light Background */}
                <View style={[styles.gameIconContainer, { backgroundColor: iconBgColor }]}>
                  <GameIcon name={g.id} size={24} color={iconColor} />
                </View>
                
                {/* Title */}
                <Text style={styles.gameTitle} numberOfLines={2}>{g.title}</Text>
                
                {/* Difficulty Stars */}
                <View style={styles.starsRow}>
                  <DifficultyStars level={level} size="small" orientation="horizontal" />
                </View>
                
                {/* Progress Ring - Bottom Right */}
                <View style={styles.progressRing}>
                  <Svg width={20} height={20} style={{ transform: [{ rotate: '-90deg' }] }}>
                    {/* Background circle */}
                    <Circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke={colors.border}
                      strokeWidth={2}
                      fill="transparent"
                    />
                    {/* Progress circle */}
                    <Circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke={iconColor}
                      strokeWidth={2}
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonsRow}>
          <Pressable style={styles.actionButton} onPress={onOpenHistory}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  logoContainer: {
    width: 356,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  streakBadge: {
    backgroundColor: colors.cardBackground,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickStartButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStartGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  quickStartText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  quickStartSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    // justifyContent: 'flex-start',
  },
  gameCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 16,
    marginBottom: GRID_GAP,
    // marginRight: GRID_GAP,
    alignItems: 'flex-start',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    maxWidth: '32%',
  },
  gameIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'left',
    marginBottom: 6,
    lineHeight: 18,
  },
  gameDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 24,
    lineHeight: 12,
  },
  starsRow: {
    marginTop: 'auto',
  },
  progressRing: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  latestResult: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: 8,
  },
  latestText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
  },
});
