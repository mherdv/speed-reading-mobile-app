import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { loadGameProgress, updateProgress, levelToDifficulty, levelToStars, type GameProgress } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { getRandomArticle, type Article } from '../../data/articles';

const GAME_ID = 'PowerReader';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

type Props = {
  text?: string;
  chunkSize?: number;
  intervalMs?: number;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

// Get a random article from the database as the default text
function getDefaultArticle(): Article {
  return getRandomArticle();
}

export type Difficulty = 'easy' | 'medium' | 'hard';

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { chunkSize: 2, intervalMs: 800 };
    case 'medium':
      return { chunkSize: 3, intervalMs: 600 };
    case 'hard':
      return { chunkSize: 5, intervalMs: 400 };
  }
}

export default function PowerReader({ 
  text: textProp, 
  chunkSize: chunkSizeProp, 
  intervalMs: intervalMsProp, 
  autoStart = false,
  onReportResult 
}: Props & { difficulty?: Difficulty }) {
  // Get a random article on component mount
  const [currentArticle] = useState(() => getDefaultArticle());
  const text = textProp ?? currentArticle.text;
  
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [targetWpm, setTargetWpm] = useState(200); // Target WPM instead of multiplier
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Load progress on mount
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
  
  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const chunkSize = chunkSizeProp ?? currentConfig.chunkSize;
  
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  const [chunkIndex, setChunkIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const chunkIndexRef = useRef(0);
  const targetWpmRef = useRef(200);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current);
    };
  }, []);

  function scheduleNextChunk() {
    // Calculate interval based on target WPM: interval = (words per chunk) / WPM * 60000 ms
    const currentInterval = Math.round((chunkSize / targetWpmRef.current) * 60000);
    chunkTimerRef.current = setTimeout(() => {
      chunkIndexRef.current += 1;
      if (chunkIndexRef.current >= chunks.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      } else {
        setChunkIndex(chunkIndexRef.current);
        scheduleNextChunk();
      }
    }, currentInterval);
  }

  function start(force = false) {
    if (!force && phase !== 'idle') return;
    reportedRef.current = false;
    chunkIndexRef.current = 0;
    targetWpmRef.current = 200;
    setTargetWpm(200);
    setPhase('running');
    setChunkIndex(0);
    setElapsed(0);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);

    scheduleNextChunk();
  }

  function adjustSpeed(delta: number) {
    const newWpm = Math.max(50, Math.min(600, targetWpmRef.current + delta));
    targetWpmRef.current = newWpm;
    setTargetWpm(newWpm);
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const wordsRead = words.length;
    const wpm = Math.round((wordsRead / elapsedMs) * 60000);

    // Save progress - completing the reading is always success
    updateProgress(GAME_ID, true, wpm).then(({ progress }) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: wpm,
      accuracy: 1,
      details: { wordsRead, chunksShown: chunks.length },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function playAgain() {
    start(true);
  }

  const current = chunks[chunkIndex] ?? '';
  const progress = ((chunkIndex + 1) / chunks.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Power Reader</Text>
        <Text style={styles.subtitle}>Read chunks at high speed</Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <Text style={styles.difficultyLabel}>Select Difficulty:</Text>
          <View style={styles.difficultyRow}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <Pressable
                key={d}
                style={[
                  styles.difficultyBtn,
                  selectedDifficulty === d && styles.difficultyBtnActive,
                ]}
                onPress={() => setSelectedDifficulty(d)}
              >
                <Text
                  style={[
                    styles.difficultyBtnText,
                    selectedDifficulty === d && styles.difficultyBtnTextActive,
                  ]}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.difficultyHint}>
            {selectedDifficulty === 'easy' && '2 words per chunk, slower pace'}
            {selectedDifficulty === 'medium' && '3 words per chunk, moderate pace'}
            {selectedDifficulty === 'hard' && '5 words per chunk, fast pace'}
          </Text>
          <Text style={styles.previewLabel}>Text preview ({words.length} words):</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewText} numberOfLines={4}>
              {text}
            </Text>
          </View>
          <Pressable testID="start-button" style={styles.startBtn} onPress={() => start()}>
            <Text style={styles.startBtnText}>Start Reading</Text>
          </Pressable>
        </View>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, styles.progressBox]}>
              <Text style={styles.statValue}>{chunkIndex + 1}/{chunks.length}</Text>
              <Text style={styles.statLabel}>Chunk</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{(elapsed / 1000).toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>

          <View style={styles.speedControlRow}>
            <Pressable 
              testID="speed-decrease"
              style={[styles.speedBtn, targetWpm <= 50 && styles.speedBtnDisabled]} 
              onPress={() => adjustSpeed(-25)}
              disabled={targetWpm <= 50}
            >
              <Text style={styles.speedBtnText}>−</Text>
            </Pressable>
            <View style={styles.speedDisplay}>
              <Text style={styles.speedValue}>{targetWpm}</Text>
              <Text style={styles.speedLabel}>WPM</Text>
            </View>
            <Pressable 
              testID="speed-increase"
              style={[styles.speedBtn, targetWpm >= 600 && styles.speedBtnDisabled]} 
              onPress={() => adjustSpeed(25)}
              disabled={targetWpm >= 600}
            >
              <Text style={styles.speedBtnText}>+</Text>
            </Pressable>
          </View>

          <View testID="chunk-display" style={styles.chunkCard}>
            <View style={styles.focusBracketLeft}>
              <Text style={styles.focusBracket}>&#x276E;</Text>
            </View>
            <View style={styles.chunkContent}>
              <View style={styles.focusLine} />
              <Text testID="chunk" style={styles.chunk}>{current}</Text>
              <View style={styles.focusLine} />
            </View>
            <View style={styles.focusBracketRight}>
              <Text style={styles.focusBracket}>&#x276F;</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end-screen" style={styles.endCard}>
          <Text style={styles.endEmoji}>⚡</Text>
          <Text style={styles.endTitle}>Complete!</Text>
          <Text style={styles.endScore}>{Math.round((words.length / elapsed) * 60000)} WPM</Text>
          <Text style={styles.endMeta}>{words.length} words in {(elapsed / 1000).toFixed(1)}s</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Read Again</Text>
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
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  difficultyRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  difficultyBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  difficultyBtnActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  difficultyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  difficultyBtnTextActive: {
    color: '#991B1B',
  },
  difficultyHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  startBtn: { backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#FEE2E2', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  progressBox: { backgroundColor: '#FECACA' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#991B1B' },
  statLabel: { fontSize: 10, color: '#B91C1C' },
  speedControlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  speedBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  speedBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    lineHeight: 28,
  },
  speedDisplay: {
    alignItems: 'center',
    marginHorizontal: 16,
    minWidth: 70,
  },
  speedValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#991B1B',
  },
  speedLabel: {
    fontSize: 10,
    color: '#B91C1C',
  },
  chunkCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#DC2626',
    minHeight: 120,
    flexDirection: 'row',
  },
  chunkContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusBracketLeft: {
    paddingRight: 8,
  },
  focusBracketRight: {
    paddingLeft: 8,
  },
  focusBracket: {
    fontSize: 36,
    color: '#DC2626',
    fontWeight: '300',
  },
  focusLine: {
    width: 60,
    height: 3,
    backgroundColor: '#FCA5A5',
    borderRadius: 2,
    marginVertical: 8,
  },
  chunk: { fontSize: 24, fontWeight: '700', color: '#991B1B', textAlign: 'center' },
  progressBar: { height: 8, backgroundColor: '#FEE2E2', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#DC2626' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#DC2626', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#DC2626', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
