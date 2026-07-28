# SpeedRead product plan

Date: 2026-07-28
Product goal: help a reader increase the fastest pace they can sustain while
still understanding and remembering unfamiliar connected text.

## Product decision

SpeedRead should behave like a personal reading coach with an exercise library,
not like a collection of unrelated reaction games.

The primary loop is:

1. Measure reading on unfamiliar text.
2. Identify the current limiting skill.
3. Recommend one short targeted practice activity.
4. Recheck the outcome on different connected text.
5. Adjust the next session without hiding the user's controls.

The product must never equate a configured display pace, a flash-word score, or
a visual-search score with measured reading speed.

## North-star outcome

**Sustainable reading pace:** rolling median WPM across equivalent, unseen
passages where comprehension is at least 80%.

The number should include:

- the number of qualifying passages;
- comprehension beside WPM;
- the text/readability band;
- an uncertainty state until enough different passages are available.

Supporting measures:

- recommended-plan completion;
- comprehension consistency;
- delayed recall where available;
- practice minutes on connected text;
- percentage of sessions followed by the recommended next action;
- accuracy and difficulty trend within each individual skill game.

Do not optimize for:

- highest-ever WPM;
- total number of game sessions;
- streaks that encourage low-quality attempts;
- combined scores across unrelated games;
- leaderboards.

## Current product audit

### What is already strong

- All 31 exercises are available without accounts or paid gates.
- The product clearly separates measured WPM from guided pacing.
- The short reading-first plan appears before the exercise catalog.
- Shared Easy, Medium, Hard, and Adaptive controls are discoverable.
- Favorites, search, recent history, and per-game progression are persisted
  locally.
- The three-column phone layout has practical touch targets and no horizontal
  overflow at 320 px.
- Game descriptions, Back, Start, results, replay, and history are accessible
  on small screens.
- The strongest games practice connected reading, evidence, context, retrieval,
  comprehension, and purposeful scanning.

### Highest-impact gaps

1. **Too much choice after the daily card.** The Home screen becomes a flat
   wall of 31 exercises. Search helps a user who already knows what they want,
   but the product does not explain which six games matter most.
2. **The plan is only lightly personalized.** It rotates a baseline and chooses
   between Evidence Hunt and Context Builder mainly by session count. It does
   not yet prescribe practice from the user's actual error pattern.
3. **The measurement pool is too small.** Three baseline passages can establish
   an initial estimate, but repeated exposure creates memorization and weakens
   longer-term trend quality.
4. **Results are descriptive rather than prescriptive.** They explain the last
   session but do not consistently offer a one-tap, evidence-based next action.
5. **Progression is too generic.** A global success/failure streak is useful for
   persistence, but different games need different mastery rules.
6. **Reading comfort is under-configurable.** Connected-reading screens need
   font size, line height, column width, theme, and reduced-motion settings.
7. **The brand header consumes space without adding orientation.** The current
   raster logo includes substantial transparent space and appears visually
   small inside a tall box.
8. **Active Back prompts interrupted flow.** This has been corrected: Back now
   exits immediately. Destructive data actions such as clearing history still
   require confirmation.

## UX direction

### Home: coach first, library second

Keep every exercise on Home, as requested, but add progressive emphasis:

1. Compact header with the product mark, greeting, and streak.
2. One active "Today" card with a clear outcome and estimated duration.
3. A "Continue" row containing the last two unfinished/recent activities.
4. Favorites when present.
5. "Recommended for your goal" with at most six exercises.
6. Search and compact filter chips for Reading, Words, Scan, Memory, and
   Comfort.
7. The complete 31-exercise grid below, still on the same screen.

The full grid should default to coaching order, not registry order:

- direct reading and comprehension;
- vocabulary/context and purposeful search;
- guided pacing;
- optional recognition/memory labs;
- experimental number/symbol/visual labs;
- comfort.

Home acceptance criteria:

- Today's action and its Start control are visible without scrolling on a
  390 × 844 viewport.
- A returning user can resume or start the recommended action in two taps or
  fewer.
- The first screenful does not show more than one paragraph of explanatory
  text.
- All 31 exercises remain searchable and reachable on Home.

### Game setup: progressive disclosure

The setup screen currently communicates difficulty well but can be shorter.

- Lead with one sentence: what the game trains.
- Show three concise rules as numbered lines.
- Show the current recommended difficulty first.
- Collapse detailed difficulty explanations under "Compare levels."
- Show a truthful result label before Start, such as "Measures task accuracy"
  or "Measures WPM + comprehension."
- Preserve a 48-point Back target and immediate exit.

### Active session: one primary action

- Keep only the action needed for the current phase visually primary.
- Pause timers when the app becomes inactive.
- Use persistent position/progress indicators for multi-round activities.
- Announce correct, wrong, penalties, speed changes, and round changes to
  assistive technology.
