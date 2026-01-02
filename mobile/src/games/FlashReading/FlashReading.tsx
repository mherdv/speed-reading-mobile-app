import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useDifficultyProgression, Difficulty } from '../../hooks/useDifficultyProgression';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'FlashReading';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

export type { Difficulty };

type Props = {
  words?: string[];
  displayMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'flash' | 'recall' | 'feedback' | 'ended';

const DEFAULT_WORDS = ['apple', 'banana', 'cherry', 'mango', 'orange', 'grape', 'melon', 'peach'];

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { displayMs: 500, masked: false };
    case 'medium':
      return { displayMs: 200, masked: false };
    case 'hard':
      return { displayMs: 200, masked: true };
  }
}

export default function FlashReading({ words = DEFAULT_WORDS, displayMs: displayMsProp, difficulty = 'easy', autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const { 
    difficulty: selectedDifficulty, 
    correctStreak, 
    failStreak, 
    recordCorrect, 
    recordFail, 
    reset: resetProgression,
    setDifficulty: setSelectedDifficulty 
  } = useDifficultyProgression(difficulty);
  const [current, setCurrent] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(5);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const scoreRef = useRef(0);
  const roundRef = useRef(0);
  const correctRef = useRef(0);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const displayMs = displayMsProp ?? currentConfig.displayMs;
  const isMasked = currentConfig.masked;

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  // Auto-start when autoStart prop is true
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase]);

  function pickWord(): string {
    return words[Math.floor(Math.random() * words.length)];
  }

  function start() {
    if (phase !== 'idle') return;
    reportedRef.current = false;
    scoreRef.current = 0;
    roundRef.current = 0;
    correctRef.current = 0;
    setPhase('flash');
    setScore(0);
    setRound(0);
    setInput('');
    setFeedback(null);
    startRef.current = Date.now();

    const word = pickWord();
    setCurrent(word);

    flashTimeoutRef.current = setTimeout(() => {
      setPhase('recall');
    }, displayMs);
  }

  function submit() {
    if (phase !== 'recall') return;

    const correct = input.toLowerCase().trim() === current.toLowerCase();

    if (correct) {
      scoreRef.current += 20;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
      recordCorrect();
    } else {
      setFeedback('wrong');
      recordFail();
    }

    setPhase('feedback');

    setTimeout(() => {
      setFeedback(null);
      roundRef.current += 1;
      setRound(roundRef.current);

      if (roundRef.current >= totalRounds) {
        finish();
      } else {
        setInput('');
        const word = pickWord();
        setCurrent(word);
        setPhase('flash');

        flashTimeoutRef.current = setTimeout(() => {
          setPhase('recall');
        }, displayMs);
      }
    }, 800);
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = totalRounds > 0 ? correctRef.current / totalRounds : 0;

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { rounds: totalRounds, correct: correctRef.current, difficulty: selectedDifficulty },
    });

    setPhase('ended');
  }

  function playAgain() {
    resetProgression();
    setPhase('idle');
    setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flash Reading</Text>
        <Text style={styles.subtitle}>Read the word flashed quickly</Text>
        {phase !== 'idle' && phase !== 'ended' && (
          <Text style={styles.progressHint}>
            Difficulty: {selectedDifficulty} • Streak: {correctStreak > 0 ? `+${correctStreak}` : failStreak > 0 ? `-${failStreak}` : '0'}
          </Text>
        )}
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
            {selectedDifficulty === 'easy' && 'Longer display time (0.5s)'}
            {selectedDifficulty === 'medium' && 'Quick flash (0.2s)'}
            {selectedDifficulty === 'hard' && 'Quick flash + bottom half masked'}
          </Text>
          <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Start Game</Text>
          </Pressable>
        </View>
      )}

      {phase === 'flash' && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.roundBox]}>
              <Text style={styles.statValue}>{round + 1}/{totalRounds}</Text>
              <Text style={styles.statLabel}>Round</Text>
            </View>
          </View>

          <View style={styles.flashCard}>
            <View style={styles.wordContainer}>
              <Text testID="flash-word" style={styles.flashWord}>{current}</Text>
              {isMasked && <View style={styles.maskOverlay} />}
            </View>
          </View>
        </View>
      )}

      {(phase === 'recall' || phase === 'feedback') && (
        <View style={styles.gameArea}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={[styles.statBox, styles.roundBox]}>
              <Text style={styles.statValue}>{round + 1}/{totalRounds}</Text>
              <Text style={styles.statLabel}>Round</Text>
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
              placeholder="Type the word"
              placeholderTextColor="#9CA3AF"
              autoFocus
              editable={phase === 'recall'}
            />
            {feedback === 'wrong' && (
              <Text style={styles.correctAnswer}>Correct: {current}</Text>
            )}
          </View>

          {phase === 'recall' && (
            <Pressable testID="submit-btn" style={styles.submitBtn} onPress={submit}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </Pressable>
          )}
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>⚡</Text>
          <Text style={styles.endTitle}>Complete!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>
            {correctRef.current}/{totalRounds} correct ({Math.round((correctRef.current / totalRounds) * 100)}%)
          </Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <Pressable style={styles.playAgainBtn} onPress={playAgain}>
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
  progressHint: { fontSize: 11, color: '#6366F1', marginTop: 4, fontWeight: '600' },
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
    borderColor: '#F97316',
    backgroundColor: '#FFEDD5',
  },
  difficultyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  difficultyBtnTextActive: {
    color: '#9A3412',
  },
  difficultyHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  startBtn: { backgroundColor: '#F97316', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statBox: { alignItems: 'center', backgroundColor: '#FFEDD5', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  roundBox: { backgroundColor: '#FED7AA' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#9A3412' },
  statLabel: { fontSize: 10, color: '#C2410C' },
  flashCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDBA74',
  },
  wordContainer: {
    position: 'relative',
  },
  flashWord: { fontSize: 32, fontWeight: '800', color: '#9A3412' },
  maskOverlay: {
    position: 'absolute',
    left: -4,
    right: -4,
    bottom: -2,
    height: 18,
    backgroundColor: '#1F2937',
  },
  inputCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDBA74',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  input: { fontSize: 24, fontWeight: '700', color: '#9A3412', textAlign: 'center' },
  correctAnswer: { textAlign: 'center', color: '#DC2626', fontSize: 14, marginTop: 8 },
  submitBtn: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#F97316', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  playAgainBtn: { marginTop: 16, backgroundColor: '#F97316', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
