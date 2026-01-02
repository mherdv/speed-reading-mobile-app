import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { loadAllProgress, clearProgress, type GameProgress } from '../data/progressStore';
import { loadResults } from '../data/resultsStore';
import type { AttemptResult, TextSample } from '../domain/types';
import { colors, gameColors } from '../theme/colors';
import { Button } from '../ui/Button';
import { DifficultyStars } from '../ui/DifficultyStars';

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
  iconText: string;
};

const GRID_COLUMNS = 3;
const GRID_GAP = 10;

const GAMES: GameCardModel[] = [
  // Row 1: Word pairs, Letter jumble, Numbers
  {
    id: 'WordPairs',
    title: 'Pairs',
    description: 'Match word opposites',
    iconText: '⇄',
  },
  {
    id: 'LetterJumble',
    title: 'Jumble',
    description: 'Unscramble words',
    iconText: '🔀',
  },
  {
    id: 'NumberRecognition',
    title: 'Numbers',
    description: 'Spot numbers rapidly',
    iconText: '123',
  },
  // Row 2: Word search, Schulte numbers, Text search
  {
    id: 'WordSearchGame',
    title: 'Search',
    description: 'Find hidden words',
    iconText: '🔍',
  },
  {
    id: 'SchulteNumbers',
    title: 'Schulte',
    description: 'Tap 1-25 in order',
    iconText: '5',
  },
  {
    id: 'TextSearch',
    title: 'Text',
    description: 'Find target words quickly',
    iconText: '🔎',
  },
  // Row 3: Number search, Even numbers, Schulte letters
  {
    id: 'NumberSearch',
    title: 'Find',
    description: 'Find target numbers',
    iconText: '🔢',
  },
  {
    id: 'EvenNumbers',
    title: 'Even',
    description: 'Find even numbers quickly',
    iconText: '2',
  },
  {
    id: 'SchulteLetters',
    title: 'Letters',
    description: 'Tap A-Y in order',
    iconText: 'Z',
  },
  // Row 4: Letter mixup, Schulte mix, Words
  {
    id: 'LetterRecognition',
    title: 'Mixup',
    description: 'Identify letters in a grid',
    iconText: 'Aa',
  },
  {
    id: 'SchulteMix',
    title: 'Mix',
    description: 'Alternate 1,A,2,B...',
    iconText: '#',
  },
  {
    id: 'PowerReader',
    title: 'Words',
    description: 'Read chunks of text at speed',
    iconText: '⚡',
  },
  // Additional games (not shown in reference design)
  {
    id: 'EyeMovementTraining',
    title: 'Eyes',
    description: 'Train smooth eye tracking',
    iconText: '👁',
  },
  {
    id: 'VisualSpanExpansion',
    title: 'Memory',
    description: 'Remember sequences',
    iconText: '🧠',
  },
  {
    id: 'FlashReading',
    title: 'Flash',
    description: 'Read brief word flashes',
    iconText: '💡',
  },
  {
    id: 'ComprehensionTest',
    title: 'Comprehension',
    description: 'Answer questions accurately',
    iconText: '📖',
  },
  {
    id: 'SymbolRecognition',
    title: 'Symbols',
    description: 'Recognize symbols fast',
    iconText: '∞',
  },
  {
    id: 'PatternScanning',
    title: 'Patterns',
    description: 'Find patterns quickly',
    iconText: '◧',
  },
  {
    id: 'TimedPhraseRecognition',
    title: 'Phrases',
    description: 'Recognize timed phrases',
    iconText: '⏱',
  },
  {
    id: 'TimedWordRecognition',
    title: 'Recognition',
    description: 'Remember flashed words',
    iconText: '📝',
  },
  {
    id: 'WordMismatchGrid',
    title: 'Mismatch',
    description: 'Find non-matching pairs',
    iconText: '≠',
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
    }

    refresh();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        <View
          style={styles.gamesGrid}
          onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
        >
          {GAMES.map((g, index) => {
            const gameProgress = progress[g.id];
            const level = gameProgress?.level ?? 1;
            const isLastInRow = (index + 1) % GRID_COLUMNS === 0;
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
                <View style={styles.iconRow}>
                  <View style={[styles.gameIcon, { backgroundColor: gameColors[g.id] || colors.primary }]}>
                    <Text style={styles.gameIconText}>{g.iconText}</Text>
                  </View>
                  <View style={styles.starsRow}>
                    <DifficultyStars level={level} size="small" orientation="vertical" />
                  </View>
                </View>
                <Text style={styles.gameTitle} numberOfLines={1}>{g.title}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest result</Text>
        {latest ? (
          <Text style={styles.latestText}>
            {formatLatest(latest)}
          </Text>
        ) : (
          <Text style={styles.latestTextMuted}>No results yet.</Text>
        )}
        <View style={styles.buttonsRow}>
          <Button testID="open-history" label="View history" onPress={onOpenHistory} />
          <Button testID="reset-difficulty" label="Reset Difficulty" onPress={handleResetDifficulty} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.textPrimary,
  },
  latestText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  latestTextMuted: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-around',
  },
  gameCard: {
    padding: 8,
    marginBottom: GRID_GAP,
    alignItems: 'center',
    maxWidth: 80,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',    
    justifyContent: 'space-between',
  },
  gameIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIconText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  gameTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'left',
    width: '100%',
  },
  starsRow: {
    marginLeft: 2,
  },
});
