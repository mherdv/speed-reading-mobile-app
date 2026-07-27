import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getEvidenceHuntRounds,
  type EvidenceHuntRound,
  type EvidenceOption,
} from '../../data/evidenceHuntContent';
import {
  levelToStars,
  updateTwoSessionDifficultySuggestion,
} from '../../data/progressStore';
import type { EvidenceHuntResultDetails } from '../../domain/types';
import { useAccessibilityPreferences } from '../../hooks/useAccessibilityPreferences';
import { colors, shadows, spacing } from '../../theme/colors';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import {
  useAutoStart,
  useGameProgress,
  type Difficulty,
} from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'EvidenceHunt';
const CONTENT_VERSION = 1;

type Phase = 'idle' | 'active' | 'feedback' | 'ended';

type Props = {
  rounds?: readonly EvidenceHuntRound[];
  roundCount?: number;
  random?: () => number;
  initialTimed?: boolean;
  roundDurationMs?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

function shuffleWith<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(
      Math.min(0.999999, Math.max(0, random())) * (index + 1)
    );
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function rotateFresh<T>(
  values: readonly T[],
  count: number,
  sessionOrdinal: number
): T[] {
  if (values.length === 0) return [];
  const safeCount = Math.min(count, values.length);
  const offset = (sessionOrdinal * safeCount) % values.length;
  return Array.from(
    { length: safeCount },
    (_, index) => values[(offset + index) % values.length]
  );
}

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle] ?? 0
    : Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
}

function defaultRoundDuration(difficulty: Difficulty): number {
  if (difficulty === 'medium') return 90_000;
  if (difficulty === 'hard') return 75_000;
  return 120_000;
}