- Never change a manually selected grid/difficulty during an attempt.
- Back exits immediately and discards the unsaved attempt.
- Future long-form activities may autosave a draft and show a non-blocking
  "Resume" action; they must not restore a timed attempt as if timing continued.

### Results: convert feedback into the next session

Every result should contain:

1. Outcome: what happened.
2. Interpretation: what that result does and does not mean.
3. Next action: the single best follow-up.

Examples:

- Fast WPM + weak comprehension → "Repeat with a 10% slower target."
- Strong comprehension + stable WPM on two different passages → "Try the next
  pace band."
- Context meaning wrong but clue correct → "Practice Vocabulary in Context."
- Visual-search success → "Good task score. Check transfer with a measured
  read."

Primary result action should be the recommended next step. "Train again,"
"History," and "Home" remain secondary.

### History: answer a question, not just draw charts

History should default to:

- sustainable pace trend;
- comprehension trend;
- qualifying-passage count;
- current reading band;
- recent recommendation and whether it was completed.

Lab history remains separated by game. It must not be plotted on the same scale
as measured reading.

## UI direction

### Visual hierarchy

- Keep the existing white/lilac surfaces and semantic color roles.
- Reduce decorative gradients outside primary actions and game icons.
- Use one primary purple, one secondary accent, and semantic
  success/warning/error colors.
- Replace the oversized raster-logo container with the code-native mark and a
  compact "SpeedRead" wordmark.
- Reduce the daily card's vertical size by shortening explanatory copy and
  moving secondary context behind an info action.
- Use 8-point spacing increments and consistent 16/20/24 px card radii.
- Keep body text at 15–17 px with at least 1.45 line height.

### Interaction

- Minimum touch target: 44 × 44 points, 48 preferred.
- Selected controls must expose checked/selected state.
- Feedback that changes without focus must use a polite live region.
- Do not use blocking dialogs for Back, replay, difficulty changes, or ordinary
  navigation.
- Continue to require confirmation for irreversible clearing/reset actions.
- Add reduced motion and do not rely on animation to communicate correctness.

### Navigation

A separate all-exercises page is not required. Keep Home as the hub. Add a
small sticky shortcut row only if long-scroll testing shows repeated navigation
cost:

- Today
- Exercises
- Progress

These may scroll to sections rather than create new screens.

## Game-logic strategy

### Portfolio roles

**Core outcome games**

- Measured Reading / WPM Test
- Repeated Reading
- Main Idea
- Evidence Hunt
- Comprehension
- Structure Scan
- Context Builder
- Text Search

These should drive the recommended plan.

**Supporting skill games**

- Power Reader
- Words Recall
- Sentence Recall
- Word/Phrase Flash
- Last Word
- Opposites
- Letter Mixup
- Word Search

These may be recommended when a related weakness is observed.

**Optional labs**

- Schulte games
- number/symbol recognition
- even-number and pattern searches
- visual span
- digit memory

Keep them free and discoverable, but do not recommend them as equivalent to
connected reading.

### Adaptive difficulty policy

Manual selection always wins. Adaptive changes apply to a later session unless
a game's rules explicitly support within-session pace adjustment.

Use game-specific mastery contracts:

| Game family | Increase | Hold | Reduce |
| --- | --- | --- | --- |
| Measured reading | Two different valid passages at ≥80% comprehension and stable pace | One valid passage or mixed comprehension | Two weak-comprehension passages |
| Guided pacing | ≥90% content presented plus comprehension check where available | Completed guide without transfer check | Repeated early exits or weak follow-up comprehension |
| Recall/recognition | Accuracy ≥85% over a minimum sample, not a short streak | 65–84% | Three consecutive failures or <65% |
| Search/grid | Accuracy ≥90% with a minimum completed grid and bounded time | Accurate but slow/incomplete | Repeated low accuracy |
| Vocabulary/context | Meaning and clue accuracy both ≥80% | One dimension weak | Both dimensions weak |

Do not award mastery for:

- page skipping;
- attempts below the minimum sample size;
- implausibly short measured reads;
- configured guide WPM;
- immediate replay of identical content.

### Failure behavior

- A normal wrong answer subtracts score or time and continues.
- Reduce adaptive challenge after an established error pattern, not every
  single mistake.
- Three consecutive failures may end fast recognition/recall sessions.
- Connected-reading sessions should finish with feedback, not "game over."
- Always show why difficulty changed and allow the user to undo the next
  session's suggestion.

### Content and vocabulary

Priority is variety with controlled quality, not random strings.

- Expand measured and comprehension content to at least 12 unseen passages per
  readability band before making stronger trend claims.
- Version passages and questions.
- Record topic, length, readability proxy, vocabulary band, and question type.
- Balance main-idea, detail, inference, structure, and vocabulary questions.
- Prevent immediate passage reuse and quarantine content after repeated
  exposure.
- Add Vocabulary in Context before adding more isolated word-pair games.
- Add definitions, example sentences, morphology, collocations, and
  confusable-word distractors.
