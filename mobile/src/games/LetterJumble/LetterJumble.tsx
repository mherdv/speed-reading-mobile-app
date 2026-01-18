import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, TextInput as TextInputType } from 'react-native';

import { updateProgress, levelToDifficulty, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { getWordsByDifficulty } from '../../data/vocabulary';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';

const GAME_ID = 'LetterJumble';

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

function getWordsForDifficulty(difficulty: Difficulty): string[] {
  return getWordsByDifficulty(difficulty);
}

function shuffle(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? shuffle(word) : result;
}

export default function LetterJumble({ durationMs = 60000, difficulty = 'easy', autoStart = false, onReportResult }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    setSelectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);

  function pickWord(): { word: string; jumbled: string } {
    const words = getWordsForDifficulty(selectedDifficulty);
    const word = words[Math.floor(Math.random() * words.length)];
    return { word, jumbled: shuffle(word) };
  }

  const [current, setCurrent] = useState(() => pickWord());
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const [showHint, setShowHint] = useState(false);

  const startedAtRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const inputRef = useRef<TextInputType>(null);

  useEffect(() => {
    if (phase !== 'running') return;
    const endAt = startedAtRef.current + durationMs;
    
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
  }, [phase, durationMs]);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start() {
    reportedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    setScore(0);
    setAttempts(0);
    setTimeLeftMs(durationMs);
    setCurrent(pickWord());
    setInput('');
    setShowHint(false);
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    
    const now = Date.now();
    const elapsedMs = now - startedAtRef.current;
    const accuracy = attemptsRef.current > 0 ? scoreRef.current / attemptsRef.current : 0;
    
    // Update progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, scoreRef.current).then(({ progress }) => {
      setGameProgress(progress);
      setSelectedDifficulty(levelToDifficulty(progress.level));
    });

    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: { rounds: attemptsRef.current, correct: scoreRef.current },
    });
    
    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function onSubmit() {
    if (phase !== 'running') return;
    
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    
    if (input.toLowerCase().trim() === current.word) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    
    setCurrent(pickWord());
    setInput('');
    setShowHint(false);
    // Refocus input after submit
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function onSkip() {
    if (phase !== 'running') return;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    setCurrent(pickWord());
    setInput('');
    setShowHint(false);
    // Refocus input after skip
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function playAgain() {
    setPhase('idle');
    setTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Letter Jumble</Text>
        <Text style={styles.subtitle}>Unscramble the letters to form a word</Text>
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
                key: 'solved',
                value: score,
                label: 'Solved',
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
                key: 'attempts',
                value: attempts,
                label: 'Attempts',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={styles.jumbleCard}>
            <Text style={styles.jumbleLetters}>{current.jumbled.toUpperCase()}</Text>
            {showHint && (
              <Text style={styles.hint}>Hint: {current.word[0].toUpperCase()}...{current.word.slice(-1)}</Text>
            )}
          </View>

          <TextInput
            ref={inputRef}
            testID="answer-input"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
            onSubmitEditing={onSubmit}
            blurOnSubmit={false}
          />

          <View style={styles.buttonRow}>
            <Pressable style={styles.hintBtn} onPress={() => setShowHint(true)}>
              <Text style={styles.hintBtnText}>💡 Hint</Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipBtnText}>Skip →</Text>
            </Pressable>
            <Pressable testID="submit-button" style={styles.submitBtn} onPress={onSubmit}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🧩</Text>
          <Text style={styles.endTitle}>Time's Up!</Text>
          <Text style={styles.endScore}>{score} Words</Text>
          <Text style={styles.endMeta}>
            Accuracy: {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%
          </Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
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
  timerBox: { backgroundColor: '#FDE68A' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#92400E' },
  statLabel: { fontSize: 10, color: '#B45309' },
  jumbleCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  jumbleLetters: { fontSize: 28, fontWeight: '800', color: '#92400E', letterSpacing: 6 },
  hint: { marginTop: 8, fontSize: 12, color: '#B45309' },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hintBtn: { backgroundColor: '#FEF3C7', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  hintBtnText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  skipBtn: { backgroundColor: '#F3F4F6', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  skipBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  submitBtn: { backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 32, fontWeight: '800', color: '#F59E0B', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  endDifficulty: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: '#F59E0B' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
