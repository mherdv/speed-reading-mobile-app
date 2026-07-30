import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getContextBuilderRounds,
  type ContextBuilderRound,
  type ContextClueOption,
  type ContextMeaningOption,
} from '../../data/contextBuilderContent';
import {
  levelToStars,
  updateTwoSessionDifficultySuggestion,
} from '../../data/progressStore';
import {
  canonicalItemSetSignature,
  selectRotatingWindow,
  shuffleItems,
  type RandomSource,
} from '../../data/randomization';
import type { ContextBuilderResultDetails } from '../../domain/types';
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences';
import { colors, shadows, spacing } from '../../theme/colors';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useReadingDisplay } from '../../ui/ReadingDisplayPreferences';
import {
  useAutoStart,
  useGameProgress,
  type Difficulty,
} from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'ContextBuilder';
const CONTENT_VERSION = 2;

type Phase = 'idle' | 'active' | 'feedback' | 'ended';
type Confidence = 'unsure' | 'confident';

type Props = {
  rounds?: readonly ContextBuilderRound[];
  roundCount?: number;
  random?: RandomSource;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

function TargetSentence({
  round,
  sentenceNumber,
  boldText,
}: {
  round: ContextBuilderRound;
  sentenceNumber: number;
  boldText: boolean;
}) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const sentence = round.sentences.find(
    (candidate) => candidate.id === round.targetSentenceId
  );
  if (!sentence) return null;
  const targetIndex = sentence.text
    .toLocaleLowerCase()
    .indexOf(round.targetWord.toLocaleLowerCase());
  if (targetIndex < 0) {
    return (
      <Text
        testID={`context-sentence-${sentenceNumber}`}
        style={[
          styles.paragraphText,
          readingDisplay.text,
          boldText && styles.boldParagraphText,
        ]}
      >
        <Text style={styles.sentenceNumber}>Sentence {sentenceNumber}: </Text>
        {sentence.text}
      </Text>
    );
  }
  const before = sentence.text.slice(0, targetIndex);
  const target = sentence.text.slice(
    targetIndex,
    targetIndex + round.targetWord.length
  );
  const after = sentence.text.slice(targetIndex + round.targetWord.length);
  return (
    <Text
      testID={`context-sentence-${sentenceNumber}`}
      style={[
        styles.paragraphText,
        readingDisplay.text,
        boldText && styles.boldParagraphText,
      ]}
    >
      <Text style={styles.sentenceNumber}>Sentence {sentenceNumber}: </Text>
      {before}
      <Text
        accessibilityLabel={round.targetAccessibilityLabel}
        style={styles.targetWord}
      >
        {target} (target word)
      </Text>
      {after}
    </Text>
  );
}

