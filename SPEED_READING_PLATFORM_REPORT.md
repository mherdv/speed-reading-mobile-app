# SpeedRead exercise, competitor, and game-design report

Date: 2026-08-04
Scope: mobile speed-reading practice, comprehension, scanning, recognition, and screen comfort

## Revision record

| Revision | Status | What changed |
| --- | --- | --- |
| V1 | Complete | Initial market scan, evidence boundary, exercise taxonomy, and rules for all 24 live games. |
| V2 | Complete | Separated task proximity from causal evidence, added measurement guardrails, strengthened the Structure Scan specification, and extended manual control to Schulte Mix. |
| V3 | Complete | Centralized metadata design, refined adaptive defaults, added audience/accessibility constraints, and fixed the final implementation scope. |
| V4 | Complete | Added shuffled word decks, 240-session phrase template pools, adjustable/auto-stepping WPM, Last Word serial recall, persistent favorites/recent games, and an icon-first Home carousel. |
| V5 | Complete | Removed category segregation and the separate Training Library; Home now presents the complete searchable 28-game catalog beneath the one-card reading-first plan, with Favorites as the only separate game collection. |
| V6 | Complete | Made all flash-recognition sessions open-ended with a voluntary finish, a three-consecutive-miss stop rule, and upward-only WPM steps after 4 correct recalls or 8 correct recognition choices. Protected the game header so description cards cannot cover Back. |
| V7 | Complete | Re-audited the requested competitor-style drills, corrected durable-name collisions, specified preview-before-search and multi-select scanning rules, separated one-word/two-word/sentence recall, and documented exact content-pool sizes and replay limits. |
| V8 | Complete | Re-reviewed the report against the implementation, added a current 31-exercise source-of-truth inventory, made guided versus measured WPM explicit, documented Power Reader’s three modes and offline boundary, and corrected obsolete rules for Comprehension, Number Search, Opposites, Letter Mixup, Word Pair Scan, and Even Numbers. |
| V9 | Complete | Completed two reviewer–implementer correction cycles, closed result-integrity and double-tap exploits, replaced overlapping hit areas with real phone-size targets, verified all 31 game lifecycles, and reran the full release checks plus live 320 px browser QA. |
| V19 | Complete | Expanded every undersized lexical pool, raised phrase-template variety to 5,832 combinations per level, and replaced biased or retry-based random selection with tested bounded Fisher–Yates decks. |
| V20 | Complete | Added session coaching, continuous Today-plan navigation, replay-safe adaptive progression, balanced calibration trials, monotonic reading timers, and serialized result navigation. |
| V21 | Complete | Expanded undersized connected-text and lexical banks, semantically audited the retained banks, repaired authored-content quality, and added full-cycle, non-overlapping, and answer-remapping safeguards. |
| V22 | Complete | Standardized responsive brief stimuli, added opaque progressive lower-glyph markers by difficulty, removed unnecessary flash-card framing, and compacted Hard phrase generation for phone legibility. |
| V23 | Complete | Replaced immediate difficulty-band masking with a persistent 15-level flash ladder: content and exposure grow through nine clear levels, opaque masking begins at level 10, misses lower live load, and demonstrated levels resume in later sessions. |
| V24 | Complete | Hardened flash progression after two reviewer passes: higher stages now sample genuinely harder content, sustained pace resumes up to 3,000 WPM, number length and spatial/digit span grow deterministically, fixed authored sessions cannot inflate mastery, delayed storage loads cannot erase checkpoints, and result reports use the settings actually played. |
| V25 | Complete | Added Return-Sweep Flow and Focus Lane as comprehension-checked guided-reading labs, kept their configured pace out of measured WPM, and documented the evidence boundary around return sweeps, centered chunks, preview, and regressions. |
| V26 | Complete | Added Page Glimpse, Preview Catch, Peripheral Letters, Peripheral Words, and a Line-Landing variation inside Return-Sweep Flow. Two reviewer–implementer passes then hardened unique checkpoint accounting, adaptive qualification, task-specific history, measured-board geometry, keyboard/Dynamic Type layout, reduced motion, and explicit VoiceOver exposure/feedback controls. |

## Executive decision

SpeedRead should be a **reading-efficiency platform**, not a product that promises implausible WPM without comprehension. Its primary outcome is the fastest pace at which a reader can still retrieve the main idea and important details. Visual-search, flash-recognition, and memory games can remain available as optional skill labs, but their scores must not be presented as proof of faster connected-text reading.

The platform should have three layers:

1. **Recommended reading practice** — measured reading, repeated reading, comprehension, main-idea retrieval, flexible pace, and purposeful scanning.
2. **Optional skill labs** — word/phrase recognition, visual search, vocabulary, and working memory. These report task-specific accuracy or speed.
3. **Screen comfort** — breaks and natural blinking, with no eyesight-treatment claims.

