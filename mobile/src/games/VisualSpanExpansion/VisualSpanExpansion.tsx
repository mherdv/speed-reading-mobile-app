import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { loadGameProgress, updateProgress, levelToDifficulty, levelToStars, type GameProgress } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'VisualSpanExpansion';

export type Difficulty = 'easy' | 'medium' | 'hard';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

type Props = {
  startingLength?: number;
  displayMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'show' | 'recall' | 'ended';

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { startingLength: 4, displayMs: 1500 };
    case 'medium':
      return { startingLength: 6, displayMs: 1200 };
    case 'hard':
      return { startingLength: 8, displayMs: 1000 };
  }
}

function generateSequence(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

export default function VisualSpanExpansion({ startingLength: startingLengthProp, displayMs: displayMsProp, difficulty = 'easy', autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  const [level, setLevel] = useState(3);
  const [sequence, setSequence] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const levelRef = useRef(3);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const startingLength = startingLengthProp ?? currentConfig.startingLength;
  const displayMs = displayMsProp ?? currentConfig.displayMs;

  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    loadGameProgress(GAME_ID).then((progress) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
      setProgressLoaded(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
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
    if (phase !== 'idle') return;
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    levelRef.current = startingLength;
    setPhase('show');
    setLevel(startingLength);
    setScore(0);
    setAttempts(0);
    setInput('');
    setFeedback(null);
    startRef.current = Date.now();

    const seq = generateSequence(startingLength);
    setSequence(seq);

    showTimeoutRef.current = setTimeout(() => {
      setPhase('recall');
    }, displayMs);
  }

  function submit() {
    if (phase !== 'recall') return;

    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);

    if (input === sequence) {
      scoreRef.current += level * 10;
      setScore(scoreRef.current);
      setFeedback('correct');

      
        setFeedback(null);
        levelRef.current += 1;
        setLevel(levelRef.current);
        setInput('');

        const seq = generateSequence(levelRef.current);
        setSequence(seq);
        setPhase('show');

        showTimeoutRef.current = setTimeout(() => {
          setPhase('recall');
        }, displayMs);
    } else {
      setFeedback('wrong');
      
        finish();
    }
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const maxLevel = levelRef.current;
    const accuracy = attemptsRef.current > 0 ? (attemptsRef.current - 1) / attemptsRef.current : 0;

    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, scoreRef.current).then(({ progress }) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { maxLevel, attempts: attemptsRef.current, difficulty: selectedDifficulty },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function playAgain() {
    setPhase('idle');
    setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visual Span Expansion</Text>
        <Text style={styles.subtitle}>Remember the sequence shown</Text>
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
            <Text style={styles.startBtnText}>Start Training</Text>
          </Pressable>
        </View>
      )}

      {phase === 'show' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.levelBox]}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>

          <View testID="sequence-display" style={styles.sequenceCard}>
            <Text testID="sequence" style={styles.sequence}>{sequence}</Text>
          </View>

          <Text style={styles.instruction}>Memorize this sequence!</Text>
        </View>
      )}

      {phase === 'recall' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.levelBox]}>
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>

          <View style={[
            styles.inputCard,
            feedback === 'correct' && styles.cardCorrect,
            feedback === 'wrong' && styles.cardWrong,
          ]}>
            <TextInput
              testID="recall-input"
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="number-pad"
              placeholder="Enter sequence"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
          </View>

          <Pressable testID="submit-btn" style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitBtnText}>Submit</Text>
          </Pressable>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🧠</Text>
          <Text style={styles.endTitle}>Game Over!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>Max Level: {level} digits</Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Try Again</Text>
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
  startBtn: { backgroundColor: '#0D9488', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statBox: { alignItems: 'center', backgroundColor: '#CCFBF1', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  levelBox: { backgroundColor: '#99F6E4' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#115E59' },
  statLabel: { fontSize: 10, color: '#0F766E' },
  sequenceCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#5EEAD4',
  },
  sequence: { fontSize: 36, fontWeight: '800', color: '#115E59', letterSpacing: 8 },
  instruction: { textAlign: 'center', color: '#6B7280', fontSize: 12 },
  inputCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#5EEAD4',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  input: { fontSize: 28, fontWeight: '700', color: '#115E59', textAlign: 'center', letterSpacing: 4 },
  submitBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#0D9488', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#0D9488', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
