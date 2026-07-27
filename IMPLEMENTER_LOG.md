# Implementer Log

Date: 2026-07-26
Source: `REVIEWER_HANDOFF.md`, round 1
Role: implementer

## Round-one outcome

The release-blocking R1–R10 findings were implemented and tested. The pass stayed
focused on scoring truthfulness, shared difficulty behavior, replayability,
navigation safety, measurement validity, analytics comparability, contrast, and
compact-screen layout.

### R1 — Text Search truthfulness: completed

- Incorrect word taps now count as errors and show brief, non-disruptive feedback.
- Accuracy is `found / (total targets + errors)`, so both missed targets and false
  selections lower the result.
- Result details now include `found`, `totalTargets`, `missed`, `errors`, and the
  documented formula.
- Added a regression test proving one error followed by every correct target
  produces 67%, not 100%.

### R2 — Pattern Scan truthfulness: completed

- Tracks total targets presented across rounds, correct selections, missed
  targets, and incorrect selections.
- Uses the same documented opportunity/error formula as Text Search.
- Progress success is based on the truthful accuracy, not “found at least one”.
- Added deterministic partial, incorrect-plus-complete, and perfect-completion
  tests.
- Feedback and next-round timeouts touched by this fix are tracked and cleared.

### R3 — Shared Adaptive behavior: completed

- Flash Recall, Number Hunt, Number Search, Symbol Hunt, Phrase Flash, and Word
  Pairs now persist attempts through `updateProgress`.
- The success threshold is consistently `accuracy >= 0.7`.
- Removed Flash Recall’s conflicting in-session `useDifficultyProgression`
  system. Difficulty now comes only from `GameScreen`; a later session receives
  the shared persisted level.
- Added a six-game persistence integration suite.

### R4 — Structure Scan shortcut/replayability: completed

- Correct sections are selected before difficulty-based reduction, so Easy can
  never remove the answer.
- Section maps are shuffled per round; the answer is no longer fixed at position
  two.
- Expanded the authored bank from 5 to 15 varied passages.
- Added deterministic tests for all three Easy answer positions, answer
  inclusion, bank size, and failure of the “always choose #2” shortcut.

### R5 — Context-preserving and guarded back navigation: completed

- Home and Library game launches carry explicit origin metadata.
- Custom Back now uses `goBack`, preserving Home → Game → Home and Library →
  Game → Library stacks.
- `usePreventRemove` centralizes the same confirmation for custom Back, native
  stack gestures, hardware Back, and other route-removal actions.
- Successful completion bypasses the warning and proceeds to Results.
- Replaced the old mocked suite and all 10 skipped/outdated cases with real
  React Navigation tests for Home and Library return flows.

### R6 — Compact Library filter rail: completed

- Filter rail is capped at 56 px and cannot flex-grow.
- Chips are 44 px high, cross-axis centered, non-shrinking, and horizontally
  scrollable.
- Added dimension/style contract assertions.

### R7 — Implausible measured-reading attempts: completed

- Added a shared quality assessment: attempts below 3 seconds or above 1,000 raw
  WPM are invalid for calibration.
- Raw attempts are still saved and shown with a visible quality warning.
- Invalid attempts do not update Repeated Reading adaptive progress and are
  excluded from progress charts.
- Added 1 ms regression tests for both measured reading flows.

The thresholds are conservative input-quality guardrails, not claims about a
reader’s ability. Raw timing is preserved rather than clamped.

### R8 — Comparable progress analytics: completed

- Zero-score failures remain in charts and averages.
- Trends are segmented by exercise, activity, metric, difficulty, and available
  content identity.
- Invalid measurements are excluded while remaining in session history.
- Configured pacing is labeled `Paced WPM`, distinct from measured `WPM`.
- Result charts receive the complete current result rather than an unqualified
  score.
- Added tests for zeros, mixed difficulties, invalid readings, content changes,
  and paced/measurement labels.

### R9 — Accessible semantic colors: completed for reviewed release surfaces

- Added semantic enabled, pressed, focus, disabled, success, error, warning,
  information, and accessible accent roles.
- Migrated the reviewer’s representative low-contrast exercise accents and
  muted text uses to semantic tokens.
- Added automated WCAG contrast tests: normal-text token pairs are at least
  4.5:1 and the focus ring is at least 3:1.

A repository-wide removal of every historical raw hex value is intentionally
not bundled into this correctness pass; new and reviewed surfaces now have
tested roles.

