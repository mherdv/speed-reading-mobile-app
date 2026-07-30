import type { Difficulty } from './difficultyPreferences';
import {
  ADDITIONAL_MIXUP_WORDS,
  ADDITIONAL_OPPOSITE_ITEMS,
} from './vocabularyPracticeExpansion';

export type PartOfSpeech = 'adjective' | 'adverb' | 'noun' | 'verb';

export type MixupWord = {
  word: string;
  definition: string;
  partOfSpeech: PartOfSpeech;
};

export type OppositeItem = {
  word: string;
  correct: string;
  partOfSpeech: PartOfSpeech;
  distractors: readonly [string, string, string];
};

/**
 * Original English word-and-definition sets reviewed for the spelling drill.
 * These compact semantic hints are authored for this app, not copied from a
 * competitor or commercial vocabulary course.
 */
const BASE_MIXUP_WORDS: Record<Difficulty, readonly MixupWord[]> = {
  easy: [
    { word: 'apple', definition: 'a round fruit that grows on a tree', partOfSpeech: 'noun' },
    { word: 'bread', definition: 'food baked from flour and water', partOfSpeech: 'noun' },
    { word: 'chair', definition: 'a seat for one person', partOfSpeech: 'noun' },
    { word: 'dream', definition: 'images or ideas experienced during sleep', partOfSpeech: 'noun' },
    { word: 'earth', definition: 'the planet on which we live', partOfSpeech: 'noun' },
    { word: 'flame', definition: 'the visible burning part of a fire', partOfSpeech: 'noun' },
    { word: 'glass', definition: 'a hard transparent material', partOfSpeech: 'noun' },
    { word: 'heart', definition: 'the organ that pumps blood', partOfSpeech: 'noun' },
    { word: 'island', definition: 'land completely surrounded by water', partOfSpeech: 'noun' },
    { word: 'ocean', definition: 'a very large body of salt water', partOfSpeech: 'noun' },
    { word: 'river', definition: 'a natural stream of flowing water', partOfSpeech: 'noun' },
    { word: 'storm', definition: 'severe weather with wind or rain', partOfSpeech: 'noun' },
    { word: 'train', definition: 'linked vehicles that travel on rails', partOfSpeech: 'noun' },
    { word: 'voice', definition: 'sound produced when a person speaks', partOfSpeech: 'noun' },
    { word: 'youth', definition: 'the period of being young', partOfSpeech: 'noun' },
    { word: 'beach', definition: 'a sandy or stony shore beside water', partOfSpeech: 'noun' },
    { word: 'cabin', definition: 'a small simple house or room', partOfSpeech: 'noun' },
    { word: 'field', definition: 'an open area of land', partOfSpeech: 'noun' },
    { word: 'light', definition: 'energy that makes things visible', partOfSpeech: 'noun' },
    { word: 'plant', definition: 'a living thing that usually grows in soil', partOfSpeech: 'noun' },
    { word: 'bridge', definition: 'a structure that carries a path over a gap', partOfSpeech: 'noun' },
    { word: 'candle', definition: 'wax with a wick that burns to give light', partOfSpeech: 'noun' },
    { word: 'cloud', definition: 'a visible mass of tiny drops in the sky', partOfSpeech: 'noun' },
    { word: 'craft', definition: 'skill in making something by hand', partOfSpeech: 'noun' },
    { word: 'garden', definition: 'ground used for growing plants', partOfSpeech: 'noun' },
    { word: 'lemon', definition: 'a yellow citrus fruit with a sour taste', partOfSpeech: 'noun' },
    { word: 'market', definition: 'a place where goods are bought and sold', partOfSpeech: 'noun' },
    { word: 'music', definition: 'organized sound with rhythm or melody', partOfSpeech: 'noun' },
    { word: 'pencil', definition: 'a tool used for writing or drawing', partOfSpeech: 'noun' },
    { word: 'rabbit', definition: 'a small animal with long ears', partOfSpeech: 'noun' },
    { word: 'stone', definition: 'a small piece of hard natural rock', partOfSpeech: 'noun' },
    { word: 'window', definition: 'an opening with glass that admits light', partOfSpeech: 'noun' },
  ],
  medium: [
    { word: 'achieve', definition: 'to succeed in reaching a goal', partOfSpeech: 'verb' },
    { word: 'benefit', definition: 'an advantage or helpful result', partOfSpeech: 'noun' },
    { word: 'concept', definition: 'a general idea or principle', partOfSpeech: 'noun' },
    { word: 'develop', definition: 'to grow or become more advanced', partOfSpeech: 'verb' },
    { word: 'evident', definition: 'clear enough to be noticed', partOfSpeech: 'adjective' },
    { word: 'feature', definition: 'an important characteristic', partOfSpeech: 'noun' },
    { word: 'insight', definition: 'a clear understanding of something', partOfSpeech: 'noun' },
    { word: 'justify', definition: 'to show that something is reasonable', partOfSpeech: 'verb' },
    { word: 'logical', definition: 'based on clear and valid reasoning', partOfSpeech: 'adjective' },
    { word: 'measure', definition: 'to determine size, amount, or degree', partOfSpeech: 'verb' },
    { word: 'neutral', definition: 'not supporting either side', partOfSpeech: 'adjective' },
    { word: 'pattern', definition: 'a repeated or regular arrangement', partOfSpeech: 'noun' },
    { word: 'require', definition: 'to need something for a purpose', partOfSpeech: 'verb' },
    { word: 'variety', definition: 'a range of different things', partOfSpeech: 'noun' },
    { word: 'witness', definition: 'to see an event happen', partOfSpeech: 'verb' },
    { word: 'clarify', definition: 'to make an idea easier to understand', partOfSpeech: 'verb' },
    { word: 'contrast', definition: 'to examine important differences', partOfSpeech: 'verb' },
    { word: 'estimate', definition: 'an approximate calculation or judgment', partOfSpeech: 'noun' },
    { word: 'reliable', definition: 'consistently accurate or dependable', partOfSpeech: 'adjective' },
    { word: 'sequence', definition: 'an ordered set of related things', partOfSpeech: 'noun' },
    { word: 'analyze', definition: 'to examine parts and their relationships', partOfSpeech: 'verb' },
    { word: 'archive', definition: 'a collection of records kept for reference', partOfSpeech: 'noun' },
    { word: 'caution', definition: 'care taken to avoid danger or error', partOfSpeech: 'noun' },
    { word: 'context', definition: 'surrounding information that clarifies meaning', partOfSpeech: 'noun' },
    { word: 'curious', definition: 'eager to learn or know more', partOfSpeech: 'adjective' },
    { word: 'dynamic', definition: 'changing actively rather than remaining fixed', partOfSpeech: 'adjective' },
    { word: 'habitat', definition: 'the natural home of a plant or animal', partOfSpeech: 'noun' },
    { word: 'maintain', definition: 'to keep something in effective condition', partOfSpeech: 'verb' },
    { word: 'preserve', definition: 'to protect something from loss or damage', partOfSpeech: 'verb' },
    { word: 'reflect', definition: 'to think carefully about an idea or experience', partOfSpeech: 'verb' },
    { word: 'strategy', definition: 'a planned approach for reaching a goal', partOfSpeech: 'noun' },
    { word: 'translate', definition: 'to express meaning in another language', partOfSpeech: 'verb' },
  ],
  hard: [
    { word: 'acceleration', definition: 'an increase in speed or rate', partOfSpeech: 'noun' },
    { word: 'accountability', definition: 'responsibility for actions and outcomes', partOfSpeech: 'noun' },
    { word: 'acquisition', definition: 'the act of obtaining something', partOfSpeech: 'noun' },
    { word: 'administration', definition: 'the management of an organization', partOfSpeech: 'noun' },
    { word: 'appreciation', definition: 'recognition of value or importance', partOfSpeech: 'noun' },
    { word: 'approximately', definition: 'nearly but not exactly', partOfSpeech: 'adverb' },
    { word: 'biodiversity', definition: 'the variety of living things in an area', partOfSpeech: 'noun' },
    { word: 'collaboration', definition: 'the act of working together', partOfSpeech: 'noun' },
    { word: 'comprehensive', definition: 'complete and covering all important parts', partOfSpeech: 'adjective' },
    { word: 'concentration', definition: 'focused mental attention', partOfSpeech: 'noun' },
    { word: 'configuration', definition: 'an arrangement of connected parts', partOfSpeech: 'noun' },
    { word: 'contemporary', definition: 'belonging to the present time', partOfSpeech: 'adjective' },
    { word: 'credibility', definition: 'the quality of being believable', partOfSpeech: 'noun' },
    { word: 'determination', definition: 'firmness in pursuing a goal', partOfSpeech: 'noun' },
    { word: 'sustainability', definition: 'the ability to continue without exhausting resources', partOfSpeech: 'noun' },
    { word: 'interpretation', definition: 'an explanation of meaning or significance', partOfSpeech: 'noun' },
    { word: 'methodology', definition: 'a system of methods used in a field', partOfSpeech: 'noun' },
    { word: 'prerequisite', definition: 'something required before another step', partOfSpeech: 'noun' },
    { word: 'reconciliation', definition: 'the process of restoring agreement', partOfSpeech: 'noun' },
    { word: 'unprecedented', definition: 'never known or done before', partOfSpeech: 'adjective' },
    { word: 'analytical', definition: 'using careful examination and logical reasoning', partOfSpeech: 'adjective' },
    { word: 'architecture', definition: 'the design and structure of a building or system', partOfSpeech: 'noun' },
    { word: 'comprehension', definition: 'the ability to understand meaning', partOfSpeech: 'noun' },
    { word: 'consistency', definition: 'the quality of remaining logically or reliably similar', partOfSpeech: 'noun' },
    { word: 'differentiation', definition: 'the act of recognizing or creating differences', partOfSpeech: 'noun' },
    { word: 'interdisciplinary', definition: 'combining knowledge from several fields', partOfSpeech: 'adjective' },
    { word: 'metacognition', definition: 'awareness and regulation of one’s own thinking', partOfSpeech: 'noun' },
    { word: 'quantitative', definition: 'concerned with numerical amounts or measurement', partOfSpeech: 'adjective' },
    { word: 'reliability', definition: 'the quality of producing dependable results', partOfSpeech: 'noun' },
    { word: 'transparency', definition: 'openness that makes a process easy to inspect', partOfSpeech: 'noun' },
    { word: 'uncertainty', definition: 'the state of not being fully known or predictable', partOfSpeech: 'noun' },
    { word: 'verification', definition: 'the process of checking accuracy or truth', partOfSpeech: 'noun' },
  ],
};

