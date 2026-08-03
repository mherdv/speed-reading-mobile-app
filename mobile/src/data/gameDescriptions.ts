/**
 * Thorough descriptions for each game explaining what it is and what it's for.
 * These are displayed when a game is selected, in the idle state before starting.
 */

import type { GameId } from './gameIds';

export const GAME_DESCRIPTIONS: Record<GameId, string> = {
  RepeatedReading:
    'Read the same short passage twice at a comfortable pace, then answer a comprehension question. Compare both attempts and improve fluency without trading away meaning.',

  WpmTest:
    'Read one of eighteen original connected passages while the timer runs, then answer exactly three passage-dependent questions after reading time stops. Complete three different valid passages to build your personal practice estimate. Difficulty changes the number of answer choices without weakening the comprehension check.',

  MainIdeaSprint:
    'Read a short passage, hide it, and state its central idea before answer choices appear. A short cue-free recall buffer reduces recognition guessing; immediate feedback then helps you separate the author’s main claim from supporting details.',

  StructureScan:
    'Preview a short, structured article for a specific information goal, then choose the heading most likely to contain the answer. This builds purposeful skimming without pretending that skimming replaces careful reading.',

  EvidenceHunt:
    'Find the sentence or sentences that justify an answer in connected text. The result keeps answer accuracy, evidence credit, locate time, and wrong selections separate.',

  ContextBuilder:
    'Infer an unfamiliar word as it is used in one highlighted sentence, then identify the numbered sentence clue or clues that support that meaning. Its 72 reviewed words span adjectives, verbs, nouns, and adverbs; the result reports vocabulary-task accuracy, not reading speed.',

  PowerReader:
    'Use full-page Flow, a fixed three-slot Focus Lane, or responsive Return-Sweep Flow with built-in, pasted, or imported text. Each presentation starts from its matching difficulty guide and remains adjustable. The configured target is stored separately from measured WPM, and the result counts only the words and chunks actually presented.',

  CenterLineReader:
    'Read an original connected passage through a fixed center lane at your selected book-like text size. One, two, or up to four-word chunks appear between permanent guide marks while secondary side chunks preserve preview and recovery context. Long terms and chunks can wrap to a second line instead of shrinking or clipping. Pause, step back, or adjust the guide at any time, then answer two passage questions. The selected pace is a configured guide, not a measured reading speed.',

  LetterRecognition:
    'Letter Jumble asks you to scan a crowded letter grid and select every copy of one target. This optional visual-search warm-up measures task speed and accuracy, not reading comprehension.',

  TextSearch:
    'Practice intentional scanning by locating every instance of a target word in a passage. Use this mode when your real reading goal is to find a known term quickly.',

  EyeMovementTraining:
    'Take a short visual-comfort break with gentle blinking and distance focus. This routine may help you pause during screen use, but it does not improve eyesight, diagnose eye health, or measure reading speed.',

  ReadingSaccades:
    'Follow short word groups from left to right across centered, width-aware lines, then continue at the beginning of the next line. Pause, step back, or finish safely and answer a passage question. The drill records guide completion and comprehension; it does not track your gaze, treat vision, or prove faster reading.',

  VisualSpanExpansion:
    'Keep your eyes near a central fixation mark while equal-length words flash at surrounding positions. The selected difficulty sets the word band, while a saved 15-level flash ladder expands the span, shortens exposure, and introduces an opaque lower marker only after the clear stages are mastered. A miss shows both choices, costs 5 points, and narrows the next glance. Treat its score as spatial word-recall performance, not proof of faster connected-text reading.',

  FlashReading:
    'Type a briefly displayed fitted word from memory. The selected difficulty sets the vocabulary band; a saved 15-level challenge begins with shorter clear words, then adds length, pace, and finally an opaque lower marker from stage 10. Play again resumes both the shuffled deck and the fastest pace sustained by a full correct run, up to 3,000 WPM. A miss keeps the correction visible and makes the next flash easier. This task does not by itself demonstrate faster connected-text reading.',

  WordsRecall:
    'View exactly two English words, then type both from memory after they disappear. The selected difficulty sets vocabulary and base exposure; a saved 15-level ladder begins with shorter clear pairs, then adds length, speed, and an opaque lower marker after clear stages. Each play has eight prompts and replay resumes the remaining shuffled deck. Comparison ignores case, punctuation, and extra whitespace.',

  SentenceRecall:
    'Read one natural sentence, then reconstruct it after it disappears. The selected difficulty sets the language band and base exposure; a saved 15-level ladder opens progressively longer sentences, shortens exposure, and introduces an opaque lower marker after nine clear levels. Each play has eight prompts and replay resumes the 240-sentence shuffled working deck. Comparison ignores case, punctuation, and extra whitespace.',

  ComprehensionTest:
    'Follow a moving chunk highlight through a connected passage, pause or finish safely, then answer passage-dependent questions. The selected WPM is a configured pacing target, not a measured reading speed.',

  MemoryRecall:
    'Recall number sequences on a phone-style keypad. The selected difficulty sets the base length and exposure; a saved 15-level ladder resumes demonstrated sequence length, shortens the flash, and adds an opaque lower marker only at later levels. A miss pauses on both sequences before difficulty drops or the session ends. Its accuracy describes this task only; it is not a reading-retention score.',

  NumberRecognition:
    'Identify target numbers in a balanced, unpredictably shuffled Match/No Match stream, so repeating one response cannot pass. The selected difficulty sets the starting digit count; a saved 15-level challenge progressively adds similar distractors and longer numbers, shortens the response window, and introduces an opaque lower marker only after clear stages. This optional challenge measures number-recognition accuracy rather than reading skill.',

  SymbolRecognition:
    'Identify target symbols in a balanced, unpredictably shuffled Match/No Match stream, so repeating one response cannot pass. This optional visual challenge reports a task-specific score.',

  PatternScanning:
    'Locate matching patterns in a grid and compare speed with accuracy. Use it as an optional visual-search warm-up rather than a reading measure.',

  TimedPhraseRecognition:
    'Identify briefly displayed phrases from a 240-item shuffled deck among similarly shaped options. The selected difficulty sets the language band; a saved 15-level challenge begins with shorter clear phrases, then adds length, pace, and an opaque lower marker from stage 10. Replay resumes the deck and the fastest pace sustained by a full correct run, up to 3,000 WPM. A miss shows both choices and makes the next flash easier. Results apply to the drill, not connected-text comprehension.',

  TimedWordRecognition:
    'Choose a briefly displayed fitted word from similar-looking options. The selected difficulty sets the vocabulary band; a saved 15-level challenge starts with shorter clear words, then adds length, pace, and an opaque lower marker from stage 10. Replay resumes the shuffled deck and the fastest pace sustained by a full correct run, up to 3,000 WPM. A miss shows the correction and makes the next flash easier. This task records recognition accuracy without making claims about subvocalization.',

  LastWordRecall:
    'Follow a fitted word stream that stops unpredictably, then identify its final word among similarly shaped options. A saved 15-level challenge starts with clear 3–4-word streams and grows toward 6–10 words before introducing an opaque lower marker; the fastest pace sustained by a full correct run also resumes, up to 3,000 WPM. Stream words use persistent shuffled decks, and a miss shows the answer and makes the next stream easier. This reports drill accuracy, not passage comprehension.',

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
    'Memorize a briefly shown fitted number, then find it after the target hides and the grid appears. The selected difficulty sets the starting grid and range; a saved 15-level challenge grows the grid and target digit length, shortens the preview, and introduces an opaque lower marker after clear stages. The first wrong tap marks that target as one adaptive miss; extra taps cannot multiply the penalty or change the clock. This visual-search drill is not used as a reading result.',

  EvenNumbers:
    'Scan rows and columns to select every even number in a grid. Larger grids, wider ranges, and shorter sessions raise the difficulty; its score is specific to this numerical search task.',
};