### R10 — Narrow Home cards: completed

- Home switches from two columns to one below a testable 360 px breakpoint.
- Added contract tests for 320 px, breakpoint, and tablet widths.
- Existing card controls retain practical touch targets.

## Additional reviewer items

### R11 — Library density: deferred to round 2

Category and evidence-tier labels were added to search indexing. Converting all
cards to a virtualized expandable `FlatList` is a larger interaction redesign
and is deferred so it can receive focused accessibility and state-restoration
review.

### R12 — Meaningful challenge dimensions: deferred to round 2

The existing three settings remain adjustable. Redesigning stimuli, distractor
similarity, inference depth, and density for every listed game requires content
authoring and new per-game acceptance tests; changing only timers again would
not satisfy the reviewer.

### R13 — Timeout lifecycle: partially completed; remainder deferred

This pass tracks/clears Structure Scan, Text Search, Pattern Scan, Flash Recall,
Number Hunt, Symbol Hunt, and Phrase Flash callbacks affected by R1–R4. The
remaining historical timeout sites listed by the reviewer need a dedicated
25-game lifecycle pass rather than broad mechanical edits without replay tests.

### R14 — Non-blocking result persistence: completed

Game results navigate immediately while persistence continues in the
background. Report-once protection remains in place. Added pending-save and
rejected-save tests proving completion is not blocked.

### R15 — Invented comprehension: completed

`comprehensionCorrect` is optional. `GameScreen` records it only when a game
actually supplies a comprehension result; unrelated accuracy is no longer
converted into invented comprehension. Existing records remain structurally
compatible.

### R16 — Transfer messaging: completed

Experimental/lab feedback now describes the score as task-specific and directs
the user to a measured read with comprehension to evaluate reading transfer.

### R17 — Full matrix: partially completed; remainder deferred

- Removed all skipped tests.
- The existing 25-game auto-start audit remains green.
- Added focused completion, persistence, replayability, navigation, timeout, and
  difficulty tests for every changed area.

A uniform 25-game matrix for completion, exact report-once behavior, replay,
unmount, and all three challenge configurations remains a round-two task.

## Portfolio and new-exercise recommendations

The consolidation and Pace Ladder/Detail Retrieval/Summary/Vocabulary additions
are documented in `REVIEWER_HANDOFF.md` and remain deferred until the reviewer
accepts the correctness foundation. No durable game IDs were removed in this
pass.

## Validation

- `npm run typecheck`: passed.
- Targeted round-one suite: 11 suites, 61 tests passed.
- `npm run test:ci -- --silent`: 40 suites, 217 tests passed, 0 skipped.
- `npm run export:web -- --output-dir /private/tmp/speedread-export.kQvJEf`:
  passed.
- `npm run doctor`: 18/18 checks passed.
- Real React Navigation coverage: Home → Game → Back and Library → Game → Back
  passed.
- Compact viewport behavior is guarded by explicit 320 px/breakpoint and filter
  dimension tests. A fresh browser screenshot pass should be performed by the
  reviewer during round-two re-validation.

# Implementer Log — Round 2

Date: 2026-07-26

## Round-two outcome

The reviewer’s second-fix list is implemented. This pass concentrated on the
false-green paths identified during the second review: cancelled navigation,
background-save races, invalid History summaries, remaining known contrast
violations, timer cleanup, meaningful challenge design, Library scaling, and
useful longitudinal reading comparisons.

### RR2-1 — Safe active-session navigation: completed

- Idle games leave immediately and do not show a discard prompt.
- A game marks the route dirty only after Start; custom Back, hardware Back, and
  stack removal use the same `usePreventRemove` guard.
- Cancelling “Leave training?” no longer sets the game’s cancellation flag, so
  the user can continue, complete the game, and reach Results.
- Actual unmount is the only path that marks the game cancelled.
- Real-navigation tests cover idle Back, active Back → Keep → completion, and
  active Back → Leave.

### RR2-2 / RR2-3 — Honest History and resilient result persistence: completed

- “Average valid measured speed” includes only valid measured-reading attempts.
- Invalid raw sessions remain visible and say “Not used for progress”.
- Result saves are serialized and upserted by result ID, preventing overlapping
  read/modify/write operations from dropping attempts or duplicating a retry.
- Both games and measured reads navigate without awaiting storage.
- Result charts and History accept the just-finished result optimistically and
  deduplicate it once storage catches up.
