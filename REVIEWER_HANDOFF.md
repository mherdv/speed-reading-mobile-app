# Reviewer Handoff — Round 1

Date: 2026-07-26
Role: reviewer only
Verdict: **Changes requested**

## Scope and baseline

Reviewed the current mobile/web implementation, Training Library, all 25 listed exercises, difficulty behavior, scoring, lifecycle, navigation, results/history, responsive UI, accessibility, evidence, and automated coverage.

No product source was changed in this review.

Baseline completed before this handoff:

- TypeScript typecheck passed.
- Jest completed with 36 passing suites, 184 passing tests, and 10 skipped tests.
- Manual browser checks used 390×844 and 320×568 viewports.
- No P0 crash or data-loss defect was found.

The green baseline is not a release signal: several tests do not exercise truthful scoring, complete navigation, replay/unmount cleanup, or real difficulty progression.

## P1 — Fix before release

### R1. Text Search ignores incorrect taps and reports false 100% accuracy

Files:

- `mobile/src/games/TextSearch/TextSearch.tsx:142-143`
- `mobile/src/games/TextSearch/TextSearch.tsx:164-179`
- `mobile/src/data/gameCatalog.ts:336-345`

Reproduction:

1. Open Training Library → Text Search → Easy.
2. Start a round with target “fish”.
3. Tap a non-target word, then all four target words.
4. The result reports score 100, accuracy 100%, and “Sharp and controlled”.

The implementation derives accuracy only from found targets and never records incorrect taps, although the rules say wrong taps reduce accuracy.

Acceptance:

- Count correct and incorrect attempts.
- Compute and display an honest accuracy metric.
- Give clear non-disruptive feedback for an incorrect tap.
- Include errors in result details.
- Add a test proving one wrong tap followed by all correct taps cannot yield 100%.

### R2. Pattern Scan fabricates accuracy and ignores incorrect selections

Files:

- `mobile/src/games/PatternScanning/PatternScanning.tsx:159-181`
- `mobile/src/games/PatternScanning/PatternScanning.tsx:194-215`
- `mobile/src/data/gameCatalog.ts:264-273`

Accuracy is currently binary: finding any target produces `1`. Incorrect cells do nothing, and `totalTargets` is populated with the number found rather than the number available.

Acceptance:

- Track available targets, correct selections, missed targets, and incorrect selections.
- Use a documented precision/recall or correct-attempt formula.
- Never award 100% after finding only one of several targets.
- Add tests for partial completion, wrong selections, and perfect completion.

### R3. “Adaptive” mode does not adapt in six eligible games

Files:

- `mobile/src/data/difficultyPreferences.ts:32-34`
- `mobile/src/screens/GameScreen.tsx:122-133`
- `mobile/src/games/FlashReading/FlashReading.tsx`
- `mobile/src/games/NumberRecognition/NumberRecognition.tsx`
- `mobile/src/games/NumberSearch/NumberSearch.tsx`
- `mobile/src/games/SymbolRecognition/SymbolRecognition.tsx`
- `mobile/src/games/TimedPhraseRecognition/TimedPhraseRecognition.tsx`
- `mobile/src/games/WordPairs/WordPairs.tsx`
- `mobile/src/hooks/useDifficultyProgression.ts:25-110`

These games expose Adaptive and load a persisted level but never persist progress. They remain at level 1 across sessions. Flash Reading also has a second, in-session progression system, creating two incompatible meanings of adaptive difficulty.

Acceptance:

- Either integrate every eligible game with the shared persisted progression contract or remove Adaptive for that game.
- Define a consistent success threshold and persistence behavior.
- Selecting Adaptive must be able to change the next session’s configuration.
- Remove or clearly separate Flash Reading’s duplicate progression system.
- Add persistence tests for every adaptive-eligible game.

### R4. Structure Scan can be solved by always choosing heading #2

Files:

- `mobile/src/data/structureScanPassages.ts:20-164`
- `mobile/src/games/StructureScan/StructureScan.tsx:205-209`
- `mobile/src/games/StructureScan/StructureScan.tsx:286-303`

All five passages place the correct heading in the second position, and the component preserves the choice order. The exercise therefore teaches a position shortcut instead of structure recognition. Five passages are also quickly memorized.

Acceptance:

- Vary correct-answer positions across authored data or shuffle choices per round while preserving correctness.
- Ensure Easy never slices away the correct answer.
- Add at least 15 varied passages before calling the game replayable.
- Test that correct answers occupy at least three positions and that always choosing #2 fails.

### R5. Back navigation loses context and can bypass the active-session warning

Files:

- `mobile/src/navigation/RootNavigator.tsx:59-73`
- `mobile/src/navigation/RootNavigator.tsx:105-117`
- `mobile/src/screens/GameScreen.tsx:143-164`
- `mobile/src/__tests__/appFlow.test.tsx:153-155`

Opening a game from Training Library and pressing its custom Back button resets to Home rather than returning to the Library. Native stack gesture/hardware removal is not intercepted by the same active-session confirmation. The existing app-flow suite contains 10 skipped/outdated cases and mocked navigation that does not cover this behavior.

Acceptance:

- Preserve the origin route and return to it with `goBack` or equivalent history-aware behavior.
- Intercept gesture, hardware, and header removal with the same active-session guard.
- Add real-navigator tests for Home → Game → Back and Library → Game → Back.
- Restore or replace all skipped flow tests; remove outdated labels and selectors.

### R6. Library filters become ~230 px-tall pills at 320 px width

Files:

- `mobile/src/screens/TrainingLibraryScreen.tsx:84-104`
- `mobile/src/screens/TrainingLibraryScreen.tsx:293-306`

At 320×568, each filter chip stretched to about 230 px high and “Scan & search” was clipped. The filters consume most of the visible screen.

Acceptance:

- Bound the filter rail to at most 56 px.
- Keep each chip 44–48 px high and horizontally scrollable.
- Verify no clipping at 320 and 390 px widths.
- Add responsive screenshot or dimension assertions.

### R7. Immediate completion can create implausible WPM and corrupt progress

Files:

- `mobile/src/games/RepeatedReading/RepeatedReading.tsx:99-105`
- `mobile/src/games/RepeatedReading/RepeatedReading.tsx:129-140`
- Corresponding measured-reading finish logic in `mobile/src/screens/ExerciseScreen.tsx`

Repeated Reading permits an almost immediate finish, floors duration to 1 ms, and can then advance progress after a memorized comprehension answer. This can store an extreme WPM as a best or adaptive signal.

Acceptance:

- Prevent accidental immediate completion or mark implausibly short attempts invalid.
- Exclude invalid attempts from bests, trends, and adaptive calibration.
- Preserve the raw attempt with a visible quality flag rather than silently clamping it.
- Add a test for a 1 ms completion attempt.

### R8. Progress charts omit failures and mix incomparable sessions

Files:

- `mobile/src/ui/ProgressCharts.tsx:43-64`
- `mobile/src/ui/ProgressChart.tsx:22-29`
- `mobile/src/ui/ProgressChart.tsx:52-65`
- `mobile/src/screens/ResultScreen.tsx:176-191`

Zero scores are filtered out. Results are grouped mainly by game ID, mixing difficulties and potentially different metrics/content while the UI claims “Compare like-for-like sessions”. A configured pacing rate can consequently appear as measured reading progress.

Acceptance:

- Retain zero-score attempts.
- Segment trends by activity, metric, difficulty, and relevant content/readability.
- Label configured pacing separately from measured WPM.
- Add tests with zeros and mixed-difficulty sessions.

### R9. Core colors fail normal-text contrast and bypass the theme

Representative files:

