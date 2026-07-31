import type { Difficulty } from '../gameHooks';
import {
  getFlashWordPool,
  uniqueStrings,
} from '../../data/flashPracticeContent';
import {
  boundedRandom,
  shuffleItems,
} from '../../data/randomization';

export type VisualSpanPositionId =
  | 'upper-left'
  | 'upper-center'
  | 'upper-right'
  | 'center-left'
  | 'center-right'
  | 'lower-left'
  | 'lower-center'
  | 'lower-right';

export type VisualSpanSpread = 'compact' | 'standard' | 'wide';

export type VisualSpanConfig = {
  spanSize: number;
  minimumSpan: number;
  displayMs: number;
  optionCount: number;
  spread: VisualSpanSpread;
  totalRounds: number;
};

export type VisualSpanItem = {
  positionId: VisualSpanPositionId;
  positionLabel: string;
  word: string;
};

export type VisualSpanTrial = {
  items: VisualSpanItem[];
  targetPositionId: VisualSpanPositionId;
  targetPositionLabel: string;
  correctWord: string;
  options: string[];
};

export const VISUAL_SPAN_FIXATION_CUE_MS = 650;

export const VISUAL_SPAN_POSITION_LABELS: Record<
  VisualSpanPositionId,
  string
> = {
  'upper-left': 'upper left',
  'upper-center': 'top',
  'upper-right': 'upper right',
  'center-left': 'left',
  'center-right': 'right',
  'lower-left': 'lower left',
  'lower-center': 'bottom',
  'lower-right': 'lower right',
};

const POSITION_IDS_BY_SPAN: Record<number, VisualSpanPositionId[]> = {
  3: ['upper-center', 'lower-right', 'lower-left'],
  4: ['upper-left', 'upper-right', 'lower-right', 'lower-left'],
  5: [
    'upper-center',
    'upper-right',
    'lower-right',
    'lower-left',
    'upper-left',
  ],
  6: [
    'upper-center',
    'upper-right',
    'lower-right',
    'lower-center',
    'lower-left',
    'upper-left',
  ],
  7: [
    'upper-center',
    'upper-right',
    'center-right',
    'lower-right',
    'lower-left',
    'center-left',
    'upper-left',
  ],
  8: [
    'upper-center',
    'upper-right',
    'center-right',
    'lower-right',
    'lower-center',
    'lower-left',
    'center-left',
    'upper-left',
  ],
};

const REVIEWED_VISUAL_SPAN_SEEDS: Record<Difficulty, readonly string[]> = {
  easy: [
    'bank',
    'bird',
    'boat',
    'book',
    'calm',
    'desk',
    'farm',
    'fish',
    'glow',
    'hand',
    'lamp',
    'leaf',
    'moon',
    'path',
    'pond',
    'rain',
    'road',
    'seed',
    'snow',
    'star',
    'tree',
    'wave',
    'wind',
    'wood',
  ],
  medium: [
    'amber',
    'beach',
    'bloom',
    'brick',
    'cloud',
    'creek',
    'field',
    'flame',
    'glass',
    'grape',
    'green',
    'light',
    'maple',
    'metal',
    'night',
    'ocean',
    'peach',
    'pearl',
    'plant',
    'river',
    'shelf',
    'shore',
    'stone',
    'storm',
    'trail',
    'water',
    'wheat',
    'world',
  ],
  hard: [
    'branch',
    'breath',
    'breeze',
    'bridge',
    'bright',
    'bronze',
    'change',
    'charge',
    'choice',
    'course',
    'signal',
    'silent',
    'silver',
    'single',
    'source',
    'spring',
    'square',
    'stable',
    'static',
    'status',
    'strain',
    'stream',
    'street',
    'strict',
    'travel',
    'tunnel',
    'vessel',
    'visual',
    'window',
    'winter',
  ],
};

