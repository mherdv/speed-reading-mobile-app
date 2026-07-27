import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';
import { updateProgress } from '../../data/progressStore';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
} from '../../theme/colors';
import { GameIdlePanel } from '../../ui/GameIdlePanel';
import { useAutoStart, useGameProgress, useTrackedTimeouts, type Difficulty } from '../gameHooks';

const GAME_ID = 'EyeMovementTraining';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  blinkGoal?: number;
  breakSeconds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase =
  | 'idle'
  | 'blink'
  | 'distanceReady'
  | 'distance'
  | 'check'
  | 'ended';

type Comfort = 'comfortable' | 'same' | 'uncomfortable';

function getDifficultyConfig(difficulty: Difficulty) {
  if (difficulty === 'easy') return { blinkGoal: 3, breakSeconds: 10 };
  if (difficulty === 'hard') return { blinkGoal: 8, breakSeconds: 40 };
  return { blinkGoal: 5, breakSeconds: 20 };
}

export default function EyeMovementTraining({
  blinkGoal: blinkGoalProp,
  breakSeconds: breakSecondsProp,
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
  const config = getDifficultyConfig(selectedDifficulty);
  const blinkGoal = blinkGoalProp ?? config.blinkGoal;
  const breakSeconds = breakSecondsProp ?? config.breakSeconds;

  const [blinkCount, setBlinkCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(breakSeconds);
  const [comfort, setComfort] = useState<Comfort | null>(null);

  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const { scheduleTimeout, clearTrackedTimeouts } = useTrackedTimeouts();

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useAutoStart(autoStart, phase, progressLoaded, start);

  function start() {
    clearTrackedTimeouts();
    if (phase !== 'idle' && phase !== 'ended') return;
    cancelledRef.current = false;
    reportedRef.current = false;
    setBlinkCount(0);
    setSecondsLeft(breakSeconds);
    setComfort(null);
    startRef.current = Date.now();
    setPhase('blink');
  }

  function recordBlink() {
    if (phase !== 'blink') return;
    const nextCount = Math.min(blinkGoal, blinkCount + 1);
    setBlinkCount(nextCount);
    if (nextCount >= blinkGoal) setPhase('distanceReady');
  }

  function beginLookAway() {
    if (phase !== 'distanceReady') return;
    setSecondsLeft(breakSeconds);
    setPhase('distance');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setPhase('check');
        }
        return next;
      });
    }, 1000);
  }

  function complete(selectedComfort: Comfort) {
    if (phase !== 'check' || reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;
    clearTrackedTimeouts();
    setComfort(selectedComfort);

    const now = Date.now();
    const elapsedMs = Math.max(0, now - startRef.current);
    void updateProgress(GAME_ID, true, breakSeconds)
      .then(({ progress }) => {
        if (!cancelledRef.current) setGameProgress(progress);
      })
      .catch(() => undefined);

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: breakSeconds,
      details: {
        activityType: 'eye-comfort',
        blinkCount,
        breakSeconds,
        comfort: selectedComfort,
        difficulty: selectedDifficulty,
      },
    });
    setPhase('ended');
  }

  function playAgain() {
    clearTrackedTimeouts();
    setPhase('idle');
    scheduleTimeout(start, 50);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eye Reset</Text>
        <Text style={styles.subtitle}>A screen-comfort break, not vision treatment</Text>
      </View>

      {phase === 'idle' && (
        <GameIdlePanel
          description={GAME_DESCRIPTIONS[GAME_ID]}
          level={gameProgress.level}
          stars={0}
          onStart={start}
          startLabel="Start eye reset"
          containerStyle={styles.idleContent}
        >
          <View style={styles.safetyNote}>
            <Text style={styles.safetyTitle}>Comfort, not correction</Text>
            <Text style={styles.safetyText}>
              Stop if this feels uncomfortable. Ongoing blur, pain, or headaches
              deserve advice from an eye-care professional.
            </Text>
          </View>
        </GameIdlePanel>
      )}

      {phase === 'blink' && (
        <View testID="blink-stage" style={styles.stageCard}>
          <Text style={styles.stageEyebrow}>STEP 1 OF 3</Text>
          <Text style={styles.stageTitle}>Blink gently</Text>
          <Text style={styles.stageBody}>
            Close and reopen your eyes naturally. Tap once after each comfortable
            blink—do not squeeze.
          </Text>
          <View style={styles.counterCircle}>
            <Text testID="blink-count" style={styles.counterValue}>
              {blinkCount}
            </Text>
            <Text style={styles.counterLabel}>of {blinkGoal}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Record gentle blink"
            testID="record-blink"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={recordBlink}
          >
            <Text style={styles.primaryButtonText}>Record gentle blink</Text>
          </Pressable>
        </View>
      )}

      {phase === 'distanceReady' && (
        <View testID="look-away-ready" style={styles.stageCard}>
          <Text style={styles.stageEyebrow}>STEP 2 OF 3</Text>
          <Text style={styles.stageTitle}>Look into the distance</Text>
          <Text style={styles.stageBody}>
            Put the device down or hold it low. Look across the room or out a
            window and let your focus relax.
          </Text>
          <View style={styles.durationPill}>
            <Text style={styles.durationValue}>{breakSeconds}s</Text>
            <Text style={styles.durationLabel}>screen-free pause</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="begin-look-away"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={beginLookAway}
          >
            <Text style={styles.primaryButtonText}>Begin look-away break</Text>
          </Pressable>
        </View>
      )}

      {phase === 'distance' && (
        <View testID="look-away-stage" style={[styles.stageCard, styles.quietCard]}>
          <Text style={styles.stageEyebrow}>SCREEN BREAK</Text>
          <Text testID="seconds-left" style={styles.timerValue}>
            {secondsLeft}
          </Text>
          <Text style={styles.timerLabel}>seconds left</Text>
          <Text style={styles.quietInstruction}>
            Keep looking away. There is nothing to tap right now.
          </Text>
        </View>
      )}

      {phase === 'check' && (
        <View testID="comfort-check" style={styles.stageCard}>
          <Text style={styles.stageEyebrow}>STEP 3 OF 3</Text>
          <Text style={styles.stageTitle}>How do your eyes feel?</Text>
          <Text style={styles.stageBody}>
            This check records comfort only. It does not diagnose eye health.
          </Text>
          <View style={styles.comfortOptions}>
            <ComfortButton
              label="Comfortable"
              testID="comfort-comfortable"
              onPress={() => complete('comfortable')}
            />
            <ComfortButton
              label="About the same"
              testID="comfort-same"
              onPress={() => complete('same')}
            />
            <ComfortButton
              label="Uncomfortable"
              testID="comfort-uncomfortable"
              onPress={() => complete('uncomfortable')}
            />
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end-screen" style={styles.stageCard}>
          <Text style={styles.completeIcon}>✓</Text>
          <Text style={styles.stageTitle}>Eye reset complete</Text>
          <Text style={styles.stageBody}>
            {comfort === 'uncomfortable'
              ? 'Give your eyes more rest. If discomfort keeps returning, seek professional advice.'
              : `${breakSeconds} seconds away from the screen completed.`}
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="play-again"
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={playAgain}
          >
            <Text style={styles.secondaryButtonText}>Reset again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ComfortButton({
  label,
  testID,
  onPress,
}: {
  label: string;
  testID: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      style={({ pressed }) => [
        styles.comfortButton,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.comfortButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
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
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
  },
  idleContent: {
    flex: 1,
  },
  safetyNote: {
    width: '100%',
    marginBottom: spacing.lg,
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFF5E8',
  },
  safetyTitle: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
  },
  safetyText: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  stageCard: {
    flex: 1,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    ...shadows.medium,
  },
  quietCard: {
    backgroundColor: '#F0F7F2',
  },
  stageEyebrow: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  stageTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  stageBody: {
    maxWidth: 340,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  counterCircle: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
    borderRadius: 64,
    borderWidth: 10,
    borderColor: '#DCD2FA',
    backgroundColor: colors.surfaceTonal,
  },
  counterValue: {
    color: colors.primaryDark,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
  },
  counterLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  durationPill: {
    alignItems: 'center',
    marginVertical: spacing.xl,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#EAF5EC',
  },
  durationValue: {
    color: colors.success,
    fontSize: 30,
    fontWeight: '800',
  },
  durationLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  primaryButton: {
    minWidth: 220,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    borderRadius: 17,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  timerValue: {
    marginTop: spacing.lg,
    color: colors.success,
    fontSize: 82,
    fontWeight: '800',
    lineHeight: 92,
  },
  timerLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  quietInstruction: {
    maxWidth: 280,
    marginTop: spacing.xl,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  comfortOptions: {
    width: '100%',
    marginTop: spacing.xl,
    gap: 10,
  },
  comfortButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceTonal,
  },
  comfortButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  completeIcon: {
    width: 72,
    height: 72,
    color: colors.white,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 70,
    textAlign: 'center',
    borderRadius: 36,
    backgroundColor: colors.success,
    overflow: 'hidden',
  },
  secondaryButton: {
    minWidth: 190,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
