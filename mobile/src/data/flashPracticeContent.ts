import type { Difficulty } from './difficultyPreferences';
import {
  ADVANCED_WORDS,
  BEGINNER_WORDS,
  INTERMEDIATE_WORDS,
} from './vocabulary';

export type RandomSource = () => number;

export function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function shuffleItems<T>(
  values: readonly T[],
  random: RandomSource = Math.random
): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function getFlashWordPool(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case 'easy':
      return uniqueStrings(BEGINNER_WORDS);
    case 'medium':
      return uniqueStrings(INTERMEDIATE_WORDS);
    case 'hard':
      return uniqueStrings(ADVANCED_WORDS);
  }
}

/**
 * Creates a sequence without replacement until the pool is exhausted.
 * When another shuffled cycle is needed, the boundary word is changed so
 * users never see an immediate duplicate.
 */
export function createVariedSequence(
  values: readonly string[],
  count: number,
  avoidFirst = '',
  random: RandomSource = Math.random
): string[] {
  const pool = uniqueStrings(values);
  if (pool.length === 0 || count <= 0) return [];

  const sequence: string[] = [];
  let previous = avoidFirst.toLocaleLowerCase();

  while (sequence.length < count) {
    const cycle = shuffleItems(pool, random);
    if (
      cycle.length > 1 &&
      cycle[0].toLocaleLowerCase() === previous
    ) {
      [cycle[0], cycle[1]] = [cycle[1], cycle[0]];
    }

    for (const item of cycle) {
      if (sequence.length >= count) break;
      sequence.push(item);
      previous = item.toLocaleLowerCase();
    }
  }

  return sequence;
}

