import type { Difficulty } from '../gameHooks';

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
};

const WORD_POOLS: Record<Difficulty, readonly string[]> = {
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

function boundedRandom(random: () => number): number {
  return Math.max(0, Math.min(0.999_999, random()));
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(boundedRandom(random) * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}

export function createVisualSpanTrial(
  difficulty: Difficulty,
  requestedSpan = getVisualSpanConfig(difficulty).spanSize,
  random: () => number = Math.random
): VisualSpanTrial {
  const config = getVisualSpanConfig(difficulty);
  const spanSize = Math.max(
    config.minimumSpan,
    Math.min(config.spanSize, Math.round(requestedSpan))
  );
  const positionIds =
    POSITION_IDS_BY_SPAN[spanSize] ?? POSITION_IDS_BY_SPAN[config.minimumSpan]!;
  const wordPool = WORD_POOLS[difficulty];
  const words = shuffled(wordPool, random).slice(0, positionIds.length);
  const items = positionIds.map((positionId, index) => ({
    positionId,
    positionLabel: VISUAL_SPAN_POSITION_LABELS[positionId],
    word: words[index]!,
  }));
  const targetIndex = Math.floor(boundedRandom(random) * items.length);
  const target = items[targetIndex]!;

  const shownDistractors = shuffled(
    items
      .filter((item) => item.positionId !== target.positionId)
      .map((item) => item.word),
    random
  );
  const unseenDistractors = shuffled(
    wordPool.filter((word) => !words.includes(word)),
    random
  );
  const options = shuffled(
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