- Tests cover a valid read plus a 1 ms read, concurrent saves, same-ID upsert,
  pending and rejected saves, an immediate Result chart, and immediate History.

### RR2-4 — Enforced reviewed contrast migration: completed

- Removed the reviewer’s remaining known failing raw values from live TSX
  surfaces and replaced them with semantic foreground/status tokens.
- Added a repository-level source contract that fails if the reviewed raw
  low-contrast values are reintroduced in non-test TSX.
- Semantic token contrast tests continue to enforce WCAG AA pair thresholds.

### RR2-5 — Virtualized, compact Training Library: completed

- Replaced the eager vertical `ScrollView` with a bounded `FlatList`
  (`initialNumToRender=5`, five-item batches, five-window viewport).
- Cards initially show identity, evidence tier, a 44 px expandable details
  control, and Start; rules and all difficulty descriptions render on demand.
- Expand/collapse exposes an accessible `expanded` state and remains stable when
  filters temporarily remove and restore a card.
- Search, category filtering, open-game behavior, compact rail dimensions, and
  virtualization properties are covered.
- Rendered at 320×568: only five cards were present in the accessibility tree,
  filters remained a compact horizontal rail, expansion worked, the `headings`
  search returned only Structure Scan, and Library → Game → Back restored the
  active search context.

### RR2-6 — Meaningful game-specific difficulty: completed

- Main Idea keeps two rounds at every setting while increasing authored passage
  complexity, distractor plausibility, and reasoning from explicit to synthesis
  to qualification.
- Comprehension uses three authored leveled passages with constant two-question
  sessions and explicit-detail, idea-linking, and inference demands.
- Word Pairs keeps a 30-second session while increasing word unfamiliarity,
  semantic distractor plausibility, and option count.
- Number Hunt keeps a 30-second session while increasing digit count, target
  set size, near-number similarity, and cadence from 1,600 to 700 ms.
- Symbol Hunt keeps a 30-second session while moving from distinct symbols to
  confusable glyphs, increasing set size, and increasing cadence.
- Timed-out Number/Symbol stimuli now count as attempts and lower accuracy;
  generated streams keep one stable target rather than changing the target
  independently of the displayed stream.
- A dedicated five-game configuration suite proves that Easy/Medium/Hard change
  stimulus challenge rather than merely shortening the session.

### RR2-7 — Remaining timeout lifecycle debt: completed

- Added one tracked-timeout hook with unmount cleanup.
- Migrated the reviewer’s remaining replay, focus, and feedback callbacks in Eye
  Reset, Letter Jumble, Even Numbers, Schulte Mix, Memory Recall, Visual Span,
  Word Flash, Word Mismatch, and Letter Recognition.
- Added immediate-unmount coverage for all nine affected games plus a source
  contract that blocks the reviewed untracked patterns.

### RR2-8 — Useful cross-passage comparison bands: completed

- Every authored measured-reading sample now carries both its passage ID and an
  authored comparison band.
- Comparison keys use activity, metric, difficulty, and band, so different but
  similarly demanding passages can form a longitudinal baseline.
- Earlier attempts on the exact current passage are counted separately as
  same-passage practice and excluded from the baseline trend to avoid familiarity
  inflation.
- Non-reading games retain ordinary comparable-attempt histories; paced WPM
  remains separate from measured WPM.

### RR2-9 — Validation matrix: strengthened within a maintainable scope

- The existing 25-game registry/auto-start audit remains active and skip-free.
- The catalog contract proves that every registered ID has complete rules and
  all three manual difficulty descriptions.
- Focused completion/report/replay tests remain in each game’s native suite, and
  the new lifecycle suite covers every callback site changed in this review.
- All six originally broken Adaptive games have persistence integration plus an
  explicit level-5/streak-4 → level-6 test proving that the next session resolves
  from Easy to Medium.
- A single uniform synthetic interaction script for all 25 games is intentionally
  not added: the games have incompatible completion mechanics, and such a script
  would mostly duplicate stronger native suites while becoming brittle. The
  release contract instead combines the full registry start audit, complete
  static catalog contract, focused per-mechanic completion suites, timer
  lifecycle matrix, and adaptive threshold matrix.

## Final validation

- `npm run typecheck -- --pretty false`: passed.
- Focused second-round regression run: 13 suites, 98 tests passed.
- `npm run test:ci -- --silent`: 46 suites, 259 tests passed, 0 skipped.
- `npm run doctor`: 18/18 checks passed.
- `npm run export:web`: passed; production web bundle exported.