const BASE_OPPOSITE_ITEMS: Record<Difficulty, readonly OppositeItem[]> = {
  easy: [
    { word: 'hot', correct: 'cold', partOfSpeech: 'adjective', distractors: ['open', 'early', 'wide'] },
    { word: 'open', correct: 'closed', partOfSpeech: 'adjective', distractors: ['empty', 'quiet', 'smooth'] },
    { word: 'early', correct: 'late', partOfSpeech: 'adjective', distractors: ['quick', 'young', 'bright'] },
    { word: 'above', correct: 'below', partOfSpeech: 'adverb', distractors: ['inside', 'near', 'wide'] },
    { word: 'happy', correct: 'sad', partOfSpeech: 'adjective', distractors: ['calm', 'kind', 'tired'] },
    { word: 'light', correct: 'dark', partOfSpeech: 'adjective', distractors: ['pale', 'clear', 'soft'] },
    { word: 'hard', correct: 'soft', partOfSpeech: 'adjective', distractors: ['rough', 'solid', 'heavy'] },
    { word: 'high', correct: 'low', partOfSpeech: 'adjective', distractors: ['tall', 'deep', 'wide'] },
    { word: 'empty', correct: 'full', partOfSpeech: 'adjective', distractors: ['open', 'plain', 'quiet'] },
    { word: 'strong', correct: 'weak', partOfSpeech: 'adjective', distractors: ['brave', 'large', 'solid'] },
    { word: 'clean', correct: 'dirty', partOfSpeech: 'adjective', distractors: ['plain', 'fresh', 'smooth'] },
    { word: 'wide', correct: 'narrow', partOfSpeech: 'adjective', distractors: ['deep', 'high', 'long'] },
    { word: 'fast', correct: 'slow', partOfSpeech: 'adjective', distractors: ['early', 'short', 'near'] },
    { word: 'inside', correct: 'outside', partOfSpeech: 'adverb', distractors: ['above', 'around', 'under'] },
    { word: 'old', correct: 'new', partOfSpeech: 'adjective', distractors: ['large', 'used', 'plain'] },
    { word: 'push', correct: 'pull', partOfSpeech: 'verb', distractors: ['hold', 'carry', 'drop'] },
    { word: 'start', correct: 'finish', partOfSpeech: 'verb', distractors: ['pause', 'enter', 'follow'] },
    { word: 'noisy', correct: 'quiet', partOfSpeech: 'adjective', distractors: ['bright', 'empty', 'gentle'] },
    { word: 'big', correct: 'small', partOfSpeech: 'adjective', distractors: ['wide', 'heavy', 'round'] },
    { word: 'day', correct: 'night', partOfSpeech: 'noun', distractors: ['week', 'dawn', 'noon'] },
    { word: 'near', correct: 'far', partOfSpeech: 'adjective', distractors: ['wide', 'deep', 'early'] },
    { word: 'wet', correct: 'dry', partOfSpeech: 'adjective', distractors: ['cold', 'soft', 'clean'] },
    { word: 'young', correct: 'old', partOfSpeech: 'adjective', distractors: ['small', 'quick', 'new'] },
    { word: 'bright', correct: 'dim', partOfSpeech: 'adjective', distractors: ['clear', 'warm', 'pale'] },
    { word: 'enter', correct: 'leave', partOfSpeech: 'verb', distractors: ['wait', 'open', 'visit'] },
    { word: 'appear', correct: 'disappear', partOfSpeech: 'verb', distractors: ['arrive', 'remain', 'return'] },
    { word: 'give', correct: 'take', partOfSpeech: 'verb', distractors: ['hold', 'send', 'keep'] },
    { word: 'rise', correct: 'fall', partOfSpeech: 'verb', distractors: ['stand', 'climb', 'lift'] },
    { word: 'front', correct: 'back', partOfSpeech: 'noun', distractors: ['side', 'top', 'edge'] },
    { word: 'kind', correct: 'cruel', partOfSpeech: 'adjective', distractors: ['calm', 'helpful', 'quiet'] },
  ],
  medium: [
    { word: 'scarce', correct: 'abundant', partOfSpeech: 'adjective', distractors: ['limited', 'rare', 'uneven'] },
    { word: 'rigid', correct: 'flexible', partOfSpeech: 'adjective', distractors: ['firm', 'fixed', 'stable'] },
    { word: 'ancient', correct: 'modern', partOfSpeech: 'adjective', distractors: ['historic', 'aged', 'traditional'] },
    { word: 'expand', correct: 'contract', partOfSpeech: 'verb', distractors: ['extend', 'enlarge', 'increase'] },
    { word: 'accept', correct: 'reject', partOfSpeech: 'verb', distractors: ['admit', 'allow', 'receive'] },
    { word: 'advance', correct: 'retreat', partOfSpeech: 'verb', distractors: ['approach', 'continue', 'progress'] },
    { word: 'arrive', correct: 'depart', partOfSpeech: 'verb', distractors: ['enter', 'appear', 'return'] },
    { word: 'include', correct: 'exclude', partOfSpeech: 'verb', distractors: ['contain', 'mention', 'combine'] },
    { word: 'genuine', correct: 'fake', partOfSpeech: 'adjective', distractors: ['valid', 'honest', 'clear'] },
    { word: 'humble', correct: 'arrogant', partOfSpeech: 'adjective', distractors: ['quiet', 'polite', 'modest'] },
    { word: 'increase', correct: 'decrease', partOfSpeech: 'verb', distractors: ['expand', 'raise', 'improve'] },
    { word: 'permanent', correct: 'temporary', partOfSpeech: 'adjective', distractors: ['stable', 'lasting', 'regular'] },
    { word: 'complex', correct: 'simple', partOfSpeech: 'adjective', distractors: ['detailed', 'difficult', 'layered'] },
    { word: 'frequent', correct: 'rare', partOfSpeech: 'adjective', distractors: ['regular', 'common', 'repeated'] },
    { word: 'maximum', correct: 'minimum', partOfSpeech: 'noun', distractors: ['average', 'total', 'limit'] },
    { word: 'permit', correct: 'forbid', partOfSpeech: 'verb', distractors: ['request', 'delay', 'consider'] },
    { word: 'visible', correct: 'invisible', partOfSpeech: 'adjective', distractors: ['bright', 'distant', 'unclear'] },
    { word: 'combine', correct: 'separate', partOfSpeech: 'verb', distractors: ['compare', 'arrange', 'connect'] },
    { word: 'generous', correct: 'selfish', partOfSpeech: 'adjective', distractors: ['helpful', 'careful', 'wealthy'] },
    { word: 'legal', correct: 'illegal', partOfSpeech: 'adjective', distractors: ['formal', 'public', 'valid'] },
    { word: 'major', correct: 'minor', partOfSpeech: 'adjective', distractors: ['central', 'common', 'serious'] },
    { word: 'private', correct: 'public', partOfSpeech: 'adjective', distractors: ['personal', 'hidden', 'local'] },
    { word: 'rural', correct: 'urban', partOfSpeech: 'adjective', distractors: ['remote', 'natural', 'regional'] },
    { word: 'victory', correct: 'defeat', partOfSpeech: 'noun', distractors: ['effort', 'contest', 'result'] },
    { word: 'borrow', correct: 'lend', partOfSpeech: 'verb', distractors: ['return', 'share', 'request'] },
    { word: 'create', correct: 'destroy', partOfSpeech: 'verb', distractors: ['design', 'repair', 'change'] },
    { word: 'remember', correct: 'forget', partOfSpeech: 'verb', distractors: ['notice', 'record', 'repeat'] },
    { word: 'protect', correct: 'endanger', partOfSpeech: 'verb', distractors: ['defend', 'support', 'shelter'] },
    { word: 'smooth', correct: 'rough', partOfSpeech: 'adjective', distractors: ['flat', 'soft', 'plain'] },
    { word: 'attach', correct: 'detach', partOfSpeech: 'verb', distractors: ['connect', 'fasten', 'combine'] },
  ],
  hard: [
    { word: 'optimistic', correct: 'pessimistic', partOfSpeech: 'adjective', distractors: ['realistic', 'idealistic', 'opportunistic'] },
    { word: 'transparent', correct: 'opaque', partOfSpeech: 'adjective', distractors: ['translucent', 'reflective', 'colorless'] },
    { word: 'voluntary', correct: 'compulsory', partOfSpeech: 'adjective', distractors: ['optional', 'willing', 'spontaneous'] },
    { word: 'mandatory', correct: 'optional', partOfSpeech: 'adjective', distractors: ['compulsory', 'required', 'formal'] },
    { word: 'explicit', correct: 'implicit', partOfSpeech: 'adjective', distractors: ['precise', 'literal', 'detailed'] },
    { word: 'relevant', correct: 'irrelevant', partOfSpeech: 'adjective', distractors: ['important', 'related', 'specific'] },
    { word: 'rational', correct: 'irrational', partOfSpeech: 'adjective', distractors: ['logical', 'deliberate', 'practical'] },
    { word: 'conceal', correct: 'reveal', partOfSpeech: 'verb', distractors: ['cover', 'protect', 'remove'] },
    { word: 'scatter', correct: 'gather', partOfSpeech: 'verb', distractors: ['spread', 'separate', 'divide'] },
    { word: 'strength', correct: 'weakness', partOfSpeech: 'noun', distractors: ['power', 'stability', 'capacity'] },
    { word: 'presence', correct: 'absence', partOfSpeech: 'noun', distractors: ['arrival', 'existence', 'attention'] },
    { word: 'triumph', correct: 'defeat', partOfSpeech: 'noun', distractors: ['victory', 'success', 'progress'] },
    { word: 'coherent', correct: 'incoherent', partOfSpeech: 'adjective', distractors: ['consistent', 'concise', 'connected'] },
    { word: 'converge', correct: 'diverge', partOfSpeech: 'verb', distractors: ['combine', 'approach', 'intersect'] },
    { word: 'diminish', correct: 'intensify', partOfSpeech: 'verb', distractors: ['reduce', 'weaken', 'lessen'] },
    { word: 'ambiguous', correct: 'unambiguous', partOfSpeech: 'adjective', distractors: ['uncertain', 'indirect', 'complex'] },
    { word: 'superficial', correct: 'profound', partOfSpeech: 'adjective', distractors: ['visible', 'brief', 'external'] },
    { word: 'validate', correct: 'invalidate', partOfSpeech: 'verb', distractors: ['confirm', 'inspect', 'support'] },
    { word: 'artificial', correct: 'natural', partOfSpeech: 'adjective', distractors: ['synthetic', 'designed', 'modified'] },
    { word: 'benevolent', correct: 'malevolent', partOfSpeech: 'adjective', distractors: ['generous', 'tolerant', 'charitable'] },
    { word: 'constructive', correct: 'destructive', partOfSpeech: 'adjective', distractors: ['practical', 'creative', 'productive'] },
    { word: 'deliberate', correct: 'accidental', partOfSpeech: 'adjective', distractors: ['careful', 'planned', 'intentional'] },
    { word: 'inferior', correct: 'superior', partOfSpeech: 'adjective', distractors: ['secondary', 'unequal', 'ordinary'] },
    { word: 'inclusive', correct: 'exclusive', partOfSpeech: 'adjective', distractors: ['complete', 'diverse', 'collective'] },
    { word: 'maximize', correct: 'minimize', partOfSpeech: 'verb', distractors: ['increase', 'optimize', 'multiply'] },
    { word: 'predecessor', correct: 'successor', partOfSpeech: 'noun', distractors: ['ancestor', 'competitor', 'partner'] },
    { word: 'transient', correct: 'enduring', partOfSpeech: 'adjective', distractors: ['mobile', 'changing', 'brief'] },
    { word: 'constant', correct: 'variable', partOfSpeech: 'adjective', distractors: ['regular', 'consistent', 'standard'] },
    { word: 'concrete', correct: 'abstract', partOfSpeech: 'adjective', distractors: ['physical', 'specific', 'visible'] },
    { word: 'accelerate', correct: 'decelerate', partOfSpeech: 'verb', distractors: ['advance', 'intensify', 'continue'] },
    { word: 'conspicuous', correct: 'inconspicuous', partOfSpeech: 'adjective', distractors: ['prominent', 'colorful', 'distinctive'] },
  ],
};

