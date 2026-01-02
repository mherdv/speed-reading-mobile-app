import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  loadGameProgress,
  updateProgress,
  levelToDifficulty,
  levelToStars,
  type GameProgress,
} from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'timed-word-recognition';

type Difficulty = 'easy' | 'medium' | 'hard';

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
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'show' | 'choose' | 'ended';

// Word lists by length for different difficulties
const SHORT_WORDS = [
  'speed', 'read', 'focus', 'brain', 'quick', 'scan', 'learn', 'text',
  'word', 'book', 'page', 'line', 'skill', 'train', 'fast', 'mind',
];

const MEDIUM_WORDS = [
  'memory', 'recall', 'absorb', 'pattern', 'method', 'process', 'retain',
  'vision', 'improve', 'practice', 'strategy', 'technique', 'recognize',
  'comprehend', 'attention', 'exercise',
];

const LONG_WORDS = [
  'concentration', 'visualization', 'recognition', 'understanding',
  'comprehension', 'intelligence', 'development', 'improvement',
  'achievement', 'performance', 'memorization', 'acceleration',
  'optimization', 'subvocalization', 'peripheral', 'consolidation',
];

function getWordsForDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case 'easy': return SHORT_WORDS;
    case 'medium': return MEDIUM_WORDS;
    case 'hard': return LONG_WORDS;
  }
}

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { displayMs: 1000, wordLength: 'short' };
    case 'medium':
      return { displayMs: 500, wordLength: 'medium' };
    case 'hard':
      return { displayMs: 250, wordLength: 'long' };
  }
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function TimedWordRecognition({
  displayMs: displayMsProp,
  totalRounds = 10,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [gameProgress, setGameProgress] = useState<GameProgress>({ level: 1, streak: 0, totalPlays: 0 });
  const selectedDifficulty = levelToDifficulty(gameProgress.level);
  const [round, setRound] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const roundRef = useRef(0);
  const wordRef = useRef('');
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const displayMs = displayMsProp ?? currentConfig.displayMs;
  const words = getWordsForDifficulty(selectedDifficulty);

  useEffect(() => {
    loadGameProgress(GAME_ID).then(setGameProgress);
  }, []);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
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

  function pickWord(): { word: string; options: string[] } {
    const currentWords = getWordsForDifficulty(selectedDifficulty);
    const shuffled = shuffle(currentWords);
    const word = shuffled[0];
    const distractors = shuffled.slice(1, 4);
    const opts = shuffle([word, ...distractors]);
    return { word, options: opts };
  }

  function start() {
    if (phase !== 'idle') return;
    reportedRef.current = false;
    scoreRef.current = 0;
    correctRef.current = 0;
    roundRef.current = 0;
    setPhase('show');
    setRound(0);
    setScore(0);
    setFeedback(null);
    setSelectedIndex(null);
    startRef.current = Date.now();

    const { word, options } = pickWord();
    wordRef.current = word;
    setCurrentWord(word);
    setOptions(options);

    showTimeoutRef.current = setTimeout(() => {
      setPhase('choose');
    }, displayMs);
  }

  function choose(index: number) {
    if (phase !== 'choose') return;
    setSelectedIndex(index);

    const correct = options[index] === wordRef.current;

    if (correct) {
      scoreRef.current += 10;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    
      setFeedback(null);
      setSelectedIndex(null);
      roundRef.current += 1;
      setRound(roundRef.current);

      if (roundRef.current >= totalRounds) {
        finish();
      } else {
        const { word, options } = pickWord();
        wordRef.current = word;
        setCurrentWord(word);
        setOptions(options);
        setPhase('show');

        showTimeoutRef.current = setTimeout(() => {
          setPhase('choose');
        }, displayMs);
      }
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = totalRounds > 0 ? correctRef.current / totalRounds : 0;

    updateProgress(GAME_ID, accuracy >= 0.7).then(({ progress }) => setGameProgress(progress));

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { 
        rounds: totalRounds, 
        correct: correctRef.current,
        difficulty: selectedDifficulty,
      },
    });

    setPhase('ended');
  }

  function playAgain() {
    setPhase('idle');
    setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Timed Word Recognition</Text>
        <Text style={styles.subtitle}>Remember the word, then select it</Text>
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

      {phase === 'show' && (
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

          <View testID="word-flash" style={styles.wordCard}>
            <Text testID="word" style={styles.word}>{currentWord}</Text>
          </View>

          <Text style={styles.instruction}>Memorize this word!</Text>
        </View>
      )}

      {phase === 'choose' && (
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

          <Text style={styles.chooseTitle}>Which word did you see?</Text>

          <View testID="options-container" style={styles.optionsContainer}>
            {options.map((opt, i) => (
              <Pressable
                key={i}
                testID={`option-${i}`}
                style={[
                  styles.optionBtn,
                  selectedIndex === i && feedback === 'correct' && styles.optionCorrect,
                  selectedIndex === i && feedback === 'wrong' && styles.optionWrong,
                  feedback === 'wrong' && opt === wordRef.current && styles.optionCorrect,
                ]}
                onPress={() => choose(i)}
              >
                <Text style={[
                  styles.optionText,
                  selectedIndex === i && feedback === 'correct' && styles.optionTextCorrect,
                  selectedIndex === i && feedback === 'wrong' && styles.optionTextWrong,
                  feedback === 'wrong' && opt === wordRef.current && styles.optionTextCorrect,
                ]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
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
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
            </Text>
          </View>
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
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#FEF3C7', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  roundBox: { backgroundColor: '#FDE68A' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#D97706' },
  statLabel: { fontSize: 10, color: '#F59E0B' },
  wordCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  word: { fontSize: 40, fontWeight: '800', color: '#D97706', textAlign: 'center' },
  instruction: { textAlign: 'center', fontSize: 14, color: '#9CA3AF' },
  chooseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsContainer: { gap: 10 },
  optionBtn: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  optionText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  optionTextCorrect: { color: '#059669' },
  optionTextWrong: { color: '#DC2626' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#F59E0B', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