export default function EvidenceHunt({
  rounds,
  roundCount = 4,
  random = Math.random,
  initialTimed = false,
  roundDurationMs,
  difficulty = 'easy',
  autoStart = false,
  onReportResult,
}: Props) {
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const { reduceMotion, screenReader } = useAccessibilityPreferences();
  const [phase, setPhase] = useState<Phase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timed, setTimed] = useState(initialTimed);
  const [remainingMs, setRemainingMs] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [completedAnswerCorrect, setCompletedAnswerCorrect] = useState(0);
  const [completedEvidenceCredit, setCompletedEvidenceCredit] = useState(0);

  const sessionRoundsRef = useRef<EvidenceHuntRound[]>([]);
  const optionOrdersRef = useRef<EvidenceOption[][]>([]);
  const sessionOrdinalRef = useRef(gameProgress.totalPlays);
  const previousItemIdsRef = useRef<string[]>([]);
  const currentItemIdsRef = useRef<string[]>([]);
  const startedAtRef = useRef(0);
  const roundStartedAtRef = useRef(0);
  const roundLocateMsRef = useRef<number | null>(null);
  const locateTimesRef = useRef<number[]>([]);
  const answerCorrectRef = useRef(0);
  const evidenceCreditRef = useRef(0);
  const evidenceRequiredRef = useRef(0);
  const wrongSelectionsRef = useRef(0);
  const roundWrongStartRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expireRoundRef = useRef<() => void>(() => undefined);

  const sourceRounds =
    rounds ?? getEvidenceHuntRounds(selectedDifficulty);
  const totalRounds = Math.min(roundCount, sourceRounds.length);
  const configuredDuration =
    roundDurationMs ?? defaultRoundDuration(selectedDifficulty);

  function clearRoundTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearRoundTimer();
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function beginTimer() {
    clearRoundTimer();
    if (!timed) return;
    setRemainingMs(configuredDuration);
    timerRef.current = setInterval(() => {
      const next = Math.max(
        0,
        configuredDuration - (Date.now() - roundStartedAtRef.current)
      );
      setRemainingMs(next);
      if (next === 0) {
        clearRoundTimer();
        expireRoundRef.current();
      }
    }, 250);
  }

  function start(force = false) {
    if (!force && phase !== 'idle' && phase !== 'ended') return;
    clearRoundTimer();
    cancelledRef.current = false;
    reportedRef.current = false;
    answerCorrectRef.current = 0;
    evidenceCreditRef.current = 0;
    evidenceRequiredRef.current = 0;
    wrongSelectionsRef.current = 0;
    roundWrongStartRef.current = 0;
    locateTimesRef.current = [];
    roundLocateMsRef.current = null;
    setCompletedAnswerCorrect(0);
    setCompletedEvidenceCredit(0);
    setRoundIndex(0);
    setSelectedEvidence([]);
    setSelectedAnswer(null);
    const chosen = rotateFresh(
      sourceRounds,
      roundCount,
      sessionOrdinalRef.current
    );
    sessionOrdinalRef.current += 1;
    sessionRoundsRef.current = shuffleWith(chosen, random);
    optionOrdersRef.current = sessionRoundsRef.current.map((round) =>
      shuffleWith(round.options, random)
    );
    previousItemIdsRef.current = currentItemIdsRef.current;
    currentItemIdsRef.current = sessionRoundsRef.current.map((round) => round.id);
    startedAtRef.current = Date.now();
    roundStartedAtRef.current = Date.now();
    setPhase('active');
    beginTimer();
  }

  function toggleEvidence(sentenceId: string) {
    if (phase !== 'active') return;
    const current = sessionRoundsRef.current[roundIndex];
    if (!current) return;
    setSelectedEvidence((selected) => {
      let next: string[];
      if (selected.includes(sentenceId)) {
        next = selected.filter((id) => id !== sentenceId);
        return next;
      }
      if (selected.length >= current.evidenceSentenceIds.length) return selected;
      if (!current.evidenceSentenceIds.includes(sentenceId)) {
        wrongSelectionsRef.current += 1;
      }
      next = [...selected, sentenceId];
      if (
        roundLocateMsRef.current === null &&
        next.length === current.evidenceSentenceIds.length &&
        current.evidenceSentenceIds.every((id) => next.includes(id))
      ) {
        roundLocateMsRef.current = Math.max(
          0,
          Date.now() - roundStartedAtRef.current
        );
      }
      return next;
    });
  }

  function submitRound(expired = false) {
    if (phase !== 'active') return;
    const current = sessionRoundsRef.current[roundIndex];
    if (!current) return;
    if (!expired && (selectedEvidence.length === 0 || selectedAnswer === null)) {
      return;
    }
    clearRoundTimer();
    const answerCorrect =
      !expired && selectedAnswer === current.correctOptionId;
    const selectedCorrect = selectedEvidence.filter((id) =>
      current.evidenceSentenceIds.includes(id)
    ).length;
    const roundWrongSelections =
      wrongSelectionsRef.current - roundWrongStartRef.current;
    const evidenceCredit = Math.max(
      0,
      selectedCorrect - roundWrongSelections
    );
    answerCorrectRef.current += answerCorrect ? 1 : 0;
    evidenceCreditRef.current += evidenceCredit;
    evidenceRequiredRef.current += current.evidenceSentenceIds.length;
    if (!expired && roundLocateMsRef.current !== null) {
      locateTimesRef.current.push(roundLocateMsRef.current);
    }
    setCompletedAnswerCorrect(answerCorrectRef.current);
    setCompletedEvidenceCredit(evidenceCreditRef.current);
    setLastCorrect(
      answerCorrect &&
        evidenceCredit === current.evidenceSentenceIds.length
    );
    setPhase('feedback');
  }
  expireRoundRef.current = () => submitRound(true);

  function continueRound() {
    if (phase !== 'feedback') return;
    const next = roundIndex + 1;
    if (next >= sessionRoundsRef.current.length) {
      finish();
      return;
    }
    setRoundIndex(next);
    setSelectedEvidence([]);
    setSelectedAnswer(null);
    roundWrongStartRef.current = wrongSelectionsRef.current;
    roundStartedAtRef.current = Date.now();
    roundLocateMsRef.current = null;
    setPhase('active');
    beginTimer();
  }

  function finish() {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    clearRoundTimer();
    const finishedAt = Date.now();
    const total = sessionRoundsRef.current.length;
    const answerAccuracy = total > 0 ? answerCorrectRef.current / total : 0;
    const evidenceAccuracy =
      evidenceRequiredRef.current > 0
        ? evidenceCreditRef.current / evidenceRequiredRef.current
        : 0;
    const score = Math.round((answerAccuracy + evidenceAccuracy) * 50);
    const itemIds = [...currentItemIdsRef.current];
    const replayOfItemIds =
      previousItemIdsRef.current.length > 0
        ? [...previousItemIdsRef.current]
        : undefined;
    const immediateReplayDuplicate =
      replayOfItemIds !== undefined &&
      replayOfItemIds.join('|') === itemIds.join('|');
    const adaptiveQualificationEligible =
      !immediateReplayDuplicate &&
      answerAccuracy >= 0.8 &&
      evidenceAccuracy >= 0.8;
    const details = {
      schemaVersion: 1,
      contentVersion: CONTENT_VERSION,
      activityType: 'evidence-hunt',
      difficulty: selectedDifficulty,
      rounds: total,
      answerCorrect: answerCorrectRef.current,
      answerAccuracy,
      evidenceCorrect: evidenceCreditRef.current,
      evidenceRequired: evidenceRequiredRef.current,
      evidenceAccuracy,
      medianLocateMs: median(locateTimesRef.current),
      locatedRounds: locateTimesRef.current.length,
      wrongSelections: wrongSelectionsRef.current,
      timed,
      itemIds,
      replayOfItemIds,
      immediateReplayDuplicate,
      adaptiveQualificationEligible,
      reduceMotion,
    } satisfies EvidenceHuntResultDetails & Record<string, unknown>;

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
      accuracy: answerAccuracy,
      details,
    });
  }

  const current = sessionRoundsRef.current[roundIndex] ?? sourceRounds[0];
  const options = optionOrdersRef.current[roundIndex] ?? current?.options ?? [];
  const submitDisabled =
    selectedEvidence.length === 0 || selectedAnswer === null;

  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Evidence Hunt</Text>
        <Text style={styles.body}>No reviewed evidence rounds are available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Evidence Hunt</Text>
        <Text style={styles.subtitle}>
          Find the sentence evidence, then answer from the passage
        </Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description="Practice locating and justifying an answer in connected text. This reports task accuracy and locate time, not reading speed."
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          startLabel="Start Evidence Hunt"
          onStart={() => start()}
        >
          <View style={styles.idleMeta}>
            <Text style={styles.metaText}>
              {totalRounds} rounds · {selectedDifficulty === 'hard' ? '2 evidence sentences' : '1 evidence sentence'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: timed }}
            accessibilityLabel="Optional time guide"
            testID="evidence-timed-toggle"
            style={[styles.toggle, timed && styles.toggleSelected]}
            onPress={() => setTimed((value) => !value)}
          >
            <Text style={styles.toggleText}>
              {timed
                ? `Optional time guide on · ${Math.round(configuredDuration / 1000)} seconds`
                : 'Untimed play · no deadline'}
            </Text>
          </Pressable>
        </GameIdlePanel>
      )}

      {phase === 'active' && (
        <View testID="evidence-active" style={styles.active}>
          <View style={styles.promptCard}>
            <Text style={styles.eyebrow}>
              ROUND {roundIndex + 1} OF {sessionRoundsRef.current.length}
            </Text>
            <Text style={styles.question}>{current.question}</Text>
            <Text style={styles.instruction}>
              Select {current.evidenceSentenceIds.length}{' '}
              {current.evidenceSentenceIds.length === 1 ? 'sentence' : 'sentences'},
              then choose an answer.
            </Text>
            {timed && (
              <Text accessibilityLiveRegion="polite" style={styles.timerText}>
                Optional guide: {Math.ceil(remainingMs / 1000)} seconds left
              </Text>
            )}
          </View>

          <ReadingColumn
            testID="evidence-reading-column"
            style={styles.readingArea}
          >
            <ScrollView
              testID="evidence-passage"
              style={styles.passage}
              contentContainerStyle={styles.passageContent}
              showsVerticalScrollIndicator={false}
            >
            <Text style={styles.passageTitle}>{current.title}</Text>
            {current.sentences.map((sentence, index) => {
              const selected = selectedEvidence.includes(sentence.id);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Sentence ${index + 1}. ${sentence.text}`}
                  accessibilityHint={`Select as evidence. ${selected ? 'Currently selected.' : 'Not selected.'}`}
                  key={sentence.id}
                  testID={`evidence-sentence-${sentence.id}`}
                  style={({ pressed }) => [
                    styles.sentence,
                    selected && styles.sentenceSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => toggleEvidence(sentence.id)}
                >
                  <Text style={styles.sentenceNumber}>{index + 1}</Text>
                  <Text
                    style={[
                      styles.sentenceText,
                      selected && styles.selectedText,
                      screenReader && styles.screenReaderText,
                    ]}
                  >
                    {sentence.text}
                  </Text>
                  <Text style={styles.selectionText}>
                    {selected ? 'Selected' : 'Select'}
                  </Text>
                </Pressable>
              );
            })}

            <Text style={styles.answerHeading}>Choose the answer</Text>
            <View accessibilityRole="radiogroup">
              {options.map((option, index) => {
                const selected = selectedAnswer === option.id;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={option.id}
                    testID={`evidence-option-${index}`}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedAnswer(option.id)}
                  >
                    <Text style={[styles.optionText, selected && styles.selectedText]}>
                      {option.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            </ScrollView>
          </ReadingColumn>

          <Button
            testID="submit-evidence-round"
            label="Check evidence and answer"
            disabled={submitDisabled}
            onPress={() => submitRound(false)}
          />
        </View>
      )}

      {phase === 'feedback' && (
        <View testID="evidence-feedback" style={styles.center}>
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.feedbackCard,
              lastCorrect ? styles.successCard : styles.reviewCard,
            ]}
          >
            <Text style={styles.eyebrow}>
              {lastCorrect ? 'ANSWER JUSTIFIED' : 'REVIEW THE EVIDENCE'}
            </Text>
            <Text style={styles.feedbackTitle}>
              {current.options.find(
                (option) => option.id === current.correctOptionId
              )?.text}
            </Text>
            <Text style={styles.body}>{current.rationale}</Text>
            <Text style={styles.evidenceKey}>
              Correct evidence: {current.evidenceSentenceIds
                .map(
                  (id) =>
                    (current.sentences.findIndex(
                      (sentence) => sentence.id === id
                    ) + 1)
                )
                .join(', ')}
            </Text>
          </View>
          <Button
            testID="continue-evidence"
            label={
              roundIndex + 1 >= sessionRoundsRef.current.length
                ? 'See task results'
                : 'Next passage'
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
              {completedAnswerCorrect}/{sessionRoundsRef.current.length}
            </Text>
            <Text style={styles.metricLabel}>answers correct</Text>
            <Text style={styles.resultMetricSmall}>
              {completedEvidenceCredit}/{evidenceRequiredRef.current}
            </Text>
            <Text style={styles.metricLabel}>
              evidence credit · {wrongSelectionsRef.current} wrong selections
            </Text>
          </View>
          <Button
            testID="play-again"
            label="Hunt a fresh set"
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
    marginBottom: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.infoSurface,
  },
  metaText: { color: colors.infoForeground, fontSize: 12, fontWeight: '700' },
  toggle: {
    width: '100%',
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  toggleSelected: { borderColor: colors.interactivePrimary, backgroundColor: colors.surfaceTonal },
  toggleText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  active: { flex: 1, gap: spacing.sm },
  readingArea: { flex: 1 },
  promptCard: {
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.infoSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  question: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', lineHeight: 25, marginTop: 5 },
  instruction: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  timerText: { color: colors.warningForeground, fontSize: 12, fontWeight: '800', marginTop: 6 },
  passage: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  passageContent: { padding: spacing.md },
  passageTitle: { color: colors.textPrimary, fontSize: 21, fontWeight: '800', lineHeight: 28, marginBottom: spacing.md },
  sentence: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  sentenceSelected: { borderColor: colors.interactivePrimary, backgroundColor: colors.surfaceTonal },
  sentenceNumber: {
    width: 28,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    borderRadius: 9,
    overflow: 'hidden',
    color: colors.primaryDark,
    backgroundColor: colors.surfaceTonal,
    fontWeight: '800',
  },
  sentenceText: { flex: 1, color: colors.textPrimary, fontSize: 16, lineHeight: 25, marginHorizontal: 10 },
  screenReaderText: { fontSize: 17, lineHeight: 27 },
  selectionText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800', paddingTop: 5 },
  selectedText: { color: colors.primaryDark, fontWeight: '700' },
  answerHeading: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', marginTop: spacing.md, marginBottom: spacing.sm },
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
  center: { flex: 1, justifyContent: 'center', gap: spacing.md },
  feedbackCard: { padding: spacing.lg, borderRadius: 22, backgroundColor: colors.cardBackground, ...shadows.small },
  successCard: { backgroundColor: colors.successSurface, borderWidth: 1, borderColor: colors.successForeground },
  reviewCard: { backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningForeground },
  feedbackTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', lineHeight: 27, marginTop: 6 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 23, marginTop: spacing.sm },
  evidenceKey: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: spacing.md },
  resultMetric: { color: colors.primaryDark, fontSize: 42, fontWeight: '900', marginTop: spacing.sm },
  resultMetricSmall: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', marginTop: spacing.md },
  metricLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 2 },
  pressed: { opacity: 0.78 },
});
