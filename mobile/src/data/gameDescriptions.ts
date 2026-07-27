/**
 * Thorough descriptions for each game explaining what it is and what it's for.
 * These are displayed when a game is selected, in the idle state before starting.
 */

import type { GameId } from './gameIds';

export const GAME_DESCRIPTIONS: Record<GameId, string> = {
  RepeatedReading:
    'Read the same short passage twice at a comfortable pace, then answer a comprehension question. Compare both attempts and improve fluency without trading away meaning.',

  MainIdeaSprint:
    'Read a short passage, hide it, and retrieve its central idea from memory. Immediate feedback helps you learn to separate the author’s main claim from supporting details.',

  StructureScan:
    'Preview a short, structured article for a specific information goal, then choose the heading most likely to contain the answer. This builds purposeful skimming without pretending that skimming replaces careful reading.',

  EvidenceHunt:
    'Find the sentence or sentences that justify an answer in connected text. The result keeps answer accuracy, evidence credit, locate time, and wrong selections separate.',

  ContextBuilder:
    'Infer an unfamiliar word from a connected paragraph and identify the clue that supports your meaning. This reports vocabulary-task accuracy, not reading speed.',

  PowerReader:
    'Use a moving highlight to experiment with a steady reading pace. This is guided pacing practice, so its WPM reflects the chosen presentation speed and does not prove comprehension.',

  LetterRecognition:
    'Scan a letter grid and select every copy of a target. This optional visual-search warm-up measures speed and accuracy, not reading comprehension.',

  TextSearch:
    'Practice intentional scanning by locating every instance of a target word in a passage. Use this mode when your real reading goal is to find a known term quickly.',

  EyeMovementTraining:
    'Take a short visual-comfort break with gentle blinking and distance focus. This routine may help you pause during screen use, but it does not improve eyesight, diagnose eye health, or measure reading speed.',

  VisualSpanExpansion:
    'Recognize brief items around a central point as an optional peripheral-awareness challenge. Treat its score as drill performance, not evidence of a wider reading span.',

  FlashReading:
    'Identify briefly displayed words and track response accuracy. This is a recognition challenge and does not by itself demonstrate faster connected-text reading.',

  ComprehensionTest:
    'Read a passage at a useful pace, then answer main-idea and detail questions. The result prioritizes understanding instead of rewarding speed without recall.',

  MemoryRecall:
    'Recall short number sequences as an optional working-memory challenge. Its accuracy describes this task only; it is not a reading-retention score.',

  NumberRecognition:
    'Identify target numbers in a brief visual task. This optional challenge measures number-recognition accuracy rather than reading skill.',

  SymbolRecognition:
    'Identify target symbols among distractors in an optional visual-search challenge. The score is specific to this task.',

  PatternScanning:
    'Locate matching patterns in a grid and compare speed with accuracy. Use it as an optional visual-search warm-up rather than a reading measure.',

  TimedPhraseRecognition:
    'Identify briefly displayed phrases and track recognition accuracy. Results apply to the drill and should not be read as connected-text comprehension.',

  TimedWordRecognition:
    'Choose a briefly displayed word from several options. This optional task records recognition speed and accuracy without making claims about subvocalization.',

  LastWordRecall:
    'Follow a paced stream of words, then identify the final word. This trains attention to serial position and reports drill accuracy; it does not measure passage comprehension.',

  WordMismatchGrid:
    'Find the word that differs in a grid of similar choices. This is an optional visual-discrimination task, not a comprehension exercise.',

  WordPairs:
    'Match related or opposite words and track accuracy. Use it as a vocabulary warm-up; its score does not measure passage comprehension.',

  LetterJumble:
    'Unscramble letters to form words in an optional spelling and pattern challenge. The result is specific to the puzzle.',

  SchulteNumbers:
    'Find numbers in sequence in a grid to practice ordered visual search and sustained attention. Completion time measures this task only; use measured reads to check whether practice transfers to your reading.',

  SchulteLetters:
    'Find letters in sequence in a grid to practice ordered visual search with reading symbols. Treat completion time as task performance, not proof of faster connected-text reading.',

  SchulteMix:
    'Alternate between numbers and letters in sequence. This optional task challenges switching and visual search without claiming broader reading gains.',

  WordSearchGame:
    'Find hidden words in a letter grid to practice orthographic recognition and systematic visual search. Its score describes word-search performance; use measured passages to evaluate reading transfer.',

  NumberSearch:
    'Find target numbers in a grid and balance speed with accuracy. This optional drill is not used as a reading result.',

  EvenNumbers:
    'Identify even numbers in a stream as an optional selective-attention challenge. Its score is specific to numerical classification.',
};