export const MIXUP_WORDS: Record<Difficulty, readonly MixupWord[]> = {
  easy: [...BASE_MIXUP_WORDS.easy, ...ADDITIONAL_MIXUP_WORDS.easy],
  medium: [...BASE_MIXUP_WORDS.medium, ...ADDITIONAL_MIXUP_WORDS.medium],
  hard: [...BASE_MIXUP_WORDS.hard, ...ADDITIONAL_MIXUP_WORDS.hard],
};

export const OPPOSITE_ITEMS: Record<Difficulty, readonly OppositeItem[]> = {
  easy: [...BASE_OPPOSITE_ITEMS.easy, ...ADDITIONAL_OPPOSITE_ITEMS.easy],
  medium: [...BASE_OPPOSITE_ITEMS.medium, ...ADDITIONAL_OPPOSITE_ITEMS.medium],
  hard: [...BASE_OPPOSITE_ITEMS.hard, ...ADDITIONAL_OPPOSITE_ITEMS.hard],
};

export function validateVocabularyPracticeContent(): string[] {
  const errors: string[] = [];
  const unorderedPairs = new Set<string>();
  const expectedOppositeCounts: Record<Difficulty, number> = {
    easy: 46,
    medium: 46,
    hard: 47,
  };
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const mixups = MIXUP_WORDS[difficulty];
    if (mixups.length !== 48) {
      errors.push(`${difficulty}: Letter Mixup requires exactly 48 items`);
    }
    if (new Set(mixups.map((item) => item.word)).size !== mixups.length) {
      errors.push(`${difficulty}: duplicate Letter Mixup words`);
    }
    if (mixups.some((item) => !item.definition.trim())) {
      errors.push(`${difficulty}: missing Letter Mixup definition`);
    }

    const opposites = OPPOSITE_ITEMS[difficulty];
    if (opposites.length !== expectedOppositeCounts[difficulty]) {
      errors.push(
        `${difficulty}: Opposites requires exactly ${expectedOppositeCounts[difficulty]} items`
      );
    }
    if (
      new Set(
        opposites.map((item) => item.word.toLocaleLowerCase('en'))
      ).size !== opposites.length
    ) {
      errors.push(`${difficulty}: duplicate Opposites prompt words`);
    }
    for (const item of opposites) {
      const pairKey = [item.word, item.correct].sort().join('\u0000');
      if (unorderedPairs.has(pairKey)) {
        errors.push(`${difficulty}: reversed or duplicate opposite pair ${pairKey}`);
      }
      unorderedPairs.add(pairKey);
      if (
        item.word.toLocaleLowerCase('en') ===
          item.correct.toLocaleLowerCase('en') ||
        [item.correct, ...item.distractors].some(
          (value) =>
            value.toLocaleLowerCase('en') ===
            item.word.toLocaleLowerCase('en')
        ) ||
        new Set(
          [item.correct, ...item.distractors].map((value) =>
            value.toLocaleLowerCase('en')
          )
        ).size !== item.distractors.length + 1
      ) {
        errors.push(`${difficulty}/${item.word}: invalid or duplicate answer option`);
      }
    }
  }
  return errors;
}