/**
 * Equal-length words prevent button width from revealing the answer. The
 * shared vocabulary bank supplies variety while these reviewed seeds preserve
 * familiar, highly imageable examples at each length.
 */
export function getVisualSpanWordPool(difficulty: Difficulty): string[] {
  const wordLength = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const sourceDifficulties: Difficulty[] =
    difficulty === 'easy'
      ? ['easy']
      : difficulty === 'medium'
        ? ['easy', 'medium']
        : ['easy', 'medium'];

  return uniqueStrings([
    ...REVIEWED_VISUAL_SPAN_SEEDS[difficulty],
    ...sourceDifficulties.flatMap(getFlashWordPool),
  ])
    .map((word) => word.toLocaleLowerCase('en'))
    .filter((word) => /^[a-z]+$/u.test(word) && word.length === wordLength);
}

const VISUAL_SPAN_CONFIGS: Record<Difficulty, VisualSpanConfig> = {
  easy: {
    spanSize: 3,
    minimumSpan: 3,
    displayMs: 1_600,
    optionCount: 3,
    spread: 'compact',
    totalRounds: 8,
  },
  medium: {
    spanSize: 5,
    minimumSpan: 3,
    displayMs: 1_200,
    optionCount: 4,
    spread: 'standard',
    totalRounds: 8,
  },
  hard: {
    spanSize: 7,
    minimumSpan: 3,
    displayMs: 850,
    optionCount: 5,
    spread: 'wide',
    totalRounds: 8,
  },
};

export function getVisualSpanConfig(
  difficulty: Difficulty
): VisualSpanConfig {
  return VISUAL_SPAN_CONFIGS[difficulty];
}

/**
 * Visual-span sessions begin with short, quickly recognizable words, then
 * introduce longer vocabulary before the shared challenge ladder adds marker
 * masking. The selected game difficulty still controls spatial spread,
 * starting span, option count, and base exposure.
 */
export function getVisualSpanContentDifficulty(
  challengeLevel: number
): Difficulty {
  const safeLevel = Math.max(1, Math.round(challengeLevel));
  if (safeLevel <= 3) return 'easy';
  if (safeLevel <= 8) return 'medium';
  return 'hard';
}

export function createVisualSpanTrial(
  difficulty: Difficulty,
  requestedSpan = getVisualSpanConfig(difficulty).spanSize,
  random: () => number = Math.random,
  maximumSpan = getVisualSpanConfig(difficulty).spanSize,
  contentDifficulty: Difficulty = difficulty
): VisualSpanTrial {
  const config = getVisualSpanConfig(difficulty);
  const spanSize = Math.max(
    config.minimumSpan,
    Math.min(Math.max(config.spanSize, maximumSpan), Math.round(requestedSpan))
  );
  const positionIds =
    POSITION_IDS_BY_SPAN[spanSize] ?? POSITION_IDS_BY_SPAN[config.minimumSpan]!;
  const wordPool = getVisualSpanWordPool(contentDifficulty);
  const words = shuffleItems(wordPool, random).slice(0, positionIds.length);
  const items = positionIds.map((positionId, index) => ({
    positionId,
    positionLabel: VISUAL_SPAN_POSITION_LABELS[positionId],
    word: words[index]!,
  }));
  const targetIndex = Math.floor(boundedRandom(random) * items.length);
  const target = items[targetIndex]!;

  const shownDistractors = shuffleItems(
    items
      .filter((item) => item.positionId !== target.positionId)
      .map((item) => item.word),
    random
  );
  const unseenDistractors = shuffleItems(
    wordPool.filter((word) => !words.includes(word)),
    random
  );
  const options = shuffleItems(
    [
      target.word,
      ...shownDistractors,
      ...unseenDistractors,
    ].slice(0, config.optionCount),
    random
  );

  return {
    items,
    targetPositionId: target.positionId,
    targetPositionLabel: target.positionLabel,
    correctWord: target.word,
    options,
  };
}
