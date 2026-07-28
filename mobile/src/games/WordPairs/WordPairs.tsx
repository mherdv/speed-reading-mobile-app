import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAutoStart, useTrackedTimeouts, type Difficulty } from '../gameHooks';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { updateProgress } from '../../data/progressStore';
import { formatDuration } from '../../domain/results';
import {
  OPPOSITE_ITEMS,
  type OppositeItem,
} from '../../data/vocabularyPracticeContent';
import { shuffleItems } from '../../data/flashPracticeContent';

const GAME_ID = 'WordPairs';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type WordPairChallenge = {
  familiarity: 'common' | 'less-common' | 'advanced';
  distractorSimilarity: 'low' | 'medium' | 'high';
  optionCount: 2 | 3 | 4;
  items: readonly OppositeItem[];
};

const WORD_PAIR_CHALLENGES: Record<Difficulty, WordPairChallenge> = {
  easy: {
    familiarity: 'common',
    distractorSimilarity: 'low',
    optionCount: 2,
    items: OPPOSITE_ITEMS.easy,
  },
  medium: {
    familiarity: 'less-common',
    distractorSimilarity: 'medium',
    optionCount: 3,
    items: OPPOSITE_ITEMS.medium,
  },
  hard: {
    familiarity: 'advanced',
    distractorSimilarity: 'high',
    optionCount: 4,
    items: OPPOSITE_ITEMS.hard,
  },
};

export function getWordPairChallenge(
  difficulty: Difficulty
): WordPairChallenge {
  return WORD_PAIR_CHALLENGES[difficulty];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(
  challenge: WordPairChallenge,
  itemOverride?: OppositeItem
): { word: string; options: string[]; correctIndex: number } {
  const item = itemOverride ??
    challenge.items[Math.floor(Math.random() * challenge.items.length)];
  const word = item.word;
  const correct = item.correct;
  const distractors = item.distractors.slice(0, challenge.optionCount - 1);
  
  const options = shuffle([correct, ...distractors]);
  const correctIndex = options.indexOf(correct);
  
  return { word, options, correctIndex };
}

export default function WordPairs({
  durationMs: durationMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const durationMs =
    durationMsProp ??
    (difficulty === 'easy' ? 45_000 : difficulty === 'medium' ? 30_000 : 20_000);
  const challenge = getWordPairChallenge(difficulty);
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(() => buildRound(challenge));
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const startedAtRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const attemptsRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const answerLockedRef = useRef(false);
  const deckRef = useRef<OppositeItem[]>([]);
  const deckIndexRef = useRef(0);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

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
    
    return () => clearInterval(interval);
  }, [phase, durationMs]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      clearTrackedTimeouts();
    },
    // This cleanup must run only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useAutoStart(autoStart, phase, true, start);

  function start() {
    clearTrackedTimeouts();
    cancelledRef.current = false;
    reportedRef.current = false;
    answerLockedRef.current = false;
    scoreRef.current = 0;
    attemptsRef.current = 0;
    setScore(0);
    setAttempts(0);
    setTimeLeftMs(durationMs);
    deckRef.current = shuffleItems(challenge.items);
    deckIndexRef.current = 0;
    setRound(buildNextRound());
    setFeedback(null);
    startedAtRef.current = Date.now();
    setPhase('running');
  }

  function buildNextRound() {
    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = shuffleItems(challenge.items);
      deckIndexRef.current = 0;
    }
    const item = deckRef.current[deckIndexRef.current];
    deckIndexRef.current += 1;
    return buildRound(challenge, item);
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    answerLockedRef.current = true;
    clearTrackedTimeouts();
    
    const now = Date.now();
    const elapsedMs = now - startedAtRef.current;
    const accuracy = attemptsRef.current > 0 ? scoreRef.current / attemptsRef.current : 0;
    
    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, scoreRef.current).catch(
      () => undefined
    );
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: scoreRef.current,
      accuracy,
      details: {
        rounds: attemptsRef.current,
        correct: scoreRef.current,
        difficulty,
        promptPoolSize: challenge.items.length,
      },
    });
  }

  function onSelect(index: number) {
    if (phase !== 'running' || answerLockedRef.current) return;
    answerLockedRef.current = true;
    
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    
    if (index === round.correctIndex) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    scheduleTimeout(() => {
      if (cancelledRef.current || reportedRef.current) return;
      setFeedback(null);
      setRound(buildNextRound());
      answerLockedRef.current = false;
    }, 450);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Opposites</Text>
        <Text style={styles.subtitle}>Match the word with its opposite</Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
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
                key: 'score',
                value: score,
                label: 'Score',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: formatDuration(timeLeftMs),
                label: 'Left',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'rounds',
                value: attempts,
                label: 'Rounds',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={[styles.wordCard, feedback === 'correct' && styles.cardCorrect, feedback === 'wrong' && styles.cardWrong]}>
            <Text style={styles.wordLabel}>Find the opposite of:</Text>
            <Text style={styles.word}>{round.word}</Text>
            {feedback !== null && (
              <Text
                accessibilityLiveRegion="polite"
                testID="opposites-feedback"
                style={feedback === 'correct' ? styles.correctText : styles.wrongText}
              >
                {feedback === 'correct' ? 'Correct' : 'Not quite'}
              </Text>
            )}
          </View>

          <View style={styles.optionsGrid}>
            {round.options.map((opt, idx) => (
              <Pressable accessibilityRole="button"
                key={`${opt}-${idx}`}
                testID={`option-${idx}`}
                style={styles.optionBtn}
                accessibilityState={{ disabled: answerLockedRef.current }}
                disabled={answerLockedRef.current}
                onPress={() => onSelect(idx)}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🎯</Text>
          <Text style={styles.endTitle}>Game Over!</Text>
          <Text style={styles.endScore}>Score: {score}</Text>
          <Text style={styles.endMeta}>
            Accuracy: {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%
          </Text>
          <Pressable accessibilityRole="button" testID="play-again" style={styles.playAgainBtn} onPress={start}>
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
  startBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280' },
  wordCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  cardCorrect: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  cardWrong: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  correctText: { color: '#116149', fontSize: 12, fontWeight: '700', marginTop: 6 },
  wrongText: { color: '#9F253A', fontSize: 12, fontWeight: '700', marginTop: 6 },
  wordLabel: { fontSize: 12, color: '#6366F1', marginBottom: 4 },
  word: { fontSize: 24, fontWeight: '700', color: '#312E81' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  optionBtn: {
    width: '48%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 32, fontWeight: '800', color: '#6366F1', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
