import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { updateProgress, levelToDifficulty, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';

const GAME_ID = 'SchulteMix';

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

type Props = {
  gridSize?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';
type CellType = { value: string; type: 'number' | 'letter' };

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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGrid(size: number): CellType[] {
  const half = Math.floor((size * size) / 2);
  const numbers: CellType[] = Array.from({ length: half }, (_, i) => ({ value: String(i + 1), type: 'number' }));
  const letters: CellType[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, size * size - half).split('').map(l => ({ value: l, type: 'letter' }));
  return shuffleArray([...numbers, ...letters]);
}

function generateSequence(size: number): CellType[] {
  const half = Math.floor((size * size) / 2);
  const seq: CellType[] = [];
  const letterCount = size * size - half;
  
  for (let i = 0; i < Math.max(half, letterCount); i++) {
    if (i < half) seq.push({ value: String(i + 1), type: 'number' });
    if (i < letterCount) seq.push({ value: String.fromCharCode(65 + i), type: 'letter' });
  }
  
  return seq;
}

export default function SchulteMix({ 
  gridSize: gridSizeProp,
  difficulty = 'medium',
  autoStart = false, 
  onReportResult 
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    setSelectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const [grid, setGrid] = useState<CellType[]>([]);
  const [sequence, setSequence] = useState<CellType[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [tapped, setTapped] = useState<Set<string>>(new Set());

  const startedAtRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  // Cleanup on unmount - prevent reporting results after back button
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const gridSize = gridSizeProp ?? currentConfig.gridSize;
  const total = gridSize * gridSize;

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

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start() {
    reportedRef.current = false;
    setGrid(generateGrid(gridSize));
    setSequence(generateSequence(gridSize));
    setNextIndex(0);
    setMistakes(0);
    setTapped(new Set());
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (cancelledRef.current) return;
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

  function onTap(cell: CellType) {
    if (phase !== 'running') return;
    
    const expected = sequence[nextIndex];
    if (cell.value === expected.value && cell.type === expected.type) {
      const key = `${cell.type}-${cell.value}`;
      setTapped(prev => new Set(prev).add(key));
      if (nextIndex === sequence.length - 1) {
        finish();
      } else {
        setNextIndex(nextIndex + 1);
      }
    } else {
      setMistakes(m => m + 1);
    }
  }

  const nextCell = sequence[nextIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schulte Mix</Text>
        <Text style={styles.subtitle}>Alternate: 1, A, 2, B, 3, C...</Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          onStart={start}
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
          progressInfoStyle={styles.progressInfo}
          levelLabelStyle={styles.levelLabel}
          starsStyle={styles.starsDisplay}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        />
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'next',
                value: nextCell?.value ?? '',
                label: `Next (${nextCell?.type === 'number' ? '#' : 'A'})`,
                containerStyle: [styles.statBox, nextCell?.type === 'number' ? styles.numberBox : styles.letterBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'progress',
                value: `${tapped.size}/${total}`,
                label: 'Progress',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'errors',
                value: mistakes,
                label: 'Errors',
                containerStyle: styles.statBox,
                valueStyle: [styles.statValue, mistakes > 0 && styles.errorValue],
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={styles.gridContainer}>
            <View
              testID="schulte-mix-grid"
              style={[styles.grid, { width: actualGridSize, height: actualGridSize, padding: GRID_PADDING }]}
            >
              {Array.from({ length: gridSize }, (_, rowIndex) => (
                <View
                  key={rowIndex}
                  testID={`schulte-mix-row-${rowIndex}`}
                  style={[styles.gridRow, rowIndex < gridSize - 1 && { marginBottom: cellGap }]}
                >
                  {Array.from({ length: gridSize }, (_, colIndex) => {
                    const cellIndex = rowIndex * gridSize + colIndex;
                    const cell = grid[cellIndex];
                    if (!cell) return null;
                    const key = `${cell.type}-${cell.value}`;
                    const isDone = tapped.has(key);
                    return (
                      <Pressable
                        key={colIndex}
                        testID={`cell-${cell.type}-${cell.value}`}
                        style={[
                          styles.cell,
                          { 
                            width: cellSize, 
                            height: cellSize,
                            marginRight: colIndex < gridSize - 1 ? cellGap : 0,
                          },
                          cell.type === 'number' ? styles.cellNumber : styles.cellLetter,
                          isDone && styles.cellDone,
                        ]}
                        onPress={() => onTap(cell)}
                        disabled={isDone}
                      >
                        <Text style={[styles.cellText, { fontSize: cellSize * 0.4 }, isDone && styles.cellTextDone]}>
                          {cell.value}
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
          <Text style={styles.endEmoji}>🎯</Text>
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
    backgroundColor: '#EC4899',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  statBox: { alignItems: 'center', backgroundColor: '#FCE7F3', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  numberBox: { backgroundColor: '#DBEAFE' },
  letterBox: { backgroundColor: '#FEF3C7' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#BE185D' },
  errorValue: { color: '#DC2626' },
  statLabel: { fontSize: 10, color: '#DB2777' },
  gridContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    backgroundColor: '#FDF2F8',
    borderRadius: 8,
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cellNumber: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  cellLetter: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  cellDone: { backgroundColor: '#EC4899', borderColor: '#EC4899' },
  cellText: { fontWeight: '700', color: '#1F2937' },
  cellTextDone: { color: 'white' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endTime: { fontSize: 32, fontWeight: '800', color: '#EC4899', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#EC4899', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
