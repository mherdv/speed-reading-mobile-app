import React, { useMemo } from 'react';

import {
  createSentenceRecallPool,
  SENTENCE_RECALL_CONFIG,
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

export default function SentenceRecall({
  prompts,
  displayMs,
  totalRounds,
  difficulty = 'medium',
  autoStart = false,
  random = Math.random,
  onReportResult,
}: Props) {
  const config = SENTENCE_RECALL_CONFIG[difficulty];
  const pool = useMemo(
    () => prompts ?? createSentenceRecallPool(difficulty),
    [difficulty, prompts]
  );
  return (
    <TypedRecallExercise
      gameId="SentenceRecall"
      title="Sentence Recall"
      subtitle="Read a natural sentence, then reconstruct it from memory"
      inputPlaceholder="Type the sentence"
      prompts={pool}
      displayMs={displayMs ?? config.displayMs}
      totalRounds={totalRounds ?? config.roundCount}
      difficulty={difficulty}
      autoStart={autoStart}
      random={random}
      onReportResult={onReportResult}
    />
  );
}
