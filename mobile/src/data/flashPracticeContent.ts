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

export type PersistentVariedDeckState = {
  source: readonly string[] | null;
  pool: string[];
  poolSignature: string;
  deck: string[];
  index: number;
  previous: string;
};

export function createPersistentVariedDeckState(): PersistentVariedDeckState {
  return {
    source: null,
    pool: [],
    poolSignature: '',
    deck: [],
    index: 0,
    previous: '',
  };
}

/**
 * Consumes one complete shuffled cycle before refilling. The mutable cursor is
 * intentionally component-owned so ordinary game replays keep unused items,
 * while a changed source pool starts a new cycle. Refill boundaries avoid an
 * immediate repeat whenever the pool has more than one item.
 */
export function takeNextPersistentVariedItem(
  state: PersistentVariedDeckState,
  values: readonly string[],
  random: RandomSource = Math.random
): string | undefined {
  if (state.source !== values) {
    const pool = uniqueStrings(values);
    const poolSignature = JSON.stringify(pool);
    state.source = values;
    state.pool = pool;

    if (state.poolSignature !== poolSignature) {
      state.poolSignature = poolSignature;
      state.deck = [];
      state.index = 0;
    }
  }

  if (state.index >= state.deck.length) {
    state.deck = createVariedSequence(
      state.pool,
      state.pool.length,
      state.previous,
      random
    );
    state.index = 0;
  }

  const next = state.deck[state.index];
  if (next === undefined) return undefined;
  state.index += 1;
  state.previous = next;
  return next;
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
  'Study partners',
  'Quick readers',
  'Bright students',
  'Small groups',
  'Morning readers',
  'New classmates',
  'Active learners',
  'Calm reviewers',
  'Local students',
  'Busy researchers',
  'Helpful teachers',
  'Focused learners',
  'Reading partners',
  'Alert learners',
  'Museum guides',
  'Park rangers',
  'New volunteers',
  'Young builders',
] as const;

const EASY_ACTIONS = [
  'notice small details',
  'follow clear directions',
  'remember key facts',
  'compare two examples',
  'discover useful clues',
  'collect field notes',
  'describe simple changes',
  'measure short distances',
  'organize written ideas',
  'observe changing patterns',
  'question weak claims',
  'share helpful feedback',
  'connect related facts',
  'practice new skills',
  'review short stories',
  'trace safe routes',
  'explain main ideas',
  'predict likely outcomes',
  'examine word shapes',
  'sort matching symbols',
  'locate nearby landmarks',
  'repeat useful phrases',
  'test simple rules',
  'map new routes',
] as const;

const EASY_CONTEXTS = [
  'with care',
  'with focus',
  'with patience',
  'with curiosity',
  'with a partner',
  'with the group',
  'during practice',
  'during review',
  'while learning',
  'before answering',
  'before deciding',
  'after reading',
  'after checking',
  'step by step',
  'without rushing',
  'as instructed',
  'whenever needed',
  'each morning',
  'each week',
  'in their notes',
  'for the lesson',
  'for the project',
  'at the library',
  'throughout the session',
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
  'Before revising the schedule',
  'During the archive visit',
  'After mapping the route',
  'While reviewing the transcript',
  'At the weekly planning session',
  'Following a second measurement',
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
  'the transport planner',
  'a careful translator',
  'the volunteer coordinator',
  'an observant technician',
  'the debate moderator',
  'a diligent fact checker',
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
  'locates the relevant paragraph',
  'reorders the steps for clarity',
  'checks the dates against the record',
  'distinguishes the signal from noise',
  'connects the outcome to its cause',
  'rephrases the claim without changing its scope',
] as const;

/**
 * Hard prompts keep advanced analytical vocabulary while remaining compact
 * enough for a single-line flash on a phone. The actor and modifier slots
 * broaden the pool without producing ungrammatical clause combinations.
 */
const HARD_ANALYSES = [
  'tests an alternative against the record',
  'maps the remaining evidence gaps',
  'tries to disconfirm each interpretation',
  'rechecks assumptions against new data',
  'links individual results into a sequence',
  'tests another method under matching conditions',
  'treats the conclusion as provisional',
  'checks plausible confounding factors',
  'compares gains with delayed costs',
  'limits the claim to the sample',
  'measures whether the change persists',
  'inspects the estimate and its distribution',
  'verifies claims against primary sources',
  'compares the groups’ starting conditions',
  'defines terms before comparing arguments',
  'updates the model with new data',
  'inspects null and conflicting results',
  'traces sources to independent evidence',
  'separates outcomes by subgroup',
  'tests conditions in another setting',
  'estimates tolerable measurement error',
  'infers meaning from nearby context',
  'examines subgroup distributions separately',
  'narrows the rule after counterevidence',
] as const;

const HARD_ANALYSIS_ACTORS = [
  'the research team',
  'the review team',
  'the analysis group',
  'the project evaluator',
  'the lead investigator',
  'the independent reviewer',
  'the methods specialist',
  'the editorial team',
  'the evidence panel',
  'the assessment group',
  'the audit team',
  'the study coordinator',
  'the data analyst',
  'the policy reviewer',
  'the field researcher',
  'the technical editor',
  'the evaluation committee',
  'the quality team',
  'the inquiry team',
  'the verification group',
  'the methods panel',
  'the research editor',
  'the study reviewer',
  'the decision team',
] as const;

const HARD_ANALYSIS_MODIFIERS = [
  'carefully',
  'independently',
  'cautiously',
  'transparently',
  'systematically',
  'explicitly',
  'provisionally',
  'skeptically',
  'rigorously',
  'consistently',
  'deliberately',
  'methodically',
  'precisely',
  'critically',
  'objectively',
  'jointly',
  'separately',
  'patiently',
  'attentively',
  'conservatively',
  'responsibly',
  'openly',
  'thoroughly',
  'repeatedly',
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
      for (const action of EASY_ACTIONS) {
        for (const context of EASY_CONTEXTS) {
          phrases.push(`${subject} ${action} ${context}`);
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
    for (const analysis of HARD_ANALYSES) {
      for (const actor of HARD_ANALYSIS_ACTORS) {
        for (const modifier of HARD_ANALYSIS_MODIFIERS) {
          phrases.push(`${actor} ${analysis} ${modifier}.`);
        }
      }
    }
  }

  return shuffleItems(phrases, random).slice(0, count);
}

export function getPhraseCombinationCount(difficulty: Difficulty): number {
  if (difficulty === 'easy') {
    return EASY_SUBJECTS.length * EASY_ACTIONS.length * EASY_CONTEXTS.length;
  }
  if (difficulty === 'medium') {
    return MEDIUM_OPENERS.length * MEDIUM_SUBJECTS.length * MEDIUM_ACTIONS.length;
  }
  return (
    HARD_ANALYSES.length *
    HARD_ANALYSIS_ACTORS.length *
    HARD_ANALYSIS_MODIFIERS.length
  );
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
