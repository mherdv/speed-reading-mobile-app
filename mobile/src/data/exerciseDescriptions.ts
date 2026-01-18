/**
 * Exercise descriptions and benefits for pre-exercise information screens
 */

import type { GameId } from './gameIds';
import { normalizeGameId } from './gameIds';

export type ExerciseInfo = {
  id: GameId;
  name: string;
  description: string;
  benefits: string[];
  skills: string[];
  difficulty: string;
  duration: string;
};

export const exerciseDescriptions: Partial<Record<GameId, ExerciseInfo>> = {
  PowerReader: {
    id: 'PowerReader',
    name: 'Power Reader',
    description: 'Read chunks of text at controlled speeds to train your reading pace. Words appear one group at a time, encouraging you to process larger chunks and maintain rhythm.',
    benefits: [
      'Increases overall reading speed',
      'Trains comfortable reading rhythm',
      'Reduces word-by-word reading habit',
      'Improves focus during extended reading',
    ],
    skills: ['Reading Speed', 'Chunking', 'Focus'],
    difficulty: 'Beginner to Advanced',
    duration: '2-5 minutes',
  },
  LetterRecognition: {
    id: 'LetterRecognition',
    name: 'Letter Recognition',
    description: 'Quickly identify target letters in a grid. This exercise trains your visual scanning ability and letter recognition speed.',
    benefits: [
      'Sharpens visual scanning abilities',
      'Improves letter recognition speed',
      'Enhances attention to detail',
      'Builds pattern recognition',
    ],
    skills: ['Visual Scanning', 'Pattern Recognition', 'Attention'],
    difficulty: 'Beginner',
    duration: '1-3 minutes',
  },
  TextSearch: {
    id: 'TextSearch',
    name: 'Text Search',
    description: 'Find specific target words within blocks of text. This exercise improves your ability to scan text efficiently while searching for information.',
    benefits: [
      'Develops efficient text scanning',
      'Improves word recognition speed',
      'Enhances visual search strategies',
      'Trains selective attention',
    ],
    skills: ['Scanning', 'Word Recognition', 'Focus'],
    difficulty: 'Beginner to Intermediate',
    duration: '2-4 minutes',
  },
  EyeMovementTraining: {
    id: 'EyeMovementTraining',
    name: 'Eye Movement Training',
    description: 'Follow moving targets to train smooth eye movements. This exercise helps reduce jerky eye motions and improves reading fluidity.',
    benefits: [
      'Improves smooth eye tracking',
      'Reduces unnecessary eye jumps',
      'Enhances reading fluidity',
      'Decreases eye fatigue',
    ],
    skills: ['Eye Tracking', 'Motor Control', 'Focus'],
    difficulty: 'Beginner',
    duration: '1-2 minutes',
  },
  VisualSpanExpansion: {
    id: 'VisualSpanExpansion',
    name: 'Visual Span Expansion',
    description: 'Remember and recall sequences of digits shown briefly. This exercise expands your visual span—the amount of information you can capture in a single glance.',
    benefits: [
      'Expands peripheral vision awareness',
      'Increases information capture per fixation',
      'Improves short-term visual memory',
      'Reduces number of eye fixations needed',
    ],
    skills: ['Visual Memory', 'Peripheral Vision', 'Working Memory'],
    difficulty: 'Intermediate',
    duration: '2-4 minutes',
  },
  FlashReading: {
    id: 'FlashReading',
    name: 'Flash Reading',
    description: 'Words or phrases flash briefly on screen, and you must recognize them. This trains quick word recognition and reduces the time needed to identify words.',
    benefits: [
      'Speeds up word recognition',
      'Reduces subvocalization tendency',
      'Improves reading automaticity',
      'Trains rapid visual processing',
    ],
    skills: ['Word Recognition', 'Visual Speed', 'Memory'],
    difficulty: 'Beginner to Intermediate',
    duration: '2-3 minutes',
  },
  ComprehensionTest: {
    id: 'ComprehensionTest',
    name: 'Comprehension Test',
    description: 'Read passages and answer questions to verify understanding. This ensures that increased reading speed maintains comprehension quality.',
    benefits: [
      'Validates reading comprehension',
      'Develops active reading habits',
      'Improves information retention',
      'Balances speed with understanding',
    ],
    skills: ['Comprehension', 'Critical Thinking', 'Retention'],
    difficulty: 'Intermediate',
    duration: '3-5 minutes',
  },
  MemoryRecall: {
    id: 'MemoryRecall',
    name: 'Memory Recall',
    description: 'Remember items shown and recall them accurately. This exercise strengthens working memory, which is essential for reading comprehension.',
    benefits: [
      'Strengthens working memory',
      'Improves information retention',
      'Enhances recall accuracy',
      'Supports comprehension during reading',
    ],
    skills: ['Working Memory', 'Recall', 'Attention'],
    difficulty: 'Intermediate',
    duration: '2-4 minutes',
  },
  NumberRecognition: {
    id: 'NumberRecognition',
    name: 'Number Recognition',
    description: 'Quickly identify target numbers among distractors. Similar to letter recognition but with numbers, training rapid visual discrimination.',
    benefits: [
      'Improves number recognition speed',
      'Enhances visual discrimination',
      'Sharpens attention to detail',
      'Builds rapid scanning ability',
    ],
    skills: ['Visual Scanning', 'Number Recognition', 'Speed'],
    difficulty: 'Beginner',
    duration: '1-3 minutes',
  },
  SymbolRecognition: {
    id: 'SymbolRecognition',
    name: 'Symbol Recognition',
    description: 'Identify symbols quickly in various contexts. This trains pattern recognition beyond letters and numbers.',
    benefits: [
      'Broadens pattern recognition',
      'Improves symbol processing speed',
      'Enhances visual flexibility',
      'Trains attention to visual details',
    ],
    skills: ['Pattern Recognition', 'Visual Processing', 'Attention'],
    difficulty: 'Beginner to Intermediate',
    duration: '1-3 minutes',
  },
  PatternScanning: {
    id: 'PatternScanning',
    name: 'Pattern Scanning',
    description: 'Find specific patterns within a grid or sequence. This exercise develops systematic visual scanning strategies.',
    benefits: [
      'Develops systematic scanning',
      'Improves pattern detection',
      'Enhances visual search efficiency',
      'Builds attention span',
    ],
    skills: ['Pattern Detection', 'Scanning', 'Focus'],
    difficulty: 'Intermediate',
    duration: '2-4 minutes',
  },
  TimedPhraseRecognition: {
    id: 'TimedPhraseRecognition',
    name: 'Phrase Recognition',
    description: 'Recognize phrases shown briefly and select the correct one from options. This trains phrase-level processing instead of word-by-word reading.',
    benefits: [
      'Enables phrase-level reading',
      'Increases chunk size recognition',
      'Reduces word-by-word processing',
      'Improves reading flow',
    ],
    skills: ['Phrase Recognition', 'Chunking', 'Speed'],
    difficulty: 'Intermediate',
    duration: '2-3 minutes',
  },
  TimedWordRecognition: {
    id: 'TimedWordRecognition',
    name: 'Word Recognition',
    description: 'Words flash briefly and you must remember and identify them. This exercise builds rapid word recognition and visual memory.',
    benefits: [
      'Speeds up word identification',
      'Strengthens word memory',
      'Reduces recognition time',
      'Builds automatic word processing',
    ],
    skills: ['Word Recognition', 'Memory', 'Speed'],
    difficulty: 'Beginner to Intermediate',
    duration: '2-3 minutes',
  },
  WordMismatchGrid: {
    id: 'WordMismatchGrid',
    name: 'Word Mismatch',
    description: 'Find word pairs that do not match among similar-looking words. This sharpens attention to detail and word discrimination.',
    benefits: [
      'Improves word discrimination',
      'Enhances attention to detail',
      'Develops careful reading habits',
      'Builds visual comparison skills',
    ],
    skills: ['Word Comparison', 'Attention', 'Accuracy'],
    difficulty: 'Intermediate',
    duration: '2-4 minutes',
  },
  WordPairs: {
    id: 'WordPairs',
    name: 'Word Pairs',
    description: 'Match words with their opposites or related pairs. This builds vocabulary connections and semantic understanding.',
    benefits: [
      'Strengthens vocabulary connections',
      'Improves semantic understanding',
      'Builds word relationships',
      'Enhances reading comprehension',
    ],
    skills: ['Vocabulary', 'Semantic Memory', 'Associations'],
    difficulty: 'Intermediate',
    duration: '2-4 minutes',
  },
  LetterJumble: {
    id: 'LetterJumble',
    name: 'Letter Jumble',
    description: 'Unscramble letters to form words. This exercise strengthens word recognition and spelling patterns.',
    benefits: [
      'Reinforces spelling patterns',
      'Improves word recognition',
      'Builds vocabulary awareness',
      'Enhances problem-solving',
    ],
    skills: ['Word Recognition', 'Spelling', 'Problem Solving'],
    difficulty: 'Beginner to Intermediate',
    duration: '2-4 minutes',
  },
  SchulteNumbers: {
    id: 'SchulteNumbers',
    name: 'Schulte Numbers',
    description: 'Tap numbers 1 to 25 in order as fast as possible. This classic exercise trains peripheral vision and reduces eye movement.',
    benefits: [
      'Expands peripheral vision',
      'Reduces unnecessary eye movements',
      'Improves visual scanning speed',
      'Increases attention span',
    ],
    skills: ['Peripheral Vision', 'Scanning', 'Speed'],
    difficulty: 'Beginner to Advanced',
    duration: '1-2 minutes',
  },
  SchulteLetters: {
    id: 'SchulteLetters',
    name: 'Schulte Letters',
    description: 'Tap letters A to Y in order as fast as possible. Similar to Schulte Numbers but with letters for varied training.',
    benefits: [
      'Trains letter sequence recognition',
      'Expands peripheral awareness',
      'Improves scanning efficiency',
      'Enhances alphabetical fluency',
    ],
    skills: ['Letter Recognition', 'Peripheral Vision', 'Speed'],
    difficulty: 'Beginner to Advanced',
    duration: '1-2 minutes',
  },
  SchulteMix: {
    id: 'SchulteMix',
    name: 'Schulte Mix',
    description: 'Alternate between numbers and letters (1, A, 2, B...). This adds complexity and trains mental flexibility.',
    benefits: [
      'Improves mental flexibility',
      'Enhances task switching',
      'Trains divided attention',
      'Builds cognitive control',
    ],
    skills: ['Mental Flexibility', 'Task Switching', 'Focus'],
    difficulty: 'Intermediate to Advanced',
    duration: '2-3 minutes',
  },
  WordSearchGame: {
    id: 'WordSearchGame',
    name: 'Word Search',
    description: 'Find hidden words in a grid of letters. This exercise trains pattern recognition and systematic visual scanning.',
    benefits: [
      'Develops visual scanning strategies',
      'Improves word pattern recognition',
      'Enhances sustained attention',
      'Builds vocabulary awareness',
    ],
    skills: ['Word Recognition', 'Scanning', 'Pattern Detection'],
    difficulty: 'Beginner to Intermediate',
    duration: '3-5 minutes',
  },
  NumberSearch: {
    id: 'NumberSearch',
    name: 'Number Search',
    description: 'Find target numbers in a grid of digits. This trains rapid number recognition and visual scanning.',
    benefits: [
      'Sharpens number recognition',
      'Improves visual search speed',
      'Develops scanning strategies',
      'Enhances concentration',
    ],
    skills: ['Number Recognition', 'Scanning', 'Attention'],
    difficulty: 'Beginner',
    duration: '2-4 minutes',
  },
};

export function getExerciseInfo(gameId: string): ExerciseInfo | null {
  const normalizedId = normalizeGameId(gameId) as GameId;
  return exerciseDescriptions[normalizedId] || null;
}
