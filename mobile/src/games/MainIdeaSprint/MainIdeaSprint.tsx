import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import {
  MAIN_IDEA_PASSAGES,
  type MainIdeaPassage,
} from '../../data/mainIdeaPassages';
import { levelToStars, updateProgress } from '../../data/progressStore';
import { colors, shadows, spacing } from '../../theme/colors';
import { Button } from '../../ui/Button';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { ReadingColumn } from '../../ui/ResponsiveShell';
import { useAutoStart, useGameProgress, type Difficulty } from '../gameHooks';
import type { GameReportPayload } from '../registry';

const GAME_ID = 'MainIdeaSprint';

type Props = {
  passages?: MainIdeaPassage[];
  roundCount?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'reading' | 'question' | 'feedback' | 'ended';

export function getMainIdeaChallenge(difficulty: Difficulty) {
  return {
    roundCount: 2,
    passageLevel: difficulty,
    inferenceDepth:
      difficulty === 'easy'
        ? 'explicit'
        : difficulty === 'medium'
          ? 'synthesis'
          : 'qualification',
  } as const;
}

function selectPassages(
  source: MainIdeaPassage[],
  count: number,
  offset: number
): MainIdeaPassage[] {
  if (source.length === 0) return [];
  return Array.from(
    { length: Math.min(count, source.length) },
    (_, index) => source[(offset + index) % source.length]
  );
}

export default function MainIdeaSprint({
  passages = MAIN_IDEA_PASSAGES,
  roundCount,
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

  const [phase, setPhase] = useState<Phase>('idle');
  const [passageIndex, setPassageIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const sessionPassagesRef = useRef<MainIdeaPassage[]>([]);
  const sessionStartedAtRef = useRef(0);
  const correctCountRef = useRef(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start(force = false) {
    cancelledRef.current = false;
    if (!force && phase !== 'idle' && phase !== 'ended') return;

    const challenge = getMainIdeaChallenge(selectedDifficulty);
    const configuredRoundCount = roundCount ?? challenge.roundCount;
    const leveledPassages = passages.filter(
      (passage) =>
        passage.difficulty === undefined ||
        passage.difficulty === challenge.passageLevel
    );
    sessionPassagesRef.current = selectPassages(
      leveledPassages.length > 0 ? leveledPassages : passages,
      configuredRoundCount,
      gameProgress.totalPlays % Math.max(leveledPassages.length, 1)
    );
    reportedRef.current = false;
    correctCountRef.current = 0;
    setCorrectCount(0);
    setPassageIndex(0);
    setSelectedAnswer(null);
    setLastAnswerCorrect(false);
    sessionStartedAtRef.current = Date.now();
    setPhase('reading');
  }

  function showQuestion() {
    if (phase !== 'reading') return;
    setSelectedAnswer(null);
    setPhase('question');
  }

  function checkAnswer() {
    const current = sessionPassagesRef.current[passageIndex];
    if (!current || selectedAnswer === null || phase !== 'question') return;
    const correct = selectedAnswer === current.correctIndex;
    setLastAnswerCorrect(correct);
    if (correct) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
    }
    setPhase('feedback');
  }

  function continueAfterFeedback() {
    const nextIndex = passageIndex + 1;
    if (nextIndex >= sessionPassagesRef.current.length) {
      finish();
      return;
    }
    setPassageIndex(nextIndex);
    setSelectedAnswer(null);
    setLastAnswerCorrect(false);
    setPhase('reading');
  }

  function finish() {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    const now = Date.now();
    const total = sessionPassagesRef.current.length;
    const accuracy = total > 0 ? correctCountRef.current / total : 0;
    const score = Math.round(accuracy * 100);

    setPhase('ended');
    void updateProgress(GAME_ID, accuracy >= 0.7, score).then(({ progress }) => {
      if (cancelledRef.current) return;
      setGameProgress(progress);
    }).catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(sessionStartedAtRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs: Math.max(1, now - sessionStartedAtRef.current),
      score,
      accuracy,
      details: {
        activityType: 'retrieval-comprehension',
        questionsTotal: total,
        correctCount: correctCountRef.current,
        difficulty: selectedDifficulty,
      },
    });
  }

  const currentPassage =
    sessionPassagesRef.current[passageIndex] ?? passages[0];
  const totalPassages =
    sessionPassagesRef.current.length ||
    Math.min(
      roundCount ?? getMainIdeaChallenge(selectedDifficulty).roundCount,
      passages.length
    );

  if (!currentPassage) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.stageTitle}>No passages available</Text>
          <Text style={styles.bodyText}>Add at least one passage to start this drill.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Main Idea</Text>
        <Text style={styles.subtitle}>Read, hide, retrieve, and check</Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={levelToStars(gameProgress.level)}
          startLabel="Start retrieval drill"
          onStart={() => start()}
        >
          <View style={styles.idleMeta}>
            <Text style={styles.idleMetaText}>
              {totalPassages} short passages · immediate feedback
            </Text>
          </View>
        </GameIdlePanel>
      )}

      {phase === 'reading' && (
        <View style={styles.stage}>
          <View style={styles.stageHeader}>
            <View>
              <Text style={styles.eyebrow}>
                PASSAGE {passageIndex + 1} OF {totalPassages}
              </Text>
              <Text style={styles.stageTitle}>Read for the central claim</Text>
            </View>
            <View style={styles.scorePill}>
              <Text style={styles.scoreValue}>{correctCount}</Text>
              <Text style={styles.scoreLabel}>correct</Text>
            </View>
          </View>

          <ReadingColumn
            testID="main-idea-reading-column"
            style={styles.readingArea}
          >
            <ScrollView
              style={styles.passageCard}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.passageTitle}>{currentPassage.title}</Text>
              <Text testID="main-idea-passage" style={styles.passageText}>
                {currentPassage.text}
              </Text>
            </ScrollView>
          </ReadingColumn>

          <View style={styles.retrievalHint}>
            <Text style={styles.retrievalHintTitle}>Before continuing</Text>
            <Text style={styles.retrievalHintText}>
              State the main idea in your own words. Then hide the passage and
              compare it with the choices.
            </Text>
          </View>
          <Button
            testID="hide-passage"
            label="Hide passage and answer"
            onPress={showQuestion}
          />
        </View>
      )}

      {phase === 'question' && (
        <View style={styles.stage}>
          <View style={styles.stageHeader}>
            <View>
              <Text style={styles.eyebrow}>RETRIEVE FROM MEMORY</Text>
              <Text style={styles.stageTitle}>Which is the best main idea?</Text>
            </View>
          </View>

          <ScrollView
            style={styles.choicesCard}
            showsVerticalScrollIndicator={false}
          >
            <View accessibilityRole="radiogroup">
              {currentPassage.choices.map((choice, index) => {
                const selected = selectedAnswer === index;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={choice}
                    key={`${choice}-${index}`}
                    testID={`main-idea-choice-${index}`}
                    style={[styles.choice, selected && styles.choiceSelected]}
                    onPress={() => setSelectedAnswer(index)}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {choice}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Button
            testID="check-main-idea"
            label="Check my answer"
            disabled={selectedAnswer === null}
            onPress={checkAnswer}
          />
        </View>
      )}

      {phase === 'feedback' && (
        <View style={styles.centerStage}>
          <View
            testID="main-idea-feedback"
            style={[
              styles.feedbackCard,
              lastAnswerCorrect
                ? styles.feedbackCardCorrect
                : styles.feedbackCardReview,
            ]}
          >
            <Text
              style={[
                styles.feedbackTitle,
                lastAnswerCorrect ? styles.correctText : styles.reviewText,
              ]}
            >
              {lastAnswerCorrect ? 'Correct central idea' : 'Review the central idea'}
            </Text>
            {!lastAnswerCorrect && (
              <Text style={styles.correctAnswer}>
                Best answer: {currentPassage.choices[currentPassage.correctIndex]}
              </Text>
            )}
            <Text style={styles.feedbackText}>{currentPassage.feedback}</Text>
          </View>

          <Button
            testID="continue-main-idea"
            label={
              passageIndex + 1 >= totalPassages
                ? 'Finish session'
                : 'Next passage'
            }
            onPress={continueAfterFeedback}
          />
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end" style={styles.centerStage}>
          <View style={styles.feedbackCard}>
            <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
            <Text style={styles.bigMetric}>
              {correctCount}/{totalPassages}
            </Text>
            <Text style={styles.metricLabel}>main ideas retrieved</Text>
            <Text style={styles.feedbackText}>
              Retrieval becomes more useful when you explain why the main idea
              fits and the supporting details do not.
            </Text>
          </View>
          <Button
            testID="play-again"
            label="Practice again"
            onPress={() => start(true)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  idleMeta: {
    marginBottom: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceTonal,
  },
  idleMetaText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  stage: {
    flex: 1,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  stageTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  scorePill: {
    minWidth: 60,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.surfaceTonal,
  },
  scoreValue: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  passageCard: {
    flex: 1,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  readingArea: { flex: 1 },
  passageTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
    marginBottom: spacing.md,
  },
  passageText: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 30,
  },
  retrievalHint: {
    marginVertical: spacing.sm,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.surfaceTonal,
  },
  retrievalHintTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  retrievalHintText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  choicesCard: {
    flex: 1,
    marginBottom: spacing.md,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    ...shadows.small,
  },
  choice: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceTonal,
  },
  radio: {
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textMuted,
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  choiceText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 11,
  },
  choiceTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  feedbackCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  feedbackCardCorrect: {
    backgroundColor: '#EAF8F2',
  },
  feedbackCardReview: {
    backgroundColor: '#FFF4E8',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  correctText: {
    color: colors.success,
  },
  reviewText: {
    color: colors.warning,
  },
  correctAnswer: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  feedbackText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bigMetric: {
    color: colors.textPrimary,
    fontSize: 44,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
  },
});