- `mobile/src/theme/colors.ts`
- `mobile/src/games/VisualSpanExpansion/VisualSpanExpansion.tsx:260`
- `mobile/src/games/TimedWordRecognition/TimedWordRecognition.tsx:357-447`
- `mobile/src/games/NumberSearch/NumberSearch.tsx:262-318`
- `mobile/src/games/PatternScanning/PatternScanning.tsx:330-390`
- `mobile/src/games/TimedPhraseRecognition/TimedPhraseRecognition.tsx:308-355`
- `mobile/src/games/MemoryRecall/MemoryRecall.tsx:291-359`

Examples against white: `#9CA3AF` 2.54:1, `#F59E0B` 2.15:1, `#14B8A6` 2.49:1, `#0D9488` 3.74:1, `#EA580C` 3.56:1, `#0284C7` 4.10:1, `#8B5CF6` 4.23:1. Normal text requires 4.5:1 under WCAG AA. The project also contains hundreds of hard-coded color uses, causing inconsistent states and branding.

Acceptance:

- Introduce semantic foreground/background/status tokens.
- Meet 4.5:1 for normal text and 3:1 for large text and essential UI graphics.
- Cover enabled, pressed, focused, disabled, success, and error states.
- Add automated contrast tests for token pairs.

## P2 — Important quality improvements

### R10. Home cards do not adapt to narrow screens

`mobile/src/screens/HomeScreen.tsx:600-660` keeps two columns at all widths. At 320 px, “Comprehension” breaks mid-word and descriptions are heavily truncated.

Acceptance: use one column below a compact-width breakpoint or safe text scaling; verify 320/390 layouts and 44 px targets.

### R11. Training Library is too dense and not efficiently searchable

`mobile/src/screens/TrainingLibraryScreen.tsx:45-53` and `:106-200` render all 25 expanded cards in a ScrollView. Search omits category/tier text.

Acceptance: use `FlatList`/`SectionList`, compact cards with expandable rules, and index title, description, rules, keywords, category, and evidence tier.

### R12. Several difficulty levels alter duration or repetition, not challenge

Examples:

- Main Idea changes round count: `MainIdeaSprint.tsx:28-31`.
- Word Pairs changes duration: `WordPairs.tsx:57-65`.
- Number/Symbol Hunt mainly change duration: `NumberRecognition.tsx:34-44`, `SymbolRecognition.tsx:36-46`.
- Comprehension changes question count on one fixed passage: `ComprehensionTest.tsx:37-84`.

Shorter sessions are not harder when the score is accuracy; more rounds measure endurance, not complexity.

Acceptance: define game-specific difficulty using distractor similarity, stimulus length, cadence, inference depth, density, or grid size; test that all three levels change meaningful challenge parameters.

### R13. Multiple delayed callbacks are not lifecycle-managed

Untracked `setTimeout` calls exist in Eye Movement, Flash Reading, Letter Jumble, Memory Recall, Number Recognition, Pattern Scan, Schulte Mix, Symbol Recognition, Timed Phrase, Timed Word, Visual Span, Word Mismatch, and Even Numbers.

Acceptance: centralize tracked timeout cleanup; clear callbacks on unmount, replay, and completion; prove no post-unmount update or duplicate report with lifecycle tests.

### R14. Result persistence can block navigation

`mobile/src/screens/GameScreen.tsx:166-195` and `mobile/src/navigation/RootNavigator.tsx:82-99` await storage before showing Results.

Acceptance: navigate without waiting indefinitely, make persistence idempotent, handle failure visibly but non-fatally, and test a pending/rejected save.

### R15. The result model invents comprehension for non-reading games

`mobile/src/domain/types.ts:12-24` requires a comprehension boolean, and `GameScreen.tsx:184-186` defaults unrelated activities to `true`.

Acceptance: use discriminated result types or make comprehension optional only for measured reading; migrate existing records safely.

### R16. Experimental-game messaging overstates transfer

`mobile/src/screens/ResultScreen.tsx:65-74` says repeated lab practice will build durable speed. Current evidence does not justify broad reading-transfer claims.

Acceptance: report task-specific improvement; direct users to comparable, comprehension-checked reading sessions to assess transfer.

### R17. The automated matrix is incomplete despite a green suite

The suite checks basic starts but not every game’s completion, report-once behavior, replay reset, unmount cleanup, and three-level configuration. Ten flow tests remain skipped.

Acceptance: add a 25-game contract matrix covering start, finish, one report, replay, unmount, manual difficulty, and adaptive eligibility; restore real navigation flows.

## Exercise portfolio recommendation

Consolidate redundant mechanics:

- Merge Number Hunt and Symbol Hunt into one Recognition Stream with stimulus packs.
- Present Schulte Numbers, Letters, and Mix as variants of one Schulte Lab.
- Combine overlapping Flash Recall, Word Flash, and Phrase Flash into a progressive recognition pack; retain connected-text meaning checks.
- Keep Number Search, Letter Hunt, and Pattern Scan separate only if each has distinct scoring and challenge progression.
- De-emphasize Even/Odd because its connection to reading performance is especially weak.

Add after the P1 correctness work:

1. Pace Ladder calibrated from multiple comparable, comprehension-checked reads.
2. Detail Retrieval with immediate and delayed questions.
3. Main-Idea/Summary Compression using connected text and a transparent rubric.
4. Vocabulary in Context.
5. Variable-Pace Reading and question-first scanning for specific information.

Do not market eye or grid games as proven to increase general reading speed. Label them as experimental visual-attention practice and validate transfer through measured reading plus comprehension.

## Research and competitor context