- Build a local spaced-review queue from words the user missed.
- Keep source/provenance and validators for every pool.
- Do not label content with CEFR, school grade, or a commercial vocabulary list
  unless the data was actually calibrated for that system.

## New exercises worth building

### 1. Pace Ladder

Read equivalent short passages at a comfortable pace, +10%, and +20%. Answer
questions after each. The result is the fastest tested pace that preserved the
comprehension threshold, not the highest displayed pace.

### 2. Variable Pace

Read familiar explanation faster, slow down for a key claim, then scan an
example. The game trains deliberate pace changes rather than one universal WPM.

### 3. Summary Recall

Read connected text, hide it, and write one sentence containing the main claim
and one supporting detail. Score content units separately from grammar.

### 4. Delayed Recall

After another activity, ask one question from an earlier passage. This adds
retention to the product outcome without requiring a long test.

### 5. Vocabulary in Context

Infer a highlighted word, identify the clue, review definition/morphology, then
schedule the word for spaced retrieval in a different sentence.

### 6. Gist–Detail Switch

Alternate between identifying a paragraph's gist and locating one exact detail.
This practices switching reading goals instead of always reading every line at
the same pace.

Do not prioritize more number, symbol, or generic reaction variants until the
core recommendation and content systems are stronger.

## Release plan

### Release 1 — Frictionless sessions

Status: started in this pass.

- Remove all blocking Back prompts from games and measured reading.
- Keep confirmations only for destructive reset/clear actions.
- Add regression coverage for idle, active, and replayed-session exits.
- Compact the Home brand area.
- Add a visible recent/continue row.
- Shorten setup descriptions and label what each result measures.
- Add a recommended next-action card to results.

Success criteria:

- no Back action opens a dialog;
- no active timer survives unmount;
- starting a recommended session takes at most two taps;
- no runtime error in phone-width browser QA.

### Release 2 — Personal coach

- Add a short onboarding choice: goal, available daily minutes, and reading
  context.
- Replace count-based skill rotation with weakness-based prescription.
- Add the mastery contracts above.
- Explain each recommendation in one short sentence.
- Let the user accept, swap, or dismiss the next suggestion.
- Make plan completion and recommendation follow-through visible.

Success criteria:

- every recommendation has a deterministic reason;
- users can override every difficulty/recommendation;
- no lab result changes sustainable WPM;
- unit tests cover each prescription branch.

### Release 3 — Content and vocabulary engine

- Expand unseen passage banks and question coverage.
- Add Vocabulary in Context with local spaced review.
- Add Pace Ladder and Delayed Recall.
- Add content exposure tracking and versioning.
- Calibrate reading bands before labeling them.

Success criteria:

- at least 12 validated passages per measurement band;
- no immediate repeat;
- all questions are passage-dependent and validator-checked;
- repeated content is excluded from baseline trend calibration.

### Release 4 — Personal reading workspace

- Add typography and theme controls across connected-reading surfaces.
- Add durable offline imports for pasted text, EPUB, and supported documents.
- Add explicit storage management.
- Preserve reading position and locally saved drafts.
- Consider optional speech only after privacy, offline behavior, and
  accessibility requirements are defined.

## Prioritized backlog

| Priority | Item | Impact | Effort |
| --- | --- | --- | --- |
| P0 | Immediate non-blocking Back | High | Small |
| P0 | Result → recommended next action | High | Medium |
| P0 | Weakness-based daily plan | High | Medium |
| P0 | Expand unseen measured passage pool | High | Large |
| P1 | Compact Home header/daily card | Medium | Small |
| P1 | Continue/recent row | Medium | Small |
| P1 | Goal and daily-time onboarding | High | Medium |
| P1 | Game-specific mastery rules | High | Medium |
| P1 | Reading typography controls | High | Medium |
| P1 | Vocabulary in Context + review queue | High | Large |
| P1 | Pace Ladder | High | Large |
| P2 | Delayed Recall | Medium | Medium |
| P2 | Local draft/resume for long activities | Medium | Medium |
| P2 | Offline document imports | High | Large |
| P2 | Reduced-motion setting | Medium | Small |
| P3 | Speech input/read-aloud | Medium | Large |

## Local analytics plan

The app can evaluate product usefulness without an account or remote tracking.
Store only local event summaries:

- plan shown/start/completed/swapped/skipped;
- recommendation reason and follow-through;
- game start/exit/complete;
- difficulty selected/suggested/overridden;
- measured-read quality and comprehension band;
- content exposure count;
- result next-action selected.

Provide "Clear local data" and never transmit these events unless a separate,
explicit privacy decision is made.

## Definition of useful

A release is useful only when it improves one of these:

- the user reaches a relevant exercise faster;
- the app better identifies the user's reading limitation;
- practice is more likely to transfer to connected reading;
- measurement becomes more trustworthy;
- the user can read more comfortably;
- the app explains what to do next.

Adding another game without improving one of those outcomes is not a product
priority.
