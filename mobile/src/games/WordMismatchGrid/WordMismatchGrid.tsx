import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { updateProgress, levelToStars } from '../../data/progressStore';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { useAutoStart, useGameProgress, useTrackedTimeouts, type Difficulty } from '../gameHooks';
import { colors } from '../../theme/colors';

const GAME_ID = 'WordMismatchGrid';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: {
    wordCount?: number;
    wpm?: number;
    [key: string]: unknown;
  };
};

type Props = {
  durationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

type WordCard = {
  id: number;
  word1: string;
  word2: string;
  isDifferent: boolean;
};

// Similar-looking word pairs (easily confused)
const SIMILAR_PAIRS: [string, string][] = [
  ['affect', 'effect'],
  ['accept', 'except'],
  ['advice', 'advise'],
  ['loose', 'lose'],
  ['quiet', 'quite'],
  ['then', 'than'],
  ['their', 'there'],
  ['weather', 'whether'],
  ['principal', 'principle'],
  ['stationary', 'stationery'],
  ['complement', 'compliment'],
  ['desert', 'dessert'],
  ['breath', 'breathe'],
  ['conscience', 'conscious'],
  ['emigrate', 'immigrate'],
  ['elicit', 'illicit'],
  ['allusion', 'illusion'],
  ['assent', 'ascent'],
  ['capital', 'capitol'],
  ['cereal', 'serial'],
  ['council', 'counsel'],
  ['fair', 'fare'],
  ['hear', 'here'],
  ['hole', 'whole'],
  ['lead', 'led'],
  ['meat', 'meet'],
  ['passed', 'past'],
  ['peace', 'piece'],
  ['plain', 'plane'],
  ['sight', 'site'],
  ['threw', 'through'],
  ['waist', 'waste'],
  ['weak', 'week'],
  ['wear', 'where'],
  ['whose', 'who\'s'],
];

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { cardCount: 4, durationMs: 35000, columns: 2, penaltyMs: 1500 };
    case 'medium':
      return { cardCount: 6, durationMs: 30000, columns: 2, penaltyMs: 2000 };
    case 'hard':
      return { cardCount: 8, durationMs: 25000, columns: 2, penaltyMs: 2500 };
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

function buildRound(cardCount: number): { cards: WordCard[]; differentIds: Set<number> } {
  const shuffledPairs = shuffleArray(SIMILAR_PAIRS);
  const cards: WordCard[] = [];
  const differentIds = new Set<number>();
  
  // Decide how many cards will be different (1-3 depending on card count)
  const differentCount = Math.max(1, Math.floor(cardCount / 3));
  const differentIndices = new Set<number>();
  while (differentIndices.size < differentCount) {
    differentIndices.add(Math.floor(Math.random() * cardCount));
  }

  for (let i = 0; i < cardCount; i++) {
    const pair = shuffledPairs[i % shuffledPairs.length];
    const isDifferent = differentIndices.has(i);
    
    if (isDifferent) {
      // Show the two different words
      cards.push({
        id: i,
        word1: pair[0],
        word2: pair[1],
        isDifferent: true,
      });
      differentIds.add(i);
    } else {
      // Same word on both sides
      const word = Math.random() > 0.5 ? pair[0] : pair[1];
      cards.push({
        id: i,
        word1: word,
        word2: word,
        isDifferent: false,
      });
    }
  }

  return { cards: shuffleArray(cards), differentIds };
}

export default function WordMismatchGrid({
  durationMs: durationMsProp,
  difficulty = 'medium',
  autoStart = false,
  onReportResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [round, setRound] = useState<{ cards: WordCard[]; differentIds: Set<number> }>({ cards: [], differentIds: new Set() });
  
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const scoreRef = useRef(0);
  const roundsRef = useRef(0);
  const correctTapRef = useRef(0);
  const wrongTapRef = useRef(0);
  const missedRef = useRef(0);
  const penaltyMsRef = useRef(0);
  
  useAutoStart(autoStart, phase, progressLoaded, start);

  const currentConfig = getDifficultyConfig(selectedDifficulty);
  const currentDurationMs = durationMsProp ?? currentConfig.durationMs;
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();


  useEffect(() => {
    if (phase !== 'running') return;
    if (startedAtMs === null) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.max(
        0,
        startedAtMs + currentDurationMs - penaltyMsRef.current - now
      );
      setTimeLeftMs(left);

      if (left <= 0) {
        clearInterval(interval);
        finish(now);
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, startedAtMs, currentDurationMs]);

  useEffect(
    () => () => {
      cancelledRef.current = true;
      clearTrackedTimeouts();
    },
    // Unmount-only cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function start() {
    clearTrackedTimeouts();
    cancelledRef.current = false;
    if (phase !== 'idle' && phase !== 'ended') return;
    // Reset all refs to initial values
    reportedRef.current = false;
    scoreRef.current = 0;
    roundsRef.current = 0;
    correctTapRef.current = 0;
    wrongTapRef.current = 0;
    missedRef.current = 0;
    penaltyMsRef.current = 0;
    // Reset all state
    setScore(0);
    setRounds(0);
    setPenalties(0);
    setRoundIndex(0);
    setTimeLeftMs(currentDurationMs);
    setStartedAtMs(Date.now());
    setSelectedCards(new Set());
    // Generate fresh round
    setRound(buildRound(currentConfig.cardCount));
    setPhase('running');
  }

  function finish(nowMs: number) {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();

    const started = startedAtMs ?? nowMs;
    const elapsedMs = Math.max(0, nowMs - started);
    const finishedAtIso = new Date(nowMs).toISOString();
    const startedAtIso = new Date(started).toISOString();

    const finalScore = scoreRef.current;
    const finalRounds = roundsRef.current;
    const evaluated =
      correctTapRef.current + wrongTapRef.current + missedRef.current;
    const accuracy = evaluated > 0 ? correctTapRef.current / evaluated : 0;

    // Save progress - success if accuracy >= 70%
    const success = accuracy >= 0.7;
    updateProgress(GAME_ID, success, finalScore)
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso,
      finishedAtIso,
      elapsedMs,
      score: finalScore,
      accuracy: Math.min(1, accuracy),
      details: {
        wordCount: 0,
        wpm: 0,
        rounds: finalRounds,
        correct: finalScore,
        correctTaps: correctTapRef.current,
        wrongTaps: wrongTapRef.current,
        missedPairs: missedRef.current,
        timePenaltyMs: penaltyMsRef.current,
        difficulty: selectedDifficulty,
        durationMs: currentDurationMs,
      },
    });
    setPhase('ended');
  }

  function onSelectCard(cardId: number) {
    if (phase !== 'running') return;

    if (!round.differentIds.has(cardId)) {
      wrongTapRef.current += 1;
      penaltyMsRef.current += currentConfig.penaltyMs;
      setPenalties(wrongTapRef.current);
      setTimeLeftMs((left) => Math.max(0, left - currentConfig.penaltyMs));
      return;
    }

    // A correct selection is committed for the round. Ignoring a second tap
    // prevents answer toggling from changing the recorded decision.
    if (selectedCards.has(cardId)) return;
    correctTapRef.current += 1;
    const newSelected = new Set(selectedCards).add(cardId);
    setSelectedCards(newSelected);

    // Auto-submit: Check if all different cards are selected with no wrong selections
    let correctSelections = 0;
    let hasWrongSelection = false;
    for (const id of newSelected) {
      if (round.differentIds.has(id)) {
        correctSelections++;
      } else {
        hasWrongSelection = true;
      }
    }

    // Auto-submit when all different cards are found and no wrong cards selected
    if (correctSelections === round.differentIds.size && !hasWrongSelection) {
      // Use setTimeout to allow state update to render before submitting
      
        submitRoundInternal(newSelected);
    }
  }

  function submitRoundInternal(selected: Set<number>) {
    if (phase !== 'running') return;

    // Check if all different cards are selected and no same cards
    let correctSelections = 0;
    for (const id of selected) {
      if (round.differentIds.has(id)) {
        correctSelections++;
      }
    }
    
    // Score: +1 for each correct different card selected, -1 for wrong selections
    const wrongSelections = selected.size - correctSelections;
    const missedDifferent = round.differentIds.size - correctSelections;
    missedRef.current += missedDifferent;
    const roundScore = Math.max(0, correctSelections - wrongSelections - missedDifferent);
    
    scoreRef.current += roundScore;
    roundsRef.current += 1;
    setScore(scoreRef.current);
    setRounds(roundsRef.current);
    setSelectedCards(new Set());
    // Generate new round immediately (not via effect)
    setRound(buildRound(currentConfig.cardCount));
    setRoundIndex((r) => r + 1);
  }

  function submitRound() {
    submitRoundInternal(selectedCards);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Word Pair Scan</Text>
      <Text style={styles.subtitle}>Select every pair whose two words are different</Text>

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
          buttonStyle={styles.startButton}
          buttonTextStyle={styles.startButtonText}
        />
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'score',
                testID: 'score',
                value: score,
                label: 'Score',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: `${(timeLeftMs / 1000).toFixed(0)}s`,
                label: 'Time',
                containerStyle: [styles.statBox, styles.timerBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'rounds',
                value: rounds,
                label: 'Rounds',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <Text style={styles.instruction}>
            Tap DIFFERENT pairs ({round.differentIds.size} total) · matching pairs cost {currentConfig.penaltyMs / 1000}s
          </Text>
          {penalties > 0 && (
            <Text
              accessibilityLiveRegion="polite"
              testID="penalty-count"
              style={styles.penaltyText}
            >
              {penalties} {penalties === 1 ? 'penalty' : 'penalties'}
            </Text>
          )}

          <View style={styles.cardsGrid}>
            {round.cards.map((card) => {
              const isSelected = selectedCards.has(card.id);
              return (
                  <Pressable accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={`${roundIndex}-${card.id}`}
                    testID={`card-${card.id}`}
                    style={[
                      styles.card,
                      isSelected && styles.cardSelected,
                    ]}
                    onPress={() => onSelectCard(card.id)}
                  >
                    <Text style={[styles.cardWord, styles.cardWordTop]}>{card.word1}</Text>
                    <View style={styles.cardDivider} />
                    <Text style={[styles.cardWord, styles.cardWordBottom]}>{card.word2}</Text>
                    {isSelected && (
                      <View style={styles.checkMark}>
                        <Text style={styles.checkMarkText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
              );
            })}
          </View>

          <Pressable accessibilityRole="button" style={styles.submitBtn} onPress={submitRound}>
            <Text style={styles.submitBtnText}>Submit ({selectedCards.size} selected)</Text>
          </Pressable>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.endCard}>
          <Text style={styles.endEmoji}>🎯</Text>
          <Text style={styles.endTitle}>Game Over!</Text>
          <Text style={styles.endScore}>{score}</Text>
          <Text style={styles.endMeta}>Points in {rounds} rounds</Text>
          <Text style={styles.endDifficulty}>Difficulty: {selectedDifficulty}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable accessibilityRole="button" testID="play-again" style={styles.playAgainBtn} onPress={() => {
            clearTrackedTimeouts();
            setPhase('idle');
            scheduleTimeout(start, 50);
          }}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  idleContent: {
    flex: 1,
  },
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
  startButton: {
    backgroundColor: colors.warningForeground,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  gameArea: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  timerBox: {
    backgroundColor: '#FDE68A',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B45309',
  },
  statLabel: {
    fontSize: 10,
    color: '#D97706',
  },
  instruction: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  penaltyText: {
    color: colors.errorForeground,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardsGrid: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.warningForeground,
    backgroundColor: '#FFFBEB',
  },
  cardWord: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardWordTop: {
    marginBottom: 4,
  },
  cardWordBottom: {
    marginTop: 4,
  },
  cardDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  checkMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warningForeground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: colors.warningForeground,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  endCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  endTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  endScore: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.warningForeground,
    marginVertical: 8,
  },
  endMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  endDifficulty: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  starsText: {
    fontSize: 16,
    color: colors.warningForeground,
  },
  playAgainBtn: {
    marginTop: 16,
    backgroundColor: colors.warningForeground,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  playAgainText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
