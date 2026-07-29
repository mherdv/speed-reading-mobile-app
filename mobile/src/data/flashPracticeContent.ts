import type { Difficulty } from './difficultyPreferences';
import {
  ADVANCED_WORDS,
  BEGINNER_WORDS,
  INTERMEDIATE_WORDS,
} from './vocabulary';
import {
  shuffleItems,
  type RandomSource,
} from './randomization';

export { shuffleItems, type RandomSource } from './randomization';

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
  'Morning readers',
  'Fresh ideas',
  'Active minds',
  'Calm hikers',
  'Local artists',
  'Busy gardeners',
  'Helpful teachers',
  'Playful dolphins',
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
  'connect',
  'practice',
  'review',
  'trace',
  'explain',
  'predict',
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
  'word shapes',
  'safe paths',
  'early warnings',
  'shared goals',
  'quiet sounds',
  'fresh evidence',
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
  'Following the first interview',
  'Inside the crowded workshop',
  'Before the public briefing',
  'During the second experiment',
  'Beyond the familiar example',
  'After comparing both accounts',
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
  'the museum curator',
  'a community planner',
  'the software tester',
  'an attentive librarian',
  'the field biologist',
  'a patient instructor',
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
  'maps the sequence of events',
  'compares the likely tradeoffs',
  'groups related details together',
  'checks the claim against the chart',
  'identifies the missing assumption',
  'explains why the pattern matters',
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
  'Although the summary uses confident language',
  'Because the comparison groups differ in several ways',
  'Whenever a definition changes across disciplines',
  'After the original forecast misses an important shift',
  'While the strongest result receives most attention',
  'Even if two sources repeat the same claim',
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
  'the reader tests whether the conclusion survives a counterexample',
  'the evaluator separates implementation failure from theory failure',
  'the archivist compares the later account with the dated record',
  'the engineer examines how the constraint changes under stress',
  'the facilitator distinguishes broad agreement from complete unanimity',
  'the researcher checks whether the measure captures the intended concept',
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
  'before generalizing beyond the observed setting',
  'while naming the strongest alternative explanation',
  'and identifies which assumption carries the most risk',
  'before combining results from incompatible measures',
  'while preserving exceptions that affect the conclusion',
  'and states what additional evidence would be decisive',
] as const;

export function generatePhrasePool(
  difficulty: Difficulty,
  count = 240,
  random: RandomSource = Math.random
): string[] {
  if (count <= 0) return [];
  const phrases: string[] = [];

  if (difficulty === 'easy') {
    for (const subject of EASY_SUBJECTS) {
      for (const verb of EASY_VERBS) {
        for (const object of EASY_OBJECTS) {
          phrases.push(`${subject} ${verb} ${object}`);
        }
      }
    }
  } else if (difficulty === 'medium') {
    for (const opener of MEDIUM_OPENERS) {
      for (const subject of MEDIUM_SUBJECTS) {
        for (const action of MEDIUM_ACTIONS) {
          phrases.push(`${opener}, ${subject} ${action}`);
        }
      }
    }
  } else {
    for (const opener of HARD_OPENERS) {
      for (const clause of HARD_CLAUSES) {
        for (const ending of HARD_ENDINGS) {
          phrases.push(`${opener}, ${clause} ${ending}`);
        }
      }
    }
  }

  return shuffleItems(phrases, random).slice(0, count);
}

export function getPhraseCombinationCount(difficulty: Difficulty): number {
  if (difficulty === 'easy') {
    return EASY_SUBJECTS.length * EASY_VERBS.length * EASY_OBJECTS.length;
  }
  if (difficulty === 'medium') {
    return MEDIUM_OPENERS.length * MEDIUM_SUBJECTS.length * MEDIUM_ACTIONS.length;
  }
  return HARD_OPENERS.length * HARD_CLAUSES.length * HARD_ENDINGS.length;
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