# Research Cycle Build

Date: 2026-07-26

## RC-1 — Evidence Hunt: completed

- Added 36 original, versioned rounds: 12 each at Easy, Medium, and Hard.
- Every item has stable content and sentence IDs, source/license metadata, word
  count, answer and evidence keys, rationale, and accessibility text.
- Easy uses short explicit passages and one direct evidence sentence; Medium
  uses longer paraphrased passages; Hard requires inference and two evidence
  sentences with plausible distractors.
- The answer and required evidence must both be selected. Answer accuracy and
  evidence accuracy are reported separately. Selecting wrong evidence and then
  correcting it cannot earn full evidence credit.
- The timer is optional and off by default at every level. Expiry is an
  unanswered attempt, and leaving an active session creates no result.
- Replay rotates to fresh item IDs before reuse and reports exactly once.

## RC-2 — Context Builder: completed

- Added 36 original, versioned rounds: 12 distinct target words at each
  difficulty.
- Each item records its target sentence, definition, meaning options, accepted
  context-clue IDs, clue type, morphology, frequency/complexity metadata,
  rationale, and accessible target-word description.
- A round requires both a meaning choice and a clue choice. Confidence is
  optional and explicitly not scored; Skip records an omission.
- Meaning accuracy, clue accuracy, attempts, omissions, and confidence are
  reported as separate dimensions. The target is identified by text and
  underlining rather than color alone.
- The exercise is untimed. Replay uses fresh items before reuse, reports once,
  and does not save an abandoned session.

## RC-3 — Difficulty and session integrity: completed

- Both exercises expose Easy, Medium, and Hard in the shared controller.
- Manual remains the default. Adaptive is opt-in and never changes difficulty
  during an active session.
- Two consecutive qualifying sessions create a transparent next-session
  suggestion; the user’s manual selection is not overwritten.
- Results store schema and content versions, item IDs, difficulty, component
  metrics, replay IDs, and immediate-replay-duplicate status.
- All 27 registered games now participate in the shared auto-start, completion,
  report-once, replay-reset, pending-timer, unmount, navigation, catalog, and
  history contracts.

## RC-4 — Today plan and baseline: completed

- Today contains at most three ordered items: a skippable direct read/baseline,
  one explained focused skill, and an optional Eye Reset only after sustained
  use.
- Every item states why it was selected and its estimated duration, and exposes
  Start, Swap where applicable, and Skip without streak penalty.
- Baseline uses three different versioned passages with three dependent
  main-idea/detail/inference questions per passage.
- A personal estimate is withheld until three valid different passages exist.
  It then uses median valid WPM and reports comprehension as correct/total.
- Home and the reader use the same duration estimator.

## RC-5 — Results, History, and comparison validity: completed

- Results use plain metric cards rather than progress rings.
- Evidence Hunt shows answer accuracy, evidence accuracy, wrong selections, and
  median locate time. Context Builder shows meaning and clue accuracy,
  attempts, and omissions.
- History defaults to Reading and separates Practice and Labs. Reading trends
  use compatible passage bands; task trends retain their own metric and
  difficulty keys. Invalid and immediate duplicate measurements remain
  viewable but are excluded from estimates and trends.
- Charts size from their actual container and expose a visible textual data
  series plus an accessible summary.

## RC-6 — Responsive and accessibility contract: completed

- Added a shared shell with compact below 600 px, medium from 600–839 px, and
  expanded at 840 px and above, capped near 1,200 px. Reading text is capped at
  700 px.
- Home, Library, Game, Exercise, Result, and History screens use the shell.
- Browser validation at 320, 390, 768, 1,024, and 1,440 CSS pixels found zero
  horizontal overflow and zero visible interactive targets below 44×44.
- Keyboard traversal follows the visual order and retains a visible browser
  focus outline. New game controls expose named radio, switch, checkbox, and
  button semantics.
- Reduced-motion, screen-reader, and bold-text preferences are queried with
  safe platform fallbacks. A browser-only missing bold-text API discovered
  during validation was guarded and regression-tested.

## Post-development validation cycle 1

- Strict typecheck passed.
- Full test run passed after the feature build.
- Expo Doctor passed all 18 checks.
- Production web export passed.
- Content validators prove at least 12 reviewed rounds per difficulty, stable
  keys, answer/evidence dimensions, and three valid baseline passages.

## Post-development validation cycle 2

