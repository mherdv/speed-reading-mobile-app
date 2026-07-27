# SpeedRead product, UX, and engineering audit

Audit date: 2026-07-26

## Outcome

The app now has one clear primary loop: perform a timed read, answer a comprehension question, review a truthful WPM result, and repeat. The curated home separates five direct reading exercises—Repeated Reading, Main Idea, Structure Scan, Comprehension, and Text Search—from three supporting labs—Word Search, Schulte Numbers, and Schulte Letters—and one screen-wellness activity, Eye Reset. A searchable Training Library exposes all 25 registered exercises with tier labels, rules, and exact difficulty effects without presenting every drill as equally proven.

The product intentionally treats reading speed and understanding as a pair. Research does not support dramatic speed-reading claims without a comprehension tradeoff, so the app now rewards controlled improvement, meaningful recall, and purposeful scanning instead of raw word flashing:

- [Association for Psychological Science review of speed reading](https://www.psychologicalscience.org/publications/speed_reading.html)
- [RSVP speed-reading app study](https://pubmed.ncbi.nlm.nih.gov/29461715/)
- [Speed–accuracy tradeoff in trained speed readers](https://pubmed.ncbi.nlm.nih.gov/22590519/)
- [Retrieval practice and conceptual learning](https://pubmed.ncbi.nlm.nih.gov/21252317/)
- [Repeated reading case study in adults with learning disabilities](https://pubmed.ncbi.nlm.nih.gov/38966273/)

The repeated-reading evidence above is promising but based on two adults, so the product treats the drill as practice and personal comparison—not a guaranteed treatment effect.

### Evidence decision for scanning labs

The three restored labs are useful, but the current evidence does not justify calling them proven speed-reading interventions:

- Reading and visual search are related but distinct information-processing modes. Text Search directly practices finding known terms, while a search score is not a connected-text reading-speed score: [Reading and visual search](https://pubmed.ncbi.nlm.nih.gov/21287059/).
- Word-search performance is associated with word reading, spelling, and orthographic awareness, but that 2025 result is predictive/correlational rather than evidence that playing the puzzle causes faster passage reading: [Finding words in a sea of text](https://pubmed.ncbi.nlm.nih.gov/39946593/).
- Research protocols use Schulte tables to assess selective/alternating attention and visual search. This supports their placement as attention labs, not a claim that they increase normal connected-text reading speed: [Poststroke visual-search protocol](https://pmc.ncbi.nlm.nih.gov/articles/PMC10868249/).
- Near-task visual gains do not automatically transfer to reading. Crowded-letter identification training improved letter performance but did not produce a meaningful reading-speed gain: [Learning to identify crowded letters](https://pubmed.ncbi.nlm.nih.gov/17928026/).

For that reason, every lab description identifies the practiced behavior and tells the reader to use measured passages to evaluate personal transfer.

### Evidence decision for Eye Reset

Eye Reset is a visual-comfort pause, not eyesight or reading-speed treatment:

- The American Academy of Pediatrics, American Academy of Ophthalmology, and related professional groups found no adequate scientific evidence that behavioral vision therapy or eye exercises treat reading disabilities: [Joint technical report](https://pubmed.ncbi.nlm.nih.gov/19651597/).
- Reduced and incomplete blinking can contribute to digital eye-strain symptoms, and breaks plus natural blinking are common comfort recommendations: [AAO EyeWiki review](https://eyewiki.aao.org/Computer_Vision_Syndrome_%28Digital_Eye_Strain%29).
- The exact scheduled 20-20-20 formula has limited peer-reviewed support; one crossover trial did not support 20-second reminders as a therapeutic digital-eye-strain intervention: [20-20-20 rule trial](https://pubmed.ncbi.nlm.nih.gov/36473088/).

Accordingly, the activity uses gentle blinking, an optional 10-, 20-, or 40-second look-away pause, and a subjective comfort check. It makes no promise to correct vision or increase reading speed.

## Completed improvements

### Critical product and data fixes

- Made measured reading reachable from the home screen.
- Hid the passage until the timer starts.
- Stopped the timer before the comprehension question, so quiz time no longer lowers WPM.
- Removed invented comprehension percentages and placeholder result statistics.
- Fixed “read again” so reading results reopen the correct passage instead of an unknown game.
- Separated measured reading from Power Reader pacing in results and history.
- Added a real daily streak derived from local-calendar completion dates.
- Corrected per-level progress bars to use the full 15-level range.
- Limited saved history to the newest 500 sessions.
- Made result saving non-blocking so a storage failure cannot trap the user.
- Classified results by explicit activity type, preserving compatibility with older Power Reader results.
- Normalized comprehension and scanning scores to 0–100 instead of awarding arbitrary points.

### Exercise catalog and training quality

- Added Repeated Reading: two timed passes over the same meaningful passage followed by a comprehension check and a first-versus-final WPM comparison.
- Added Main Idea: the passage disappears before retrieval, the reader states the point in their own words, chooses the best central idea, and receives immediate explanatory feedback.
- Added Structure Scan: readers set an information goal, preview headings and sections, then retrieve the best route after the article hides.
- Added a searchable, category-filtered Training Library containing all 25 registered exercises, their three rules, product tier, and exact difficulty behavior.
- Centralized titles, categories, tiers, rules, keywords, and difficulty copy in one typed game catalog shared by the registry and UI.
- Kept Comprehension and Text Search because they directly exercise understanding and intentional information finding.
- Restored Word Search, Schulte Numbers, and Schulte Letters in a separate “Scanning & attention labs” tier instead of presenting them as core reading interventions.
- Rebuilt Word Search so the reader must trace every target letter in order across horizontal, vertical, reverse, and diagonal placements; tapping any single target letter no longer awards a whole word.
- Replaced Word Search’s invented 100% accuracy with accuracy derived from correct and incorrect taps.
- Fixed hard Letter Schulte, which previously created 49 positions from a 26-letter alphabet and could never be completed.
- Calibrated both Schulte grids to 3×3, 4×4, and 5×5 so every difficulty is completable and targets remain practical on small screens.
- Made Schulte scores comparable as accuracy-adjusted items per minute while retaining elapsed time and error details.
- Kept duplicate and indirect labs out of the curated home while making them discoverable, honestly categorized, and playable in the complete Training Library.
- Rewrote the default comprehension passage around flexible pace and understanding, with main-idea, detail, and purpose questions.
- Replaced unsupported instructional passages about eliminating subvocalization, forced eye movements, peripheral-span expansion, and metronome pacing with material on repeated reading, targeted rereading, retrieval, main ideas, sustainable pace, and readable layouts.
- Rewrote optional legacy exercise descriptions so they report task-specific practice instead of promising unproven transfer to reading.
- Removed an unused duplicate exercise-benefits catalog and its unused information-card component; both still contained unsupported transfer claims.
- Retired duplicate Schulte Mix, flash modes, number/symbol reaction games, generic grids, and redundant word puzzles from the home catalog without deleting IDs required by saved results.
- Added explicit core, supporting, and combined curated-ID lists so future catalog changes preserve both product hierarchy and compatibility data.
- Restored the former moving-dot activity as Eye Reset: a three-stage gentle-blink, look-away, and comfort-check routine with explicit non-treatment language.
- Added Eye Reset to a separate “Eye comfort” home tier rather than presenting it as a reading exercise.

### Difficulty control

- Added one persistent difficulty control to every registered game.
- Added Adaptive, Easy, Medium, and Hard selection to games where stored performance may usefully choose a starting point.
- Made explicit manual choices restart the idle game at the chosen setting and persist across app sessions.
- Made Schulte Numbers, Schulte Letters, and Schulte Mix manual-only with direct 3×3, 4×4, and 5×5 labels.
- Made Eye Reset manual-only with Quick (10 seconds), Standard (20 seconds), and Extended (40 seconds) labels.
- Connected difficulty to production defaults for every legacy game, including duration, grid size, sequence length, display time, round count, question count, or pacing intensity as appropriate.
- Kept the selected Easy/Medium/Hard difficulty fixed for the session while allowing the flash drills’ independently disclosed WPM pace to step upward after sustained correct answers.
- Added stored-preference and GameScreen integration tests so manual Schulte selections cannot silently revert to adaptive mode.

### Game reliability

- Restored a visible ended state for every registered game even when results are saved by the parent screen.
- Reset cancellation/report guards on replay across the registered game set.
- Fixed stale phase guards that prevented replay in several timed games.
- Replaced Memory Recall’s no-op checkmark with a working delete key.
- Corrected Memory Recall accuracy and progress recording.
- Made Power Reader work offline with a built-in starter article.
- Delayed Project Gutenberg requests until the user chooses to browse.
- Honored Power Reader’s explicit interval setting and protected WPM from divide-by-zero results.
- Added truthful Power Reader word count, WPM, article, and difficulty metadata.
- Added a clear unavailable-game recovery state.
- Added leave-session confirmation for active reading and training.
- Added cancellation-safe shared progress loading so an unmounted exercise cannot receive late state updates.
- Added progress recording to the retained Comprehension and Text Search drills.
- Fixed Text Search’s incomplete timeout result and final elapsed-time display.

### UX and visual design

- Rebuilt the home screen around one prominent daily measured-reading action and a secondary repeated-reading action.
- Replaced the dense three-column list with scannable two-column cards.
- Gave every drill a distinct, descriptive name instead of repeated labels such as “Words.”
- Introduced calmer neutral surfaces, higher-contrast text, expressive rounded cards, tonal surfaces, restrained gradients, and consistent elevation.
- Standardized primary, secondary, and destructive buttons with 48-point minimum height.
- Modernized shared game idle cards and difficulty controls.
- Replaced duplicate game-specific selectors with one accessible radio-group pattern and a concise “Adaptive” versus “Manual” status.
- Updated the three restored labs with the current theme roles, rounded tonal statistics and grids, consistent completion cards, descriptive icons, and 48-point replay actions.
- Removed nested vertical scrolling from the navigation and game shells.
- Reworked results into a concise metric, honest feedback, comparable history, and explicit next actions.
- Reworked history into comparable per-activity charts and session records; mixed WPM and game scores are no longer plotted as one metric.
- Rebuilt square 1024×1024 iOS and Android icon assets around the existing brand mark.
- Renamed the installed app from the placeholder “mobile” to “SpeedRead.”

### Accessibility

- Added semantic button roles to game and app controls.
- Added selected/checked state to tabs, radio answers, and difficulty controls.
- Added readable labels to game cards and Memory Recall digits.
- Increased shared control targets to at least 48 points.
- Darkened muted and feedback colors for better contrast.
- Kept text feedback alongside color feedback.

The design follows current platform direction without copying a specific app: expressive hierarchy and shapes from Material 3, plus Apple/WCAG guidance for contrast and practical touch targets:

- [Apple accessibility design guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility/)
- [Material 3 design system](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [WCAG 2.2 target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)

### Engineering health

- Updated Expo SDK 54 packages to their supported versions.
- Removed production `any` types from result payloads, analytics, and book API parsing.
- Added reusable result metric, duration, summary, and streak helpers.
- Added regression coverage for measured-reading timing and result classification.
- Added focused flow, report, feedback, replay, and auto-start coverage for both new exercises.
- Added project commands and lifecycle guidance for future game changes.

## Verification completed

- TypeScript strict typecheck: passed.
- Jest: 36 suites passed; 184 tests passed; 10 navigation-dependent tests remain intentionally skipped in the existing mocked-navigation suite.
- Expo Doctor: 18/18 checks passed before the final source-only validation. A fresh rerun was attempted but the sandbox could not reach the npm registry to resolve the Doctor CLI; dependencies did not change in the final cycles.
- All-game auto-start audit: passed for all 25 registered games.
- Catalog/library audit: every registered game has one typed catalog entry, three rules, complete Easy/Medium/Hard copy, a library card, and a start path.
- Difficulty audit: every game remains manually selectable; reading practice defaults Adaptive, labs default Manual, and all three Schulte tables plus Eye Reset are manual-only.
- Production web export: passed.
- Structure Scan audit: start, untimed/timed preview, article hiding, correct/incorrect feedback, one-time result reporting, replay, and timer cleanup passed.
- Browser flow QA: Repeated Reading and Main Idea start, progress, feedback, finish, save, and replay/result paths passed. Word Search traced a complete word, both Schulte sequences reached truthful result screens, and the number replay path started a fresh grid. Schulte’s manual 4×4 choice survived a reload and produced exactly 16 targets. Eye Reset completed all three stages, reported a truthful break-duration result, and replayed a fresh session.
- Responsive QA: 320×640 and 390×844 layouts had no horizontal overflow or sub-44-point controls.
- Browser console: no runtime errors; React Native Web emits one framework deprecation warning for legacy shadow style properties.
- The final source-only browser rerun could not open a sandboxed local HTTP/file preview, so the new Library and Structure Scan were validated with render-level interaction tests rather than a fresh live browser session.
- npm dependency advisory audit: attempted repeatedly, but the npm registry advisory endpoint returned a malformed compressed response; retry this registry-side check before release.

## Recommended next improvements

### High priority

1. Add two or three calibrated questions to every longer measured passage. A single question is a useful quick check but too noisy for a dependable comprehension score.
2. Add Detox or Maestro device-level flows for home → reading → result → replay, hardware back, interrupted timers, and app relaunch. The component suite cannot fully exercise native navigation.
3. Test VoiceOver, TalkBack, Dynamic Type/font scaling, reduced motion, and 200% text on physical devices.
4. Add an onboarding baseline and a weekly plan that raises target pace only when comprehension remains stable across several attempts.
5. Compare use of the supporting labs with measured-reading outcomes over several weeks. Keep indirect legacy drills outside the recommended home unless they add a distinct behavior and stronger evidence.

### Medium priority

6. Report comprehension consistency and sustainable WPM across several sessions, not just a personal-best number.
7. Add content filters for length, topic, and reading level; record source/license metadata for imported books.
8. Cache selected public-domain books for intentional offline reading and make download state explicit.
9. Make translation an opt-in feature with a short privacy disclosure before sending selected text to a third-party service.
10. Add optional reminders and a user-selected daily goal; do not use streak pressure as the only retention mechanism.
11. Replace remaining legacy game-specific hard-coded styles with shared tokens only if those drills stay supported.
12. Add content-authoring validation for question count, answer indexes, duplicate choices, word count, and reading-level metadata.

### Release readiness

13. Run the native device matrix: current iOS, one older supported iOS, small Android, large Android, tablet, slow/offline network.
14. Add crash/error reporting with an explicit privacy policy and opt-out.
15. Add store screenshots, support/privacy URLs, final bundle identifiers, and a transparent adaptive-icon foreground if launcher theming is a release requirement.
16. Review public-domain download and translation endpoints for availability, rate limits, CORS behavior, and production terms before store submission.