function comparableText(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

function sharedEdgeLength(
  first: string,
  second: string,
  fromEnd = false
): number {
  const limit = Math.min(first.length, second.length);
  let shared = 0;
  while (shared < limit) {
    const firstIndex = fromEnd ? first.length - shared - 1 : shared;
    const secondIndex = fromEnd ? second.length - shared - 1 : shared;
    if (first[firstIndex] !== second[secondIndex]) break;
    shared += 1;
  }
  return shared;
}

function editDistance(first: string, second: string): number {
  const previous = Array.from(
    { length: second.length + 1 },
    (_, index) => index
  );

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex];
    for (
      let secondIndex = 1;
      secondIndex <= second.length;
      secondIndex += 1
    ) {
      const substitution =
        previous[secondIndex - 1] +
        (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1);
      current[secondIndex] = Math.min(
        previous[secondIndex] + 1,
        current[secondIndex - 1] + 1,
        substitution
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[second.length] ?? Math.max(first.length, second.length);
}

function recognitionSimilarityScore(answer: string, candidate: string): number {
  const normalizedAnswer = comparableText(answer);
  const normalizedCandidate = comparableText(candidate);
  const wordCountDifference = Math.abs(
    countWords(answer) - countWords(candidate)
  );
  const lengthDifference = Math.abs(
    normalizedAnswer.length - normalizedCandidate.length
  );
  const spellingDistance = editDistance(
    normalizedAnswer,
    normalizedCandidate
  );
  const sharedPrefix = sharedEdgeLength(
    normalizedAnswer,
    normalizedCandidate
  );
  const sharedSuffix = sharedEdgeLength(
    normalizedAnswer,
    normalizedCandidate,
    true
  );

  // Word count and visible length are dominant so the answer cannot be
  // inferred from button width. Spelling shape breaks close-length ties.
  return (
    wordCountDifference * 10_000 +
    lengthDifference * 1_000 +
    spellingDistance * 10 -
    sharedPrefix * 3 -
    sharedSuffix * 2
  );
}

export function selectSimilarDistractors(
  answer: string,
  candidates: readonly string[],
  count: number,
  random: RandomSource = Math.random
): string[] {
  const normalizedAnswer = answer.toLocaleLowerCase();
  const ranked = uniqueStrings(candidates)
    .filter((candidate) => candidate.toLocaleLowerCase() !== normalizedAnswer)
    .map((candidate, sourceIndex) => ({
      candidate,
      sourceIndex,
      score: recognitionSimilarityScore(answer, candidate),
    }))
    .sort(
      (first, second) =>
        first.score - second.score ||
        first.sourceIndex - second.sourceIndex
    );
  const needed = Math.max(0, count);
  const closeCandidateWindow = ranked
    .slice(0, Math.min(ranked.length, Math.max(needed, needed * 2)))
    .map(({ candidate }) => candidate);

  return shuffleItems(closeCandidateWindow, random).slice(0, needed);
}

export function createRecognitionOptions(
  answer: string,
  preferredPool: readonly string[],
  count = 4,
  random: RandomSource = Math.random
): string[] {
  const universalPool = [
    ...BEGINNER_WORDS,
    ...INTERMEDIATE_WORDS,
    ...ADVANCED_WORDS,
  ];
  const candidates = uniqueStrings([...preferredPool, ...universalPool]).filter(
    (word) => word.toLocaleLowerCase() !== answer.toLocaleLowerCase()
  );
  const distractors = selectSimilarDistractors(
    answer,
    candidates,
    Math.max(0, count - 1),
    random
  );
  return shuffleItems([answer, ...distractors], random);
}

const EASY_SUBJECTS = [
  'Curious readers',
  'Quiet students',
  'Patient learners',
  'Skilled writers',
  'Young explorers',
  'Careful thinkers',
  'Kind neighbors',
  'Quick foxes',
  'Bright stars',
  'Small rivers',
  'Morning light',
  'Fresh ideas',
] as const;

const EASY_VERBS = [
  'notice',
  'follow',
  'remember',
  'compare',
  'discover',
  'collect',
  'describe',
  'measure',
  'organize',
  'observe',
  'question',
  'share',
] as const;

const EASY_OBJECTS = [
  'small details',
  'clear patterns',
  'useful clues',
  'new routes',
  'simple changes',
  'strong signals',
  'daily habits',
  'hidden shapes',
  'bright colors',
  'short stories',
  'main ideas',
  'key facts',
] as const;

const MEDIUM_OPENERS = [
  'Before the meeting',
  'During the lesson',
  'After careful practice',
  'Across the quiet library',
  'While the city sleeps',
  'Near the riverbank',
  'At the final review',
  'Without losing focus',
  'After the field survey',
  'When the evidence conflicts',
  'Throughout the final draft',
  'Under changing conditions',
] as const;

const MEDIUM_SUBJECTS = [
  'the patient researcher',
  'an attentive reader',
  'the project team',
  'a thoughtful editor',
  'the local historian',
  'a curious student',
  'the careful observer',
  'an experienced guide',
  'the review committee',
  'a skeptical analyst',
  'the science reporter',
  'an independent auditor',
] as const;

const MEDIUM_ACTIONS = [
  'compares two reliable sources',
  'marks the strongest evidence',
  'revises the original estimate',
  'summarizes the central argument',
  'connects several useful clues',
  'checks each important detail',
  'organizes the new information',
  'questions the first conclusion',
  'traces the claim to its source',
  'tests the proposed explanation',
  'separates observation from inference',
  'records the remaining uncertainty',
] as const;

const HARD_OPENERS = [
  'Although the first explanation seemed convincing',
  'Because the available evidence remained incomplete',
  'Whenever several interpretations appear equally plausible',
  'After the preliminary findings changed unexpectedly',
  'While the broader pattern was initially overlooked',
  'Even when the familiar strategy stops working',
  'Unless the hidden assumption survives closer testing',
  'Before the apparent correlation is treated as causal',
  'Where competing priorities cannot all be maximized',
  'If the original sample excludes an important group',
  'Once the short-term improvement begins to fade',
  'Despite the precision suggested by a single estimate',
] as const;

const HARD_CLAUSES = [
  'the analyst compares competing claims before deciding',
  'the researcher revises assumptions and records the uncertainty',
  'the reader separates direct evidence from reasonable inference',
  'the team tests an alternative explanation against the data',
  'the editor preserves the main idea while removing repetition',
  'the investigator checks whether each conclusion follows logically',
  'the reviewer identifies which evidence would change the conclusion',
  'the committee weighs immediate benefits against delayed costs',
  'the historian distinguishes the surviving record from later interpretation',
  'the designer tests whether the solution transfers to a different setting',
  'the statistician examines the distribution behind the average',
  'the reporter verifies the fluent summary against the primary source',
] as const;

const HARD_ENDINGS = [
  'before publishing the result',
  'without hiding important uncertainty',
  'and explains the decision clearly',
  'before choosing the next step',
  'while preserving the central meaning',
  'and records what changed',
  'before rejecting the competing account',
  'while keeping the evidence visible',
  'and names the limit of the available sample',
  'before recommending a permanent change',
  'while distinguishing confidence from certainty',
  'and explains which tradeoff remains unresolved',
] as const;

function pick<T>(
  values: readonly T[],
  random: RandomSource
): T {
  return values[Math.floor(random() * values.length)];
}

function buildPhrase(difficulty: Difficulty, random: RandomSource): string {
  if (difficulty === 'easy') {
    return `${pick(EASY_SUBJECTS, random)} ${pick(
      EASY_VERBS,
      random
    )} ${pick(EASY_OBJECTS, random)}`;
  }

  if (difficulty === 'medium') {
    return `${pick(MEDIUM_OPENERS, random)}, ${pick(
      MEDIUM_SUBJECTS,
      random
    )} ${pick(MEDIUM_ACTIONS, random)}`;
  }

  return `${pick(HARD_OPENERS, random)}, ${pick(
    HARD_CLAUSES,
    random
  )} ${pick(HARD_ENDINGS, random)}`;
}

export function generatePhrasePool(
  difficulty: Difficulty,
  count = 240,
  random: RandomSource = Math.random
): string[] {
  const phrases = new Set<string>();
  const target = Math.max(1, count);
  const maxAttempts = target * 30;

  for (let attempt = 0; phrases.size < target && attempt < maxAttempts; attempt += 1) {
    phrases.add(buildPhrase(difficulty, random));
  }

  return shuffleItems([...phrases], random);
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
