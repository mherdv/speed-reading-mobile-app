import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';

import { updateProgress, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';

const GAME_ID = 'WordSearchGame';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

type Props = {
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

const WORDS = ['READ', 'BOOK', 'FAST', 'MIND', 'WORD', 'TEXT', 'SCAN', 'FIND', 'LOOK', 'SEEK', 'SPEED', 'FOCUS', 'LEARN', 'STUDY'];

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { gridSize: 6, durationMs: 90000 };
    case 'medium':
      return { gridSize: 8, durationMs: 60000 };
    case 'hard':
      return { gridSize: 10, durationMs: 45000 };
  }
}

function randomLetter(): string {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

function buildGrid(size: number, word: string): { grid: string[][]; wordPositions: Set<string> } {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => randomLetter())
  );
  
  const wordPositions = new Set<string>();
  const row = Math.floor(Math.random() * size);
  const maxCol = size - word.length;
  const col = Math.floor(Math.random() * (maxCol + 1));
  
  for (let i = 0; i < word.length; i++) {
    grid[row][col + i] = word[i];
    wordPositions.add(`${row}-${col + i}`);
  }
  
  return { grid, wordPositions };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WordSearch({ 
  durationMs: durationMsProp, 
  difficulty = 'medium',
  autoStart = false,
  onReportResult 
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const [targetWord, setTargetWord] = useState(() => WORDS[0]);
  const [gridData, setGridData] = useState(() => buildGrid(8, WORDS[0]));
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [wordsFound, setWordsFound] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  const startedAtRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const wordsFoundRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const gridSize = currentConfig.gridSize;
  const currentDurationMs = durationMsProp ?? currentConfig.durationMs;

  useEffect(() => {
    if (phase !== 'running') return;
    const endAt = startedAtRef.current + currentDurationMs;
    
    const interval = setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setTimeLeftMs(left);
      if (left <= 0) {
        clearInterval(interval);
        finish();
      }
    }, 100);
    
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [phase, currentDurationMs]);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start() {
    reportedRef.current = false;
    scoreRef.current = 0;
    wordsFoundRef.current = 0;
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTargetWord(word);
    setGridData(buildGrid(gridSize, word));
    setFoundCells(new Set());
    setScore(0);
    setWordsFound(0);
    setTimeLeftMs(currentDurationMs);
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    
    const now = Date.now();
    const elapsedMs = now - startedAtRef.current;
    const accuracy = 1; // Always successful in this game
    
    updateProgress(GAME_ID, accuracy >= 0.7).then(({ progress }) => setGameProgress(progress));
    
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { 
        wordsFound: wordsFoundRef.current,
        difficulty: selectedDifficulty,
        gridSize,
      },
    });
    
    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function onCellPress(row: number, col: number) {
    if (phase !== 'running') return;
    
    const key = `${row}-${col}`;
    
    // If this cell is part of the target word, found it!
    if (gridData.wordPositions.has(key)) {
      scoreRef.current += 10;
      wordsFoundRef.current += 1;
      setScore(scoreRef.current);
      setWordsFound(wordsFoundRef.current);
      
      // Mark all word cells as found
      setFoundCells(new Set(gridData.wordPositions));
      
      // Next word after a brief delay
      
        const word = WORDS[Math.floor(Math.random() * WORDS.length)];
        setTargetWord(word);
        setGridData(buildGrid(gridSize, word));
        setFoundCells(new Set());
    }
  }

  // Calculate cell size based on grid
  const cellSize = Math.min(
    (SCREEN_WIDTH - 40) / gridSize,
    (SCREEN_HEIGHT - 300) / gridSize,
    36
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Search</Text>
        <Text style={styles.subtitle}>Tap any letter of the hidden word</Text>
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
                key: 'found',
                value: wordsFound,
                label: 'Found',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: Math.ceil(timeLeftMs / 1000),
                label: 'Seconds',
                containerStyle: [styles.statBox, styles.timerBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'score',
                value: score,
                label: 'Score',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Find this word:</Text>
            <Text style={styles.targetWord}>{targetWord}</Text>
          </View>

          <View style={styles.gridContainer}>
            <View style={[styles.grid, { width: cellSize * gridSize + 8 }]}>
              {gridData.grid.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map((letter, colIdx) => {
                    const key = `${rowIdx}-${colIdx}`;
                    const isFound = foundCells.has(key);
                    const isWordPart = gridData.wordPositions.has(key);
                    return (
                      <Pressable
                        key={key}
                        testID={`cell-${rowIdx}-${colIdx}`}
                        style={[
                          styles.cell, 
                          { width: cellSize, height: cellSize },
                          isFound && styles.cellFound
                        ]}
                        onPress={() => onCellPress(rowIdx, colIdx)}
                      >
                        <Text style={[
                          styles.cellText, 
                          { fontSize: cellSize * 0.45 },
                          isFound && styles.cellTextFound
                        ]}>
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
          <Text style={styles.endEmoji}>🔍</Text>
          <Text style={styles.endTitle}>Time's Up!</Text>
          <Text style={styles.endScore}>{wordsFound} Words</Text>
          <Text style={styles.endMeta}>Score: {score}</Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
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
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  statBox: { alignItems: 'center', backgroundColor: '#DBEAFE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  timerBox: { backgroundColor: '#BFDBFE' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1E40AF' },
  statLabel: { fontSize: 10, color: '#3B82F6' },
  targetCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  targetLabel: { fontSize: 12, color: '#3B82F6' },
  targetWord: { fontSize: 22, fontWeight: '800', color: '#1E3A8A', letterSpacing: 3 },
  gridContainer: { alignItems: 'center' },
  grid: { backgroundColor: '#F0F9FF', borderRadius: 8, padding: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'center' },
  cell: {
    margin: 1,
    backgroundColor: 'white',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cellFound: { backgroundColor: '#10B981', borderColor: '#10B981' },
  cellText: { fontWeight: '600', color: '#374151' },
  cellTextFound: { color: 'white' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 32, fontWeight: '800', color: '#3B82F6', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
