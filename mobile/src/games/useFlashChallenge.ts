import { useCallback, useEffect, useRef, useState } from 'react';

import type { Difficulty } from '../data/difficultyPreferences';
import {
  FLASH_CHALLENGE_MIN_LEVEL,
  loadFlashChallengeProgress,
  qualifyFlashChallengeLevel,
  qualifyFlashChallengeWpm,
  saveFlashChallengeResumeLevel,
  saveFlashChallengeResumeWpm,
  type FlashChallengeProgress,
} from '../data/flashChallengeProgress';
import { isProgressCalibrationEnabled } from '../data/progressStore';
import {
  createFlashChallengeSessionState,
  getFlashChallengeProfile,
  updateFlashChallengeSession,
  type FlashChallengeOutcome,
  type FlashChallengeSessionState,
} from './flashChallenge';

const DEFAULT_PROGRESS: FlashChallengeProgress = {
  resumeLevel: FLASH_CHALLENGE_MIN_LEVEL,
  highestLevel: FLASH_CHALLENGE_MIN_LEVEL,
};

export function useFlashChallenge(
  gameId: string,
  difficulty: Difficulty,
  correctAnswersToAdvance: number,
  missesToEnd = 3,
  options: { masteryEligible?: boolean } = {}
) {
  const masteryEligible = options.masteryEligible ?? true;
  const [loaded, setLoaded] = useState(false);
  const [savedProgress, setSavedProgress] =
    useState<FlashChallengeProgress>(DEFAULT_PROGRESS);
  const [sessionState, setSessionState] =
    useState<FlashChallengeSessionState>(() =>
      createFlashChallengeSessionState(
        DEFAULT_PROGRESS.resumeLevel
      )
    );
  const progressRef = useRef<FlashChallengeProgress>(DEFAULT_PROGRESS);
  const sessionRef = useRef<FlashChallengeSessionState>(
    createFlashChallengeSessionState(DEFAULT_PROGRESS.resumeLevel)
  );
  const mutationVersionRef = useRef(0);
  const rollbackSavedRef = useRef(false);
  const paceRollbackSavedRef = useRef(false);
  const loadedRef = useRef(false);
  const calibrationReadyRef = useRef(false);
  const sessionActiveRef = useRef(false);

  useEffect(() => {
    let active = true;
    mutationVersionRef.current += 1;
    const loadVersion = mutationVersionRef.current;
    loadedRef.current = false;
    calibrationReadyRef.current = false;
    sessionActiveRef.current = false;
    const fallbackProgress = { ...DEFAULT_PROGRESS };
    progressRef.current = fallbackProgress;
    setSavedProgress(fallbackProgress);
    sessionRef.current = createFlashChallengeSessionState(
      fallbackProgress.resumeLevel
    );
    setSessionState(sessionRef.current);
    setLoaded(false);
    if (!masteryEligible) {
      loadedRef.current = true;
      setLoaded(true);
      return () => {
        active = false;
      };
    }
    loadFlashChallengeProgress(gameId, difficulty)
      .then((progress) => {
        if (
          !active ||
          loadVersion !== mutationVersionRef.current
        ) {
          return;
        }
        calibrationReadyRef.current = true;
        progressRef.current = progress;
        setSavedProgress(progress);
        sessionRef.current = sessionActiveRef.current
          ? {
              ...sessionRef.current,
              level: Math.max(
                sessionRef.current.level,
                progress.resumeLevel
              ),
            }
          : createFlashChallengeSessionState(progress.resumeLevel);
        setSessionState(sessionRef.current);
      })
      .catch(() => {
        // A failed read leaves a playable in-memory fallback, but this mount
        // cannot write mastery and risk replacing a stronger saved checkpoint.
        calibrationReadyRef.current = false;
      })
      .finally(() => {
        if (active) {
          loadedRef.current = true;
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [difficulty, gameId, masteryEligible]);

  const beginSession = useCallback(() => {
    const next = createFlashChallengeSessionState(
      progressRef.current.resumeLevel
    );
    sessionRef.current = next;
    setSessionState(next);
    sessionActiveRef.current = true;
    rollbackSavedRef.current = false;
    paceRollbackSavedRef.current = false;
    return next.level;
  }, []);

  const applyOptimisticProgress = useCallback(
    (
      optimisticProgress: FlashChallengeProgress,
      mutation: Promise<FlashChallengeProgress>
    ) => {
      const mutationVersion = mutationVersionRef.current + 1;
      mutationVersionRef.current = mutationVersion;
      progressRef.current = optimisticProgress;
      setSavedProgress(optimisticProgress);
      void mutation
        .then((progress) => {
          if (mutationVersion !== mutationVersionRef.current) return;
          progressRef.current = progress;
          setSavedProgress(progress);
        })
        .catch(() => undefined);
    },
    []
  );

  const recordOutcome = useCallback(
    (correct: boolean): FlashChallengeOutcome => {
      const outcome = updateFlashChallengeSession(
        sessionRef.current,
        correct,
        correctAnswersToAdvance,
        missesToEnd
      );
      sessionRef.current = outcome.state;
      setSessionState(outcome.state);

      if (
        !masteryEligible ||
        !loadedRef.current ||
        !calibrationReadyRef.current ||
        !isProgressCalibrationEnabled(gameId)
      ) {
        return outcome;
      }

      if (
        outcome.qualified &&
        outcome.state.level > progressRef.current.resumeLevel
      ) {
        const optimisticProgress: FlashChallengeProgress = {
          ...progressRef.current,
          resumeLevel: outcome.state.level,
          highestLevel: Math.max(
            progressRef.current.highestLevel,
            outcome.state.level
          ),
          updatedAtIso: new Date().toISOString(),
        };
        applyOptimisticProgress(
          optimisticProgress,
          qualifyFlashChallengeLevel(
            gameId,
            difficulty,
            outcome.state.level
          )
        );
      } else if (
        outcome.shouldSaveRollback &&
        !rollbackSavedRef.current
      ) {
        rollbackSavedRef.current = true;
        // One difficult session makes the next start gentler without erasing
        // every live step-down or the learner's highest demonstrated level.
        const saferResumeLevel = Math.max(
          FLASH_CHALLENGE_MIN_LEVEL,
          progressRef.current.resumeLevel - 1
        );
        const optimisticProgress: FlashChallengeProgress = {
          ...progressRef.current,
          resumeLevel: saferResumeLevel,
          updatedAtIso: new Date().toISOString(),
        };
        applyOptimisticProgress(
          optimisticProgress,
          saveFlashChallengeResumeLevel(
            gameId,
            difficulty,
            saferResumeLevel
          )
        );
      }
      return outcome;
    },
    [
      correctAnswersToAdvance,
      difficulty,
      gameId,
      masteryEligible,
      missesToEnd,
      applyOptimisticProgress,
    ]
  );

  const recordQualifiedWpm = useCallback(
    (wpm: number) => {
      if (
        !masteryEligible ||
        !loadedRef.current ||
        !calibrationReadyRef.current ||
        !isProgressCalibrationEnabled(gameId) ||
        wpm <= (progressRef.current.resumeWpm ?? 0)
      ) {
        return;
      }
      const roundedWpm = Math.max(1, Math.round(wpm));
      const optimisticProgress: FlashChallengeProgress = {
        ...progressRef.current,
        resumeWpm: roundedWpm,
        highestWpm: Math.max(
          progressRef.current.highestWpm ?? 0,
          roundedWpm
        ),
        updatedAtIso: new Date().toISOString(),
      };
      applyOptimisticProgress(
        optimisticProgress,
        qualifyFlashChallengeWpm(gameId, difficulty, roundedWpm)
      );
    },
    [
      applyOptimisticProgress,
      difficulty,
      gameId,
      masteryEligible,
    ]
  );

  const recordRollbackWpm = useCallback(
    (wpm: number) => {
      if (
        !masteryEligible ||
        !loadedRef.current ||
        !calibrationReadyRef.current ||
        !isProgressCalibrationEnabled(gameId) ||
        paceRollbackSavedRef.current
      ) {
        return;
      }
      paceRollbackSavedRef.current = true;
      const roundedWpm = Math.max(1, Math.round(wpm));
      const highestWpm = Math.max(
        progressRef.current.highestWpm ?? 0,
        progressRef.current.resumeWpm ?? 0
      );
      const optimisticProgress: FlashChallengeProgress = {
        ...progressRef.current,
        resumeWpm: roundedWpm,
        ...(highestWpm === 0 ? {} : { highestWpm }),
        updatedAtIso: new Date().toISOString(),
      };
      applyOptimisticProgress(
        optimisticProgress,
        saveFlashChallengeResumeWpm(gameId, difficulty, roundedWpm)
      );
    },
    [
      applyOptimisticProgress,
      difficulty,
      gameId,
      masteryEligible,
    ]
  );

  return {
    beginSession,
    getCurrentLevel: () => sessionRef.current.level,
    getHighestLevel: () => progressRef.current.highestLevel,
    getHighestWpm: () => progressRef.current.highestWpm,
    getResumeLevel: () => progressRef.current.resumeLevel,
    getResumeWpm: () => progressRef.current.resumeWpm,
    highestLevel: savedProgress.highestLevel,
    highestWpm: savedProgress.highestWpm,
    level: sessionState.level,
    loaded,
    profile: getFlashChallengeProfile(sessionState.level),
    recordQualifiedWpm,
    recordOutcome,
    recordRollbackWpm,
    resumeLevel: savedProgress.resumeLevel,
    resumeWpm: savedProgress.resumeWpm,
  };
}
