import type { Difficulty } from './difficultyPreferences';
import type { GameId } from './gameIds';

export type GameCategory =
  | 'reading'
  | 'pacing'
  | 'scanning'
  | 'recognition'
  | 'language'
  | 'memory'
  | 'wellness';

export type GameTier =
  | 'reading-practice'
  | 'skill-lab'
  | 'experimental'
  | 'wellness';

export type DifficultyOption = {
  label: string;
  helper: string;
};

export type GameCatalogEntry = {
  id: GameId;
  title: string;
  shortDescription: string;
  category: GameCategory;
  tier: GameTier;
  rules: readonly [string, string, string];
  difficulty: Record<Difficulty, DifficultyOption>;
  keywords: readonly string[];
};

export const GAME_CATEGORIES: readonly {
  id: GameCategory;
  label: string;
}[] = [
  { id: 'reading', label: 'Reading' },
  { id: 'pacing', label: 'Pacing' },
  { id: 'scanning', label: 'Scan & search' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'language', label: 'Words & language' },
  { id: 'memory', label: 'Memory' },
  { id: 'wellness', label: 'Eye comfort' },
];

export const GAME_TIER_LABELS: Record<GameTier, string> = {
  'reading-practice': 'Reading practice',
  'skill-lab': 'Skill lab',
  experimental: 'Experimental lab',
  wellness: 'Comfort',
};

function option(label: string, helper: string): DifficultyOption {
  return { label, helper };
}