- A major review finds a speed–accuracy tradeoff and does not support large reading-speed gains with unchanged comprehension: [So Much to Read, So Little Time](https://journals.sagepub.com/doi/10.1177/1529100615623267).
- Specific retrieval questions improved delayed memory for text containing irrelevant details in one study: [Applied Cognitive Psychology](https://onlinelibrary.wiley.com/doi/abs/10.1002/acp.3984).
- Text-structure/main-idea instruction showed near and mid transfer but not far-transfer reading comprehension in a randomized study: [PMC study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7539662/).
- Accessibility requirements: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography), and [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo).
- Relevant product patterns, not scientific proof: [AceReader comprehension](https://www.acereader.com/reading-comprehension), [AceReader baseline/adaptive positioning](https://www.acereader.com/common-core), [Outread](https://outreadapp.com/), and [Spreeder](https://www.spreeder.com/).

The useful competitor pattern is calibration with comparable passages, comprehension, adjustable pacing, and user-owned content—not copying unsupported “brain game” claims.

## Implementer order and re-review gate

Implement in this order:

1. R1–R4 truthful scoring, adaptive behavior, and shortcut removal.
2. R5–R7 navigation, responsive Library, and reading-attempt validity.
3. R8–R9 honest analytics and accessible theme tokens.
4. R10–R17 responsive polish, meaningful difficulty, lifecycle, data model, and test matrix.
5. Portfolio consolidation/new exercises only after core correctness is stable.

Before returning to the reviewer:

- Typecheck and all tests must pass with no unexplained skips.
- Every one of 25 games must pass the lifecycle/difficulty matrix.
- Verify Home, Library, game, and result flows at 320×568 and 390×844.
- Verify gesture/hardware/custom Back from active and idle sessions.
- Verify contrast, text scaling, reduced motion behavior, and 44 px targets.
- Verify results retain failures and compare only equivalent measurements.
- Document each fixed reviewer ID and its added test.

Round 1 status: **implementation changes required, then reviewer re-validation and a second fix/review cycle.**

# Reviewer Round 2

Date: 2026-07-26
Role: reviewer only
Verdict: **Changes requested — 8 accepted, 9 rejected**

## Independent validation

- `npm run typecheck`: passed.
- Focused regression run: 13 suites and 67 tests passed.
- Full run: 40 suites and 217 tests passed, with no skipped tests.
- Browser at 320×568: Home cards render in one column; Library filters render at 44 px high.
- Browser at 320×568 also confirmed that Back prompts before a Structure Scan round has started.
- The automated baseline is still false-green for cancelled navigation, concurrent/background persistence, remaining timeout sites, meaningful three-level challenge, and full 25-game lifecycle behavior.

No product source was changed during this review.

## R1–R17 disposition

| ID | Status | Round-two decision |
|---|---|---|
| R1 | **Accepted** | Text Search records incorrect taps, uses the documented denominator, shows feedback, reports error details, and has a passing regression test. |
| R2 | **Accepted** | Pattern Scan now records total targets, misses, and errors; partial, erroneous, and perfect cases pass. |
| R3 | **Accepted** | All six named games call the shared persisted controller and Flash Recall’s competing in-session controller is removed. The full level-transition matrix remains part of R17. |
| R4 | **Accepted** | Correct sections survive reduction, choices shuffle, the bank contains 15 rounds, and answer-position/replay tests pass. |
| R5 | **Rejected** | Stack context is fixed, but cancelling the leave dialog can silently disable later completion; idle games are also guarded unnecessarily. |
| R6 | **Accepted** | Rendered filter chips are 44 px high at 320 px and the rail remains horizontally scrollable. |
| R7 | **Rejected** | The 3-second/1,000-WPM guardrail works in Results/charts/adaptive progress, but invalid raw WPM still pollutes History’s Average Speed and lacks a History quality label. |
| R8 | **Rejected** | Comparable chart groups and zero retention work, but History still averages incomparable/invalid measurements and a background save can omit the just-finished attempt from the Result chart. |
| R9 | **Rejected** | New semantic tokens pass their own test, but multiple live exercises still use known failing foreground/background pairs. |
| R10 | **Accepted** | Source tests and rendered 320 px output confirm one-column cards with intact titles. |
| R11 | **Rejected** | Search indexing improved, but all 25 fully expanded cards are still eagerly rendered in a vertical ScrollView. |
| R12 | **Rejected** | Main Idea, Word Pairs, Number/Symbol Hunt, and Comprehension still use round count/session duration/question count instead of consistently harder stimuli. |
| R13 | **Rejected** | Several touched timers were fixed, but material replay/feedback timeout sites remain untracked. |
| R14 | **Rejected** | GameScreen is non-blocking, but measured reading still awaits storage; background read-modify-write saves can also race or be absent from the immediate Result view. |
| R15 | **Accepted** | Comprehension is optional and is no longer invented for unrelated games. |
| R16 | **Accepted** | The previous durable-speed transfer claim is gone; low-accuracy lab feedback explicitly recommends measured transfer checking. |
| R17 | **Rejected** | Skips are removed, but `allGamesAutoStart` still verifies only start state rather than the required completion/replay/unmount/difficulty contract. |

## P1 regressions and remaining release blockers

### RR2-1. Cancelling Back permanently suppresses the later result

Files:

- `mobile/src/screens/GameScreen.tsx:141-148`
- `mobile/src/navigation/RootNavigator.tsx:68-74`
- `mobile/src/__tests__/appFlow.test.tsx:56-99`

Reproduction:

1. Open any game and press Back.
2. Choose “Keep training”/dismiss the web confirmation.
3. Continue and complete the game.
4. `handleGameReport` returns because `cancelledRef` was set before navigation was confirmed, so Results never opens.

The current navigation tests always choose Leave and cannot detect this dead end. The browser also confirmed a leave prompt appears on an untouched idle Structure Scan screen.

Acceptance:

- Set cancellation/unmounted state only after confirmed removal or actual unmount, never on a Back intent that may be cancelled.
- Prompt only when a round is active or has unsaved interaction.
- Add tests for idle Back without a prompt, active Back → Keep training → successful completion, and active Back → Leave.

### RR2-2. Reading-quality exclusions are not applied to History summary

Files:

- `mobile/src/screens/HistoryScreen.tsx:38-42`
- `mobile/src/screens/HistoryScreen.tsx:180-191`
- `mobile/src/domain/results.ts:16-40`

Reproduction:

1. Finish a measured read immediately and submit an answer.
2. Results correctly labels the raw attempt invalid.
3. Open History.
4. “Average Speed” includes the implausible WPM, and the session row does not say it was excluded from progress.

Acceptance:

- Compute Average Speed from valid measured-reading results only.
- Label it “Average valid measured speed” or explain its inclusion rule.
- Show “Not used for progress” on invalid History rows.
- Test a valid result plus a 1 ms result and assert that only the valid WPM affects the average.

### RR2-3. Background result persistence can race, lose, or temporarily hide results

Files:

- `mobile/src/screens/GameScreen.tsx:173-176`
- `mobile/src/navigation/RootNavigator.tsx:165-181`
- `mobile/src/data/resultsStore.ts:30-41`
- `mobile/src/ui/ProgressChart.tsx:30-47`

Game results navigate before `saveResult` resolves, while measured-reading results still await it. `saveResult` performs an unserialized load/prepend/write. Two overlapping saves may read the same old list and overwrite one another. The Result chart immediately reloads storage and does not optimistically include/deduplicate `currentResult`, so a slow save can make the latest session disappear from its own chart.

Acceptance:

- Use one consistent non-blocking completion path for games and measured reads.
- Serialize/upsert saves by result ID so concurrent completions cannot lose records.
- Include `currentResult` optimistically in Result charts and deduplicate it after persistence.
- Add tests for two concurrent saves, a pending save while Result renders, a rejected save, and immediate History navigation.

### RR2-4. Known WCAG contrast failures remain on live controls/text

Files:

- `mobile/src/games/LetterRecognition/LetterRecognition.tsx:432-498`
- `mobile/src/games/LetterJumble/LetterJumble.tsx:315-367`
- `mobile/src/games/NumberRecognition/NumberRecognition.tsx:253-285`
- `mobile/src/games/EvenNumbers/EvenNumbers.tsx:345-357`
- `mobile/src/games/WordMismatchGrid/WordMismatchGrid.tsx:483-646`
- `mobile/src/theme/colors.test.ts:1-56`

Examples still present:

- White on `#8B5CF6`: about 4.23:1.
- White on `#F59E0B`: about 2.15:1.
- `#9CA3AF` on white: about 2.54:1.

The token test only checks the new tokens; it does not ensure rendered styles use them.

Acceptance:

- Replace the remaining failing live pairs with semantic tokens.
- Add component/style assertions for every game start, submit, choice, replay, muted metadata, and error/success state.
- Add a repository check that blocks known failing raw foreground/background pairings.

## P2 incomplete work

### RR2-5. Library density remains unbounded

`mobile/src/screens/TrainingLibraryScreen.tsx:110-204` maps all 25 expanded rule/difficulty cards inside a ScrollView. The 320 px DOM contains every rule and setting at once.

Acceptance: use `FlatList`/`SectionList`, initially compact cards, accessible expand/collapse state, stable state restoration, and tests that off-window items are virtualized while search/filter/open still work.

### RR2-6. Difficulty still measures session length in several games

Files:

- `mobile/src/games/MainIdeaSprint/MainIdeaSprint.tsx:28-31`
- `mobile/src/games/WordPairs/WordPairs.tsx:42-65`
- `mobile/src/games/NumberRecognition/NumberRecognition.tsx:43-44`
- `mobile/src/games/SymbolRecognition/SymbolRecognition.tsx:45-46`
- `mobile/src/games/ComprehensionTest/ComprehensionTest.tsx:37-84`

Acceptance:

- Main Idea: increase passage complexity, distractor plausibility, and inference depth—not just rounds.
- Word Pairs: use frequency/familiarity and semantic distractor similarity; keep session duration separate.
- Number/Symbol Hunt: increase target/distractor similarity, set size, and display cadence; do not call a shorter session harder.
- Comprehension: use multiple leveled passages, not more questions on one memorized passage.
- Add per-game configuration tests demonstrating distinct stimulus challenge at Easy/Medium/Hard.

### RR2-7. Remaining timeout lifecycle debt

Untracked sites include:

- `EyeMovementTraining.tsx:154`
- `LetterJumble.tsx:151,162,167`
- `EvenNumbers.tsx:175`
- `SchulteMix.tsx:309`
- `MemoryRecall.tsx:160`
- `VisualSpanExpansion.tsx:166`
- `TimedWordRecognition.tsx:220`
- `WordMismatchGrid.tsx:432`
- `LetterRecognition.tsx:392`

Acceptance: move them to tracked refs/helpers, clear on unmount/replay/completion, and test immediate unmount after Play Again/feedback for each affected game.

### RR2-8. Comparable charts are truthful but too fragmented for longitudinal reading

`mobile/src/domain/results.ts:87-113` groups measured reads by exact `contentId`. This prevents misleading mixing but often makes each new passage a one-attempt chart. Repeating the same passage is also affected by familiarity, so it should not be the only longitudinal comparison.

Acceptance: store both passage ID and an authored comparison band (difficulty/readability/length range); show same-passage practice separately from unseen-passage baseline trends. Continue keeping paced WPM separate from measured WPM.

### RR2-9. Full 25-game contract remains missing

`mobile/src/__tests__/allGamesAutoStart.test.tsx:47-285` mostly asserts that the start button disappears.

Acceptance: for every registered game, verify start, one completion report, report-once behavior, replay reset, immediate unmount cleanup, and meaningful Easy/Medium/Hard configuration. Add explicit adaptive threshold-to-next-session tests for the six R3 games.

## Focused research disposition

No new source changes the Round 1 recommendations. WCAG 2.2 remains the governing contrast reference, and the reading-speed evidence still supports comprehension-checked, comparable connected-text measurement over broad transfer claims. No further competitor research is required for the second fix.

## Concrete second-fix list

1. Fix RR2-1 first and add the cancelled-confirmation navigation tests.
2. Fix RR2-2/RR2-3 together: valid-only summaries, visible quality flags, serialized/upsert persistence, optimistic Result charts, and non-blocking measured reads.
3. Finish the R9 migration for all remaining low-contrast live styles and enforce usage, not only token values.
4. Replace all RR2-7 timeout sites and add replay/unmount tests.
5. Implement meaningful R12 difficulty dimensions and the full R17 contract matrix.
6. Virtualize/collapse the Library, then add comparison bands for useful cross-passage trends.

Round 2 status: **not release-ready; return after the second-fix list is complete.**

# Reviewer Final Acceptance

Date: 2026-07-26
Role: final reviewer, read-only
Verdict: **Changes requested — 5 of 9 Round-2 items accepted**

## Final validation

- `npm run typecheck -- --pretty false`: passed.
- `npm run test:ci -- --silent`: 46 suites and 259 tests passed, 0 skipped.
- Source validation covered navigation activity ownership, result serialization/upsert, optimistic result handling, History quality filtering, contrast enforcement, list virtualization, meaningful difficulty, timeout cleanup, comparison keys, and the game test matrix.
- Browser spot check confirmed a bounded Library render (10 of 25 cards mounted rather than all 25), 44 px filter chips, and working details expansion. The current browser surface reported a desktop inner width despite the requested compact override, so exact narrow-width confidence continues to rely on the previously rendered 320 px pass and passing layout contracts.
- No product source was changed.

## RR2-1 through RR2-9 disposition

| ID | Status | Final evidence |
|---|---|---|
| RR2-1 | **Rejected** | Idle Back and manual Start/Keep/Leave flows are fixed, but an auto-started replay never marks the route dirty. |
| RR2-2 | **Accepted** | History averages only valid measured reads and visibly labels invalid raw sessions as excluded. |
| RR2-3 | **Accepted** | Saves are serialized and upserted by ID; both completion paths are non-blocking; Result and History merge/deduplicate the optimistic result. Concurrent, duplicate-ID, pending, and rejected cases pass. |
| RR2-4 | **Rejected** | The three newly forbidden raw colors are gone, but other live normal-text contrast failures remain outside the contract. |
| RR2-5 | **Accepted** | The Library uses a bounded `FlatList`, compact collapsed cards, accessible expansion, preserved filter state, and working search/open behavior. |
| RR2-6 | **Accepted** | The five named games now change stimulus complexity/confusability/inference while keeping workload duration or question count comparable. |
| RR2-7 | **Accepted** | All nine listed callback sites use tracked cleanup and the lifecycle/source-contract suites pass. Remaining raw timers use explicit refs/effect cleanup and were not part of the rejected sites. |
| RR2-8 | **Rejected** | Comparison bands are stored, but real results are still partitioned by passage `sampleId`, preventing the promised cross-passage trend. |
| RR2-9 | **Rejected** | Registry/catalog/start checks are strong, but the requested per-game completion/report/replay/unmount matrix remains incomplete. |

## Release blockers

### FA-1. Auto-started replay can be abandoned without the active-session guard

Files:

- `mobile/src/navigation/RootNavigator.tsx:224-244`
- `mobile/src/screens/GameScreen.tsx:242-260`
- `mobile/src/games/gameHooks.ts:50-63`
- `mobile/src/ui/GameIdlePanel.tsx:45-86`
- `mobile/src/ui/SimpleIdlePanel.tsx:31-35`

Manual Start marks activity through the idle-panel button. Result → Play Again sets `autoStart: true`, and `useAutoStart` calls the game’s `start` function directly without invoking `useMarkGameSessionActive`. `GameScreen` has no auto-start dirty effect.

Reproduction:

1. Complete a game and choose Play Again.
2. The new session starts automatically.
3. Press Back while that round is active.
4. The route leaves without the discard confirmation because `sessionDirty` is still false.

Acceptance:

- Mark a session active when auto-start actually starts, not only when an idle-panel button is pressed.
- Add Result → Play Again → active Back tests for both Keep training and Leave.

### FA-2. Live WCAG failures remain outside the contrast source contract

Files:

- `mobile/src/games/TextSearch/TextSearch.tsx:353`
- `mobile/src/ui/ProgressCharts.tsx:106,149-151`
- `mobile/src/ui/ProgressChart.tsx:237-250`
- `mobile/src/theme/contrastUsage.test.ts:4-24`

Examples:

- Text Search renders white text on `#22D3EE`, a very low-contrast pair.
- Progress Charts renders small trend text as `#4CAF50` or `#F44336` on a white card.
- Result progress uses small `#059669` positive-trend text on a light surface.

The repository contract forbids only `#8B5CF6`, `#F59E0B`, and `#9CA3AF`, so it passes while these failures remain.

Acceptance:

- Move these states to tested semantic foreground/background pairs.
- Make the usage contract semantic rather than a three-value denylist, or explicitly cover every rendered text/background pair.

### FA-3. Required all-game lifecycle release gate is incomplete

Files:

- `mobile/src/__tests__/allGamesAutoStart.test.tsx`
- `mobile/src/games/trackedTimeoutCleanup.test.tsx`
- Native tests under `mobile/src/games/**`

Evidence:

- The 25-game audit verifies start state, not completion/report/replay/unmount.
- Native suites referencing `onReportResult` cover 22 games; Number Hunt, Symbol Hunt, and Even/Odd lack that completion assertion.
- Replay behavior appears in only eight game-native suites.
- Unmount coverage combines nine reviewed timeout games with only a small number of native lifecycle cases, not every registered game.

Acceptance:

- Add data-driven contract adapters where mechanics permit and small game-specific completion drivers where they do not.
- Every registered game must prove one completion report, report-once behavior, replay reset, and unmount safety.
- Keep the existing start/catalog/difficulty/adaptive checks.

## Residual future enhancement

### FA-4. Comparison bands do not currently form cross-passage trends

Files:

- `mobile/src/domain/results.ts:127-134`
- `mobile/src/ui/ProgressChart.tsx:36-48`
- `mobile/src/ui/ProgressCharts.tsx:37-43`
- `mobile/src/ui/ProgressChart.test.tsx:42-86`

`areResultsComparable` still requires equal `sampleId`, `ProgressChart` filters to the current normalized sample ID, and History chart keys prefix the normalized sample ID. Real measured reads use each passage ID as `sampleId`. The test labeled “different passage” changes only `details.contentId` while retaining `sampleId: 'sample-3'`, so it does not reproduce stored production data.

This does not corrupt scores, but it leaves the promised longitudinal baseline nonfunctional and labels a one-passage series “cross-passage comparisons”.

Acceptance:

- For measured-reading results, group by activity + metric + difficulty + comparison band, not passage `sampleId`.
- Continue grouping games by normalized game ID.
- Update the test so its second passage has a genuinely different `sampleId`.
- Either fix before release or remove the cross-passage label and treat the feature as a documented follow-up.

## Accepted residual risks

- Background-save failure remains silent and Home can briefly show an older latest result while persistence is pending. Result and immediate History are optimistic, so this is a future resilience improvement rather than a blocker for the reviewed acceptance criteria.
- Browser virtualization mounted 10 cards rather than the implementer log’s stated five; it remained bounded and did not restore the original 25-card eager render, so RR2-5 remains accepted.
- No new scientific or competitor research changes the existing product recommendations.

## Final verdict

The platform is substantially stronger and the complete automated suite is green, but final release acceptance is **withheld** until FA-1, FA-2, and FA-3 are fixed. FA-4 may be fixed now or explicitly removed from the shipped cross-passage claim and tracked as a future enhancement.

# Reviewer Final Re-review

Date: 2026-07-26

## Final disposition

| Finding | Disposition | Independent reviewer evidence |
|---|---|---|
| FA-1 — Auto-start replay navigation guard | **Accepted** | `useAutoStart` marks the session active at the same transition that invokes `start`. Real-navigation coverage completes Structure Scan, selects Play Again, then verifies both active Back → Keep training and active Back → Leave. |
| FA-2 — Semantic contrast coverage | **Accepted** | The reviewed Text Search, Result progress, and History trend surfaces use semantic info/success/error foreground and surface tokens. The source contract rejects all seven reviewed raw colors and rejects any raw hex color in those three surfaces. |
| FA-3 — All-game lifecycle release gate | **Accepted** | The data-driven matrix has 25 concrete adapters matching the 25 registry components. Each proves start, completion, exactly one report, report-once after pending timers drain, clean active replay, and no report after replay unmount. This explicitly includes Number Hunt, Symbol Hunt, and Even/Odd. |
| FA-4 — Cross-passage measured-reading trends | **Accepted** | Measured reads are compared by activity, metric, difficulty, and comparison band without requiring an equal passage ID. Result and History tests use genuinely different `sampleId` values and group them into one compatible trend; non-reading games remain scoped by normalized game ID. |

## Independent validation

- `npm run typecheck -- --pretty false`: passed.
- Focused FA-1–FA-4 gate: 8 suites, 72 tests passed.
- `npm run test:ci -- --silent`: 47 suites, 294 tests passed, 0 skipped.
- `git diff --check`: passed.
- Source inspection confirmed the corrective implementations, not only their test descriptions.

## Residual non-blocking risks

- Background-save failure remains silent, and Home can briefly display an older latest result while persistence is pending. Immediate Result and History views remain optimistic, so this is a resilience follow-up rather than a release blocker.
- Comparison bands are authored metadata. The current passages share one band; additional bands should be calibrated as the passage library expands.
- Contrast enforcement is strong for the reviewed surfaces and known rejected values. New UI surfaces should continue to use the semantic token pairs and extend the contract when new state colors are introduced.

## Final release verdict

**Accepted for release.** FA-1 through FA-4 are closed in the reviewed workspace state, and no blocking regression was found in the typecheck, focused acceptance gate, or complete automated suite. No product source was modified during this final re-review.

# New Research-led Review Cycle

Date: 2026-07-26

## Reviewer handoff

The reviewer completed a fresh source, live-browser, UX/UI, content, measurement, accessibility, privacy/offline, motivation, competitor-pattern, and research audit without changing product source. The implementation-ready findings and complete exercise specifications are in `REVIEWER_RESEARCH_PROPOSALS.md`.

### Required BUILD NOW scope

1. Add **Evidence Hunt** and **Context Builder** exactly to the difficulty, truth, accessibility, anti-gaming, replay, cleanup, and lifecycle contracts in the proposal.
2. Replace the rotating Home recommendation with a deterministic, explained, swappable, skippable Today plan.
3. Label reading output a personal practice estimate; require at least three distinct valid passages for a baseline; separate WPM, correct/total comprehension, and task-specific lab metrics.
4. Remove misleading percentage rings for WPM/arbitrary scores and make Reading the default History view, with Practice and Labs separated.
5. Add the responsive shell, 680–720-pixel connected-reading column, container-measured charts, chart text summaries, 320-pixel/200%-text reflow, keyboard focus, screen-reader states, reduce-motion, and untimed paths.
6. Add reviewed, typed, versioned content and validators; preserve all existing game IDs and historical data.

### Scope exclusions

Do not expand this cycle to dark mode, imports/cloud/social features, an all-game visual rewrite, another RSVP variant, or more generic number/symbol/eye-speed games. Legacy labs may be de-emphasized without deletion.

### Review loop

The implementer should first complete the bounded scope and full automated checks, then return the diff and validation evidence. The reviewer will inspect real flows and source, report concrete failures, review the fixes, and run a final regression/acceptance pass. Implementation must not begin by treating competitor marketing as efficacy evidence.

## Verdict

Proceed with the bounded BUILD NOW scope. The product direction is **reading practice with understanding**, with lab tasks explicitly separated from reading outcomes.

# Research Cycle Reviewer Audit

Date: 2026-07-26
Role: independent reviewer
Change boundary: no product source was modified during this audit.

## Verdict

**Release acceptance withheld pending RC-A1 through RC-A7.**

The implementation has the correct overall architecture: 27 registered games, strong lifecycle coverage, two distinct new reading tasks, a bounded Today plan, separate result metrics, reading-first History, a shared responsive shell, container-sized charts, and explicit accessibility semantics. Typecheck and every automated suite pass.

The remaining failures are not requests to broaden the release. They are reproducible correctness gaps inside the agreed BUILD NOW contracts: authored difficulty does not match the labels in parts of both new content sets, Context Builder can game adaptive progression by skipping, old one-question results can satisfy the new three-question baseline, Today skips do not survive navigation, the comfort rule is not actually sustained-use-only, “locate time” includes answer time, direct-reading screens still have unbounded line lengths, and the measurement quality ceiling still admits extreme rates.

## Independent validation

- `npm run typecheck -- --pretty false`: passed.
- Focused research-cycle gate: 9 suites, 49 tests passed.
- `npm run test:ci -- --silent`: 55 suites, 323 tests passed, 0 skipped.
- Live wide browser check at 1728×903:
  - bounded Home shell and maximum-three-card Today plan rendered correctly;
  - every Today card exposed a reason, duration, Start, and appropriate Swap/Skip controls;
  - Evidence Hunt exposed Manual Easy/Medium/Hard, optional timing off by default, and correct switch/radio semantics;
  - Context Builder exposed Manual Easy/Medium/Hard, untimed play, marked target text, radio groups, confidence, Skip, and disabled submission until meaning plus clue were selected;
  - keyboard Tab focus landed in visual order with a visible browser focus outline.
- The current in-app browser window could not be programmatically resized in this pass. Compact behavior is covered by implementation tests and the implementer’s recorded 320/390-pixel pass, but was not independently re-run interactively here.

The focused run emitted non-failing React `act(...)` warnings from asynchronous progress/chart updates. They do not establish a product failure, but those tests should be settled cleanly when nearby tests are changed.

## Acceptance matrix

| BUILD NOW criterion | Disposition | Reviewer evidence |
|---|---|---|
| 12+ Evidence Hunt items per difficulty, stable/versioned schema and structural validator | **Accepted structurally; editorial acceptance rejected by RC-A1** | 36 items, 12 per level; IDs, word counts, keys, rationales, metadata, and answer positions are validated. |
| Evidence Hunt rules, answer/evidence separation, wrong-tap penalty, optional timer, replay/cleanup | **Accepted except locate-time truthfulness** | Four rounds; evidence required before submission; wrong selections reduce evidence credit; timer is off by default; lifecycle tests pass. RC-A5 covers timing. |
| 12+ Context Builder items per difficulty, stable/versioned schema and structural validator | **Accepted structurally; editorial acceptance rejected by RC-A2** | 36 distinct target words, 12 per level; keys, morphology, metadata, and positions are validated. |
| Context Builder rules, separate meaning/clue/omission/confidence details, untimed, replay/cleanup | **Accepted except anti-gaming/adaptive qualification** | Five untimed rounds, Skip and optional confidence work, result fields remain separate, lifecycle tests pass. RC-A2 and RC-A3 cover the gaps. |
| Manual Easy/Medium/Hard and optional between-session adaptation | **Rejected in part** | Manual is the default and active difficulty is stable, but qualification is gameable and can combine different played difficulties; see RC-A3. |
| New-game accessibility and keyboard path | **Accepted for reviewed web/code paths** | Named switch/radio/checkbox/button roles, selected states, 48–56-point controls, text plus underline target cue, no mandatory timer, and visible keyboard focus were observed. |
| Typed/versioned result details and 27-game registry/lifecycle | **Accepted** | Both games store schema/content versions and item IDs. Registry/catalog contain 27 IDs. All-game start, complete, report-once, replay, pending-timer, and unmount gate passes all 27. |
| Today max three, explained, deterministic, swappable, skippable | **Rejected in part** | Max-three/order/reasons/swap/skip UI pass. Skip persistence and comfort gating fail RC-A4. |
| Optional three-passage baseline and honest insufficient state | **Rejected in part** | Three distinct authored passages and three dependent items each exist; the insufficient state and median/count UI exist. Legacy eligibility and numbering fail RC-A4. |
| Shared reading-duration estimate | **Accepted** | Home and measured-read setup call the same `formatReadingEstimate` implementation. |
| Result metric cards; Reading/Practice/Labs History; compatible trends | **Accepted** | WPM/comprehension and both new games’ component metrics are separate; History defaults to Reading; filters and compatible metric keys are tested. |
| 1200-pixel shell and compact/medium/expanded breakpoints | **Accepted** | Shared shell uses `<600`, `600–839`, and `≥840`, capped at 1200; Home/Library/Game/Exercise/Result/History consume it. |
| 680–720-pixel connected-reading column | **Rejected in part** | Measured Read, Evidence Hunt, and Context Builder cap at 700; several retained direct-reading screens do not. See RC-A6. |
| Container-measured charts plus accessible/visible data | **Accepted** | `ResponsiveLineChart` consumes `onLayout`; the SVG has an accessible trend summary and visible data series. |
| Reduced-motion preference behavior | **Accepted for current new games** | Preference queries are capability-safe. Neither new task relies on required motion; the preference is recorded in result details. |
| Extreme/too-short attempt exclusion | **Rejected in part** | Quality flags and exclusion plumbing work, but the retained 1000-WPM ceiling admits extreme brief-passage measurements; see RC-A7. |

## Required fixes

### RC-A1 — Evidence Hunt’s Medium and Hard content does not implement the stated difficulty

Priority: **P1**

Files:

- `mobile/src/data/evidenceHuntContent.ts:250-333`
- `mobile/src/data/__tests__/researchCycleContent.test.ts`
- `mobile/src/data/gameCatalog.ts:114-131`

Reproduction from source:

1. Medium labels itself `paraphrase`, but the answer is `topic.outcome`, sentence 5 renders that same outcome verbatim, and sentence 5 is the evidence key.
2. Hard asks for a conclusion considering outcome **and limitation**, but its evidence key is sentence 5 plus sentence 13. Sentence 13 already states the exact `topic.conclusion`; the actual limitation is sentence 6 and is not keyed.
3. Therefore the validator proves labels and counts, not the claimed paraphrase/inference behavior.

Required fix:

- Author a real paraphrase answer for every Medium round that is not copied from the passage.
- For Hard, remove the sentence that supplies the final answer verbatim. Key the outcome and limitation (or another genuinely necessary two-sentence combination) and require their integration.
- Add evidence-role metadata such as `outcome`, `limitation`, and `synthesis-input`.
- Extend validation/tests to prove Medium’s correct answer is not a passage substring and Hard’s two required evidence roles are distinct and do not include a sentence containing the correct answer.
- Re-review all 36 rendered items, not only the generator.

Acceptance:

- Each of 12 Medium rounds requires a real paraphrase.
- Each of 12 Hard rounds requires two independently necessary evidence sentences and a supported inference.
- Catalog copy matches the behavior.

### RC-A2 — Context Builder is template-gameable and all Hard target sentences share a grammar fault

Priority: **P1**

Files:

- `mobile/src/data/contextBuilderContent.ts:102-212`
- `mobile/src/data/__tests__/researchCycleContent.test.ts`

Reproduction from source and live Easy round:

- Every word receives the same three generic meaning distractor patterns: the opposite of the definition, “related only to speed or urgency,” and “a person, place, or physical object.”
- Every clue set uses the same three implausible distractors: title alone, sentence count, and punctuation. A user can learn the template instead of using context.
- Every Hard target sentence is generated as `the author describes how [scenario] as [word]`, which is grammatically malformed for the shipped items.
- Every accepted clue has ID `c1`; visual shuffling removes position gaming, but the semantic template remains obvious.

Required fix:

- Author word-specific, same-part-of-speech meaning distractors that are plausible in context.
- Make clue choices reference actual sentence/clause IDs and include plausible but insufficient clues from the paragraph.
- Correct and editorially review every Hard sentence.
- Vary clue construction and accepted-clue identity across the set.
- Extend the validator to require unique option IDs/text, the target’s presence, referenced clue spans, and difficulty-appropriate clue roles. Add rendered-content assertions for all Hard sentences.

Acceptance:

- No repeated generic distractor trio remains.
- Hard paragraphs are grammatical and require combined context.
- A user cannot select the correct clue by recognizing one repeated option template.

### RC-A3 — Context Builder skips and cross-level sessions can incorrectly earn adaptive promotion

Priority: **P1**

Files:

- `mobile/src/games/ContextBuilder/ContextBuilder.tsx:225-288`
- `mobile/src/data/progressStore.ts:115-139`
- `mobile/src/data/__tests__/progressStore.test.ts:180-228`
- `mobile/src/games/ContextBuilder/ContextBuilder.test.tsx`

Reproduction:

1. Answer one of five rounds correctly for meaning and clue.
2. Skip the other four.
3. `attempts` is 1, so both accuracies are 1/1 = 100%; omissions are reported but do not affect the qualifying Boolean.
4. Repeat once and the stored two-session streak can suggest the next difficulty.
5. Separately, one qualifying Easy session followed by one qualifying Medium session shares the same streak; the second can suggest Hard without two qualifying Medium sessions.

Required fix:

- Preserve “attempted accuracy” as a truthful displayed metric, but require sufficient coverage for adaptation—prefer all five rounds attempted, or count omissions as incorrect in a separate qualification rate.
- Store the difficulty associated with the qualifying run and reset the run whenever played difficulty changes.
- Immediate-duplicate results must remain in History but must not qualify.

Acceptance:

- One correct plus four skipped never qualifies.
- Two sessions at different difficulties never combine.
- Two complete, nonduplicate sessions at the same difficulty with both component rates ≥80% suggest the next level.
- Manual selection remains unchanged.

### RC-A4 — Baseline eligibility and Today state are not compatible with existing saved results

Priority: **P1**

Files:

- `mobile/src/domain/readingPlan.ts:65-139,171-283`
- `mobile/src/screens/HomeScreen.tsx:175-205,294-430`
- `mobile/src/data/textSamples.ts:622-655`
- `mobile/src/domain/readingPlan.test.ts`
- `mobile/src/screens/HomeScreen.test.tsx`

Reproduction:

- `getComprehensionCounts` converts a legacy Boolean comprehension result into 1/1.
- Baseline selection accepts any valid measured result for a matching content ID; it does not require the new three-question schema/count.
- Because the three current baseline IDs existed before this research cycle, three old one-question attempts can produce a “ready” personal estimate and mark the new baseline complete.
- The displayed title uses `validContentIds.size + 1`, where the set includes every measured passage. A user with valid nonbaseline passages can see “Baseline passage 8 of 3.”
- Skip/swap state lives only in Home component state. Leaving Home and returning remounts the screen, so a task skipped “for today” returns the same day.
- Eye Reset appears after **any three** same-day results even when their combined time is far below ten minutes; three short reaction labs are not sustained reading use.

Required fix:

- Add one shared `isBaselineEligibleResult` rule used by the Today plan and personal estimate. Require a baseline content ID/version, valid measurement, `comprehensionQuestionCount >= 3`, and the authored baseline comparison band.
- Keep legacy attempts visible in general History, but do not treat one-question legacy data as completion of the new baseline.
- Calculate the passage ordinal from completed baseline IDs only.
- Persist skipped Today IDs with a local-date key; restore/reset explicitly and clear on the next local day. Swap persistence is optional.
- Gate Eye Reset by actual same-day sustained duration (the agreed approximately ten minutes), not raw result count alone.

Acceptance:

- Three legacy 1/1 results still show “Not enough readings.”
- Twenty nonbaseline results cannot change “Baseline passage 1 of 3.”
- Skip survives Home unmount/remount on the same date and resets the next day.
- Three very short labs do not add Eye Reset; ten minutes of same-day use does.

### RC-A5 — Evidence Hunt’s “median locate time” includes answer-decision time

Priority: **P2**

Files:

- `mobile/src/games/EvidenceHunt/EvidenceHunt.tsx:221-245,289-301`
- `mobile/src/games/EvidenceHunt/EvidenceHunt.test.tsx`
- `mobile/src/screens/ResultScreen.tsx:116-143`

The timer begins at round start and is recorded only when the user submits both evidence and answer. A user can locate evidence immediately, then spend a minute deciding the answer; the full minute is reported as locate time.

Required fix:

- Either capture locate completion when the required evidence selection becomes complete and report that timestamp, or rename the field and UI everywhere to “median round decision time.”
- Expired/unanswered rounds must not masquerade as successful locate timings; store them separately or omit them from the locate median.

Acceptance:

- A fake-timer test that completes evidence at 5 seconds and submits the answer at 15 seconds reports 5 seconds as locate time, or 15 seconds under the explicitly renamed round-time metric.

### RC-A6 — The 700-pixel reading column is not applied to all direct connected-text flows

Priority: **P1**

Files:

- `mobile/src/ui/ResponsiveShell.tsx:51-76`
- `mobile/src/games/RepeatedReading/RepeatedReading.tsx:223-226,408-429`
- `mobile/src/games/ComprehensionTest/ComprehensionTest.tsx:182-184,276-285`
- `mobile/src/games/MainIdeaSprint/MainIdeaSprint.tsx`
- `mobile/src/games/StructureScan/StructureScan.tsx`
- `mobile/src/games/TextSearch/TextSearch.tsx`

`ReadingColumn` exists but has no consumers. Measured Reading, Evidence Hunt, and Context Builder duplicate a local `maxWidth: 700`; Repeated Reading and Comprehension active passage containers have no reading-width cap inside the 1200-pixel Game shell. Other connected-text core flows need the same audit.

Required fix:

- Use the shared `ReadingColumn` around active connected text in every retained direct-reading/core flow.
- Remove duplicated local width rules where practical so one contract controls the measure.
- Add expanded-layout tests that assert the passage container maxes at 700 while controls can use the wider shell.

Acceptance:

- At 1440/1728 widths, no direct connected passage exceeds 700 pixels.
- At 320 pixels, passages use available width without horizontal overflow.

### RC-A7 — The baseline quality rule still accepts an extreme brief-passage rate

Priority: **P1**

Files:

- `mobile/src/domain/results.ts:26-45`
- `mobile/src/domain/results.test.ts`
- `mobile/src/domain/readingPlan.test.ts`

The three-second minimum and 1000-WPM ceiling are unchanged. A 140-word passage completed in about 9.3 seconds is roughly 900 WPM and is currently valid for the personal estimate. The BUILD NOW contract requires extreme attempts to remain viewable but be excluded.

Required fix:

- Adopt and document a conservative personal-estimate ceiling below the current 1000 WPM (the research proposal’s evidence review supports treating this as a quality flag, not a diagnosis), or use an equivalently conservative passage-length-aware rule.
- Keep the raw attempt and its comprehension result visible.
- Apply the rule through the shared quality function so Today, Result, History, and baseline calculation agree.

Acceptance:

- A roughly 900-WPM brief-passage attempt receives `implausible-speed` and cannot complete a baseline slot or enter a trend.
- Boundary tests cover the chosen inclusive/exclusive threshold.

## Accepted nonblocking observations

- The wide Today layout is much clearer than the prior unbounded layout. Its cards are deliberately broad but remain inside the 1200-pixel shell.
- Metric cards remove the misleading WPM/score percentage rings.
- History chart sorting remains by comparable-attempt count within the selected category; because Reading is now the default filter, lab volume no longer buries the reading estimate.
- The current new games have no required animation, so recording reduce-motion without changing visible behavior is reasonable.
- `ResponsiveShell` announces “compact/medium/expanded layout” as an accessibility label. This is implementation detail rather than useful user content; it may be removed during RC-A6, but it is not a release blocker.
- Home still uses a flame and a few text arrows. Replacing remaining functional symbols with the established icon system is desirable, but it is not a reason to expand this corrective cycle.

## Native-only residual checks

These are not replaced by Jest or the web browser and remain required on an iOS/Android device or simulator after RC-A1–RC-A7:

- VoiceOver and TalkBack reading order, state changes, live feedback, and Back-confirmation announcements.
- OS-level 200% Dynamic Type, bold text, and high-contrast behavior without clipped controls or lost task content.
- Reduce Motion with native settings.
- Background/foreground behavior during optional Evidence Hunt timing and measured reading.
- Save-failure recovery/status with device storage unavailable.
- Portrait/landscape checks on compact phone and tablet sizes.

## Fix/re-review sequence

1. Correct both authored content sets and their semantic validators.
2. Fix adaptive qualification, baseline eligibility/numbering, Today persistence/comfort gating, and the quality threshold.
3. Correct or rename the locate-time metric.
4. Apply the shared reading column to every direct connected-text flow.
5. Add the exact regression tests listed above, run typecheck and all 55+ suites, then run compact/wide web and native residual checks.
6. Return the diff and validation evidence for a second reviewer pass.

# Research Cycle Final Acceptance

Date: 2026-07-26
Role: independent reviewer, second corrective pass
Change boundary: product source was read and exercised but not modified during this acceptance pass.

## Final verdict

**RC-A1 through RC-A7 are accepted. The research-cycle corrective gate is green for the reviewed source, automated, and web-browser boundaries.**

The seven defects that withheld acceptance in the preceding audit are no longer reproducible. The corrections are present in implementation code, backed by targeted regression tests, and compatible with the full test suite. No new release-blocking defect surfaced during falsification or compact/wide browser QA.

This acceptance does not replace the native-device checks listed below.

## Per-item disposition

### RC-A1 — Evidence Hunt authored difficulty: accepted

Independent source review covered every generated Medium and Hard item, not only the validator:

- All 12 Medium answers use an authored `outcomeParaphrase`; none is an exact substring of its rendered passage.
- Hard rounds key the distinct `outcome` and `limitation` sentence roles. The keyed evidence no longer contains the final answer, and the answer requires integrating both roles.
- The reviewed Hard conclusions remain appropriately bounded by limitations such as study duration, season, population, location, or design scope.
- The typed requirement schema distinguishes `tested-change`, `outcome`, and `limitation`, with synthesis inputs explicit.
- `researchCycleContent.test.ts` iterates the complete Medium/Hard set and enforces the non-substring and outcome-plus-limitation contracts.

The prior “paraphrase copied verbatim” and “conclusion supplied as evidence” reproductions fail against the corrected build.

### RC-A2 — Context Builder editorial quality and anti-template design: accepted

Independent review found:

- 36 target-word-specific distractor sets, each with three plausible alternatives. Adjective targets use adjective alternatives; verb targets use verb alternatives.
- The old generic opposite/speed/object trio is absent.
- All 12 authored Hard target sentences are grammatical on review.
- Every clue option references real sentence IDs. Hard answers require the combined-context option, while plausible single-span options remain insufficient.
- Correct clue identity rotates across `c1` through `c4`; it is not fixed to one semantic or positional template.
- The validator and focused tests cover unique option IDs/text, target presence, valid referenced spans, accepted roles by difficulty, two-span Hard evidence, and varied correct positions.

The live Hard `salient` round also rendered the grammatical target sentence, four item-specific same-part-of-speech choices, and a combined sentence 1 plus sentence 3 clue.

### RC-A3 — Adaptive qualification integrity: accepted

The qualifying rule now requires a production-length session of at least five rounds, every selected round attempted, both attempted component accuracies at or above 80%, and no immediate duplicate replay. Omission metrics remain truthful but cannot be used to obtain a qualifying 1/1 session.

The stored run includes `adaptiveQualificationDifficulty`. A changed played difficulty begins a new one-session run; two Medium sessions can suggest Hard, but an Easy plus Medium pair cannot. A below-threshold session clears the run.

Manual preference is stored separately from the adaptive level signal. Completing qualifying sessions does not overwrite a saved manual selection; the optional adaptive value is consumed only when that mode is selected for a later session.

Regression coverage proves:

- one correct response plus four skips is ineligible;
- immediate duplicate results remain reportable but ineligible;
- a complete five-round, nonduplicate session at both thresholds is eligible;
- mixed-difficulty sessions do not combine;
- two same-difficulty qualifying sessions suggest the next band.

### RC-A4 — Baseline eligibility and Today state: accepted

`isBaselineEligibleResult` is now the shared rule used by both the personal estimate and Today completion logic. It requires:

- a measured-reading result;
- the shared raw measurement-quality check;
- explicit `measurementValid: true`;
- a current baseline content ID;
- the exact authored content version and comparison band;
- at least three comprehension questions.

Consequently, legacy 1/1 attempts remain in general History but cannot fill a baseline slot. Nonbaseline results cannot inflate the ordinal, which is calculated only from completed baseline IDs.

Today skips are persisted with a local-date key, restored after Home remount, deduplicated, explicitly restorable, and cleared when the local day changes. Eye Reset is gated by at least ten minutes of accumulated same-local-day activity, not by raw result count.

Focused tests falsify the original cases: three legacy 1/1 results leave the estimate unready; 20 nonbaseline results still produce “Baseline passage 1 of 3”; three 30-second results do not add Eye Reset; three 200-second results do; same-day skips survive remount and next-day skips clear.

### RC-A5 — Evidence locate-time truthfulness: accepted

Evidence Hunt now records locate completion at the first moment the full required evidence set is selected, independently of answer selection and submission time. It stores only completed, non-expired locate timings.

The fake-clock regression selects the required evidence at 5 seconds, submits the answer at 15 seconds, and reports `medianLocateMs: 5000` with one located round. The timed-expiry regression reports zero located rounds and does not place an unanswered round into the median.

### RC-A6 — Shared connected-reading measure: accepted

`ReadingColumn` owns the `maxWidth: 700` contract. All eight named retained direct-text flows use it:

1. Measured Reading
2. Evidence Hunt
3. Context Builder
4. Repeated Reading
5. Comprehension
6. Main Idea Sprint
7. Structure Scan
8. Text Search

The source gate checks each consumer and rejects local `maxWidth: 700` duplicates. Guided flash/chunk activities are not full connected-passage displays and remain outside this contract.

Browser measurements:

- At 1728×903, the responsive Home shell was centered at 1200 pixels and the active Hard Context reading column measured exactly 700 pixels.
- At 320×800, the same reading column measured 272 pixels from x=24 to x=296.
- The compact document `scrollWidth` equaled its 320-pixel viewport, and a DOM bounds sweep found zero horizontal overflow offenders.
- All visible compact radio and action controls were at least 48 pixels high. The side-by-side Skip/Check action row stayed within the viewport, including the wrapped disabled label.

### RC-A7 — Conservative personal-estimate quality rule: accepted

The shared quality function now accepts the documented 800-WPM boundary and rejects raw rates above it as `implausible-speed`. It recalculates WPM from stored word count and elapsed time instead of trusting a stale WPM or `measurementValid` flag.

Therefore a 140-word attempt completed in 9,333 ms is rejected at roughly 900 WPM even when the stored result claims `measurementValid: true`. The raw result and comprehension remain visible, while baseline completion and reading trends call the same validity function and exclude it.

Boundary tests cover 800 as valid, 801 as invalid, the approximately 900-WPM brief attempt as invalid, and the pre-existing too-short rule.

## Command evidence

- `npm run typecheck -- --pretty false`: **passed**, exit 0.
- Corrective focused run covering all RC-A1–RC-A7 paths: **10 suites, 79 tests passed**, 0 failed, 0 skipped.
  - Research content
  - Progress/adaptive qualification
  - Context Builder
  - Reading plan/baseline
  - Today skip persistence
  - Home Today integration
  - Evidence Hunt locate timing
  - Shared ReadingColumn usage
  - Result quality rules
  - History quality filtering
- `npm run test:ci -- --silent`: **57 suites, 345 tests passed**, 0 failed, 0 skipped.

The final runs emitted no failing assertions and no blocking warnings.

## Live browser evidence

Wide check at 1728×903:

- Home rendered two explained Today cards—optional baseline and focused skill—within the maximum-three contract.
- Each card exposed duration, reason, Start, Swap, and Skip semantics as applicable.
- The 1200-pixel shell had no page-level horizontal overflow.
- Hard Context Builder showed the selected manual difficulty, an untimed five-round session, target text plus underline/text cue, plausible choices, real sentence-linked clue choices, optional confidence, Skip, and disabled submission until required choices were made.
- The connected passage measured 700 pixels.

Compact check at 320×800:

- The page and passage stayed within 320 pixels with no horizontal overflow.
- The passage used available width rather than retaining the desktop cap.
- Long Hard clue labels wrapped without clipping their controls.
- The fixed action row stayed usable at the bottom of the active task.
- Pressing Back during the active session triggered the leave-confirmation dialog.

## Native-only residual boundaries

The following remain explicitly outside web/Jest acceptance and should be run on iOS and Android device or simulator before store release:

- VoiceOver and TalkBack reading order, state changes, live feedback, and Back-confirmation announcements.
- OS-level 200% Dynamic Type, bold text, and high-contrast behavior without clipped controls or lost task content.
- Reduce Motion with native settings.
- Background/foreground behavior during optional Evidence Hunt timing and measured reading.
- Save-failure recovery/status when device storage is unavailable.
- Portrait/landscape checks on compact phones and tablets.

These are residual platform checks, not evidence of a known defect in the accepted web/source build.