This boundary follows the major review of speed-reading research: increasing presentation speed beyond normal reading rates generally reduces comprehension and memory, while practice, language skill, vocabulary, knowledge, and strategic skimming are more credible levers. See [Rayner et al., 2016](https://journals.sagepub.com/doi/10.1177/1529100615623267).

## Competitor apps currently offering related training

These products were verified from official sites or current app-store listings in July 2026. Feature descriptions are what the products advertise; they are not independent proof that every claim transfers to ordinary reading.

| App | Platforms / position | Main mechanics | Useful product lesson |
| --- | --- | --- | --- |
| [Outread](https://outreadapp.com/) | iPhone, iPad, Mac | Guide highlighting, RSVP Flash mode, adjustable WPM/chunk length, comprehension tests, daily lessons, eight training games, document/book imports, notes and stats | Strong combination of real reading, configurable presentation, a daily plan, and a separate training area |
| [Spreeder](https://www.spreeder.com/) | Web/cloud learning platform | RSVP reader, cloud library, courses, pasted/imported text, reading and vocabulary training | Imported personal content and a structured course make practice feel useful outside a game |
| [Acceleread](https://accelereadapp.com/) | iOS and Android | Baseline assessment, personalized program, comprehension-oriented speed practice | Begin with a baseline and personalize progression |
| [SwiftRead](https://swiftread.com/) | Web/extension | RSVP-style reading for webpages and documents, configurable speed | Fast “read this now” workflow is valuable, but comprehension safeguards are needed |
| [AceReader](https://www.acereader.com/) | Web, education, family and desktop products | Baseline/post assessments, daily timed comprehension, pacing drills, games, leveled text, classroom reporting | Calibrate drills from measured reading and compare equivalent text levels |
| [Reedy](https://play.google.com/store/apps/details?id=azagroup.reedy) | Android | Normal reading, RSVP up to user-selected rates, text-to-speech, document reading | Users value switching between normal, guided, and listening modes |
| [ReadMe!](https://apps.apple.com/us/app/readme-spritz-beeline/id877697552) / Spritz | iOS | Spritz RSVP and BeeLine-style visual formatting for books and documents | Alternative presentation can be an accessibility/preference tool rather than a training claim |
| [QuickReader](https://apps.apple.com/us/app/quickreader-speed-reading/id333441801) | iPhone and iPad | Guided reading across ebooks, wide speed range, themes and layout controls | A reader should allow comfortable typography and user control |
| [Readlax](https://www.readlax.com/brain-training) | Web, iOS, Android | Short brain games, speed-reading exercises, mini-books, memory/focus training, speed/comprehension tests | A broad library needs honest categories so brain-game scores are not confused with reading outcomes |
| [Schulte Table](https://play.google.com/store/apps/details?id=com.greenkeyuniverse.schultetable) | Android | Number/letter tables, course progression, history and leaderboards | Schulte users expect controlled grid sizes and history; marketing claims should be treated cautiously |

### Competitor gap SpeedRead can own

Many products advertise “2×” or “3×” reading. SpeedRead can be more trustworthy by showing:

- measured WPM only when the user actually read connected text;
- comprehension beside WPM, never as an invented percentage;
- a **sustainable pace** trend rather than only a personal-best speed;
- clear labels for “reading practice,” “skill lab,” and “comfort”;
- manual difficulty everywhere, with Adaptive as an explicit choice;
- rules and difficulty changes before the user starts;
- transfer checks: optional lab practice is compared with later measured reads, not assumed to work.

## Product tiers used in the platform

These tiers describe **how directly an activity practices a reading behavior**. They are not a claim that a game has been proven to cause a general reading-speed increase.

| Tier | Task proximity | Typical evidence position | Product treatment |
| --- | --- | --- |
| A — Reading practice | Direct connected-text fluency, comprehension, retrieval, or purposeful information finding | Evidence varies by population and intervention; the result itself still measures real reading | Recommended; only comprehension-verified results may influence sustainable pace |
| B — Related skill | Word recognition, vocabulary, visual search, or working memory | Near-task learning is plausible; general reading transfer is uncertain | Available in the library as “Skill lab”; results stay task-specific |
| C — Experimental | Commercial speed-reading convention or indirect cognitive/visual drill | Weak or absent evidence for ordinary connected-text transfer | Optional “Experimental lab”; never used to calculate reading improvement |
| W — Wellness | Screen comfort rather than reading ability | Comfort guidance, not performance treatment | Separate wellness category; no result interpreted as skill |

### Measurement guardrails

- **Sustainable pace** requires actual connected text, measured reading time, and a comprehension threshold.
- The personal benchmark uses only the latest six distinct eligible passages from one comparison band and content version within the last 30 days. It requires at least three distinct passage forms and never mixes bands or versions.
- Sustainable WPM is the median of passages that individually reached at least 80% comprehension; a high aggregate score cannot make a poorly understood fast passage influence that pace.
- Baseline answer positions are deterministically balanced while preserving the keyed answer, preventing the repeated option-position cue found during review.
- Guided-display WPM is a presentation setting, not a measured reading rate.
- Recognition, Schulte, visual-span, memory, and search scores are never merged into WPM charts.
- Adaptive reading difficulty may change only from comparable recent results, not from one best score.
- Optional lab completion may affect a streak or library history, but not a reading-level recommendation.
- A wrong comprehension answer should recommend a slower or equivalent pace, never a harder reading passage solely because the read was fast.
- “Improved” means improvement against the user’s own comparable baseline; the product should not promise a multiple such as “3×.”

Supporting evidence:

- Repeated-reading research is strongest in developing/struggling readers and remains limited for typical adults. A recent adult study involved only two adults with learning disabilities, so it is promising rather than a universal guarantee: [Halkowski & Kubina](https://pubmed.ncbi.nlm.nih.gov/38966273/).
- Retrieval practice and main-idea generation can support learning and comprehension: [retrieval practice for instructional text](https://onlinelibrary.wiley.com/doi/10.1002/acp.3984) and [main-idea/text-structure intervention](https://pmc.ncbi.nlm.nih.gov/articles/PMC7539662/).
- RSVP can display text quickly, but high rates remove regressions and parafoveal preview and can degrade comprehension: [Rayner et al.](https://journals.sagepub.com/doi/10.1177/1529100615623267) and [RSVP speed-limit study](https://pubmed.ncbi.nlm.nih.gov/27088226/).
- Visual-span/peripheral training has produced near-task gains in laboratory or low-vision-oriented conditions, but that does not establish broad transfer to everyday central reading: [letter recognition and peripheral reading](https://pmc.ncbi.nlm.nih.gov/articles/PMC2729075/).
- No direct controlled evidence was located showing that Schulte tables increase normal connected-text reading speed. They remain visual-search/attention games.

## Complete exercise roadmap

“Live” means implemented in the repository. “Next” means a recommended addition. “Later” means useful only after the core measurement loop is mature. “Do not prioritize” means redundant or too weakly connected to reading.

This is a comprehensive **actionable** catalog for the current product, not a claim that no other reading exercise could ever be invented.

### Connected reading and comprehension

| Exercise | Status | Tier | Core rule |
| --- | --- | --- | --- |
| Baseline measured read | Live | A | Read a passage once, stop timing before questions, then report WPM with comprehension |
| WPM Test | Live | A | Read connected text, stop timing before questions, then report actual word count, measured WPM, comprehension, and quality flags |
| Repeated Reading | Live | A | Read the same passage twice and compare pace only after a comprehension check |
| Main Idea | Live | A | Read, hide the passage, retrieve the point, then choose and explain the best main idea |
| Page Glimpse | Live | A | Read a brief one-to-four-line connected-text glimpse, then retrieve its missing phrase, detail, or main idea without reopening it |
| Comprehension | Live | A | Follow an adjustable paced highlight, pause or finish safely, then answer passage-dependent questions |
| Purposeful Text Search | Live | A | Find every requested term in connected text |
| Structure Scan | Live | A | Preview a structured passage and choose the section most likely to answer a stated reading goal |
| Pace Ladder | Next | A | Read equivalent passages at gradually higher target paces; keep only the fastest pace that preserves comprehension |
| Variable Pace | Next | A | Mark familiar, new, and critical sections; read each at a deliberately different pace |
| Detail Retrieval | Next | A | Hide a passage and retrieve names, quantities, causes, or steps |
| Inference Check | Next | A | Answer what is implied, then reveal the evidence sentences |
| Summary Compression | Next | A | Reduce a passage to one sentence without losing its central claim |
| Delayed Recall | Next | A | Re-answer a key question several minutes or a day later |
| Error-Guided Reread | Next | A | After a wrong answer, locate and reread only the evidence needed to correct it |
| Question-First Scan | Next | A | Read a question first, scan for its answer, then verify surrounding context |
| Headline-to-Argument Map | Later | A | Match headings to claims and supporting evidence |
| Compare Two Sources | Later | A | Find agreement, disagreement, and evidence across two short texts |
| Table/Data Scan | Later | A | Locate a value or trend in a table and connect it to explanatory prose |
| Citation/Reference Scan | Later | A | Find who made a claim, when, and where the source is cited |
| Proofreading Pace | Later | A | Read for a specific error type under time while maintaining accuracy |

### Guided pacing and presentation

| Exercise | Status | Tier | Core rule |
| --- | --- | --- | --- |
| Power Reader | Live | B | Use full-page Flow, a three-slot Focus Lane, or responsive Return-Sweep Flow with built-in or pasted text; pause or adjust pace; do not call its configured rate measured WPM |
| Return-Sweep Flow + Line-Landing (`ReadingSaccades`) | Live | B | Follow highlighted chunks across stable lines, or identify a briefly flashed next-line beginning during each return; finish with comprehension and keep configured pace separate from measured WPM |
| Focus Lane (`CenterLineReader`) | Live | B | Read centered 1-, 2-, or 4-word chunks between fixed guides with neighboring chunks retained for preview/regression, then answer two comprehension questions |
| Flash Recall | Live | C | View one word briefly, type it, and track recognition accuracy |
| Words Recall | Live | B | View exactly two words, hide them, and type them back in order |
| Sentence Recall | Live | B | View a natural sentence, hide it, and reconstruct its words in order |
| Word Flash | Live | B | View a word, then choose it from distractors |
| Phrase Flash | Live | B | View a phrase, then choose it from distractors |
| Last Word | Live | B | Follow a paced word stream, then identify the final item |
| Phrase RSVP | Later | C | Show short grammatical chunks serially with punctuation-aware pauses |
| Line Pacer | Later | B | Move a guide down ordinary text while allowing regressions and pause |
| Chunk Boundary Practice | Later | B | Mark meaningful phrase boundaries rather than arbitrary fixed word counts |
| RSVP Reader | Later | C | Present one word/chunk at a fixed location with prominent comprehension and pause controls |
| Contrast/Bionic Formatting Trial | Later | C | Let users compare formatting preferences without claiming faster comprehension |
| Read-Along Audio | Later | B | Synchronize text highlighting with speech and allow adjustable narration speed |

### Scanning and visual search

| Exercise | Status | Tier | Core rule |
| --- | --- | --- | --- |
| Word Search | Live | B | Trace every letter of hidden target words in order |
| Schulte Numbers | Live | C | Tap shuffled numbers from 1 upward |
| Schulte Letters | Live | C | Tap shuffled letters from A upward |
| Schulte Mix | Live | C | Alternate number and letter targets in order |
| Pattern Scan | Live | C | Find target patterns among distractors |
| Letter Jumble | Live | B | Select all copies of a target letter in a grid |
| Number Search | Live | C | Locate a target number in a changing grid |
| Number Hunt | Live | C | Decide whether the current number matches the target |
| Symbol Hunt | Live | C | Decide whether the current symbol matches the target |
| Word Pair Scan | Live | B | Select every mismatching word pair; a matching-pair tap immediately costs time |
| Even Numbers | Live | C | Scan a number grid by rows or columns and select every even value |
| Preview Catch | Live | B | Recognize a briefly shown upcoming word beside central focus, then complete a passage-meaning check |
| Peripheral Letters | Live | C | Keep central fixation while a balanced left/right trigram flashes, then type all three letters in order |
| Peripheral Words | Live | B | Keep central fixation while a balanced left/right word flashes, choose it among close-looking alternatives, and periodically verify meaning |
| Guided Row Scan | Later | C | Sweep rows left-to-right and reverse with accuracy targets |
| Multi-Target Search | Later | B | Hold two target words and find both in connected text |
| Distractor Resistance | Later | B | Find a meaningful target among visually similar nonwords |

### Vocabulary, language, and memory

| Exercise | Status | Tier | Core rule |
| --- | --- | --- | --- |
| Opposites | Live | B | Match a word to its reviewed opposite among plausible alternatives |
| Letter Mixup | Live | B | Correct a real word whose two nearby letters were transposed |
| Memory Recall | Live | B | Recall digit sequences that grow after success |
| Visual Span | Live | C | Recall briefly shown items around a fixation point |
| Vocabulary in Context | Next | A/B | Infer a word’s meaning from a sentence, then reveal context evidence |
| Morphology Builder | Next | B | Combine roots, prefixes, and suffixes to decode unfamiliar words |
| Collocation Match | Later | B | Match words that naturally occur together |
| Semantic Category Sprint | Later | B | Sort words by meaning while tracking accuracy |
| Sentence Completion | Later | B | Choose the word that best preserves grammar and meaning |
| Working-Memory Instructions | Later | B | Read multi-step instructions, hide them, and execute the steps in order |
| Reading N-back | Do not prioritize | C | Track repeated words/ideas across a stream; too indirect for the current product |

### Screen comfort

| Exercise | Status | Tier | Core rule |
| --- | --- | --- | --- |
| Eye Reset | Live | W | Blink naturally, look away for a chosen interval, and record comfort |
| Ergonomic Setup Check | Later | W | Check distance, text size, glare, and posture without diagnosing health |
| Optional Break Reminder | Later | W | User-configured reminder; no fixed formula presented as treatment |
| Convergence/pencil exercises | Do not build | — | Medical/vision-therapy exercises require individual professional assessment |

## Rules for every live game

All games must show their rules before start, support manual Easy/Medium/Hard, report once, clear timers on exit, and provide a replay path. Adaptive mode is optional. Reading-practice games start adaptive; optional labs start manual. All Schulte tables and Eye Reset remain manual-only.

### 1. Repeated Reading

- Read the first passage at a comfortable pace and tap finished.
- Read the same passage a second time.
- Answer the comprehension question.
- Result: first and second WPM, comprehension, and change between passes.
- Difficulty: selects from an explicitly reviewed bank of 10 Easy, 10 Medium,
  or 10 Hard passages. A shuffled deck presents every passage in the selected
  level before reuse.

### 2. Main Idea

- Read a short passage.
- Hide it and state the central point without answer-choice cues.
- After the 3/5/8-second Easy/Medium/Hard retrieval buffer, reveal the choices
  explicitly rather than changing screens automatically.
- Choose the best main idea from several options.
- Review an explanation before finishing.
- Difficulty: 3, 4, or 5 main-idea rounds with explicit, synthesis, or
  qualification-focused passages. Each current passage uses four plausible
  answer options.
- This short buffer reduces immediate recognition cueing. It is not a
  minutes-later or next-day retention measurement; a true delayed-recall
  exercise still requires separate withheld prompts.

### 3. Power Reader

- Choose the built-in article, custom text, or a public-domain book.
- Choose full-page Flow, a fixed three-slot Focus Lane, or responsive
  Return-Sweep Flow presentation. These reuse Power Reader's selected text and
  lifecycle rather than starting the separate games or inventing questions for
  pasted/imported material.
- Follow the highlighted phrase; pause, resume, or adjust the guide speed.
- Finish when the text is complete.
- Result: configured target, unique words/chunks/pages actually presented, article, and active guide time. Stored measured WPM is zero.
- Progression integrity: the session is successful for mastery only when at least 90% of the document’s unique words were actually presented. Page-skipping still produces an honest result but cannot award successful progression.
- Legacy history: older `PowerReader` records without an activity type are displayed as Guided pace, using their old WPM or score as the configured guide value rather than relabeling them measured WPM.
- Difficulty: Flow starts at 150 WPM/2-word, 300 WPM/3-word, or 500 WPM/5-word
  chunks. Focus Lane starts at 160/1, 250/2, or 360/4. Return-Sweep Flow starts
  at 150/2, 230/3, or 320/3 with responsive 12/14/16-word line ceilings.
- Offline boundary: the built-in article and pasted text are local; browsing or reopening Project Gutenberg books requires a connection.

### 4. Flash Recall

- A word flashes briefly.
- Type the word from memory.
- Continue through a shuffled, de-duplicated difficulty-specific deck; finish
  voluntarily or after three consecutive misses. In-screen replay resumes the
  unused deck cursor, and refill occurs only after the full pool has appeared.
- Set a starting WPM. The live pace rises by 25 WPM after four consecutive correct recalls. A miss resets the correct streak but does not reduce WPM.
- Result: actual attempts, correct answers, recognition accuracy, ending failure streak, initial/final WPM, and pace-change count. This WPM is presentation pace, not measured connected-text reading.
- Difficulty: common words at 120 WPM; academic words at 220 WPM; or advanced words at 320 WPM with the lower word area masked.

### 5. Comprehension

- Follow the moving chunk highlight at the displayed target pace.
- Pause, resume, or finish the reading phase safely when ready.
- Answer every passage-dependent question and review feedback.
- Result: percentage correct, session time, and configured target pace; the target is not reported as measured WPM.
- Difficulty: 180/260/340 WPM, 3/4/5-word chunks, and 1/2/3 questions across
  10 curated passages per level. The full selected-level deck is exhausted
  before reuse, and its 30 training passages are disjoint from Baseline
  Reading’s assessment forms.

### 6. Schulte Numbers

- Choose a stable grid or a harder moving grid that reshuffles after every correct non-final tap.
- Tap numbers in ascending order from 1.
- Incorrect taps add mistakes but do not advance the sequence or add a synthetic time penalty. Completed cells remain uncolored in moving-grid mode.
- Result: monotonic completion time, accuracy, mistakes, grid mode, and accuracy-adjusted items per minute.
- Manual difficulty: 3×3, 4×4, or 5×5.

### 7. Schulte Letters

- Choose a stable grid or a harder moving grid that reshuffles after every correct non-final tap.
- Tap letters alphabetically from A to the final visible letter.
- Incorrect taps add mistakes without a synthetic time penalty. Completed cells remain uncolored in moving-grid mode.
- Result: monotonic completion time, accuracy, mistakes, grid mode, and accuracy-adjusted items per minute.
- Manual difficulty: 3×3, 4×4, or 5×5.

### 8. Schulte Mix

- Choose a stable grid or a harder moving grid that reshuffles after every correct non-final tap.
- Follow the displayed sequence by alternating numbers and letters.
- Tap the next requested item; incorrect taps add mistakes without a synthetic time penalty. Completed cells remain uncolored in moving-grid mode.
- Result: monotonic completion time, accuracy, mistakes, grid mode, and accuracy-adjusted items per minute.
- Manual difficulty: 3×3, 4×4, or 5×5. A 7×7 alternating grid is too dense for reliable small-screen interaction and is removed from the recommended configuration.

### 9. Eye Reset

- Record a small number of natural, gentle blinks.
- Put the device down and look across the room for the selected interval.
- Report whether the eyes feel comfortable, unchanged, or uncomfortable.
- Result: break duration and comfort only; no reading or eyesight score.
- Manual difficulty: Quick (3 blinks/10 s), Standard (5/20 s), Extended (8/40 s).

### 10. Visual Span

- Keep attention near the center + while equal-length words appear at distinct
  surrounding positions.
- After the flash, identify which word occupied one prompted position. Choices
  include other displayed words, so position memory—not word length—is needed.
- A miss costs 5 points and temporarily removes one position. Three correct
  position recalls restore one position up to the manually selected ceiling;
  three consecutive misses end the set after the correction is reviewed.
- Result: position-recall accuracy, score, widest/final span, misses, and actual
  presentation duration. This remains an optional spatial-attention drill, not
  a measured-reading result.
- Difficulty: 3/5/7 positions, compact/standard/wide spread,
  1600/1200/850 ms, and 3/4/5 equal-length choices.

### 11. Pattern Scan

- Find all copies of the requested pattern in a grid.
- Submit or continue through rounds while the timer runs.
- Result: correct selections, errors, speed, and accuracy.
- Difficulty: 4×4/45 s, 5×5/35 s, or 6×6/30 s with greater target density.

### 12. Word Flash

- View a word briefly.
- Choose the word from distractors after it disappears.
- Continue through a shuffled difficulty-specific deck; finish voluntarily or
  after three consecutive misses. In-screen replay resumes the unused deck
  cursor, and refill occurs only after every word has appeared.
- Set a starting WPM. The live pace rises by 25 WPM after eight consecutive correct choices. A miss resets the correct streak but does not reduce WPM.
- Result: actual attempts, recognition accuracy, score, ending failure streak, initial/final WPM, and pace-change count.
- Difficulty: common words at 120 WPM, academic words at 220 WPM, or advanced words at 320 WPM.

### 13. Phrase Flash

- View a grammatical phrase from a 240-item working pool generated from the
  selected level’s 13,824 compatible combinations.
- Choose the exact phrase from four options.
- Continue until voluntary finish or three consecutive misses. In-screen replay
  resumes the remaining shuffled pool instead of regenerating it; all 240
  phrases appear before refill. Eight consecutive correct choices raise the
  pace by 25 WPM; a miss resets that correct streak.
- Result: actual attempts, correct choices, recognition accuracy, ending failure streak, initial/final WPM, and pace-change count.
- Difficulty: shorter grammatical phrases start at 180 WPM, longer
  sentence-like phrases at 260 WPM, and complex reasoning sentences at 360 WPM.

### 13a. Last Word

- Watch a sequence of words shown one at a time.
- After the stream ends, choose the final word from four options; earlier stream words are used as distractors when possible.
- Every stream stops independently after a random 3–10 words. Its words consume
  one continuous no-replacement difficulty deck across rounds and in-screen
  replays; refill occurs only after the full vocabulary cycle.
- Set a starting WPM. Four consecutive correct recalls raise it by 25 WPM; a miss resets that streak without reducing pace. Finish voluntarily or after three consecutive misses.
- Result: actual attempts, final-word recall accuracy, ending failure streak, sequence length, initial/final WPM, and pace-change count.
- Difficulty: Easy/Medium/Hard changes vocabulary and starts at 180/280/380 WPM;
  it does not replace the independent random 3–10-word stopping rule.

### 14. Opposites

- Read the prompt word.
- Choose its reviewed opposite from the available alternatives.
- Continue until time expires.
- Result: matches and accuracy.
- Difficulty: 45, 30, or 20 seconds.

### 15. Text Search

- Read the target word.
- Find every exact occurrence in the connected paragraph.
- A correct tap marks the occurrence; wrong taps reduce accuracy.
- Result: found count, errors, completion time, and accuracy.
- Each word is a rendered, non-overlapping control at least 44 points high.
- Difficulty: unlimited with visible count; 30 seconds; or 20 seconds with the total target count hidden.

### 16. Word Search

- Find each listed hidden word.
- Trace every letter in order; single-letter taps do not award a word.
- Words may run horizontally, vertically, backward, or diagonally according to difficulty.
- Result: words found, incorrect traces/taps, speed, and accuracy.
- Targets come from large shuffled difficulty pools and do not immediately repeat.
- Difficulty: 4×4/common four-letter words/forward directions/90 seconds; 5×5/words up to five letters/orthogonal directions/60 seconds; or 6×6/words up to six letters/all directions/45 seconds. Every rendered cell remains at least 44×44 points without overlapping hit areas.

### 17. Number Search

- Memorize the target during a brief preview.
- Find it only after the target hides and the grid appears.
- Tap it to generate the next target preview/grid; wrong taps count as attempts.
- Continue until time expires.
- Result: correct finds and accuracy.
- Difficulty: 4×4/range 0–49/1.2 s preview/45 s; 5×5/0–199/0.9 s/35 s; or 6×6/0–999/0.65 s/25 s.

### 18. Letter Jumble

- Find every copy of the target letter.
- Select cells and submit the round.
- Continue through timed rounds.
- Result: correct targets, missed/wrong selections, and accuracy.
- Difficulty: 4×4 with 3 targets/30 s; 5×5 with 5/25 s; or 6×6 with 8/20 s.

### 19. Number Hunt

- Compare the current digit with the displayed target.
- Tap Match or No Match.
- The stream advances after every answer.
- Result: decisions, correct answers, and accuracy.
- Difficulty: 30, 20, or 12 seconds.

### 20. Symbol Hunt

- Compare the current symbol with the target.
- Tap Match or No Match.
- Continue until the timer ends.
- Result: decisions, correct answers, and accuracy.
- Difficulty: 30, 20, or 12 seconds.

### 21. Letter Mixup

- Inspect a valid English word with exactly two nearby letters transposed.
- Type the corrected word or request its part-of-speech and definition hint.
- Continue until time expires.
- Result: solved words and accuracy.
- Difficulty: common 4–6-letter edge transpositions; 6–9-letter internal transpositions; or subtle internal transpositions in 8+-letter words.

### 23. Even Numbers

- Scan the grid systematically by rows or columns.
- Select every even number, then check the whole grid.
- Result: correct selections, selected odd numbers, missed evens, and accuracy.
- Difficulty: 4×4/range 0–40/45 s; 5×5/0–120/35 s; or 6×6/0–500/25 s.

### 24. Memory Recall

- Memorize the displayed digit sequence.
- Re-enter it in order after it disappears.
- A correct answer increases sequence length and resets the failure streak.
- An incorrect answer subtracts 10 points, reduces the next sequence by one digit
  (minimum one), and continues the session.
- Three consecutive incorrect sequences finish the attempt.
- Result: maximum/final length, correct sequences, failures, ending failure
  streak, score, and accuracy.
- Difficulty: starts at 3/4/5 digits displayed for 1500/1100/800 ms.

### 25. Structure Scan

- Read a specific information goal before previewing the article.
- Use the article title, headings, and section text to build a quick map.
- After the article hides, choose the section most likely to answer the goal.
- Review the correct heading and evidence before continuing.
- Result: routes found, accuracy, and average decision time.
- Difficulty: 3 untimed sections/3 rounds; 4 sections with a 35-second preview/4 rounds; or 5 sections with a 25-second preview/5 rounds.

### 26. Baseline Reading (WPM Test)

- Start the timer only when the connected passage appears.
- Tap Done before answering; reading time stops before the comprehension phase.
- Answer exactly three passage-dependent questions for every form.
- Result: actual passage word count, measured WPM, comprehension correct/total, and measurement-quality flags.
- Difficulty: every level uses the same 18 baseline forms and three questions.
  Easy/Medium/Hard changes only distractor load, presenting 2/3/4 choices per
  question. This assessment bank is separate from paced Comprehension’s
  10-passage-per-level training bank.

### 27. Words Recall

- View exactly two English words and type both back in the same order after they hide.
- Case, punctuation, and repeated whitespace do not affect scoring.
- Result: correct prompts, eight actual attempts, and accuracy.
- Difficulty: common/intermediate/advanced vocabulary shown for 1.6/1.1/0.7
  seconds. Easy/Medium/Hard provide 364/308/384 rotating prompts. Each play
  presents eight, and in-screen replay resumes the remaining cursor so every
  source word is covered before the selected deck refills.

### 28. Sentence Recall

- Read one natural English sentence and reconstruct it after it hides.
- Preserve word identity and order; case, punctuation, and repeated whitespace do not affect scoring.
- Result: correct reconstructions, eight actual attempts, and accuracy.
- Difficulty: short/simple, longer, or compact analytical sentences shown for 2.2/1.6/1.1
  seconds. Each level has 13,824 compatible combinations and generates a
  240-item unique working pool. Each play presents eight prompts; in-screen
  replay continues the pool cursor until the full 240-item cycle is complete.

### 29. Evidence Hunt

- Read an information question and scan a connected passage.
- Select the required evidence sentence or sentences, then answer the question.
- Result: answer accuracy, evidence accuracy, wrong evidence selections, and locate time remain separate.
- Difficulty: direct single-sentence evidence; paraphrased evidence; or a bounded inference requiring outcome and limitation evidence.

### 30. Context Builder

- Read a paragraph with a marked target word.
- Choose its meaning, then identify the context clue supporting that inference.
- Result: meaning accuracy, clue accuracy, attempts, and optional confidence remain separate.
- Difficulty: direct definition; close same-part-of-speech choices with contrast/consequence; or less-frequent vocabulary requiring two context spans.

### 31. Word Pair Scan

- Scan every same-or-different word pair and select each mismatching pair.
- A tap on a matching pair immediately adds time and cannot be deselected without consequence.
- Result: correct mismatches, missed mismatches, wrong taps, penalty time, and accuracy.
- Difficulty: 4/6/8 cards, 35/30/25-second base time, and 1.5/2/2.5-second wrong-tap penalties.

### 32. Return-Sweep Flow (`ReadingSaccades`)

- Choose **Guided Flow** for uninterrupted pacing or **Line-Landing** for an
  added next-line recognition checkpoint. The selected mode remains explicit
  throughout the attempt.
- Follow each emphasized chunk across a stable, book-like line, then continue
  at the first chunk of the next line. Five to eight responsive lines stay in
  view, and full lines distribute phrase groups toward both page edges while
  the final passage line remains left aligned.
- Pause, step back, or adjust the live guide in 25-WPM increments from 100 to
  800 WPM. A pace change reschedules the current guide step immediately and is
  stored as configured pace rather than measured reading speed.
- Complete the passage and answer one passage-dependent comprehension question.
- In Line-Landing, each unvisited line beginning stays concealed. During the
  return, it flashes briefly and then hides; identify the exact line start from
  three or four close-length choices before the guide continues. Feedback stays
  visible until Continue.
- Result: comprehension, configured guide pace, active presentation time,
  guide coverage, return sweeps, and—in Line-Landing—line-start recognition
  accuracy.
  Active time uses a monotonic clock and excludes paused time. Stored measured
  WPM is zero because the configured rate is a guide, not an observed reading
  rate.
- Difficulty: 2-word chunks with a 12-word safety ceiling at 150 WPM; 3-word
  chunks with a 14-word ceiling at 230 WPM; or 3-word chunks with a 16-word
  ceiling at 320 WPM. Responsive character fitting is the primary line break:
  it uses more of wide reading columns and breaks earlier on narrow screens or
  at larger text sizes.
- The app has no eye tracker and therefore does not score saccade accuracy,
  fixation location, or visual efficiency. This is guided line-transition
  practice with a comprehension check, not an eyesight or dyslexia treatment.

### 33. Focus Lane (`CenterLineReader`)

- Read the emphasized center chunk between fixed upper and lower guides while
  secondary neighboring chunks preserve context and a limited preview.
- The center chunk uses the selected passage font size rather than a display
  heading size. Long terms and chunks may wrap to a second centered line, with
  invisible break opportunities preserving the original accessible text.
- Pause or resume at any time, move back one chunk, or adjust the configured
  presentation pace in 25-WPM steps.
- Complete the passage and answer two passage-dependent comprehension questions.
- Result: comprehension, configured guide pace, and presented content. Stored
  measured WPM is zero; a display setting is not a timed connected-text reading
  result.
- Difficulty: 1-word chunks at 160 WPM, up to 2-word chunks at 250 WPM, or up
  to 4-word chunks at 360 WPM; long phrases split earlier to stay legible.
- The center guide is a pacing and attention aid. It does not prove that a
  reader processed every word simultaneously or that removing ordinary eye
  movements improves reading.

### 34. Page Glimpse

- Read a short, book-like connected-text glimpse before it hides automatically.
- Retrieve a missing phrase, a precise detail, or the central idea. The text
  cannot be reopened before answering, and corrective feedback remains visible
  until Continue.
- Result: correct retrievals, attempts, accuracy, glimpse duration, and prompt
  mix. The controlled exposure is not reported as measured reading WPM.
- Difficulty: 3 one-line rounds at 2.6 seconds; 4 two-line rounds at 2.1
  seconds; or 5 dense four-line rounds at 1.7 seconds. Each band contains six
  original validated prompts balanced across the three retrieval types.
- With a screen reader, the glimpse remains available until an explicit Hide
  and answer action. Untimed attempts remain in history under a separate
  comparison band but do not calibrate the timed Adaptive level.

### 35. Preview Catch

- Keep the current word near the center while an upcoming word from the same
  connected passage appears briefly to its right.
- Easy and Medium ask whether the preview stayed the same or changed; Hard asks
  for the exact preview among four visually similar choices. Finish with one
  passage-dependent meaning question.
- Result: preview-recognition accuracy and comprehension remain separate. The
  app does not infer gaze direction or parafoveal processing from a tap.
- Difficulty: 4 previews at 900 ms; 5 previews at 600 ms with less obvious
  changes; or 5 previews at 380 ms with exact-word choices. The bank contains
  nine original passages and 45 validated preview trials.
- Screen-reader exposure is explicit rather than timer-driven. These untimed
  attempts remain playable and saved, but cannot advance timed Adaptive
  difficulty and are not mixed with timed comparison bands.

### 36. Peripheral Letters

- Keep attention near the central plus while one three-letter group flashes on
  a balanced left or right side, then type all three letters in order.
- Four correct recalls advance and save the 15-level challenge. A miss lowers
  the next live challenge by one; three consecutive misses end the attempt
  after showing the correction.
- Result: exact-recall accuracy, side balance, exposure, offset, and challenge
  movement. Pixel offset is screen-fitted and is not presented as calibrated
  visual angle or measured gaze.
- Difficulty: 10 rounds at 900–520 ms with wider spacing; 12 rounds at 700–360
  ms with more similar letters; or 14 rounds at 520–240 ms with the most
  crowded alphabet and widest fitted offset.
- Recall uses a keyboard-aware scrolling layout. VoiceOver feedback announces
  the submitted and correct letters and waits for an explicit Continue.

### 37. Peripheral Words

- Keep attention near the central plus while one fitted word flashes on a
  balanced left or right side, then select it among close-looking alternatives.
- Periodic same-category definition checks verify meaning instead of rewarding
  word-shape guessing alone. Four correct responses advance the saved 15-level
  challenge; a miss lowers the next live challenge, and three consecutive
  misses end the attempt after feedback.
- Result: word-recognition accuracy, meaning-check accuracy, side balance,
  exposure, offset, and challenge movement; it is not measured reading WPM.
- Difficulty: 10 rounds at 1,000–560 ms with 3 choices and meaning every fifth
  trial; 12 rounds at 760–390 ms with 4 choices and meaning every fourth; or 14
  rounds at 560–260 ms with 5 choices and meaning every third.
- The target uses the game board's measured width rather than the outer window.
  VoiceOver feedback is announced and waits for Continue. A three-miss stop
  never qualifies as a successful Adaptive completion, even if earlier
  aggregate accuracy was high.

## Review 1: defects found and corrections

1. **Tier wording was too strong.** “Tier A” now means direct reading practice, not proven causal transfer.
2. **Progression inputs were underspecified.** Only connected reading with comprehension may influence sustainable pace.
3. **Commercial claims could look endorsed.** The competitor section now explicitly records advertised mechanics without validating “2×/3×” marketing.
4. **Schulte control was incomplete.** Schulte Mix will join Numbers and Letters as manual-only and use practical 3×3/4×4/5×5 grids.
5. **Structure Scan needed full rules.** Its production specification follows.
6. **The library needed acceptance criteria.** These are added so development can be objectively checked.

## Structure Scan production specification

### Goal

Practice deciding **where to read next** from text structure. The task does not reward pretending to comprehend unread material.

### Rules

1. Show a reading goal, such as “Which section is most likely to explain why city trees reduce summer temperatures?”
2. Show a short article with a title, meaningful section headings, and two or three sentences per section.
3. The user may inspect the article until ready or until the optional limit expires.
4. Hide the article and show the section headings.
5. The user chooses the section most likely to answer the goal.
6. Reveal the correct section and one evidence sentence.
7. Complete several rounds and report accuracy plus decision time.

### Difficulty

- Easy: 3 sections, distinct headings, no time limit, 3 rounds.
- Medium: 4 sections, related headings, 35-second preview limit, 4 rounds.
- Hard: 5 sections, closer headings, 25-second preview limit, 5 rounds.

### Result rules

- Score is accuracy percentage, not WPM.
- Record correct section, chosen section, decision time, and difficulty.
- It belongs to Reading Practice because it uses connected-text structure and a real information goal, but it still does not by itself establish faster full-passage reading.

## V2 implementation recommendation

1. Keep the curated home screen small.
2. Add a searchable/filterable **Training Library** containing all live games and Structure Scan.
3. Add structured metadata to every game: category, evidence tier, rules, and difficulty summary.
4. Show that metadata in the library before a user opens a game.
5. Add **Structure Scan** because it fills the gap between exact keyword search and full comprehension.
6. Keep every difficulty manually selectable. Recommended reading practice starts Adaptive; labs start Manual. All three Schulte games and Eye Reset are manual-only.
7. Add metadata-completeness tests and an all-game library/start audit.
8. Keep lab history and WPM history visually and mathematically separate.

### Development acceptance criteria

- Every registered game appears exactly once in the library.
- Search finds a game by title, description, category, or rule text.
- Category filters are keyboard/screen-reader operable and visibly selected.
- Every card states task tier, rules, and the effect of difficulty before start.
- Every game still starts with Easy, Medium, and Hard from the shared control.
- Schulte Numbers, Letters, Mix, and Eye Reset never show Adaptive.
- Structure Scan reports once, survives replay, and clears its timer after leaving.
- The curated home remains no more than the recommended reading/scan/wellness set; experimental labs do not crowd it.
- Typecheck, all Jest suites, Expo Doctor, production export, and an interactive all-game start audit pass.

## Review 2: defects found and corrections

1. **Rules could drift across four places.** Rules, category, tier, keywords, and exact Easy/Medium/Hard effects will live in one typed `gameCatalog` data source. The registry, library, home labels, and difficulty control will consume it.
2. **Adaptive defaults were too broad.** Recommended connected-reading exercises default to Adaptive. Skill and experimental labs default to Manual but may expose Adaptive when progression is reasonable. Schulte Numbers, Letters, Mix, and Eye Reset are strictly manual-only.
3. **The audience was implicit.** This product is general adult/teen reading practice. It is not diagnosis, dyslexia remediation, vision therapy, or a substitute for educational/clinical assessment.
4. **Accessibility was not an implementation gate.** Library filters, cards, rules, and search now require semantic labels, selected states, 44-point minimum targets, readable contrast, and usable layout at 320 px width.
5. **The implementation scope risked expanding indefinitely.** This development pass adds the metadata-driven library and one distinct reading exercise, Structure Scan. Pace Ladder, delayed recall, vocabulary in context, and content imports remain the highest-priority future work.
6. **“All games” could overwhelm Home.** Home remains curated. The library exposes everything with category and tier filters, so optional labs are discoverable without being recommended as equivalent to reading practice.

## Final implementation scope

### Build now

- A typed catalog for all 25 games after Structure Scan is added.
- Training Library screen with search, category filters, tier labels, rules, and difficulty effects.
- Home entry point: “Explore all drills & rules.”
- Structure Scan with five content rounds, three difficulty configurations, feedback, results, replay, progress, and tests.
- Schulte Mix changed to manual-only 3×3/4×4/5×5.
- Per-game difficulty copy in the shared control instead of generic Easy/Medium/Hard helper text.
- Adaptive defaults only for the recommended reading set; labs start Manual.
- Registry/catalog completeness tests and library interaction tests.

## Post-development validation and improvement

### Validation cycle 1

- Passed strict typecheck and the full Jest suite.
- Verified catalog completeness, library search/filter/start behavior, all 25 auto-start paths, Structure Scan completion/report/replay/timer cleanup, and production web export.
- Found and fixed a hidden replay defect: several games could replace a Manual choice with their new progress-derived level after completion. Game components now retain the difficulty supplied by `GameScreen`; adaptive progression applies to a later opened session.
- Corrected Main Idea metadata so Easy/Medium/Hard truthfully state 3/4/5 rounds rather than nonexistent changes to answer-option count.

### Validation cycle 2

- Removed direct difficulty mutation from the shared game hook API so future game components cannot silently override the controller.
- Added exact Schulte Mix checks for 9, 16, and 25 unique cells at Easy, Medium, and Hard.
- Made total exercise counts derive from the registry instead of duplicated “25” strings.
- Re-ran strict typecheck, all 36 Jest suites (184 passed, 10 intentionally skipped), and the production web export successfully.
- A fresh Expo Doctor and interactive browser rerun were attempted. Both require capabilities blocked in the current sandbox: the Doctor package lookup could not reach the npm registry, and the browser could not connect to a sandboxed local server. Expo Doctor had passed 18/18 before this source-only pass; no dependencies changed in these final cycles.

### Defer

- Pace Ladder until equivalent calibrated passages and a sustainable-pace algorithm are authored.
- AI questions/summaries until privacy, cost, factuality, and offline fallback are designed.
- EPUB/PDF importing until licensing, parsing, storage, and privacy requirements are specified.
- Medical or vision-therapy exercises.
- Leaderboards based on WPM or Schulte speed, because they encourage speed without context and create accessibility/fairness problems.

## Final product success measures

- Weekly median sustainable WPM for comparable reading difficulty.
- Comprehension consistency, not one highest score.
- Percentage of sessions in which the user deliberately lowers pace after poor comprehension.
- Completion and replay rates by exercise category.
- Whether optional lab users later improve measured reading relative to their own baseline; no transfer is assumed.
- Search success in the library and time from opening the library to starting a chosen drill.

## Current implementation audit (updated through V26)

This section is the authoritative snapshot for the current source. Earlier revision notes remain as history.

### Availability and offline boundary

- The registry contains **37 exercises**, and all 37 are available in the searchable Home collection. There is no subscription, checkout, or paid-feature gate in the current source.
- The exercise engines, authored passages, vocabulary pools, built-in Power Reader article library, and pasted-text workflow are local and usable without requesting network content.
- Project Gutenberg discovery/book retrieval and Power Reader translation are optional network features. A recent Gutenberg title is metadata, not a falsely labeled offline copy.
- Content in the implemented recall, vocabulary, and search pools is English-only; the interface must not imply multilingual exercise content.

### Exact replay inventory and known cycle points

| Content set | Easy | Medium | Hard | Replay behavior |
| --- | ---: | ---: | ---: | --- |
| Shared flash words | 364 | 308 | 384 | Full selected-level cursor persists across in-screen replays; refill follows a complete no-replacement cycle |
| Phrase possibilities | 13,824 | 13,824 | 13,824 | A 240-item generated working deck persists across in-screen replays and refills only after its full cycle |
| Letter Mixup | 48 | 48 | 48 | Shuffled without replacement; cycle boundaries avoid an immediate repeat |
| Opposites | 46 | 46 | 47 | Shuffled without replacement; cycle boundaries avoid an immediate repeat |
| Text Search | 18 | 18 | 18 | Full shuffled passage deck; cycle boundaries avoid an immediate repeat |
| Words Recall | 364 | 308 | 384 | Eight-prompt plays continue one cursor across in-screen replays; one pair per source word appears before refill |
| Sentence Recall | 240 of 13,824 | 240 of 13,824 | 240 of 13,824 | Eight-prompt plays continue through the 240-item working deck before refill |
| Visual Span | 96 | 227 | 124 | Equal-length level-specific words; each trial is independently shuffled |
| Word Search | 128 | 372 | 197 | Shuffled target deck without replacement; cycle boundaries avoid an immediate repeat |
| Word Pair Scan | 100 pairs | 100 pairs | 100 pairs | Each round independently shuffles the reviewed confusable-pair bank |
| Baseline Reading | 18 | 18 | 18 | Full shuffled assessment-form deck; latest six distinct valid forms enter the 30-day benchmark |
| Paced Comprehension | 10 | 10 | 10 | Curated non-baseline deck is exhausted before reuse; question depth is 1/2/3 by difficulty |
| Repeated Reading | 10 | 10 | 10 | Same explicitly curated 30-passage training bank; both passes use the exact same passage |
| Main Idea | 12 | 12 | 12 | Session-sized rotating windows and shuffled, correctly remapped choices |
| Structure Scan | 24 shared | 24 shared | 24 shared | Session-sized rotating windows; answer section always remains available |
| Evidence Hunt | 12 | 12 | 12 | Four-round rotating windows; answer options shuffle while evidence sentences remain in reading order |
| Context Builder | 24 | 24 | 24 | Five-round rotating windows; meaning and clue options are shuffled |
| Power Reader offline | 8 | 8 | 8 | User-selected original articles with computed word counts |
| Page Glimpse | 6 | 6 | 6 | Difficulty-filtered, no-replacement session selection; the bank balances missing phrase, detail, and main-idea prompts |
| Preview Catch | 3 passages / 15 trials | 3 / 15 | 3 / 15 | One rotating passage per play; each passage has five no-replacement preview targets and one meaning check |
| Peripheral Letters | 336–360 generated trigrams | 360 | 360 | Unique validated three-letter pools are shuffled; a changed challenge tier rebuilds the appropriate pool |
| Peripheral Words | 43 reviewed words | 117 | 85 | Length-filtered definitions feed a persistent varied deck; recognition distractors favor close spelling and meaning choices favor the same part of speech |

These are honest limits, not “unlimited content” claims. The current connected-
text inventory contains 36 Main Idea passages, 18 Page Glimpse prompts, 24 Structure Scan scenarios, 36
Evidence Hunt rounds, 72 Context Builder rounds, 48 general reading samples
(18 assessment forms and a disjoint 30-passage training bank), 54 Text Search
passages, nine Preview Catch passages with 45 trials, and 24 offline Power Reader articles. Paced Comprehension and Repeated
Reading deliberately share the training bank, with explicit 10/10/10
difficulty curation rather than inferred difficulty. Executable validators
enforce the published counts and the associated ID, difficulty, answer, option,
question-depth, disjointness, and computed-word-count rules.

### Competitor parity and remaining delta

Implemented now:

- an actual timed WPM test whose timer stops before questions;
- comprehension beside speed and visible measurement-quality flags;
- guided full-page Flow, three-slot Focus Lane, and responsive Return-Sweep
  Flow modes inside Power Reader;
- comprehension-checked Return-Sweep Flow and Focus Lane guides whose configured
  rates remain separate from measured WPM;
- optional Line-Landing checkpoints inside Return-Sweep Flow, with separately
  reported line-start recognition and comprehension;
- adjustable guide speed, difficulty, and chunk size by level;
- local pasted text, a 24-article built-in offline library, and optional Project Gutenberg discovery;
- repeated reading, Page Glimpse retrieval, purposeful search, evidence,
  structure, context, recall, Preview Catch, peripheral letter/word recognition,
  Schulte number/letter/mix, number preview search, letter-grid search,
  row/column even-number scanning, and word-pair discrimination;
- task-specific results that keep configured pacing separate from measured connected-text WPM.

Highest-value gaps:

1. Import EPUB/PDF/web articles only after parsing, licensing, privacy, and offline-storage rules are specified.
2. Add optional font-family presets; width, size, line spacing, reading theme, and reduced-motion preferences already cover the connected-reading surfaces.
3. Expand equivalent passage/question banks and version their readability before using personal pace trends for stronger recommendations.
4. Add a durable offline book cache with explicit storage controls; do not relabel recent online metadata as downloaded content.
5. Add goal-specific connected-reading drills—Gist–Detail Switch, Pace Ladder, Summary Recall, and Inference Bridge—before adding more number/symbol reaction variants.
6. Validate narrow-screen, keyboard, focus, screen-reader, and reduced-motion behavior with device-level tests.

### Report review pass 1

The first re-read found naming collisions and obsolete rules. Durable IDs were retained while visible names were corrected: `WordMismatchGrid` is **Word Pair Scan**, `WordPairs` is **Opposites**, `LetterRecognition` is **Letter Jumble**, and `LetterJumble` is **Letter Mixup**. Number Search now explicitly previews then hides its target; Even Numbers is a whole-grid multi-select task; and wrong Word Pair Scan choices have an immediate penalty.

### Report review pass 2

The second re-read found two remaining claim risks: guided WPM could still be mistaken for measured WPM, and recent online books could be mistaken for an offline cache. The implementation/report now label Power Reader and paced Comprehension as configured pacing, reserve measured WPM for connected-text timing plus questions, and state the network boundary next to Gutenberg content. The pass also added exact pool counts and cycle points so replay limits are visible instead of hidden.

### V9 final validation and reviewer signoff

- The full strict TypeScript check passed.
- The full Jest run passed: **65 suites and 416 tests**, including all-game lifecycle, auto-start, replay, difficulty, result-semantics, vocabulary-pool, accessibility, and narrow-layout coverage.
- Expo Doctor passed **18/18** checks.
- The production web export passed with 570 modules and a roughly 1.5 MB JavaScript bundle; the exported PWA manifest and icons were present.
- Live browser QA passed at 320 px and 390 px widths: Home had no horizontal overflow, the description panel scrolled independently beneath a visible Back control, WPM Test started, pasted local text opened in Power Reader, and Word Search rendered non-overlapping 48 × 48 px cells.
- The browser console had no runtime errors. React Native Web still emits its existing shadow-style deprecation warning.
- Jest remains non-console-clean because asynchronous React tests emit `act(...)` warnings. They did not fail any assertion, but making unexpected `console.error` fail the suite remains test-hygiene work.
- The final read-only reviewer pass found no remaining blocker or P1 issue in the changed exercise, result-integrity, touch-target, vocabulary, or Power Reader scope.

### V26 final validation and reviewer signoff

- Strict TypeScript passed.
- The full Jest run passed: **94 suites and 776 tests**, including all 37 game
  lifecycles and auto-start paths, content contracts, randomization, adaptive
  qualification, accessibility, result semantics, replay, and narrow layouts.
- Expo Doctor passed **18/18** checks; no dependencies changed afterward.
- The production web/PWA export passed with 650 modules, a roughly 2.03 MB
  JavaScript bundle, and a service worker precaching 21 offline assets.
- Two read-only reviewer cycles found and then verified fixes for checkpoint
  farming/omission, hidden comprehension and meaning metrics, untimed-session
  calibration, failure-stop qualification, narrow-board target overlap,
  keyboard/Dynamic Type clipping, reduced motion, and VoiceOver timer traps.
- Manual screen-reader exposure is captured per session or prompt and reported
  truthfully. Page Glimpse and Preview Catch untimed sessions stay out of timed
  Adaptive calibration; Peripheral feedback remains until an announced
  Continue action.

# Research-cycle platform update

The live catalog now contains 37 exercises. Evidence Hunt and Context Builder
were added in this research cycle because they train skills closer to real
reading than another symbol-speed drill:

## Evidence Hunt

### Rules

1. Read one connected passage.
2. Select the sentence or sentences that provide the evidence requested.
3. Choose one answer to the question.
4. Submit only after both evidence and answer are selected.
5. Review the correct answer, required evidence, and rationale.
6. Complete four rounds; replay rotates through fresh content before reuse.

### Difficulty

- Easy: short, explicit passage; one directly stated evidence sentence; untimed.
- Medium: longer passage; paraphrased question; one evidence sentence; optional
  time guide.
- Hard: denser passage; inference; two required evidence sentences; plausible
  distractors; optional time guide.

### Scoring

Answer accuracy and evidence accuracy remain separate. Wrong evidence
selections are retained as errors even if later corrected. Locate time is a
task metric, not reading WPM.

## Context Builder

### Rules

1. Read a sentence containing a clearly marked target word.
2. Infer the target word’s meaning.
3. Identify the exact context clue that supports that inference.
4. Optionally record confidence, or skip the round.
5. Review the definition, clue type, morphology, and rationale.
6. Complete five untimed rounds; replay rotates through fresh content.

### Difficulty

- Easy: familiar words and explicit definition/example clues.
- Medium: less familiar words and paraphrase, contrast, or morphology clues.
- Hard: low-frequency words, indirect clues, and more plausible distractors.

### Scoring

Meaning accuracy and clue accuracy remain separate. Confidence is not scored,
and skipped rounds are reported as omissions.

## Shared research-cycle behavior

- Manual Easy/Medium/Hard selection is always available for both new games.
- Adaptive mode is optional and changes only a future session after two
  consecutive qualifying results; it never changes a running game.
- Today recommends no more than three ordered activities and explains each
  choice. Its date-scoped snapshot keeps the assigned reading and skill stable,
  persists swaps and skips, migrates the former skip-only record, and rolls over
  on the next local date. Completion is derived only from an exact matching
  result started after that item was assigned. Once all assigned items are
  completed or skipped, the plan stays terminal and does not replenish that day.
- Home exercise discovery is icon-first at three items per row with a compact
  level progress bar. All 37 exercises now share one searchable Home collection
  without category sections or a separate library route. Favorites persist
  locally as the only separate game collection.
- Shared exercise description and difficulty panels scroll independently on
  short phone screens, so every Start button remains reachable without
  compressing the rules or difficulty choices.
- Flash-style games use de-duplicated Fisher–Yates decks. Their component-owned
  cursors survive in-screen Play again, exhaust the selected working pool before
  refill, and prevent an immediate repeat at cycle boundaries. Phrase Flash
  generates one 240-combination working pool per selected source level rather
  than regenerating it for every replay.
- Results use metric cards; History keeps Reading, Practice, and Labs separate.
- Invalid and immediate replay-duplicate results remain visible but do not
  enter personal estimates or trends.
- The app shell now supports compact, medium, and expanded layouts, while
  reading text remains in a narrow 700 px column.

## Final focused reviewer validation

- Strict TypeScript typecheck passed.
- Seven focused Jest suites passed with **63/63 tests** covering legacy/result semantics, Power Reader completion-gated progression and truthful presentation counts, 4×4/5×5/6×6 Word Search layouts, Text Search touch targets, Word Pair Scan penalty announcements, difficulty metadata, and contrast usage.
- The focused run still emits existing non-failing React test `act(...)` warnings from asynchronous stored-progress updates. Those warnings were not treated as product failures and were intentionally left outside this correction cycle.

## P0 plan and benchmark integrity validation

- Strict TypeScript typecheck passed.
- Seven focused Jest suites passed with **44/44 tests** covering Today snapshot migration, local-date rollover, stable assignments, persisted swaps, exact post-assignment completion, terminal no-replenishment behavior, backup coverage, recent same-band/version benchmark selection, six-passage/30-day limits, per-passage comprehension gating, answer-position balance, Home presentation, and History compatibility.

## V10 outcome-focused training upgrade

- Adaptive progression now has one public between-session rule: two consecutive
  at-target sessions raise the Easy/Medium/Hard band and two consecutive
  below-target sessions reduce it. A Manual session records its history and
  best score but cannot change the separate Adaptive suggestion.
- Baseline Reading uses an 80% comprehension target for adaptive qualification.
  Home and exercise descriptions present the three difficulty bands instead of
  exposing the obsolete internal 15-step counter as if it were a learning
  measure.
- Measured Reading and Baseline Reading save versioned, question-level outcomes
  after submission. Result screens can identify main-idea, detail/evidence, or
  inference errors, show the authored explanation and correct answer, and give
  a concrete next-pace action. Older results remain valid without diagnostics.
- Reading display preferences are local, backed up, and available from Home:
  three text sizes, three line spacings, three line widths, and light/warm/dark
  reading canvases. They apply to connected passages in Measured Reading,
  Baseline Reading, Repeated Reading, Comprehension, Main Idea, Structure Scan,
  Evidence Hunt, Context Builder, Text Search, and Power Reader. Game stimuli
  whose size is part of difficulty are unchanged.
- The brand-derived navy/cyan theme remains. The reviewer found no evidence that
  replacing an accessible coherent palette with a trend-driven recolor would
  improve reading outcomes.

## V10 reviewer correction passes

- The first implementation review identified and corrected four integrity
  gaps: removed passage IDs can no longer leave Today permanently pending,
  Manual practice preserves an in-progress Adaptive qualification, Power
  Reader highlights remain readable on dark passages. Its Focus Lane uses the
  selected book-like text size with two-line fallback, while its Return-Sweep
  presentation keeps a stable 5–8-line, two-edge-aligned reading block within
  the reading column.
- Restoring a backup now reloads reading-display settings immediately in the
  running app. Restore behaves as a replacement for supported app keys, while
  writing imported entries before removing omitted keys so a failed storage
  write cannot erase the user’s existing results or preferences.
- Live iPhone-width browser QA confirmed that dark connected-reading passages
  remain scrollable without horizontal overflow, action controls remain
  reachable, and Back exits an active measured read without a blocking browser
  prompt. Dark Power Reader highlight pairs measure 6.65:1 and 13.68:1
  contrast, above the 4.5:1 WCAG AA target for normal text.
- The final full validation passed strict TypeScript, all Expo Doctor checks,
  the complete Jest suite, production web export, and installable/offline PWA
  verification. Existing non-failing React test `act(...)` warnings remain
  test-hygiene work rather than a product failure.

## V11 content and mistake-review audit (historical snapshot)

- The vocabulary audit found more than 80 Easy, 100 Medium, and 180 Hard flash
  words, 120 unique two-word prompts per difficulty, and 240 sentence prompts
  per difficulty. Adding more generated fragments would increase volume without
  improving transfer, so the higher-value content work remains connected text.
- At V11, Baseline Reading contained 12 comparable original passages across
  science, civic, history, narrative, and practical topics. Every form had
  separate main-idea, detail/evidence, and inference/purpose questions with
  explanations. The authoritative V21 inventory above supersedes this
  historical count.
- Words Recall, Sentence Recall, Flash Recall, Visual Span, and keypad Memory
  Recall now preserve the learner’s submitted or selected response and reveal
  the correct response after a miss. Incorrect feedback remains visible for
  2.8–5.2 seconds, increasing with sentence or sequence length; correct feedback
  remains brief.
- A third consecutive miss no longer hides the correction behind the result
  screen. The correction is reviewed first, then the session ends.
- Final validation passed strict TypeScript, all 479 Jest tests across 71
  suites, all 18 Expo Doctor checks, production PWA export/offline
  verification, and a 390 × 844 browser interaction check with no horizontal
  overflow or runtime errors.

## V12 Visual Span differentiation

- Visual Span is now a spatial word-position exercise rather than a second
  serial-recall keypad game. A 650 ms fixation cue precedes an equal-length word
  flash around the center; the learner then identifies the word that occupied
  one prompted location.
- Memory Recall remains the serial digit-recall exercise with a phone-style
  keypad. The two activities now train and report distinct interactions.
- Manual Easy/Medium/Hard settings control 3/5/7 positions,
  compact/standard/wide spread, 1600/1200/850 ms presentation time, and 3/4/5
  similar-length choices. A miss costs 5 points and narrows the next glance by
  one position; three correct answers restore one position and three
  consecutive misses end the set after correction review.
- Deterministic unit coverage checks the generated layouts, equal-length
  distractors, fixation timing, recall feedback, difficulty reduction, failure
  ending, reporting, replay, and lifecycle completion. Phone-width browser QA
  confirmed that the seven-position Hard flash and five recall choices fit at
  390 × 844 with no horizontal overflow or console errors.

## V13 Main Idea retrieval upgrade

- The reviewer found a difficulty-contract mismatch: Main Idea advertised
  3/4/5 rounds but launched 2 at every level. Easy, Medium, and Hard now run
  3/4/5 non-repeating, difficulty-matched passages by default.
- Hiding the passage now starts a choice-free 3/5/8-second recall buffer. The
  learner forms a one-sentence central claim first, receives one readiness
  announcement, and explicitly reveals the choices afterward. The displayed
  number states the configured buffer duration rather than announcing a noisy
  second-by-second countdown. This remains an immediate retrieval exercise
  rather than a delayed-retention measure.
- Main Idea results now report configured and completed rounds plus the active
  retrieval-buffer duration, while preserving task accuracy and avoiding WPM.
- At V13, Baseline Reading difficulty copy matched its then-current validated
  inventory of 12 reviewed passages. The authoritative V21 inventory and
  catalog contract now require 18 forms per level.
- Final validation passed strict TypeScript, all 482 Jest tests across 71
  suites, all 18 Expo Doctor checks, production PWA export/offline
  verification, and a 390 × 844 browser interaction check with no horizontal
  overflow or runtime errors.

## V14 Schulte moving-grid variation and timing integrity

- Schulte Numbers, Letters, and Mix now offer a separately controlled
  “Shuffle after each tap” variation while retaining the conventional stable
  table as the default. Every correct non-final tap guarantees a different
  arrangement; completed targets remain disabled but receive no completion
  color, so position and color cannot act as memory aids.
- Grid size remains the Easy/Medium/Hard difficulty control. The moving-grid
  variation is an independent challenge setting and is recorded with its exact
  reshuffle count in the session result.
- Final completion duration now uses a monotonic clock rather than civil wall
  time. System-clock corrections cannot change the score, display-interval
  throttling cannot accumulate timing drift, and wrong taps add no synthetic
  seconds. Real time spent searching, pausing, scrolling, or waiting still
  counts as part of the attempt.
- Schulte Mix now uses the same accuracy-adjusted items-per-minute result as
  Numbers and Letters instead of reporting the grid size as its score.
- Final validation passed strict TypeScript, all 488 Jest tests across 72
  suites, all 18 Expo Doctor checks, production PWA export/offline
  verification, and a complete 390 × 844 moving-grid session with no
  horizontal overflow or browser errors.

## V15 Selection protection and Schulte comparison integrity

- Game, measured-reading, and result surfaces now prevent browser text
  highlighting and copy selection. This keeps accidental long-presses or drags
  from interfering with timed interaction. Editable typing and custom-text
  fields explicitly retain normal text selection for correction, replacement,
  and paste.
- The review found that conventional stable-grid Schulte scores and the new
  moving-grid scores were entering the same “like-for-like” chart despite
  representing materially different search tasks. Comparison keys and chart
  labels now include the grid variation. Historical Schulte attempts without a
  stored variation are treated as stable-grid attempts.
- Schulte result screens now display “Stable grid” or “Shuffle after each tap.”
  “Train again” preserves that exact variation along with difficulty, so a
  moving-grid repetition cannot silently fall back to the easier layout.
- Final validation passed strict TypeScript, all 497 Jest tests across 73
  suites, all 18 Expo Doctor checks, production PWA export/offline
  verification, and 390 × 844 browser QA. Live computed styles confirmed
  `user-select: none` for game and result text and `user-select: text` for the
  custom-text editor; a completed moving-grid result replayed directly into the
  same mode with no overflow or browser errors.

## V16 Schulte result clarity

- The review found that Schulte’s accuracy-adjusted search rate was stored
  correctly but displayed as the opaque label “Score.” Numbers, Letters, and
  Mix now present that primary measure as Items/min on results, trends, and
  history.
- Modern Items/min attempts and historical Schulte records that stored a
  different score meaning receive different comparison keys. This prevents an
  old grid-size or generic score from silently entering a search-rate trend.
- Result cards now show mistakes separately from task accuracy and session
  time. History rows include the stable/moving grid variation and mistake count,
  making prior attempts understandable without reopening their result screen.
- Final validation passed strict TypeScript, all 499 Jest tests across 73
  suites, all 18 Expo Doctor checks, production PWA export/offline
  verification, and a complete 390 × 844 moving-grid session with one
  intentional mistake. The result and Labs history displayed Items/min, mode,
  and mistake details with no overflow or browser errors.

## V17 rapid-flash pace range

- Word Flash, Phrase Flash, Last Word, and Flash Recall now share a practical
  upper setting of 3,000 WPM instead of stopping at difficulty-specific limits
  between 240 and 540 WPM. Difficulty still selects the starting pace and
  content complexity; it no longer prevents a learner from testing a faster
  personally manageable pace.
- Six tap-friendly quick settings reach 150, 300, 600, 1,000, 2,000, or 3,000
  WPM without requiring dozens of plus-button presses. The control also shows
  the selected pace as milliseconds per word and preserves the existing
  25-WPM streak-based adaptation.
- The shared presentation floor is now 20 ms per word, which makes the
  3,000-WPM setting operational rather than cosmetic. Phrase Flash calculates
  exposure from the actual number of words, so a five-word phrase at 3,000 WPM
  remains visible for 100 ms and its reported pace matches the delivered pace.
- Final validation passed strict TypeScript, all 508 Jest tests across 75
  suites, all 18 Expo Doctor checks, production PWA export/offline
  verification, and a live 3,000-WPM Word Flash interaction. The preview
  reached its answer phase at the expected rapid pace with no runtime errors
  or horizontal overflow.

## V18 recognition correction review

- The product review found a learning-loop gap in Word Flash, Phrase Flash,
  and Last Word: choosing an option immediately discarded both the choice and
  the answer. Similar distractors increased difficulty, but a learner could not
  inspect what made a miss wrong.
- All three exercises now enter a dedicated answer-review state after every
  choice. Correct answers receive a brief 0.5-second confirmation; misses show
  “You chose” beside the exact answer for 2.8–5.2 seconds, with longer phrases
  receiving more review time.
- Round counts, scoring, consecutive-miss logic, and adaptive WPM updates occur
  at selection time, while the next flash or result waits for review to finish.
  The third consecutive miss therefore reveals its correction before ending
  the session.
- The shared feedback card uses accessible success/error roles, centered
  wrapping text, and a polite live-region announcement so the same comparison
  remains usable for words and multi-word phrases.
- Final validation passed strict TypeScript, all 508 Jest tests across 75
  suites, all 18 Expo Doctor checks, production PWA export/offline
  verification, and a live wrong-answer review. The browser showed both the
  selected and correct words, preserved the review delay, returned home without
  a blocking Back prompt, and reported no runtime errors or horizontal
  overflow.

## V19 vocabulary and randomization audit (historical snapshot)

The figures in this section describe V19 and are superseded by the
authoritative V21 inventory above.

- At V19, the lexical inventory contained 272 Easy, 230 Medium, and 307 Hard unique
  flash words. These banks feed Word Flash, Flash Recall, Last Word, Words
  Recall, Letter Mixup distractor matching, and difficulty-filtered Word Search
  targets instead of leaving each drill dependent on a small private list.
- At V19, Phrase Flash and Sentence Recall drew from 18 × 18 × 18 reviewed template
  dimensions at every difficulty: 5,832 possible phrases per level. Generation
  enumerates the valid combinations before shuffling, so an unlucky or injected
  random source cannot return a short pool.
- At V19, Letter Mixup had 32 word/definition prompts per level; Opposites had
  30/30/31 reviewed challenges; Text Search had 12 natural passages per level;
  and Word Pair Scan had 100 confusable pairs. Text Search and Opposites used
  complete shuffled decks, with immediate-repeat protection at cycle
  boundaries.
- At V19, Visual Span preserved the anti-guessing constraint of equal-length
  options while drawing from 71/194/75 words instead of 24/28/30 private
  entries. Word Search consequently exposes 101/313/178 valid grid-sized
  targets at Easy/Medium/Hard.
- A shared bounded Fisher–Yates utility replaced random-comparator sorting and
  retry-until-unique selection. It protects injected boundary values, never
  mutates the source, and supports deterministic tests. Word Search placement,
  Word Pair Scan target positions, Opposites options, flash sequences, and
  Text Search decks now use testable random paths without dropping or
  duplicating items.
- Final validation passed strict TypeScript, all 518 Jest tests across 76
  suites, all 18 Expo Doctor checks, production PWA export, and offline-cache
  verification. Live 390 × 844 checks started two different Letter Mixup
  prompts, opened a randomized Text Search passage, and displayed a seven-word
  Hard Visual Span trial with five equal-length choices. Back remained
  nonblocking, all tested pages stayed at 390 px without horizontal overflow,
  and the browser reported no runtime errors.

## V20 session coaching and progression integrity

- Results now lead with a useful next action instead of making the learner
  interpret a score alone. Measured-reading recommendations choose a fresh
  comparable passage, can carry an appropriate WPM target, and keep exact replay
  as a secondary option. Timing-invalid attempts use neutral clean-retake copy
  and never present contradictory speed praise.
- The Today plan is now a continuous session flow. Its launch context survives
  reading, games, results, and exact replay; completing one item can open the
  next pending item directly. Optimistically completed IDs prevent a slow local
  save or a backward wall-clock change from repeating an item.
- Invalid measured readings cannot complete a Today item or alter adaptive
  calibration. Exact replay of an Adaptive level is isolated as one-off Manual
  practice: it can retain play/best information without changing the learner's
  saved level or qualification streak. Eye-comfort safety exits always override
  plan continuation.
- Number and Symbol Recognition now deliver independently oriented balanced
  pairs, keeping every generated prefix within one target/non-target trial.
  Calibration requires at least four answers with two trials of each kind, so
  an always-Match or always-No strategy cannot qualify. Result details report
  the actual trial mix rather than the requested deck size.
- Measured reading, Baseline Reading, and Repeated Reading use monotonic elapsed
  time so device-clock adjustments do not corrupt WPM. Comprehension time stays
  outside reading time, passage identities remain stable across paced variants,
  and unrelated legacy game results no longer enter the same comparison chart.
- Result navigation is single-flight: the primary action, exact replay, Back,
  and History share a visible busy lock. Progress writes are serialized, clear
  operations cannot race them, and a bounded wait prevents damaged or stalled
  local storage from trapping the learner.
- Final validation passed strict TypeScript, all 573 Jest tests across 79
  suites, all 18 Expo Doctor checks, production PWA export, and offline-cache
  verification.

## V21 content breadth, semantic quality, and replay integrity

- The shared Easy/Medium/Hard word banks now contain 364/308/384 unique entries.
  Words Recall exposes the same number of rotating prompts and covers every
  source word; Letter Mixup contains 48 prompts per level, and Opposites
  contains 46/46/47 reviewed challenges.
- Phrase Flash and Sentence Recall now draw from 13,824 enumerated combinations
  per level. The dimensions use compatible semantic frames—including the Hard
  bank—so increased variety does not come from mechanically joining
  incompatible subjects, actions, and contexts.
- Connected-text coverage now includes 18 Text Search passages per level, 12
  Main Idea passages per level, 24 Structure Scan scenarios, 12 Evidence Hunt
  rounds per level, 24 Context Builder rounds per level, eight Power Reader
  articles per level, and 24 offline Power Reader articles in total.
- Baseline Reading retains 18 assessment forms per level. Paced Comprehension
  and Repeated Reading use a separate 30-passage training bank curated as 10
  Easy, 10 Medium, and 10 Hard passages; Comprehension supplies 1/2/3
  passage-dependent questions by level.
- Comprehension and Repeated Reading use full no-replacement decks, while
  rotating-window games traverse fresh content before reuse. Answer choices are
  shuffled with their answer keys remapped, and cycle-boundary safeguards
  prevent an immediate repeat across deck refills.
- Flash Recall, Word Flash, Phrase Flash, Last Word, Words Recall, and Sentence
  Recall now preserve component-owned deck cursors across in-screen replay.
  They consume every unique item in the active word or 240-item phrase/sentence
  working pool before refilling; a changed source pool starts a new cycle.
- Exact-count and structural validators now fail on accidental pool drift,
  duplicate IDs/options, invalid answers, incorrect difficulty bands,
  assessment/training overlap, question-depth mismatches, or inconsistent
  computed word counts. Semantic review also repaired misleading context clues
  and incompatible generated phrase frames.
- Two final validation passes each cleared strict TypeScript, all 633 Jest
  tests across 84 suites, all 18 Expo Doctor checks, and production PWA/offline
  verification. Live 390 × 844 browser QA covered Home, Context Builder, Words
  Recall, Phrase Flash, and the scrollable Power Reader exercise; Back remained
  nonblocking, horizontal width stayed at 390 px, and the console remained
  free of warnings and errors.

## V22 responsive flash stimuli and progressive masking

- Flash Recall, Word Flash, Phrase Flash, Last Word, Words Recall, Sentence
  Recall, Visual Span, Memory Recall, Number Search, and Number Hunt now use
  the same brief-stimulus presentation contract. A single word or number is
  constrained to one fitted line; word pairs, phrases, and sentences may wrap
  onto two or three readable lines.
- Difficulty adds a consistent visual-recognition layer without changing
  scoring: Easy leaves glyphs clear, Medium obscures the lower 18%, and Hard
  obscures the lower 38%. The obstruction is a fully opaque near-black marker
  rather than a transparent overlay or background-colored erasure.
- Flash-only frames no longer spend phone width on decorative borders, large
  horizontal padding, or rounded cards. Visual Span retains its positional
  cells because their locations are part of the task, but their horizontal
  padding is reduced and each single-word item still follows the no-wrap rule.
- Hard Phrase Flash and Sentence Recall preserve 13,824 grammatical analytical
  combinations while using compact actor–analysis–modifier constructions.
  This avoids shrinking the former 21–37-word prompts to illegible sizes on a
  phone.
- Automated coverage checks the opaque marker color and depth, wrapped phrase
  contract, single-word/number no-wrap contract, responsive font-size floor,
  compact Hard prompt range, and the presence of the correct difficulty marker
  in every affected exercise engine.
- Final validation passed strict TypeScript, all 639 Jest tests across 85
  suites, all 18 Expo Doctor checks, and a production web export. Live
  390 × 844 browser checks confirmed that a Hard number remained `nowrap` with
  no horizontal overflow and that a Hard analytical phrase wrapped to three
  22 px lines; both used an opaque `rgb(17, 17, 17)` marker at the configured
  38% line depth.

## V23 persistent gradual flash challenge

- V23 supersedes V22's immediate Easy/Medium/Hard masking rule for the ten
  flash-based drills: Flash Recall, Word Flash, Phrase Flash, Last Word, Words
  Recall, Sentence Recall, Visual Span, Memory Recall, Number Search, and
  Number Hunt. The public difficulty still controls the vocabulary or task
  band, but every band now has its own saved 1–15 flash level.
- Levels 1–9 prioritize readable progression: short/common items appear first,
  progressively longer or wider content is opened, and exposure becomes
  faster. The stimulus stays clear throughout these levels. Levels 10–15 add
  an opaque near-black lower marker in measured steps from 10% to 38%.
- Flash Recall and Last Word qualify the next level after four consecutive
  correct recalls; Word Flash, Phrase Flash, and Number Hunt use eight;
  two-word recall, sentence recall, number search, and visual span use three;
  digit Memory Recall uses two correct sequences. A miss resets the promotion
  run and lowers the live challenge by one. Three-miss games still show their
  correction before ending.
- A separately serialized local checkpoint records the safe resume level and
  the highest demonstrated level per game and public difficulty. A complete
  promotion run saves immediately. Three consecutive misses make the next
  session start one level lower without erasing the recorded best. Reset Game
  Levels clears these checkpoints, and app-data export/import includes them.
- Fast word/phrase drills still allow an explicit starting flash pace up to
  3,000 WPM. Their saved level restores the earned 25-WPM steps, while level-15
  sessions may continue increasing pace without an artificial end. Explicit
  test/content overrides retain their deterministic values.
- Last Word begins with unpredictable 3–4-word streams and expands toward
  6–10 words. Memory Recall resumes a qualified sequence-length offset. Visual
  Span can expand to eight positions. Number Search grows its grid/range and
  shortens preview time; Number Hunt shortens its response cadence while
  retaining balanced target and non-target trials.
- The implementation reports initial, final, and highest in-session flash
  levels alongside the existing pace, length, span, and accuracy fields.
  Pure reducer, persistence, marker, backup, and affected-engine tests protect
  monotonic progression, clamping, saved resume, safe rollback, and opaque
  masking.

## V24 flash-mastery integrity and game-specific progression

- V24 keeps a separate saved challenge stage inside each chosen public
  difficulty. “Manual” therefore continues to hold the public Easy/Medium/Hard
  band steady, while the explicitly displayed challenge stage adapts inside
  that band as requested. The idle status labels this checkpoint as saved for
  the current setting.
- Text selection now moves through overlapping complexity windows instead of
  opening an ever-growing prefix that continued to serve the easiest items.
  Cross-stage deck boundaries retain immediate-repeat protection. Word,
  phrase, pair, and sentence prompts therefore rise in median and minimum
  complexity before masking begins.
- Rapid word and phrase drills save sustained pace separately from the
  15-stage content ladder. A complete correct run can qualify progressively up
  to 3,000 WPM even after content stage 15; the next eligible session resumes
  that pace. The terminal three-miss run saves a safer pace while preserving
  the fastest demonstrated pace.
- Number Hunt raises distractor similarity and adds one digit every four
  challenge stages, regenerating a balanced target/non-target stream at a tier
  boundary. Number Search opens larger grids and guaranteed longer target
  bands while shortening preview time; only the first wrong tap can mark one
  target as a failed adaptive round.
- Memory Recall maps one saved stage to one deterministic digit span, requiring
  two correct sequences before adding a digit. Visual Span applies newly
  earned timing on the very next trial, grows toward eight positions, and
  stages shorter-to-longer vocabulary. Typed recall uses the same current-stage
  exposure calculation and remains vertically scrollable above a phone
  keyboard.
- Qualifications can never lower a stronger saved checkpoint. Live recovery
  below a checkpoint remains live-only, and only the third consecutive miss
  can save one rollback per session. Start remains disabled for the brief
  checkpoint read, so the first stimulus and starting pace always use the
  demonstrated level. A resumed WPM is applied through a synchronous session
  reference and cannot receive the stage bonus twice.
- Explicit content, timing, target, stream, size, or span overrides remain
  useful for deterministic practice but are ineligible to inflate persistent
  mastery and skip the checkpoint wait. Exact replay remains non-calibrating.
  Storage mutations fail closed if the existing checkpoint cannot be read,
  and a session using an in-memory fallback cannot replace saved mastery.
  Result payloads use synchronous getters and actual initial/final per-round
  settings so a promotion, cadence, span, range, or exposure is not reported
  one step behind.

## V25 guided reading-path labs and evidence boundary

- **Return-Sweep Flow** is grounded in the observation that normal multiline
  reading includes return sweeps and frequent corrective undersweeps; launch
  position, landing position, line length, and text size affect that movement.
  See [Slattery and Parker, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6863793/),
  [Parker et al., 2019](https://doi.org/10.1016/j.visres.2018.12.007), and
  [Vasilev et al., 2021](https://doi.org/10.1016/j.visres.2021.01.003).
  These studies describe eye-movement behavior; they do not show that this
  particular no-eye-tracker game increases ordinary reading speed.
- **Focus Lane** uses a stable center guide and progressively larger chunks as
  a controlled presentation technique. In a gaze-contingent study, the useful
  span was the fixated word plus two words to its right for controls but only
  one word to the right for readers with aphasia, illustrating that span is not
  universal; a single word's optimal viewing position also does not establish a
  multiword “magic center.” See
  [DeDe, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7540203/) and
  [Nazir, Jacobs, and O'Regan, 1998](https://pubmed.ncbi.nlm.nih.gov/9701972/).
- Preserving faded neighbors plus Pause and Back is intentional. Preventing
  regressions can reduce comprehension, and rapid serial presentation may trade
  comprehension or comfort for display speed. See
  [Schotter et al., 2014](https://doi.org/10.1177/0956797614531148),
  [Benedetto et al., 2015](https://doi.org/10.1016/j.chb.2014.12.043), and the
  broader [Rayner et al., 2016 review](https://doi.org/10.1177/1529100615623267).
- The safe product claim for both games is **guided reading-path and paced-chunk
  practice with immediate comprehension checks**. Neither result contributes a
  measured WPM value, neither claims to diagnose or train gaze without eye
  tracking, and neither is presented as treatment for dyslexia or another
  learning condition. Any transfer claim must come from later, conventional
  connected-text reads that preserve comprehension.

## V26 brief-text, preview, and line-transition practice

- **Page Glimpse** adds a connected-text retrieval task rather than another
  isolated-symbol reaction game. Its 18 original items are evenly divided by
  difficulty and retrieval type, selected without replacement inside a play,
  and checked by structural validators. The result reports retrieval accuracy,
  never an inferred WPM from a fixed exposure.
- **Preview Catch** uses nine original passages and 45 keyed preview targets.
  Same/Changed trials are balanced, Hard choices are visually similar, answer
  positions are remapped after shuffling, and each attempt ends with a meaning
  check. It is a screen-based preview-recognition proxy, not proof that the user
  held central fixation or processed the target parafoveally.
- **Peripheral Letters** balances left/right flashes and asks for ordered
  three-letter recall from a generated, validated pool. **Peripheral Words**
  uses the reviewed definition bank, close-spelling recognition alternatives,
  and periodic same-part-of-speech meaning checks. Both fit offsets to the
  actual usable board, call them pixels rather than visual angle, retain corrections
  long enough to inspect, and use three consecutive misses as the stop rule.
- The two peripheral exercises share the persistent 15-level challenge model:
  demonstrated success increases exposure difficulty and fitted offset, a miss
  lowers the next live trial, and later sessions resume a safe demonstrated
  checkpoint. Easy/Medium/Hard remains manually controllable and changes the
  starting timing, content, spacing or choice load, and session length.
- **Line-Landing** is an explicit Return-Sweep variation, not a fifth catalog
  duplicate. It conceals each new line start, briefly exposes it during the
  transition, waits for an exact choice among close-length alternatives, and
  resumes only after durable feedback. Its result adds line-start accuracy and
  return count while keeping configured presentation pace out of measured WPM.
- All five additions preserve the product boundary: without eye tracking and
  physical visual-angle calibration, they measure only the response made in
  the exercise. Any benefit to ordinary reading must be checked later with a
  conventional connected-text read that preserves comprehension.