export const GAME_CATALOG: Record<GameId, GameCatalogEntry> = {
  RepeatedReading: {
    id: 'RepeatedReading',
    title: 'Repeated Reading',
    shortDescription: 'Build fluency over two meaningful passes.',
    category: 'reading',
    tier: 'reading-practice',
    rules: [
      'Read the same connected passage twice at a comfortable pace.',
      'Answer a comprehension question after the second pass.',
      'Compare both measured rates without sacrificing meaning.',
    ],
    difficulty: {
      easy: option('Easy', 'Short, approachable passage'),
      medium: option('Medium', 'Longer passage with denser ideas'),
      hard: option('Hard', 'Most complex passage and vocabulary'),
    },
    keywords: ['fluency', 'wpm', 'reread', 'comprehension'],
  },
  MainIdeaSprint: {
    id: 'MainIdeaSprint',
    title: 'Main Idea',
    shortDescription: 'Recall the point after the passage disappears.',
    category: 'reading',
    tier: 'reading-practice',
    rules: [
      'Read a short passage and retrieve its central point.',
      'Choose the best main idea after the passage hides.',
      'Review an explanation before completing the round.',
    ],
    difficulty: {
      easy: option('Easy', '3 main-idea rounds'),
      medium: option('Medium', '4 main-idea rounds'),
      hard: option('Hard', '5 main-idea rounds'),
    },
    keywords: ['main idea', 'retrieval', 'recall', 'summary'],
  },
  StructureScan: {
    id: 'StructureScan',
    title: 'Structure Scan',
    shortDescription: 'Use headings to decide where to read next.',
    category: 'reading',
    tier: 'reading-practice',
    rules: [
      'Read an information goal, then preview a structured article.',
      'After the article hides, choose the section most likely to answer it.',
      'Review the evidence sentence and continue through the set.',
    ],
    difficulty: {
      easy: option('Easy', '3 sections · no preview limit · 3 rounds'),
      medium: option('Medium', '4 sections · 35-second preview · 4 rounds'),
      hard: option('Hard', '5 sections · 25-second preview · 5 rounds'),
    },
    keywords: ['skimming', 'headings', 'structure', 'information goal'],
  },
  EvidenceHunt: {
    id: 'EvidenceHunt',
    title: 'Evidence Hunt',
    shortDescription: 'Find and justify answers in connected text.',
    category: 'reading',
    tier: 'reading-practice',
    rules: [
      'Read the information question and scan the connected passage.',
      'Select the supporting sentence or sentences before choosing an answer.',
      'Review answer accuracy, evidence credit, wrong selections, and locate time separately.',
    ],
    difficulty: {
      easy: option('Easy', 'Short explicit text · one direct evidence sentence · untimed'),
      medium: option('Medium', 'Longer text · paraphrase the recorded outcome · one evidence sentence'),
      hard: option('Hard', 'Infer a bounded conclusion from separate outcome and limitation evidence'),
    },
    keywords: ['evidence', 'passage', 'scan', 'justify', 'detail', 'inference'],
  },
  ContextBuilder: {
    id: 'ContextBuilder',
    title: 'Context Builder',
    shortDescription: 'Infer a word and identify its context clue.',
    category: 'language',
    tier: 'skill-lab',
    rules: [
      'Read the connected paragraph and locate the marked target word.',
      'Choose its meaning, then select the clue that supports your inference.',
      'Optionally rate confidence and review meaning and clue accuracy separately.',
    ],
    difficulty: {
      easy: option('Easy', 'Common words · direct definition among sentence-based clues'),
      medium: option('Medium', 'Closer same-part-of-speech distractors · contrast or consequence clue'),
      hard: option('Hard', 'Less-frequent words · combine two independent context spans'),
    },
    keywords: ['context', 'vocabulary', 'meaning', 'clue', 'morphology'],
  },
  PowerReader: {
    id: 'PowerReader',
    title: 'Power Reader',
    shortDescription: 'Experiment with a steady highlighted pace.',
    category: 'pacing',
    tier: 'skill-lab',
    rules: [
      'Choose built-in, custom, or public-domain reading material.',
      'Follow the highlighted phrase and pause or adjust when needed.',
      'Treat the configured rate as guided pacing, not measured comprehension.',
    ],
    difficulty: {
      easy: option('Easy', '150 WPM guide · 2-word chunks'),
      medium: option('Medium', '300 WPM guide · 3-word chunks'),
      hard: option('Hard', '500 WPM guide · 5-word chunks'),
    },
    keywords: ['highlight', 'reader', 'guide', 'books', 'wpm'],
  },
  FlashReading: {
    id: 'FlashReading',
    title: 'Flash Recall',
    shortDescription: 'Identify briefly displayed words.',
    category: 'recognition',
    tier: 'experimental',
    rules: [
      'View one briefly displayed word.',
      'Type the word from memory after it disappears.',
      'The pace rises by 25 WPM after 4 correct in a row; a miss resets the streak and 3 consecutive misses end the session.',
    ],
    difficulty: {
      easy: option('Easy', 'Common words · starts at 120 WPM'),
      medium: option('Medium', 'Longer words · starts at 220 WPM'),
      hard: option('Hard', 'Advanced words · 320 WPM · lower area masked'),
    },
    keywords: ['flash', 'word', 'typing', 'recognition'],
  },
  ComprehensionTest: {
    id: 'ComprehensionTest',
    title: 'Comprehension',
    shortDescription: 'Read a passage, then check understanding.',
    category: 'reading',
    tier: 'reading-practice',
    rules: [
      'Read the connected passage at a useful pace.',
      'Move to the questions only when ready.',
      'Review feedback and finish with a truthful percentage correct.',
    ],
    difficulty: {
      easy: option('Easy', '1 main-idea question'),
      medium: option('Medium', '2 main-idea and detail questions'),
      hard: option('Hard', '3 main-idea, detail, and purpose questions'),
    },
    keywords: ['understanding', 'questions', 'passage', 'accuracy'],
  },
  SchulteNumbers: {
    id: 'SchulteNumbers',
    title: 'Schulte Numbers',
    shortDescription: 'Practice ordered number search.',
    category: 'scanning',
    tier: 'experimental',
    rules: [
      'Keep the entire shuffled grid comfortably visible.',
      'Tap every number in ascending order from 1.',
      'Incorrect taps add mistakes without advancing the sequence.',
    ],
    difficulty: {
      easy: option('3 × 3', '9 targets'),
      medium: option('4 × 4', '16 targets'),
      hard: option('5 × 5', '25 targets'),
    },
    keywords: ['schulte', 'numbers', 'sequence', 'visual search'],
  },
  SchulteLetters: {
    id: 'SchulteLetters',
    title: 'Schulte Letters',
    shortDescription: 'Practice ordered letter search.',
    category: 'scanning',
    tier: 'experimental',
    rules: [
      'Keep the entire shuffled letter grid visible.',
      'Tap letters alphabetically from A.',
      'Incorrect taps add mistakes without advancing the sequence.',
    ],
    difficulty: {
      easy: option('3 × 3', 'Letters A–I'),
      medium: option('4 × 4', 'Letters A–P'),
      hard: option('5 × 5', 'Letters A–Y'),
    },
    keywords: ['schulte', 'letters', 'alphabet', 'visual search'],
  },
  SchulteMix: {
    id: 'SchulteMix',
    title: 'Schulte Mix',
    shortDescription: 'Alternate ordered numbers and letters.',
    category: 'scanning',
    tier: 'experimental',
    rules: [
      'Read the next displayed number-or-letter target.',
      'Alternate through the shuffled sequence in order.',
      'Incorrect taps add mistakes without advancing.',
    ],
    difficulty: {
      easy: option('3 × 3', '9 alternating targets'),
      medium: option('4 × 4', '16 alternating targets'),
      hard: option('5 × 5', '25 alternating targets'),
    },
    keywords: ['schulte', 'switching', 'numbers', 'letters'],
  },
  EyeMovementTraining: {
    id: 'EyeMovementTraining',
    title: 'Eye Reset',
    shortDescription: 'Blink, look away, and take a screen break.',
    category: 'wellness',
    tier: 'wellness',
    rules: [
      'Record several natural, gentle blinks without squeezing.',
      'Put the screen down and look across the room.',
      'Record comfort only; this is not eyesight treatment.',
    ],
    difficulty: {
      easy: option('Quick', '3 blinks · 10-second look-away break'),
      medium: option('Standard', '5 blinks · 20-second look-away break'),
      hard: option('Extended', '8 blinks · 40-second look-away break'),
    },
    keywords: ['break', 'blink', 'comfort', 'screen'],
  },
  VisualSpanExpansion: {
    id: 'VisualSpanExpansion',
    title: 'Visual Span',
    shortDescription: 'Recall items shown around the center.',
    category: 'memory',
    tier: 'experimental',
    rules: [
      'Keep attention near the center while items appear briefly.',
      'Enter the sequence after it disappears.',
      'Correct recalls increase the sequence length.',
    ],
    difficulty: {
      easy: option('Easy', 'Starts at 4 items · 1500 ms display'),
      medium: option('Medium', 'Starts at 6 items · 1200 ms display'),
      hard: option('Hard', 'Starts at 8 items · 1000 ms display'),
    },
    keywords: ['peripheral', 'recall', 'sequence', 'visual span'],
  },
  PatternScanning: {
    id: 'PatternScanning',
    title: 'Patterns',
    shortDescription: 'Find matching patterns among distractors.',
    category: 'scanning',
    tier: 'experimental',
    rules: [
      'Read the target pattern for the round.',
      'Select every matching copy in the grid.',
      'Balance correct selections against errors before time expires.',
    ],
    difficulty: {
      easy: option('Easy', '4 × 4 grid · 45 seconds'),
      medium: option('Medium', '5 × 5 grid · 35 seconds'),
      hard: option('Hard', '6 × 6 grid · 30 seconds'),
    },
    keywords: ['patterns', 'grid', 'scan', 'distractors'],
  },
  TimedWordRecognition: {
    id: 'TimedWordRecognition',
    title: 'Word Flash',
    shortDescription: 'Recognize words under time pressure.',
    category: 'recognition',
    tier: 'skill-lab',
    rules: [
      'View one word before it disappears.',
      'Choose the exact word from several distractors.',
      'The pace rises by 25 WPM after 8 correct in a row; a miss resets the streak and 3 consecutive misses end the session.',
    ],
    difficulty: {
      easy: option('Easy', 'Common words · starts at 120 WPM'),
      medium: option('Medium', 'Academic words · starts at 220 WPM'),
      hard: option('Hard', 'Advanced words · starts at 320 WPM'),
    },
    keywords: ['word', 'flash', 'choice', 'recognition'],
  },
  TimedPhraseRecognition: {
    id: 'TimedPhraseRecognition',
    title: 'Phrase Flash',
    shortDescription: 'Recognize briefly displayed phrases.',
    category: 'recognition',
    tier: 'skill-lab',
    rules: [
      'View one generated phrase at the selected WPM.',
      'Choose the exact phrase from four options.',
      'The pace rises by 25 WPM after 8 correct in a row; a miss resets the streak and 3 consecutive misses end the session.',
    ],
    difficulty: {
      easy: option('Easy', '5-word templates · starts at 180 WPM'),
      medium: option('Medium', 'Longer templates · starts at 260 WPM'),
      hard: option('Hard', 'Complex templates · starts at 360 WPM'),
    },
    keywords: ['phrase', 'flash', 'chunk', 'recognition'],
  },
  LastWordRecall: {
    id: 'LastWordRecall',
    title: 'Last Word',
    shortDescription: 'Recall the final word in a paced stream.',
    category: 'memory',
    tier: 'skill-lab',
    rules: [
      'Watch a sequence of words shown one at a time.',
      'After the stream ends, choose the word that appeared last.',
      'The pace rises by 25 WPM after 4 correct in a row; a miss resets the streak and 3 consecutive misses end the session.',
    ],
    difficulty: {
      easy: option('Easy', '4-word stream · starts at 180 WPM'),
      medium: option('Medium', '6-word stream · starts at 280 WPM'),
      hard: option('Hard', '8-word stream · starts at 380 WPM'),
    },
    keywords: ['last word', 'stream', 'flash', 'serial recall', 'wpm'],
  },
  WordPairs: {
    id: 'WordPairs',
    title: 'Word Pairs',
    shortDescription: 'Match related or opposite words.',
    category: 'language',
    tier: 'skill-lab',
    rules: [
      'Read the prompt word.',
      'Choose its opposite or paired word.',
      'Continue until the timer ends and review accuracy.',
    ],
    difficulty: {
      easy: option('Easy', '45-second session'),
      medium: option('Medium', '30-second session'),
      hard: option('Hard', '20-second session'),
    },
    keywords: ['vocabulary', 'opposites', 'meaning', 'pairs'],
  },
  TextSearch: {
    id: 'TextSearch',
    title: 'Text Search',
    shortDescription: 'Scan passages for target words.',
    category: 'reading',
    tier: 'reading-practice',
    rules: [
      'Read the requested target word.',
      'Find every exact occurrence in the connected paragraph.',
      'Wrong taps reduce accuracy; correct taps mark found terms.',
    ],
    difficulty: {
      easy: option('Easy', 'No limit · target count visible'),
      medium: option('Medium', '30 seconds · target count visible'),
      hard: option('Hard', '20 seconds · target count hidden'),
    },
    keywords: ['keyword', 'scan', 'find', 'passage'],
  },
  WordSearchGame: {
    id: 'WordSearchGame',
    title: 'Word Search',
    shortDescription: 'Trace hidden words with structured search.',
    category: 'scanning',
    tier: 'skill-lab',
    rules: [
      'Find a listed target word in the letter grid.',
      'Trace every letter in order to claim the word.',
      'Continue until all words are found or time expires.',
    ],
    difficulty: {
      easy: option('Easy', '6 × 6 · common words · forward directions'),
      medium: option('Medium', '7 × 7 · larger word pool · orthogonal directions'),
      hard: option('Hard', '9 × 9 · longest word pool · all directions'),
    },
    keywords: ['word search', 'trace', 'letters', 'orthographic'],
  },
  NumberSearch: {
    id: 'NumberSearch',
    title: 'Number Search',
    shortDescription: 'Find target numbers in changing grids.',
    category: 'scanning',
    tier: 'experimental',
    rules: [
      'Read the target number.',
      'Find and tap it in the current grid.',
      'Continue through fresh targets until time expires.',
    ],
    difficulty: {
      easy: option('Easy', '4 × 4 grid · 45 seconds'),
      medium: option('Medium', '5 × 5 grid · 35 seconds'),
      hard: option('Hard', '6 × 6 grid · 25 seconds'),
    },
    keywords: ['numbers', 'grid', 'find', 'search'],
  },
  LetterRecognition: {
    id: 'LetterRecognition',
    title: 'Letter Hunt',
    shortDescription: 'Select every target letter in a grid.',
    category: 'recognition',
    tier: 'skill-lab',
    rules: [
      'Read the target letter for the round.',
      'Select every matching cell and submit.',
      'Continue through timed rounds and avoid distractors.',
    ],
    difficulty: {
      easy: option('Easy', '4 × 4 · 3 targets · 30 seconds'),
      medium: option('Medium', '5 × 5 · 5 targets · 25 seconds'),
      hard: option('Hard', '6 × 6 · 8 targets · 20 seconds'),
    },
    keywords: ['letter', 'grid', 'target', 'recognition'],
  },
  NumberRecognition: {
    id: 'NumberRecognition',
    title: 'Number Hunt',
    shortDescription: 'Decide whether a number matches the target.',
    category: 'recognition',
    tier: 'experimental',
    rules: [
      'Compare the current digit with the target.',
      'Choose Match or No Match.',
      'The stream advances after every decision.',
    ],
    difficulty: {
      easy: option('Easy', '30-second session'),
      medium: option('Medium', '20-second session'),
      hard: option('Hard', '12-second session'),
    },
    keywords: ['number', 'match', 'stream', 'reaction'],
  },
  SymbolRecognition: {
    id: 'SymbolRecognition',
    title: 'Symbol Hunt',
    shortDescription: 'Decide whether a symbol matches the target.',
    category: 'recognition',
    tier: 'experimental',
    rules: [
      'Compare the current symbol with the target.',
      'Choose Match or No Match.',
      'The stream advances after every decision.',
    ],
    difficulty: {
      easy: option('Easy', '30-second session'),
      medium: option('Medium', '20-second session'),
      hard: option('Hard', '12-second session'),
    },
    keywords: ['symbol', 'match', 'stream', 'reaction'],
  },
  LetterJumble: {
    id: 'LetterJumble',
    title: 'Word Jumble',
    shortDescription: 'Unscramble letters into words.',
    category: 'language',
    tier: 'skill-lab',
    rules: [
      'Inspect the shuffled letters.',
      'Type the original word or request the available hint.',
      'Continue until time expires and review solved words.',
    ],
    difficulty: {
      easy: option('Easy', 'Common short-word vocabulary'),
      medium: option('Medium', 'Longer intermediate vocabulary'),
      hard: option('Hard', 'Longest and least familiar vocabulary'),
    },
    keywords: ['jumble', 'spelling', 'vocabulary', 'unscramble'],
  },
  WordMismatchGrid: {
    id: 'WordMismatchGrid',
    title: 'Odd Word',
    shortDescription: 'Spot the word that does not fit.',
    category: 'recognition',
    tier: 'skill-lab',
    rules: [
      'Inspect the grid of visually similar words.',
      'Select the one word that differs and submit.',
      'Continue through rounds while time remains.',
    ],
    difficulty: {
      easy: option('Easy', '4 cards · 35 seconds'),
      medium: option('Medium', '6 cards · 30 seconds'),
      hard: option('Hard', '8 cards · 25 seconds'),
    },
    keywords: ['odd word', 'difference', 'discrimination', 'grid'],
  },
  EvenNumbers: {
    id: 'EvenNumbers',
    title: 'Even or Odd',
    shortDescription: 'Classify displayed numbers quickly.',
    category: 'recognition',
    tier: 'experimental',
    rules: [
      'Read the displayed number.',
      'Choose Even or Odd.',
      'Continue through fresh numbers until time expires.',
    ],
    difficulty: {
      easy: option('Easy', 'Numbers to 20 · 30 seconds'),
      medium: option('Medium', 'Numbers to 99 · 20 seconds'),
      hard: option('Hard', 'Numbers to 999 · 15 seconds'),
    },
    keywords: ['even', 'odd', 'number', 'classification'],
  },
  MemoryRecall: {
    id: 'MemoryRecall',
    title: 'Memory Recall',
    shortDescription: 'Recall increasingly long digit sequences.',
    category: 'memory',
    tier: 'skill-lab',
    rules: [
      'Memorize the displayed digit sequence.',
      'Re-enter it in order after it disappears.',
      'A correct recall adds a digit and resets strikes; a miss costs 10 points and removes one digit, while three consecutive misses finish the attempt.',
    ],
    difficulty: {
      easy: option('Easy', 'Starts at 3 digits · 1500 ms'),
      medium: option('Medium', 'Starts at 4 digits · 1100 ms'),
      hard: option('Hard', 'Starts at 5 digits · 800 ms'),
    },
    keywords: ['memory', 'digits', 'sequence', 'recall'],
  },
};

export function getGameCatalogEntry(gameId: string): GameCatalogEntry | null {
  return (GAME_CATALOG as Record<string, GameCatalogEntry>)[gameId] ?? null;
}