- Interactive browser testing exposed a React Native Web crash when
  `isBoldTextEnabled` was unavailable.
- Added a capability-safe query fallback and regression tests for missing and
  rejected accessibility preference APIs.
- Re-tested a live Evidence Hunt setup and active round at 390 px: controls,
  sentence semantics, difficulty labels, optional timer, and active passage
  reflow all passed with no horizontal overflow or undersized targets.
- Final `npm run typecheck -- --pretty false`: passed.
- Final `npm run test:ci -- --silent`: 55 suites, 323 tests passed, 0 skipped.
- Final `npm run export:web`: passed.
- Final `git diff --check`: passed.

## Honest validation boundary

- Web responsive layout, keyboard focus, semantic DOM, reduced-motion query,
  game start, and active-round behavior were tested interactively.
- Native VoiceOver/TalkBack announcements, OS-level 200% dynamic type, app
  background/resume, and device storage-failure recovery still require an iOS
  or Android device/simulator pass; automated lifecycle and accessibility
  contracts cover the code paths but are not a substitute for native assistive
  technology testing.

# Research Cycle Correction Pass

Date: 2026-07-26

## RC-A1 — Evidence Hunt difficulty integrity: corrected

- All 12 Medium correct answers are now authored paraphrases rather than
  substrings copied from their passages.
- Every Hard item removes the sentence that previously supplied the conclusion.
  Its two keyed inputs are now the independently necessary observed outcome and
  stated limitation.
- Added typed evidence requirements with `tested-change`, `outcome`, and
  `limitation` roles plus a `synthesis-input` purpose.
- Validation and rendered-item tests check every Medium and Hard round: answers
  are nonverbatim, Hard roles are distinct, both keys exist, and neither the
  passage nor keyed text states the inferred answer.
- Catalog copy now describes the actual paraphrase and outcome-plus-limitation
  tasks.

## RC-A2 — Context Builder editorial and anti-template quality: corrected

- Replaced the repeated generic meaning distractors with 36 authored,
  word-specific sets of same-part-of-speech alternatives.
- Every clue option now references one or more real sentence IDs and carries a
  semantic role. Plausible background, target-use, contrast, and consequence
  spans replace title/count/punctuation decoys.
- Correct clue positions rotate across all four option IDs. Medium items vary
  between contrast and consequence; Hard items require a two-span combined
  context.
- Replaced the malformed Hard template with 12 explicitly authored and reviewed
  grammatical target sentences.
- Validators prove unique IDs/text, target presence, real span references,
  difficulty-appropriate clue roles, and rotating meaning/clue positions.
  Tests assert the complete reviewed Hard sentence list and reject every prior
  generic option template.

## RC-A3 — Adaptive qualification integrity: corrected

- Context Builder preserves attempted accuracy for display, but adaptive
  qualification now requires all five production rounds to be attempted.
- The two-session run stores its played difficulty and resets to one whenever
  difficulty changes; Easy and Medium sessions cannot combine.
- Immediate replay duplicates remain reportable and visible but never qualify.
- Two complete, nonduplicate sessions at the same difficulty and at least 80%
  on both components still suggest the next band. Manual difficulty selection
  remains untouched.
- Tests cover one correct plus four omissions, cross-level runs, full five-round
  qualification, and immediate duplicates.

## RC-A4 — Baseline eligibility and Today persistence: corrected

- Added one shared `isBaselineEligibleResult` rule for Today and the personal
  estimate. It requires a current baseline content ID and version, the authored
  comparison band, an explicitly valid quality result, and at least three
  comprehension questions.
- Legacy one-question and wrong-version/band attempts remain in History but do
  not complete a baseline slot.
- The displayed ordinal now counts completed baseline IDs only, so unrelated
  measured passages cannot produce impossible values such as 8 of 3.
- Today skips are stored with a local-date key, restored across Home
  unmount/remount, explicitly restorable, and cleared when the local date
  changes.
- Eye Reset now appears only after at least ten minutes of actual same-local-day
  activity duration; raw session count is no longer sufficient.

## RC-A5 — Evidence locate-time truthfulness: corrected

- Each round captures its locate timestamp when the complete required evidence
  set is first selected.
- Answer-decision time after evidence completion no longer inflates locate
  time.
- Expired/unanswered rounds are omitted from the locate median and recorded via
  a separate located-round count.
- An exact fake-timer test selects evidence at 5 seconds, submits the answer at
  15 seconds, and proves the reported locate time is 5 seconds. A second test
  proves expiration creates no locate timing.

