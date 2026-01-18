import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { updateProgress, levelToDifficulty, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { getRandomArticle, type Article } from '../../data/articles';
import { colors } from '../../theme/colors';
import { loadResults } from '../../data/resultsStore';
import { useAutoStart, useGameProgress } from '../gameHooks';
import { StatsRow } from '../../ui/StatsRow';

const GAME_ID = 'PowerReader';

type Intensity = 'beginner' | 'intermediate' | 'advanced';

const INTENSITY_CONFIG: Record<Intensity, { wpm: number; label: string; chunkSize: number; color: string }> = {
  beginner: { wpm: 150, label: 'Beginner', chunkSize: 2, color: '#10B981' },
  intermediate: { wpm: 300, label: 'Intermediate', chunkSize: 3, color: '#8B5CF6' },
  advanced: { wpm: 500, label: 'Advanced', chunkSize: 5, color: '#6366F1' },
};

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
  onReportResult,
  difficulty = 'medium',
}: Props & { difficulty?: Difficulty }) {
  // Get a random article on component mount
  const [currentArticle] = useState(() => getDefaultArticle());
  const text = textProp ?? currentArticle.text;
  
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    setSelectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity>('intermediate');
  const [targetWpm, setTargetWpm] = useState(300); // Target WPM instead of multiplier
  const [bestWpm, setBestWpm] = useState(0);
  
  useEffect(() => {
    async function loadBestWpm() {
      const results = await loadResults();
      const powerReaderResults = results.filter(r => r.sampleId === GAME_ID);
      const maxWpm = powerReaderResults.reduce((max, r) => Math.max(max, r.wpm || r.score || 0), 0);
      setBestWpm(maxWpm);
    }
    loadBestWpm();
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);
  
  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const intensityConfig = INTENSITY_CONFIG[selectedIntensity];
  const chunkSize = chunkSizeProp ?? intensityConfig.chunkSize;
  
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
  const cancelledRef = useRef(false);
  const chunkIndexRef = useRef(0);
  const targetWpmRef = useRef(200);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
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
    targetWpmRef.current = intensityConfig.wpm;
    setTargetWpm(intensityConfig.wpm);
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
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const wordsRead = words.length;
    const wpm = Math.round((wordsRead / elapsedMs) * 60000);

    // Save progress - completing the reading is always success
    updateProgress(GAME_ID, true, wpm).then(({ progress }) => {
      if (cancelledRef.current) return;
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
      {phase === 'idle' && (
        <View style={styles.idleContent}>
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <Svg width={48} height={48} viewBox="0 0 100 100" fill="none">
              {/* Speedometer outline */}
              <Path
                d="M20 60 A35 35 0 1 1 80 60"
                stroke="#4B5563"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Speedometer tick marks */}
              <Path d="M25 50 L30 52" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M35 38 L38 42" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M50 32 L50 38" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M65 38 L62 42" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M75 50 L70 52" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              {/* Needle */}
              <Path d="M50 55 L68 40" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
              <Circle cx="50" cy="55" r="5" fill="#4B5563" />
            </Svg>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>Expand Your Visual Span</Text>
          
          {/* Description */}
          <Text style={styles.heroDescription}>
            Train your brain to recognize word clusters instead individual letters. This exercise increases processing speed by 40%.
          </Text>

          {/* Intensity Selection */}
          <Text style={styles.sectionLabel}>Select Intensity</Text>
          <View style={styles.intensityRow}>
            {(['beginner', 'intermediate', 'advanced'] as Intensity[]).map((intensity) => {
              const config = INTENSITY_CONFIG[intensity];
              const isSelected = selectedIntensity === intensity;
              return (
                <Pressable
                  key={intensity}
                  style={[
                    styles.intensityBtn,
                    { borderColor: config.color },
                    isSelected && { backgroundColor: config.color + '15' },
                  ]}
                  onPress={() => setSelectedIntensity(intensity)}
                >
                  <Text style={[styles.intensityLabel, { color: config.color }]}>
                    {config.label}
                  </Text>
                  <Text style={[styles.intensityWpm, { color: config.color }]}>
                    {config.wpm} WPM
                  </Text>
                  {isSelected && (
                    <View style={[styles.selectedDot, { backgroundColor: config.color }]} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{bestWpm || '—'}</Text>
              <Text style={styles.statDescription}>Best WPM</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>Lvl {gameProgress.level}</Text>
              <Text style={styles.statDescription}>Current Mastery</Text>
            </View>
          </View>

          {/* Start Button */}
          <Pressable testID="start-button" style={styles.startBtnWrapper} onPress={() => start()}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtnGradient}
            >
              <Text style={styles.startBtnText}>START TRAINING</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'chunk',
                value: `${chunkIndex + 1}/${chunks.length}`,
                label: 'Chunk',
                containerStyle: [styles.statBox, styles.progressBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: `${(elapsed / 1000).toFixed(1)}s`,
                label: 'Time',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

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
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  idleContent: { 
    flex: 1, 
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  intensityLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  intensityWpm: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  statDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  startBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Running phase styles
  header: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  gameArea: { flex: 1, paddingHorizontal: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, marginTop: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  progressBox: { backgroundColor: '#E0E7FF' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 10, color: '#6366F1' },
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
    backgroundColor: '#6366F1',
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
    color: '#4F46E5',
  },
  speedLabel: {
    fontSize: 10,
    color: '#6366F1',
  },
  chunkCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#6366F1',
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
    color: '#6366F1',
    fontWeight: '300',
  },
  focusLine: {
    width: 60,
    height: 3,
    backgroundColor: '#A5B4FC',
    borderRadius: 2,
    marginVertical: 8,
  },
  chunk: { fontSize: 24, fontWeight: '700', color: '#4F46E5', textAlign: 'center' },
  progressBar: { height: 8, backgroundColor: '#E0E7FF', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366F1' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#6366F1', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#6366F1', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
