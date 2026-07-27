# SpeedRead exercise, competitor, and game-design report

Date: 2026-07-27
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
| Repeated Reading | Live | A | Read the same passage twice and compare pace only after a comprehension check |
| Main Idea | Live | A | Read, hide the passage, retrieve the point, then choose and explain the best main idea |
| Comprehension | Live | A | Read connected text and answer literal/main-idea questions |
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
| Power Reader / guided highlight | Live | B | Follow highlighted chunks through real text; pause or adjust pace; do not call its configured rate measured WPM |
| Flash Recall | Live | C | View one word briefly, type it, and track recognition accuracy |
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
| Letter Hunt | Live | B | Select all copies of a target letter in a grid |
| Number Search | Live | C | Locate a target number in a changing grid |
| Number Hunt | Live | C | Decide whether the current number matches the target |
| Symbol Hunt | Live | C | Decide whether the current symbol matches the target |
| Odd Word | Live | B | Identify the word that differs from similar words |
| Guided Row Scan | Later | C | Sweep rows left-to-right and reverse with accuracy targets |
| Multi-Target Search | Later | B | Hold two target words and find both in connected text |
| Distractor Resistance | Later | B | Find a meaningful target among visually similar nonwords |

### Vocabulary, language, and memory

| Exercise | Status | Tier | Core rule |
| --- | --- | --- | --- |
| Word Pairs | Live | B | Match a word to its opposite/related pair |
| Word Jumble | Live | B | Unscramble letters into a word |
| Memory Recall | Live | B | Recall digit sequences that grow after success |
| Visual Span | Live | C | Recall briefly shown items around a fixation point |
| Even or Odd | Live | C | Classify displayed numbers quickly |
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
- Difficulty: chooses progressively denser passages.

### 2. Main Idea

- Read a short passage.
- Hide it and briefly retrieve the central point.
- Choose the best main idea from several options.
- Review an explanation before finishing.
- Difficulty: 3, 4, or 5 main-idea rounds. Each current passage uses four plausible answer options.

### 3. Power Reader

- Choose the built-in article, custom text, or a public-domain book.
- Follow the highlighted phrase; pause, resume, or adjust the guide speed.
- Finish when the text is complete.
- Result: configured pacing rate, words shown, article, and time; it is not a comprehension-verified WPM result.
- Difficulty: approximately 150 WPM/2-word chunks, 300 WPM/3-word chunks, or 500 WPM/5-word chunks.

### 4. Flash Recall

- A word flashes briefly.
- Type the word from memory.
- Continue through a rolling shuffled, de-duplicated difficulty-specific deck; finish voluntarily or after three consecutive misses.
- Set a starting WPM. The live pace rises by 25 WPM after four consecutive correct recalls. A miss resets the correct streak but does not reduce WPM.
- Result: actual attempts, correct answers, recognition accuracy, ending failure streak, initial/final WPM, and pace-change count. This WPM is presentation pace, not measured connected-text reading.
- Difficulty: common words at 120 WPM; academic words at 220 WPM; or advanced words at 320 WPM with the lower word area masked.

### 5. Comprehension

- Read the passage without a forced pace.
- Move to the questions when ready.
- Choose an answer and review feedback.
- Result: percentage correct and session time.
- Difficulty: 1, 2, or 3 questions.

### 6. Schulte Numbers

- Keep the whole grid comfortably visible.
- Tap numbers in ascending order from 1.
- Incorrect taps add mistakes but do not advance the sequence.
- Result: completion time, accuracy, mistakes, and accuracy-adjusted items per minute.
- Manual difficulty: 3×3, 4×4, or 5×5.

### 7. Schulte Letters

- Tap letters alphabetically from A to the final visible letter.
- Incorrect taps add mistakes.
- Result: completion time, accuracy, mistakes, and accuracy-adjusted items per minute.
- Manual difficulty: 3×3, 4×4, or 5×5.

### 8. Schulte Mix

- Follow the displayed sequence by alternating numbers and letters.
- Tap the next requested item; incorrect taps add mistakes.
- Result: completion speed and accuracy.
- Manual difficulty: 3×3, 4×4, or 5×5. A 7×7 alternating grid is too dense for reliable small-screen interaction and is removed from the recommended configuration.

### 9. Eye Reset

- Record a small number of natural, gentle blinks.
- Put the device down and look across the room for the selected interval.
- Report whether the eyes feel comfortable, unchanged, or uncomfortable.
- Result: break duration and comfort only; no reading or eyesight score.
- Manual difficulty: Quick (3 blinks/10 s), Standard (5/20 s), Extended (8/40 s).

### 10. Visual Span

- Keep attention near the center while a sequence appears briefly.
- Enter the sequence after it disappears.
- Correct recalls increase the sequence length; the session ends after the configured rounds/failure path.
- Result: correct recalls and task accuracy.
- Difficulty: starts with 4/6/8 items shown for 1500/1200/1000 ms.

### 11. Pattern Scan

