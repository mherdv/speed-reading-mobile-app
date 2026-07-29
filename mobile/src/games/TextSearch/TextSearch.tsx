import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import { useAutoStart } from '../gameHooks';
import { SimpleIdlePanel } from '../../ui/SimpleIdlePanel';
import { StatsRow } from '../../ui/StatsRow';
import { colors } from '../../theme/colors';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import {
  TEXT_SEARCH_VARIATIONS,
  type TextSearchVariation,
} from '../../data/textSearchContent';
import {
  shuffleItems,
  type RandomSource,
} from '../../data/randomization';
import { formatDuration } from '../../domain/results';

const GAME_ID = 'TextSearch';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

type Props = {
  paragraph?: string;
  targetWord?: string;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

export function buildTextSearchDeck(
  variations: readonly TextSearchVariation[],
  avoidFirstId = '',
  random: RandomSource = Math.random
): TextSearchVariation[] {
  const deck = shuffleItems(variations, random);
  if (deck.length > 1 && deck[0]?.id === avoidFirstId) {
    [deck[0], deck[1]] = [deck[1], deck[0]];
  }
  return deck;
}

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { timeLimit: null, showCount: true }; // No time limit, show target count
    case 'medium':
      return { timeLimit: 30000, showCount: true }; // 30 second limit
    case 'hard':
      return { timeLimit: 20000, showCount: false }; // 20 seconds, hidden count
  }
}

