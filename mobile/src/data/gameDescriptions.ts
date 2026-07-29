/**
 * Thorough descriptions for each game explaining what it is and what it's for.
 * These are displayed when a game is selected, in the idle state before starting.
 */

import type { GameId } from './gameIds';

export const GAME_DESCRIPTIONS: Record<GameId, string> = {
  RepeatedReading:
    'Read the same short passage twice at a comfortable pace, then answer a comprehension question. Compare both attempts and improve fluency without trading away meaning.',

  WpmTest:
    'Read one of twelve original connected passages while the timer runs, then answer three passage-dependent questions after reading time stops. Complete three different valid passages to build your personal practice estimate. Difficulty changes the number of answer choices without weakening the comprehension check.',

  MainIdeaSprint:
    'Read a short passage, hide it, and state its central idea before answer choices appear. A short cue-free recall buffer reduces recognition guessing; immediate feedback then helps you separate the author’s main claim from supporting details.',

  StructureScan:
    'Preview a short, structured article for a specific information goal, then choose the heading most likely to contain the answer. This builds purposeful skimming without pretending that skimming replaces careful reading.',

  EvidenceHunt:
    'Find the sentence or sentences that justify an answer in connected text. The result keeps answer accuracy, evidence credit, locate time, and wrong selections separate.',

  ContextBuilder:
    'Infer an unfamiliar word as it is used in one highlighted sentence, then identify the numbered sentence clue or clues that support that meaning. Its 72 reviewed words span adjectives, verbs, nouns, and adverbs; the result reports vocabulary-task accuracy, not reading speed.',

  PowerReader:
    'Use Flow, Focus line, or RSVP to experiment with a steady display guide. The configured target is stored separately from measured WPM, and the result counts only the words and chunks actually presented.',

  LetterRecognition:
    'Letter Jumble asks you to scan a crowded letter grid and select every copy of one target. This optional visual-search warm-up measures task speed and accuracy, not reading comprehension.',

  TextSearch:
    'Practice intentional scanning by locating every instance of a target word in a passage. Use this mode when your real reading goal is to find a known term quickly.',

  EyeMovementTraining:
    'Take a short visual-comfort break with gentle blinking and distance focus. This routine may help you pause during screen use, but it does not improve eyesight, diagnose eye health, or measure reading speed.',

  VisualSpanExpansion:
    'Keep your eyes near a central fixation mark while equal-length words flash at several surrounding positions. After they disappear, select the word that occupied one prompted position. A miss shows both choices, costs 5 points, and temporarily narrows the next glance. Treat its score as spatial word-recall performance, not proof of faster connected-text reading.',

  FlashReading:
    'Type a briefly displayed word from memory and track response accuracy. Set or adapt the flash pace anywhere up to 3,000 WPM. A miss keeps your entry and the correct word visible before continuing. This challenge does not by itself demonstrate faster connected-text reading.',

  WordsRecall:
    'View exactly two English words, then type both from memory after they disappear. A miss pauses on your entry and the correct pair. Difficulty changes only vocabulary and display time; comparison ignores case, punctuation, and extra whitespace.',

  SentenceRecall:
    'Read one natural English sentence briefly, then reconstruct it after it disappears. A miss keeps both versions visible longer for comparison. The large prompt deck avoids immediate repetition, and comparison ignores case, punctuation, and extra whitespace.',

  ComprehensionTest:
    'Follow a moving chunk highlight through a connected passage, pause or finish safely, then answer passage-dependent questions. The selected WPM is a configured pacing target, not a measured reading speed.',

  MemoryRecall:
    'Recall short number sequences on a phone-style keypad. A miss pauses on your entry and the correct sequence before difficulty drops or the session ends. Its accuracy describes this task only; it is not a reading-retention score.',

  NumberRecognition:
    'Identify target numbers in a brief visual task. This optional challenge measures number-recognition accuracy rather than reading skill.',

  SymbolRecognition:
    'Identify target symbols among distractors in an optional visual-search challenge. The score is specific to this task.',

  PatternScanning:
    'Locate matching patterns in a grid and compare speed with accuracy. Use it as an optional visual-search warm-up rather than a reading measure.',

  TimedPhraseRecognition:
    'Identify briefly displayed phrases among options with similar word counts and visible lengths. Set or adapt the word-based flash pace up to 3,000 WPM; longer phrases receive proportionally more display time. A miss pauses on your choice and the exact phrase for careful comparison. Results apply to the drill and should not be read as connected-text comprehension.',

  TimedWordRecognition:
    'Choose a briefly displayed word from close-length, similar-looking options so exact recall matters more than button shape. Set or adapt the flash pace anywhere up to 3,000 WPM. A miss pauses on your choice and the correct word before continuing. This optional task records recognition speed and accuracy without making claims about subvocalization.',

  LastWordRecall:
    'Follow a paced stream up to 3,000 WPM that stops unpredictably after 3–10 words, then identify the final word among close-length, similar-looking options. A miss pauses on your choice and the true last word before continuing. This trains attention to serial position and reports drill accuracy; it does not measure passage comprehension.',

  WordMismatchGrid:
    'Compare same-or-different word pairs and find every mismatch. A tap on a matching pair costs time immediately, so guesses cannot be removed without consequence. This is an optional visual-discrimination task, not a comprehension exercise.',

  WordPairs:
    'Match each prompt with its reviewed opposite among the closest-length authored alternatives and track accuracy. Use Opposites as an English vocabulary warm-up; its score does not measure passage comprehension.',

  LetterJumble:
    'Repair an English word whose nearby letters have been transposed, then type the corrected spelling. Letter Mixup is a spelling and pattern challenge; its result is specific to the puzzle.',

  SchulteNumbers:
    'Find numbers in sequence in a stable grid, or choose the harder mode that reshuffles after every correct tap and leaves completed cells uncolored. Wrong taps count as errors but add no artificial time penalty. Monotonic completion time measures this task only; use measured reads to check whether practice transfers to your reading.',

  SchulteLetters:
    'Find letters in sequence in a stable grid, or choose the harder mode that reshuffles after every correct tap and leaves completed cells uncolored. Wrong taps count as errors but add no artificial time penalty. Treat the monotonic completion time as task performance, not proof of faster connected-text reading.',

  SchulteMix:
    'Alternate between numbers and letters in a stable grid, or choose the harder mode that reshuffles after every correct tap and leaves completed cells uncolored. Wrong taps count as errors but add no artificial time penalty. This optional task challenges switching and visual search without claiming broader reading gains.',

  WordSearchGame:
    'Find hidden words in a letter grid to practice orthographic recognition and systematic visual search. Its score describes word-search performance; use measured passages to evaluate reading transfer.',

  NumberSearch:
    'Memorize a briefly shown target number, then find it after the target hides and the grid appears. This optional visual-search and recall drill is not used as a reading result.',

  EvenNumbers:
    'Scan rows and columns to select every even number in a grid. Larger grids, wider ranges, and shorter sessions raise the difficulty; its score is specific to this numerical search task.',
};