## RC-A6 — Single connected-reading measure: corrected

- `ReadingColumn` is now the only 700-pixel direct-reading width contract.
- It wraps active text in Measured Reading, Evidence Hunt, Context Builder,
  Repeated Reading, Comprehension, Main Idea, Structure Scan, and Text Search.
- Removed duplicated local `maxWidth: 700` rules from those flows.
- Contract tests prove every retained flow uses the shared component and the
  component remains fluid at `width: 100%` with a 700-pixel maximum.
- Live Evidence Hunt and Context Builder checks at 1,728 px measured exactly
  700 px for connected text while the active shell and controls used 1,152 px.
- Compact Context Builder QA initially exposed a 38-pixel action-row overflow.
  The two actions now use constrained equal-width wrappers. The 320-pixel
  recheck measured a 272-pixel reading column, zero horizontal overflow, and no
  visible interactive target below 44×44.

## RC-A7 — Conservative personal-estimate quality rule: corrected

- Replaced the 1,000-WPM ceiling with a documented shared 800-WPM ceiling.
- Exactly 800 WPM remains eligible; values above 800 receive
  `implausible-speed`.
- Shared validity now recalculates reading quality from raw word count and
  elapsed time, so previously stored extreme attempts are consistently excluded
  from Today completion, estimates, Results comparisons, History trends, and
  charts while the raw attempt remains visible.
- Boundary tests cover 800, 801, and an approximately 900-WPM 140-word attempt;
  the extreme attempt cannot fill a baseline slot.

## Correction validation

- `npm run typecheck -- --pretty false`: passed.
- Focused correction gate: 10 suites, 77 tests passed.
- Non-silent nearby async/UI gate: 4 suites, 12 tests passed with no React
  `act(...)` warnings.
- Final `npm run test:ci -- --silent`: 57 suites, 345 tests passed, 0 skipped.
- `npm run doctor`: 18/18 checks passed.
- Final `npm run export:web`: passed.
- `git diff --check`: passed before logging; final patch hygiene rechecked after
  this section.
- Live browser QA passed at 320 and 1,728 pixels after the compact action-row
  correction. Evidence Hunt and Hard Context Builder both rendered real active
  rounds with zero final horizontal overflow; browser console contained no app
  errors.
- `git diff --check`: passed.
- Rendered 320×568 browser validation: Home one-column layout, compact
  virtualized Library, details expansion, search, Library → Game → Back context,
  and zero browser console errors all passed.

# Implementer Log — Final Corrective Pass

Date: 2026-07-26

## Final-acceptance outcome

All four final-review findings are implemented and covered by executable
contracts.

### FA-1 — Auto-started replay navigation guard: completed

- `useAutoStart` now marks the route active at the exact point that it invokes a
  game’s automatic `start` callback.
- Real-navigation tests complete Structure Scan, choose Play Again, and verify
  both active Back → Keep training and active Back → Leave flows.

### FA-2 — Semantic contrast coverage: completed

- Text Search feedback, Result progress, and History trend states now use the
  tested semantic success/error/info foreground and surface pairs.
- The repository source contract covers all seven reviewed low-contrast raw
  values and asserts that the three reviewed surfaces contain no raw hex colors.
- The expanded contract also caught and migrated the same legacy positive-trend
  value in Word Flash.

### FA-3 — All-game lifecycle release gate: completed

- Added data-driven completion adapters and game-specific drivers for every one
  of the 25 registered games.
- Each game now proves exactly one completion report, report-once behavior after
  pending timers drain, a clean active replay reset, and no report after active
  replay unmount.
- Number Hunt, Symbol Hunt, and Even/Odd are explicitly included.
- Every registered game exposes a stable `play-again` test contract.

### FA-4 — Cross-passage measured-reading trends: completed

- Measured reads compare by activity, metric, difficulty, and comparison band
  across genuinely different passage IDs.
- Non-reading games remain grouped by normalized game ID, including legacy ID
  aliases.
- Result and History chart tests now use distinct stored `sampleId` values and
  prove that compatible passages form one trend.

## Final validation

- `npm run typecheck -- --pretty false`: passed.
- Focused final-acceptance run: 7 suites, 68 tests passed.
- `npm run test:ci -- --silent`: 47 suites, 294 tests passed, 0 skipped.
- `npm run doctor`: 18/18 checks passed.
- `npm run export:web`: passed; production web bundle exported.