- Find all copies of the requested pattern in a grid.
- Submit or continue through rounds while the timer runs.
- Result: correct selections, errors, speed, and accuracy.
- Difficulty: 4×4/45 s, 5×5/35 s, or 6×6/30 s with greater target density.

### 12. Word Flash

- View a word briefly.
- Choose the word from distractors after it disappears.
- Continue through a rolling shuffled deck without immediate repeats; finish voluntarily or after three consecutive misses.
- Set a starting WPM. The live pace rises by 25 WPM after eight consecutive correct choices. A miss resets the correct streak but does not reduce WPM.
- Result: actual attempts, recognition accuracy, score, ending failure streak, initial/final WPM, and pace-change count.
- Difficulty: common words at 120 WPM, academic words at 220 WPM, or advanced words at 320 WPM.

### 13. Phrase Flash

- View one of 240 freshly generated grammatical phrase combinations at the selected WPM.
- Choose the exact phrase from four options.
- Continue until voluntary finish or three consecutive misses. Eight consecutive correct choices raise the pace by 25 WPM; a miss resets that correct streak.
- Result: actual attempts, correct choices, recognition accuracy, ending failure streak, initial/final WPM, and pace-change count.
- Difficulty: 5-word templates starting at 180 WPM, longer templates at 260 WPM, or complex templates at 360 WPM.

### 13a. Last Word

- Watch a sequence of words shown one at a time.
- After the stream ends, choose the final word from four options; earlier stream words are used as distractors when possible.
- Set a starting WPM. Four consecutive correct recalls raise it by 25 WPM; a miss resets that streak without reducing pace. Finish voluntarily or after three consecutive misses.
- Result: actual attempts, final-word recall accuracy, ending failure streak, sequence length, initial/final WPM, and pace-change count.
- Difficulty: 4 words at 180 WPM, 6 at 280 WPM, or 8 at 380 WPM.

### 14. Word Pairs

- Read the prompt word.
- Choose its opposite or paired word.
- Continue until time expires.
- Result: matches and accuracy.
- Difficulty: 45, 30, or 20 seconds.

### 15. Text Search

- Read the target word.
- Find every exact occurrence in the connected paragraph.
- A correct tap marks the occurrence; wrong taps reduce accuracy.
- Result: found count, errors, completion time, and accuracy.
- Difficulty: unlimited with visible count; 30 seconds; or 20 seconds with the total target count hidden.

### 16. Word Search

- Find each listed hidden word.
- Trace every letter in order; single-letter taps do not award a word.
- Words may run horizontally, vertically, backward, or diagonally according to difficulty.
- Result: words found, incorrect traces/taps, speed, and accuracy.
- Targets come from large shuffled difficulty pools and do not immediately repeat.
- Difficulty: 6×6/common words/forward directions; 7×7/larger pool/orthogonal directions; or 9×9/longest pool/all directions.

### 17. Number Search

- Find the displayed target number in the grid.
- Tap it to generate the next target/grid; wrong taps count as attempts.
- Continue until time expires.
- Result: correct finds and accuracy.
- Difficulty: 4×4/45 s, 5×5/35 s, or 6×6/25 s.

### 18. Letter Hunt

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

### 21. Word Jumble

- Unscramble the displayed letters.
- Type the word or request the available hint.
- Continue until time expires.
- Result: solved words and accuracy.
- Difficulty: chooses easy, medium, or hard vocabulary lists.

### 22. Odd Word

- Inspect a grid of similar words.
- Select the one word that differs and submit.
- Continue through rounds while time remains.
- Result: correct rounds, selections, and accuracy.
- Difficulty: 4 cards/35 s, 6/30 s, or 8/25 s.

### 23. Even or Odd

- Read the displayed number.
- Tap Even or Odd.
- The number changes after each decision.
- Result: correct classifications and accuracy.
- Difficulty: numbers up to 20/30 s, 99/20 s, or 999/15 s.

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

# Research-cycle platform update

The live catalog now contains 28 exercises. Two connected-reading exercises
were added because they train skills closer to real reading than another
symbol-speed drill:

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
  choice. Home shows one Today card at a time with previous/next controls. The reading baseline is skippable and requires three different valid
  passages before showing a personal median-WPM estimate.
- Home exercise discovery is icon-first at three items per row with a compact
  level progress bar. All 28 exercises now share one searchable Home collection
  without category sections or a separate library route. Favorites persist
  locally as the only separate game collection.
- Shared exercise description and difficulty panels scroll independently on
  short phone screens, so every Start button remains reachable without
  compressing the rules or difficulty choices.
- Flash-style games use de-duplicated Fisher–Yates decks. Word pools contain
  more than 80/100/180 unique entries across Easy/Medium/Hard; Phrase Flash
  generates 240 combinations per session.
- Results use metric cards; History keeps Reading, Practice, and Labs separate.
- Invalid and immediate replay-duplicate results remain visible but do not
  enter personal estimates or trends.
- The app shell now supports compact, medium, and expanded layouts, while
  reading text remains in a narrow 700 px column.
