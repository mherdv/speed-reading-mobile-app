import React, { useMemo } from 'react';

import {
  createWordsRecallPool,
  WORDS_RECALL_CONFIG,
} from '../../data/recallContent';
import type { RandomSource } from '../../data/randomization';
import { TypedRecallExercise } from '../TypedRecallExercise';
import type { Difficulty } from '../gameHooks';
import type { GameReportPayload } from '../registry';

type Props = {
  prompts?: readonly string[];
  displayMs?: number;
  totalRounds?: number;
  difficulty?: Difficulty;
  autoStart?: boolean;
  random?: RandomSource;
  onReportResult?: (payload: GameReportPayload) => void;
};

export default function WordsRecall({
  prompts,
  displayMs,
  totalRounds,
  difficulty = 'medium',
  autoStart = false,
  random = Math.random,
  onReportResult,
}: Props) {
  const config = WORDS_RECALL_CONFIG[difficulty];
  const pool = useMemo(
    () => prompts ?? createWordsRecallPool(difficulty),
    [difficulty, prompts]
  );
  return (
    <TypedRecallExercise
      gameId="WordsRecall"
      title="Words Recall"
      subtitle="Remember exactly two briefly displayed words"
      inputPlaceholder="Type both words in order"
      prompts={pool}
      displayMs={displayMs ?? config.displayMs}
      fixedDisplayMs={displayMs != null}
      masteryEligible={prompts == null && displayMs == null}
      totalRounds={totalRounds ?? config.roundCount}
      difficulty={difficulty}
      autoStart={autoStart}
      twoWordLayout
      random={random}
      onReportResult={onReportResult}
    />
  );
}