export default function ContextBuilder({
  rounds,
  roundCount = 5,
  random = Math.random,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const { tokens: readingDisplay } = useReadingDisplay();
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const { reduceMotion, boldText } = useAccessibilityPreferences();
  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [selectedClue, setSelectedClue] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [lastSkipped, setLastSkipped] = useState(false);
  const [lastMeaningCorrect, setLastMeaningCorrect] = useState(false);
  const [lastClueCorrect, setLastClueCorrect] = useState(false);
  const [completedMeaningCorrect, setCompletedMeaningCorrect] = useState(0);
  const [completedClueCorrect, setCompletedClueCorrect] = useState(0);

  const sourceRounds =
    rounds ?? getContextBuilderRounds(selectedDifficulty);
  const totalRounds = Math.min(roundCount, sourceRounds.length);
  const sessionRoundsRef = useRef<ContextBuilderRound[]>([]);
  const meaningOrdersRef = useRef<ContextMeaningOption[][]>([]);
  const clueOrdersRef = useRef<ContextClueOption[][]>([]);
  const sessionOrdinalRef = useRef<number | null>(null);
  const previousItemIdsRef = useRef<string[]>([]);
  const currentItemIdsRef = useRef<string[]>([]);
  const startedAtRef = useRef(0);
  const attemptsRef = useRef(0);
  const omittedRef = useRef(0);
  const meaningCorrectRef = useRef(0);
  const clueCorrectRef = useRef(0);
  const confidenceRatingsRef = useRef(0);
  const confidentCorrectRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start(force = false) {
    if (!force && phase !== 'idle' && phase !== 'ended') return;
    cancelledRef.current = false;
    reportedRef.current = false;
    attemptsRef.current = 0;
    omittedRef.current = 0;
    meaningCorrectRef.current = 0;
    clueCorrectRef.current = 0;
    confidenceRatingsRef.current = 0;
    confidentCorrectRef.current = 0;
    setCompletedMeaningCorrect(0);
    setCompletedClueCorrect(0);
    setRoundIndex(0);
    resetSelections();
    const sessionOrdinal =
      sessionOrdinalRef.current ?? gameProgress.totalPlays;
    const chosen = selectRotatingWindow(
      sourceRounds,
      roundCount,
      sessionOrdinal
    );
    sessionOrdinalRef.current = sessionOrdinal + 1;
    sessionRoundsRef.current = shuffleItems(chosen, random);
    meaningOrdersRef.current = sessionRoundsRef.current.map((round) =>
      shuffleItems(round.meaningOptions, random)
    );
    clueOrdersRef.current = sessionRoundsRef.current.map((round) =>
      shuffleItems(round.clueOptions, random)
    );
    previousItemIdsRef.current = currentItemIdsRef.current;
    currentItemIdsRef.current = sessionRoundsRef.current.map((round) => round.id);
    startedAtRef.current = Date.now();
    setPhase('active');
  }

  function resetSelections() {
    setSelectedMeaning(null);
    setSelectedClue(null);
    setConfidence(null);
    setLastSkipped(false);
    setLastMeaningCorrect(false);
    setLastClueCorrect(false);
  }

  function submitRound() {
    if (
      phase !== 'active' ||
      selectedMeaning === null ||
      selectedClue === null
    ) {
      return;
    }
    const current = sessionRoundsRef.current[roundIndex];
    if (!current) return;
    const meaningCorrect = selectedMeaning === current.correctMeaningOptionId;
    const clueCorrect = current.acceptedClueIds.includes(selectedClue);
    attemptsRef.current += 1;
    meaningCorrectRef.current += meaningCorrect ? 1 : 0;
    clueCorrectRef.current += clueCorrect ? 1 : 0;
    if (confidence !== null) {
      confidenceRatingsRef.current += 1;
      if (confidence === 'confident' && meaningCorrect && clueCorrect) {
        confidentCorrectRef.current += 1;
      }
    }
    setCompletedMeaningCorrect(meaningCorrectRef.current);
    setCompletedClueCorrect(clueCorrectRef.current);
    setLastMeaningCorrect(meaningCorrect);
    setLastClueCorrect(clueCorrect);
    setLastSkipped(false);
    setPhase('feedback');
  }

  function skipRound() {
    if (phase !== 'active') return;
    omittedRef.current += 1;
    setLastSkipped(true);
    setLastMeaningCorrect(false);
    setLastClueCorrect(false);
    setPhase('feedback');
  }

  function continueRound() {
    if (phase !== 'feedback') return;
    const next = roundIndex + 1;
    if (next >= sessionRoundsRef.current.length) {
      finish();
      return;
    }
    setRoundIndex(next);
    resetSelections();
    setPhase('active');
  }

  function finish() {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    const finishedAt = Date.now();
    const attempts = attemptsRef.current;
    const meaningAccuracy =
      attempts > 0 ? meaningCorrectRef.current / attempts : 0;
    const clueAccuracy = attempts > 0 ? clueCorrectRef.current / attempts : 0;
    const score = Math.round((meaningAccuracy + clueAccuracy) * 50);
    const itemIds = [...currentItemIdsRef.current];
    const replayOfItemIds =
      previousItemIdsRef.current.length > 0
        ? [...previousItemIdsRef.current]
        : undefined;
    const immediateReplayDuplicate =
      replayOfItemIds !== undefined &&
      canonicalItemSetSignature(replayOfItemIds) ===
        canonicalItemSetSignature(itemIds);
    const adaptiveQualificationEligible =
      sessionRoundsRef.current.length >= 5 &&
      attempts === sessionRoundsRef.current.length &&
      !immediateReplayDuplicate &&
      meaningAccuracy >= 0.8 &&
      clueAccuracy >= 0.8;
    const details = {
      schemaVersion: 1,
      contentVersion: CONTENT_VERSION,
      activityType: 'context-builder',
      difficulty: selectedDifficulty,
      rounds: sessionRoundsRef.current.length,
      attempts,
      omittedRounds: omittedRef.current,
      meaningCorrect: meaningCorrectRef.current,
      meaningAccuracy,
      clueCorrect: clueCorrectRef.current,
      clueAccuracy,
      confidenceRatings: confidenceRatingsRef.current,
      confidentCorrect: confidentCorrectRef.current,
      itemIds,
      replayOfItemIds,
      immediateReplayDuplicate,
      adaptiveQualificationEligible,
      reduceMotion,
    } satisfies ContextBuilderResultDetails & Record<string, unknown>;

    setPhase('ended');
    void updateTwoSessionDifficultySuggestion(
      GAME_ID,
      selectedDifficulty,
      adaptiveQualificationEligible,
      score
    )
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);
    onReportResult?.({
      startedAtIso: new Date(startedAtRef.current).toISOString(),
      finishedAtIso: new Date(finishedAt).toISOString(),
      elapsedMs: Math.max(1, finishedAt - startedAtRef.current),
      score,
      accuracy: meaningAccuracy,
      details,
    });
  }

  const current = sessionRoundsRef.current[roundIndex] ?? sourceRounds[0];
  const meaningOptions =
    meaningOrdersRef.current[roundIndex] ?? current?.meaningOptions ?? [];
  const clueOptions =
    clueOrdersRef.current[roundIndex] ?? current?.clueOptions ?? [];

  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Context Builder</Text>
        <Text style={styles.body}>No reviewed context rounds are available.</Text>
      </View>
    );
  }

  const targetSentenceNumber =
    current.sentences.findIndex(
      (sentence) => sentence.id === current.targetSentenceId
    ) + 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Context Builder</Text>
        <Text style={styles.subtitle}>
          Infer meaning, then identify the clue that supports it
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description="Practice inferring vocabulary from connected context. Meaning and clue accuracy are reported separately; there is no reading-speed score."
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          startLabel="Start Context Builder"
          onStart={() => start()}
        >
          <View style={styles.idleMeta}>
            <Text style={styles.metaText}>
              {totalRounds} rounds · {sourceRounds.length} reviewed words at this
              level · untimed
            </Text>
          </View>
        </GameIdlePanel>
      )}

      {phase === 'active' && (
        <View testID="context-active" style={styles.active}>
          <View style={styles.promptCard}>
            <Text style={styles.eyebrow}>
              ROUND {roundIndex + 1} OF {sessionRoundsRef.current.length}
            </Text>
            <Text style={styles.question}>
              What does “{current.targetWord}” mean in the highlighted sentence?
            </Text>
            <Text style={styles.questionHelp}>
              Choose the word’s meaning in that sentence only. Then identify the
              passage evidence that supports it.
            </Text>
          </View>

          <ReadingColumn
            testID="context-reading-column"
            style={[styles.readingArea, readingDisplay.column]}
          >
            <ScrollView
              testID="context-paragraph"
              style={[styles.passage, readingDisplay.surface]}
              contentContainerStyle={styles.passageContent}
              showsVerticalScrollIndicator={false}
            >
            <Text style={[styles.passageTitle, readingDisplay.title]}>
              {current.title}
            </Text>
            {current.sentences.map((sentence, sentenceIndex) =>
              sentence.id === current.targetSentenceId ? (
                <TargetSentence
                  key={sentence.id}
                  round={current}
                  sentenceNumber={sentenceIndex + 1}
                  boldText={boldText}
                />
              ) : (
                <Text
                  key={sentence.id}
                  testID={`context-sentence-${sentenceIndex + 1}`}
                  style={[
                    styles.paragraphText,
                    readingDisplay.text,
                    boldText && styles.boldParagraphText,
                  ]}
                >
                  <Text style={styles.sentenceNumber}>
                    Sentence {sentenceIndex + 1}:{' '}
                  </Text>
                  {sentence.text}
                </Text>
              )
            )}

            <Text style={styles.sectionHeading}>
              1. Meaning of “{current.targetWord}” in Sentence{' '}
              {targetSentenceNumber}
            </Text>
            <View accessibilityRole="radiogroup">
              {meaningOptions.map((option, index) => {
                const selected = selectedMeaning === option.id;
                const optionLetter = String.fromCharCode(65 + index);
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`Meaning option ${optionLetter}: ${option.text}`}
                    key={option.id}
                    testID={`context-meaning-${index}`}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedMeaning(option.id)}
                  >
                    <Text style={[styles.optionText, selected && styles.selectedText]}>
                      {optionLetter}. {option.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionHeading}>
              {current.difficulty === 'easy'
                ? '2. Most direct clue that defines this meaning'
                : current.difficulty === 'medium'
                  ? '2. One clue that independently supports this meaning'
                  : '2. Complete clue set needed to support this meaning'}
            </Text>
            <View accessibilityRole="radiogroup">
              {clueOptions.map((option, index) => {
                const selected = selectedClue === option.id;
                const optionLetter = String.fromCharCode(65 + index);
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`Clue option ${optionLetter}: ${option.text}`}
                    key={option.id}
                    testID={`context-clue-${index}`}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedClue(option.id)}
                  >
                    <Text style={[styles.optionText, selected && styles.selectedText]}>
                      {optionLetter}. {option.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionHeading}>Optional confidence</Text>
            <View accessibilityRole="radiogroup" style={styles.confidenceRow}>
              {(['unsure', 'confident'] as const).map((value) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: confidence === value }}
                  key={value}
                  testID={`context-confidence-${value}`}
                  style={[
                    styles.confidenceButton,
                    confidence === value && styles.optionSelected,
                  ]}
                  onPress={() => setConfidence(value)}
                >
                  <Text style={styles.optionText}>
                    {value === 'unsure' ? 'Not sure' : 'Confident'}
                  </Text>
                </Pressable>
              ))}
            </View>
            </ScrollView>
          </ReadingColumn>

          <View style={styles.actionRow}>
            <View style={styles.actionButton}>
              <Button
                testID="skip-context-round"
                label="Skip round"
                variant="secondary"
                onPress={skipRound}
              />
            </View>
            <View style={styles.actionButton}>
              <Button
                testID="submit-context-round"
                label="Check meaning and clue"
                disabled={selectedMeaning === null || selectedClue === null}
                onPress={submitRound}
              />
            </View>
          </View>
        </View>
      )}

      {phase === 'feedback' && (
        <View testID="context-feedback" style={styles.center}>
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.feedbackCard,
              !lastSkipped && lastMeaningCorrect && lastClueCorrect
                ? styles.successCard
                : styles.reviewCard,
            ]}
          >
            <Text style={styles.eyebrow}>
              {lastSkipped
                ? 'ROUND OMITTED'
                : lastMeaningCorrect && lastClueCorrect
                  ? 'MEANING AND CLUE CONNECTED'
                  : 'REVIEW THE CONTEXT'}
            </Text>
            <Text style={styles.feedbackTitle}>
              In Sentence {targetSentenceNumber}, “{current.targetWord}” means:{' '}
              {current.definition}
            </Text>
            <Text style={styles.body}>{current.rationale}</Text>
            <Text style={styles.morphology}>
              Word note: {current.morphologyNotes}
            </Text>
          </View>
          <Button
            testID="continue-context"
            label={
              roundIndex + 1 >= sessionRoundsRef.current.length
                ? 'See task results'
                : 'Next word'
            }
            onPress={continueRound}
          />
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.center}>
          <View style={styles.feedbackCard}>
            <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
            <Text style={styles.resultMetric}>
              {completedMeaningCorrect}/{attemptsRef.current}
            </Text>
            <Text style={styles.metricLabel}>meanings correct</Text>
            <Text style={styles.resultMetricSmall}>
              {completedClueCorrect}/{attemptsRef.current}
            </Text>
            <Text style={styles.metricLabel}>
              clues correct · {omittedRef.current} omitted
            </Text>
          </View>
          <Button
            testID="play-again"
            label="Build a fresh set"
            onPress={() => start(true)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.sm },
  header: { marginBottom: spacing.sm },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 2 },
  idleMeta: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.infoSurface,
  },
  metaText: { color: colors.infoForeground, fontSize: 12, fontWeight: '700' },
  active: { flex: 1, gap: spacing.sm },
  readingArea: { flex: 1 },
  promptCard: { padding: spacing.md, borderRadius: 18, backgroundColor: colors.infoSurface },
  eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  question: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', lineHeight: 25, marginTop: 5 },
  questionHelp: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
  passage: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  passageContent: { padding: spacing.md },
  passageTitle: { color: colors.textPrimary, fontSize: 21, fontWeight: '800', marginBottom: spacing.md },
  paragraphText: { color: colors.textPrimary, fontSize: 17, lineHeight: 28, marginBottom: 8 },
  boldParagraphText: { fontWeight: '600' },
  sentenceNumber: { color: colors.textSecondary, fontWeight: '800' },
  targetWord: {
    color: colors.infoForeground,
    backgroundColor: colors.infoSurface,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  sectionHeading: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.sm },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    padding: 13,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  optionSelected: { borderColor: colors.interactivePrimary, backgroundColor: colors.surfaceTonal },
  optionText: { color: colors.textPrimary, fontSize: 15, lineHeight: 21 },
  selectedText: { color: colors.primaryDark, fontWeight: '700' },
  confidenceRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  confidenceButton: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  actionRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  actionButton: { flex: 1, minWidth: 0 },
  center: { flex: 1, justifyContent: 'center', gap: spacing.md },
  feedbackCard: { padding: spacing.lg, borderRadius: 22, backgroundColor: colors.cardBackground, ...shadows.small },
  successCard: { backgroundColor: colors.successSurface, borderWidth: 1, borderColor: colors.successForeground },
  reviewCard: { backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningForeground },
  feedbackTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', lineHeight: 27, marginTop: 6 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, marginTop: spacing.sm },
  morphology: { color: colors.textPrimary, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: spacing.md },
  resultMetric: { color: colors.primaryDark, fontSize: 42, fontWeight: '900', marginTop: spacing.sm },
  resultMetricSmall: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', marginTop: spacing.md },
  metricLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  pressed: { opacity: 0.78 },
});
