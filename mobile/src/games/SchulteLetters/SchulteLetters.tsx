import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { loadGameProgress, updateProgress, levelToDifficulty, levelToStars, type GameProgress } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'SchulteLetters';

const CELL_GAP = 4;
const GRID_PADDING = 4;

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

type Props = {
  gridSize?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 4 };
    case 'medium':
      return { gridSize: 5 };
    case 'hard':
      return { gridSize: 7 };
  }
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGrid(size: number): string[] {
  const total = size * size;
  const letters = LETTERS.slice(0, total);
  return shuffleArray(letters);
}

export default function SchulteLetters({ 
  gridSize: gridSizeProp,
  difficulty = 'medium',
  autoStart = false, 
  onReportResult 
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  const [grid, setGrid] = useState<string[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [tapped, setTapped] = useState<Set<string>>(new Set());

  const startedAtRef = useRef<number>(0);
  const reportedRef = useRef(false);

  const [progressLoaded, setProgressLoaded] = useState(false);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const gridSize = gridSizeProp ?? currentConfig.gridSize;
  const total = gridSize * gridSize;
  const sequence = LETTERS.slice(0, total);

  // Use dynamic dimensions for responsive layout
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Calculate available space for the grid dynamically
  const headerHeight = 50;
  const statsHeight = 60;
  const containerPadding = 24;
  const backButtonArea = 80;
  const availableHeight = screenHeight - headerHeight - statsHeight - containerPadding - backButtonArea;
  const availableWidth = screenWidth - containerPadding;

  // Calculate cell size - ensure square cells that fit within available space
  const cellGap = CELL_GAP;
  const gridPadding = GRID_PADDING;
  const maxGridWidth = availableWidth - gridPadding * 2;
  const maxGridHeight = availableHeight - gridPadding * 2;
  const cellSize = Math.floor(Math.min(
    (maxGridWidth - cellGap * (gridSize - 1)) / gridSize,
    (maxGridHeight - cellGap * (gridSize - 1)) / gridSize
  ));
  const actualGridSize = cellSize * gridSize + cellGap * (gridSize - 1) + gridPadding * 2;

  useEffect(() => {
    loadGameProgress(GAME_ID).then((progress) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
      setProgressLoaded(true);
    });
  }, []);

  // Auto-start when autoStart prop is true
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (progressLoaded && autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase, progressLoaded]);

  function start() {
    reportedRef.current = false;
    setGrid(generateGrid(gridSize));
    setNextIndex(0);
    setMistakes(0);
    setTapped(new Set());
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;
    
    const now = Date.now();
    const elapsedMs = now - startedAtRef.current;
    const attempts = total + mistakes;
    const accuracy = attempts > 0 ? total / attempts : 1;
    
    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, total).then(({ progress }) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: total,
      accuracy,
      details: { gridSize, mistakes, timeMs: elapsedMs, difficulty: selectedDifficulty },
    });
    
    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function onTap(letter: string) {
    if (phase !== 'running') return;
    
    const expected = sequence[nextIndex];
    if (letter === expected) {
      setTapped(prev => new Set(prev).add(letter));
      if (nextIndex === total - 1) {
        finish();
      } else {
        setNextIndex(nextIndex + 1);
      }
    } else {
      setMistakes(m => m + 1);
    }
  }

  const nextLetter = sequence[nextIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schulte Letters</Text>
        <Text style={styles.subtitle}>Tap letters A to {sequence[total - 1]} in order</Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <View style={styles.progressInfo}>
            <Text style={styles.levelLabel}>Level {gameProgress.level}</Text>
            <Text style={styles.starsDisplay}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Start Game</Text>
          </Pressable>
        </View>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{nextLetter}</Text>
              <Text style={styles.statLabel}>Next</Text>
            </View>
            <View style={[styles.statBox, styles.progressBox]}>
              <Text style={styles.statValue}>{tapped.size}/{total}</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, mistakes > 0 && styles.errorValue]}>{mistakes}</Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <View
              testID="schulte-letters-grid"
              style={[styles.grid, { width: actualGridSize, height: actualGridSize, padding: GRID_PADDING }]}
            >
              {Array.from({ length: gridSize }, (_, rowIndex) => (
                <View
                  key={rowIndex}
                  testID={`schulte-letters-row-${rowIndex}`}
                  style={[styles.gridRow, rowIndex < gridSize - 1 && { marginBottom: cellGap }]}
                >
                  {Array.from({ length: gridSize }, (_, colIndex) => {
                    const cellIndex = rowIndex * gridSize + colIndex;
                    const letter = grid[cellIndex];
                    const isDone = tapped.has(letter);
                    return (
                      <Pressable
                        key={colIndex}
                        testID={`cell-${letter}`}
                        style={[
                          styles.cell,
                          { 
                            width: cellSize, 
                            height: cellSize,
                            marginRight: colIndex < gridSize - 1 ? cellGap : 0,
                          },
                          isDone && styles.cellDone,
                        ]}
                        onPress={() => onTap(letter)}
                        disabled={isDone}
                      >
                        <Text style={[styles.cellText, { fontSize: cellSize * 0.4 }, isDone && styles.cellTextDone]}>
                          {letter}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🔤</Text>
          <Text style={styles.endTitle}>Completed!</Text>
          <Text style={styles.endTime}>
            {Math.floor((Date.now() - startedAtRef.current) / 1000)}s
          </Text>
          <Text style={styles.endMeta}>
            {mistakes === 0 ? 'Perfect! No mistakes' : `${mistakes} mistake${mistakes > 1 ? 's' : ''}`}
          </Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable style={styles.playAgainBtn} onPress={() => { setPhase('idle'); setTimeout(start, 50); }}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  starsDisplay: {
    fontSize: 24,
    letterSpacing: 4,
  },
  startBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  statBox: { alignItems: 'center', backgroundColor: '#EDE9FE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  progressBox: { backgroundColor: '#DDD6FE' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#5B21B6' },
  errorValue: { color: '#DC2626' },
  statLabel: { fontSize: 10, color: '#7C3AED' },
  gridContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: 'white',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  cellDone: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  cellText: { fontWeight: '700', color: '#5B21B6' },
  cellTextDone: { color: 'white' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endTime: { fontSize: 32, fontWeight: '800', color: '#8B5CF6', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#8B5CF6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