export default function TextSearch({
  paragraph: paragraphProp, 
  targetWord: targetWordProp, 
  difficulty = 'medium',
  autoStart = false,
  onReportResult 
}: Props) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const [phase, setPhase] = useState<Phase>('idle');
  const variationPool = TEXT_SEARCH_VARIATIONS[difficulty];
  const [currentVariation, setCurrentVariation] = useState(variationPool[0]!);
  
  const config = getDifficultyConfig(difficulty);
  const paragraph = paragraphProp ?? currentVariation.text;
  const targetWord = targetWordProp ?? currentVariation.target;
  
  const words = useMemo(() => paragraph.split(/\s+/).filter(Boolean), [paragraph]);
  const [found, setFound] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [wrongFeedback, setWrongFeedback] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const foundRef = useRef<number[]>([]);
  const errorsRef = useRef(0);
  const previousVariationIdRef = useRef('');
  const variationDeckRef = useRef<TextSearchVariation[]>([]);
  const variationDeckDifficultyRef = useRef<Difficulty | null>(null);
  const activeTargetRef = useRef(targetWord);
  const activeTargetCountRef = useRef(0);
  const activeContentIdRef = useRef('custom');

  const targetIndices = useMemo(() => {
    return words
      .map((w, i) => (w.toLowerCase().replace(/[^a-z]/gi, '') === targetWord.toLowerCase() ? i : -1))
      .filter((i) => i >= 0);
  }, [words, targetWord]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, true, start);

  function start() {
    cancelledRef.current = false;
    if (phase !== 'idle' && phase !== 'ended') return;
    if (
      variationDeckRef.current.length === 0 ||
      variationDeckDifficultyRef.current !== difficulty
    ) {
      variationDeckRef.current = buildTextSearchDeck(
        variationPool,
        previousVariationIdRef.current
      );
      variationDeckDifficultyRef.current = difficulty;
    }
    const nextVariation =
      variationDeckRef.current.shift() ?? variationPool[0]!;
    previousVariationIdRef.current = nextVariation.id;
    setCurrentVariation(nextVariation);
    const activeParagraph = paragraphProp ?? nextVariation.text;
    const activeTarget = targetWordProp ?? nextVariation.target;
    activeTargetRef.current = activeTarget;
    activeContentIdRef.current =
      paragraphProp || targetWordProp ? 'custom' : nextVariation.id;
    activeTargetCountRef.current = activeParagraph
      .split(/\s+/)
      .filter(
        (word) =>
          word.toLocaleLowerCase('en').replace(/[^a-z]/g, '') ===
          activeTarget.toLocaleLowerCase('en')
      ).length;
    reportedRef.current = false;
    foundRef.current = [];
    errorsRef.current = 0;
    setPhase('running');
    setFound([]);
    setErrors(0);
    setElapsed(0);
    setFeedback(null);
    setWrongFeedback(null);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startRef.current;
      setElapsed(elapsedMs);
      
      // Check time limit
      if (config.timeLimit && elapsedMs >= config.timeLimit) {
        finish();
      }
    }, 100);
  }

  function finish() {
    if (cancelledRef.current) return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = calculateSearchAccuracy(
      foundRef.current.length,
      activeTargetCountRef.current,
      errorsRef.current
    );
    const score = Math.round(accuracy * 100);
    const missed = Math.max(
      0,
      activeTargetCountRef.current - foundRef.current.length
    );

    setElapsed(elapsedMs);
    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, score).catch(() => undefined);
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score,
      accuracy,
      details: {
        activityType: 'scanning',
        targetWord: activeTargetRef.current,
        totalTargets: activeTargetCountRef.current,
        found: foundRef.current.length,
        errors: errorsRef.current,
        missed,
        accuracyFormula: 'found / (total targets + errors)',
        difficulty,
        contentId: activeContentIdRef.current,
        contentPoolSize: variationPool.length,
        language: 'en',
      },
    });
  }

  function tapWord(index: number) {
    if (phase !== 'running') return;
    if (found.includes(index)) return;

    if (targetIndices.includes(index)) {
      foundRef.current = [...foundRef.current, index];
      setFound([...foundRef.current]);
      setFeedback(index);
      setWrongFeedback(null);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 300);

      if (foundRef.current.length === targetIndices.length) {
        finish();
      }
      return;
    }

    errorsRef.current += 1;
    setErrors(errorsRef.current);
    setFeedback(null);
    setWrongFeedback(index);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setWrongFeedback(null), 450);
  }

  function playAgain() {
    start();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Text Search</Text>
        <Text testID="target-word" style={styles.subtitle}>Find all: <Text style={styles.targetHighlight}>"{targetWord}"</Text></Text>
      </View>

      {phase === 'idle' && (
        <SimpleIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          onStart={start}
          startLabel="Start Search"
          containerStyle={styles.idleContent}
          descriptionStyle={styles.descriptionText}
          buttonStyle={styles.startBtn}
          buttonTextStyle={styles.startBtnText}
        >
          <Text style={styles.sectionLabel}>
            {difficulty === 'easy'
              ? 'No time limit'
              : difficulty === 'medium'
                ? '30-second limit'
                : '20-second limit'}
          </Text>
        </SimpleIdlePanel>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            testID="score-display"
            items={[
              {
                key: 'found',
                value: config.showCount ? `${found.length}/${targetIndices.length}` : `${found.length}/?`,
                label: 'Found',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'time',
                value: config.timeLimit
                  ? formatDuration(Math.max(0, config.timeLimit - elapsed))
                  : formatDuration(elapsed),
                label: config.timeLimit ? 'Left' : 'Time',
                containerStyle: [styles.statBox, styles.timerBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'errors',
                value: errors,
                label: 'Errors',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          {wrongFeedback !== null && (
            <Text
              accessibilityLiveRegion="polite"
              testID="text-search-error-feedback"
              style={styles.errorFeedback}
            >
              Not the target—keep scanning.
            </Text>
          )}

          <ReadingColumn
            testID="text-search-reading-column"
            style={[styles.readingArea, readingDisplay.column]}
          >
            <ScrollView
              testID="paragraph-display"
              style={[styles.textBox, readingDisplay.surface]}
            >
              <View style={styles.wordWrap}>
              {words.map((word, i) => {
                const isTarget = targetIndices.includes(i);
                const isFound = found.includes(i);
                const isFeedback = feedback === i;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={word}
                    accessibilityState={{
                      selected: isFound,
                      disabled: isFound,
                    }}
                    disabled={isFound}
                    key={i}
                    testID={`word-${i}`}
                    onPress={() => tapWord(i)}
                    style={styles.wordTouch}
                  >
                    <Text
                      style={[
                        styles.word,
                        readingDisplay.text,
                        isFound && styles.wordFound,
                        isFeedback && styles.wordFeedback,
                        wrongFeedback === i && styles.wordWrongFeedback,
                      ]}
                    >
                      {word}
                    </Text>
                  </Pressable>
                );
              })}
              </View>
            </ScrollView>
          </ReadingColumn>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end-screen" style={styles.endCard}>
          <Text style={styles.endEmoji}>🔍</Text>
          <Text style={styles.endTitle}>
            {found.length === targetIndices.length ? 'All Found!' : 'Search Complete'}
          </Text>
          <Text style={styles.endScore}>
            {Math.round(
              calculateSearchAccuracy(
                found.length,
                targetIndices.length,
                errors
              ) * 100
            )}%
          </Text>
          <Text style={styles.endMeta}>
            Found {found.length} of {targetIndices.length} · {errors}{' '}
            {errors === 1 ? 'error' : 'errors'} · {formatDuration(elapsed)}
          </Text>
          <Pressable accessibilityRole="button" testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Search Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  targetHighlight: { color: colors.infoForeground, fontWeight: '700' },
  startBtn: { backgroundColor: colors.interactiveInfo, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: colors.onInteractive, fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: colors.infoSurface, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: colors.backgroundDark },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.infoForeground },
  statLabel: { fontSize: 10, color: colors.infoForeground },
  textBox: { flex: 1, backgroundColor: colors.infoSurface, borderRadius: 12, padding: 12, borderWidth: 2, borderColor: colors.focusRing },
  readingArea: { flex: 1 },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  wordTouch: {
    minHeight: 44,
    justifyContent: 'center',
    marginRight: 4,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  word: { fontSize: 16, color: colors.infoForeground, lineHeight: 24 },
  wordFound: { backgroundColor: colors.infoSurface, borderRadius: 4, color: colors.infoForeground },
  wordFeedback: { backgroundColor: colors.successSurface, color: colors.successForeground },
  wordWrongFeedback: {
    backgroundColor: colors.errorSurface,
    color: colors.errorForeground,
  },
  errorFeedback: {
    minHeight: 24,
    marginBottom: 6,
    color: colors.errorForeground,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  endScore: { fontSize: 48, fontWeight: '800', color: colors.infoForeground, marginVertical: 8 },
  endMeta: { fontSize: 14, color: colors.textSecondary },
  playAgainBtn: { marginTop: 16, backgroundColor: colors.interactiveInfo, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: colors.onInteractive, fontSize: 14, fontWeight: '600' },
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginTop: 8 },
  difficultyRow: { flexDirection: 'row', marginBottom: 16 },
  difficultyBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 8, borderWidth: 2, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.cardBackground },
  difficultyBtnActive: { borderColor: colors.focusRing, backgroundColor: colors.infoSurface },
  difficultyBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  difficultyBtnTextActive: { color: colors.infoForeground },
  difficultyMeta: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});

export function calculateSearchAccuracy(
  found: number,
  totalTargets: number,
  errors: number
): number {
  const denominator = Math.max(0, totalTargets) + Math.max(0, errors);
  if (denominator === 0) return 0;
  return Math.min(1, Math.max(0, found) / denominator);
}
