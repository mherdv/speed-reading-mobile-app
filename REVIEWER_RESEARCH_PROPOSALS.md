# Research-led product review and implementation proposals

Date: 2026-07-26
Role: reviewer/researcher
Scope: accepted 25-game application, live web build, current source, tests, information architecture, content, measurement, accessibility, responsive layouts, motivation, privacy, and offline behavior.
Change boundary: this review changed no product source.

## Executive direction

The application should become a **reading practice coach**, not a collection that implies every visual-speed game improves reading. Its strongest differentiator is honest measurement: connected text, a clearly stated reading goal, passage-dependent comprehension, and personal trends that never confuse a trained-task score with reading speed.

Keep the existing 25 durable game IDs, but change the visible hierarchy:

1. **Today**: a short, swappable plan with one direct reading task, one focused skill task, and an optional eye-comfort break.
2. **Practice**: evidence-near reading exercises and purposeful scanning.
3. **Labs**: word, grid, Schulte, memory, and reaction tasks, explicitly described as task practice without a reading-speed transfer claim.
4. **History**: reading progress first; lab history in a separate view.

The next coherent release should add only two exercises:

- **Evidence Hunt**: answer a passage-dependent question and select the sentence(s) that justify the answer.
- **Context Builder**: infer a word's meaning from a connected paragraph and identify the context clue.

It should also correct the current plan, reading width, result hierarchy, chart responsiveness, and accessibility. Do not spend this cycle restyling or expanding all legacy labs.

## Evidence standard and claim policy

### Evidence/task-proximity tiers

| Tier | Meaning | Product claim allowed |
|---|---|---|
| A — direct reading outcome | Connected text plus a meaning check; the exercise measures the behavior users want to improve. | “Practice reading with understanding”; report task-specific WPM and comprehension separately. |
| B — task-proximal skill | Search, vocabulary, cohesion, or structure applied to connected language. Transfer is plausible but not established by this app. | “Practice finding evidence/context/structure”; report accuracy and time for that task. |
| C — trained-task lab | Generic visual search, flash recognition, memory, number, symbol, or reaction task. | “Practice this task”; never “expands vision,” “trains the brain to read faster,” or predicts reading speed. |
| W — wellness/tool | Comfort break or reading utility, not performance training. | Describe the action and comfort purpose; make no treatment or speed claim. |

### Source-backed findings

- The central scientific constraint is the speed–accuracy tradeoff. The major review by Rayner and colleagues concludes that very large speed gains with unchanged comprehension are unlikely; language skill and practice matter, while skimming is a valid but different goal ([Association for Psychological Science review](https://www.psychologicalscience.org/journals/pspi/1529100615623267/), [APS overview](https://www.psychologicalscience.org/publications/speed_reading.html)).
- A meta-analysis of working-memory training found no convincing far transfer to reading comprehension or word decoding against active controls. Generic memory/visual games therefore belong in Labs, not the reading-progress model ([Melby-Lervåg, Redick, and Hulme](https://pubmed.ncbi.nlm.nih.gov/27474138/)).
- Repeated reading has positive fluency evidence, especially for elementary-age learners with reading disabilities. This supports keeping it, but does not justify promising the same effect size for typical adults ([Lee and Yoon meta-analysis](https://pubmed.ncbi.nlm.nih.gov/26408529/)).
- Retrieval practice reliably benefits learning, supporting post-reading recall and evidence-selection tasks rather than passive exposure alone ([Roediger and Butler review](https://pubmed.ncbi.nlm.nih.gov/26151629/)).
- Reading goals and text structure alter what readers remember and infer. Skimming can increase rate while weakening integration, so gist, detail, and locate goals must be measured separately ([McCrudden and Schraw](https://pubmed.ncbi.nlm.nih.gov/25018581/), [controlled skimming experiments](https://pubmed.ncbi.nlm.nih.gov/41372888/)).
- Strategy instruction has evidence for comprehension, including summarizing, monitoring, clarifying, goal setting, and text structure. The cited practice guide is school-focused, so the adult product should test rather than assume identical effects ([IES practice guide](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/readingcomp_pg_092810.pdf), [strategy meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34421702/)).
- RSVP outcomes depend strongly on presentation conditions and do not remove natural-reading comprehension limits. Guided pacing may remain a tool, but target WPM is not evidence of comprehension ([Benedetto et al.](https://pubmed.ncbi.nlm.nih.gov/27088226/)).
- Equivalent passages require deliberate matching of content, length, difficulty, and linguistic complexity. Paragraph-level samples are less variable than single sentences, and questions answerable without the passage weaken validity ([IReST development](https://pubmed.ncbi.nlm.nih.gov/22661485/), [paragraph reliability study](https://pubmed.ncbi.nlm.nih.gov/26067392/), [passageless-question validity study](https://pubmed.ncbi.nlm.nih.gov/23223200/)).
- Motivation should support competence and autonomy. Gamification effects are small and heterogeneous; streak pressure is not a substitute for meaningful feedback ([Ryan and Deci](https://pubmed.ncbi.nlm.nih.gov/10620381/), [self-determination meta-analysis](https://pubmed.ncbi.nlm.nih.gov/35330866/), [gamification meta-analysis](https://link.springer.com/article/10.1007/s10648-019-09498-w)). Avoid countdown pressure, loss framing, buried controls, and other manipulative patterns ([FTC dark-pattern report](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers)).
- Eye breaks may support comfort, but eye exercises are not established treatment for reading problems, and evidence for an exact 20-20-20 schedule is limited ([joint technical report](https://pubmed.ncbi.nlm.nih.gov/19651597/), [20-20-20 trial](https://pubmed.ncbi.nlm.nih.gov/36473088/)).

### Competitor patterns, not efficacy evidence

| Product | Officially visible pattern worth learning from | Do not copy as proof |
|---|---|---|
| [Outread](https://apps.apple.com/us/app/outread-speed-reading/id778846279) | Guide/flash modes, adjustable pace and chunking, imports, typography, themes, offline use, multi-device UI. | Marketing speed claims and flash-mode transfer claims. |
| [Spreeder](https://www.spreeder.com/?lang=en) | Course plus personal library, imports, tags, notes, cloud continuity. | “3×” and subvocalization claims. |
| [SwiftRead](https://swiftread.com/) | Multiple import formats, configurable rate, themes, layout, and audio; its [reading test](https://swiftread.com/reading-speed-test) pairs WPM with questions. | Treating a few questions or an RSVP target as a validated assessment. |
| [Elevate](https://support.elevateapp.com/hc/en-us/articles/4402971366299-What-is-the-difference-between-workouts-and-games) | A Today tab with 3–5 personalized games and a separate game library; [product overview](https://support.elevateapp.com/hc/en-us/articles/4402922583067-What-is-Elevate) explains adaptive workouts and history. | Inferring reading transfer from generalized training. |
| [Readwise Reader](https://readwise.io/read/) | Durable library, offline reading, reading preferences, export, notes, and keyboard workflows; its [FAQ](https://docs.readwise.io/reader/docs/faqs) distinguishes reading position from skim position. | Turning this training app into an unbounded read-it-later platform. |
| [Acceleread](https://apps.apple.com/us/app/speed-reading-acceleread/id6717574202) | Plan and progress framing. | Personalization or efficacy claims without a transparent rule and measurement model. |

## Current-product audit

### Information architecture and onboarding

- Home contains a measured read, seven curated tasks, a full-catalog link, history, streak, latest result, and level reset. The hierarchy is better than the old 25-card wall, but still feels like a menu rather than a plan.
- The “Today’s Training” recommendation rotates by completed-read count; it is not a user-goal or performance-based plan. Labeling it personalized would be misleading.
- Library defaults to all 25 exercises with equally prominent Start buttons. Tier badges cannot overcome that visual equivalence.
- “Reset levels” is a low-frequency control on the primary screen. Move it to Settings and require confirmation.
- Add a short, optional onboarding: choose a goal (understanding, study/scanning, comfortable fluency), explain “speed with understanding,” offer a three-passage baseline, then show Today. It must be skippable and resumable, consistent with [Apple onboarding guidance](https://developer.apple.com/design/human-interface-guidelines/onboarding).

### Measurement and results

- A self-timed 139-word passage plus one multiple-choice question is a noisy personal practice sample, not a diagnostic reading-speed test.
- The current validity floor of three seconds and ceiling of 1000 WPM are permissive. Keep extreme attempts but flag/exclude them from trends using a quality rule; do not tell the user a clinical “true speed.”
- The 20 text samples share one comparison-band label without evidence that they are equated. Rename the output **personal practice estimate** and show a cross-passage median only after at least three different passages.
- Use three passage-dependent items per baseline passage: main idea, detail/evidence, and inference/purpose. Report `correct / total`; do not let one answer turn comprehension into a visually precise percentage.
- Results currently place WPM in the center of a circular ring whose fill can represent binary comprehension or a fallback 100%. History normalizes latest score to personal best. Both make unrelated quantities look like percentages. Replace the rings with labeled metric cards.
- History sorts high-attempt labs prominently. Default to Reading, with separate Practice and Labs filters. Show median personal reading estimate, comprehension count, valid-passage count, and uncertainty copy.
- Background save failure is silent. Keep the optimistic screen, but show a nonblocking “Saved on this device” / “Couldn’t save—retry” status.

### Content

- Current passages over-concentrate on reading tactics, creating familiarity and prior-knowledge bias. Add varied science, history, practical, narrative, and argument content.
- Every passage should carry: stable ID and version, language, genre/domain, word count, complexity band, comparison band, source/license, question types, answer dependencies, rationale, and accessibility notes.
- An authoring validator must reject duplicated IDs, inaccurate word counts, missing rationales, repeated answers in the same position, questions answerable without the passage, and baseline sets with fewer than three distinct passages.
- Same-passage repeated-reading results should remain separate from cross-passage baseline trends.

### UX, UI, and responsive design

- At a 1728-pixel viewport, Home cards stretch to roughly half the entire screen, while Library cards remain centered but its controls span the screen. Establish one responsive shell.
- Active measured-reading text spans almost the whole wide viewport. Use a centered reading column of roughly 60–75 characters / maximum 680–720 pixels. Reading width matters more than decorative trend styling.
- Home says “About 2 minutes,” while the measured-read setup says “~1 min” for the same sample. Derive duration from one shared estimate.
- At wide sizes, History cards span the viewport but contain charts capped near 280 pixels. `ProgressCharts` and `ProgressChart` use module-static `Dimensions.get('window')`, so they do not correctly respond to resize/orientation.
- Use window classes aligned with current [Android adaptive guidance](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes): compact `<600`, medium `600–839`, expanded `≥840`. Compact uses one column; medium may use two cards; expanded uses a bounded shell and optional navigation rail.
- Preserve the existing calm indigo/teal identity. Use semantic color roles for surfaces, text, success, warning, and error; do not use color alone. Material 3 supports role-based theming, dynamic color, and adaptive components ([Material 3](https://developer.android.com/develop/ui/compose/designsystems/material3), [color roles](https://developer.android.com/design/ui/mobile/guides/styles/color)).
- Do not imitate translucent “glass” inside reading content. Apple’s current materials guidance reserves such effects for navigation/control layers and requires transparency/contrast accommodations ([Apple materials](https://developer.apple.com/design/human-interface-guidelines/materials)).
- Keep the code-native icon family and remove stray emoji as functional icons. A flame may remain illustrative, but it must have a text label and must not communicate shame or loss.
- Raise small body/helper text and verify 200% text sizing. Avoid fixed-height text containers and aggressive `numberOfLines`.

### Accessibility

- Keep at least 44×44-point primary targets; WCAG’s minimum is 24×24 CSS pixels with spacing, while Apple recommends 44×44 points ([WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility/)).
- Test 320-CSS-pixel reflow, visible/non-obscured keyboard focus, logical focus order, no color-only state, and adjustable or removable time limits ([WCAG 2.2](https://www.w3.org/TR/WCAG22/), [text spacing](https://www.w3.org/WAI/WCAG22/UNDERSTANDING/text-spacing.html)).
- Charts need a single accessible summary plus a data-list alternative. Tiny SVG labels are not adequate.
- Use current React Native accessibility APIs to respect screen reader, reduce-motion, bold-text, grayscale, and high-contrast settings where available ([React Native accessibility](https://reactnative.dev/docs/accessibility), [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)).
- Grid and evidence-selection tasks need ordered screen-reader labels, selected/disabled state, keyboard activation on web, and a non-drag alternative.

### Motivation, offline behavior, and privacy

- Today must be swappable and skippable. Streaks are secondary continuity notes, not loss threats. Missing a day must not erase or downgrade progress.
- Praise strategy and consistency (“You kept comprehension at 3/3”) rather than arbitrary speed or best-score chasing.
- Built-in training is offline. Power Reader’s public-domain and translation features are network-dependent; clearly label them and explain when selected text leaves the device.
- Results use AsyncStorage, which is unencrypted and appropriate only for non-sensitive state ([Expo storage guide](https://docs.expo.dev/develop/user-interface/store-data/), [AsyncStorage](https://react-native-async-storage.github.io/)). Add “stored on this device,” delete-all, and export controls. Do not put credentials or private imported content in AsyncStorage.
- Publish an in-app privacy summary and keep store declarations accurate even if the app collects no data ([Apple app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/), [Google Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)).

## Existing 25-game disposition

Do not delete durable IDs or old history. “Merge” means one visible successor with legacy routes/results retained.

| Exercise | Tier | Decision | Reason and next action |
|---|---:|---|---|
| Repeated Reading | A | **Keep core** | Closest evidence fit. Keep two connected passes and comprehension; state adult-evidence limits and compare pass 1/2 without rewarding comprehension loss. |
| Main Idea | A | **Keep core** | Direct retrieval after connected text. Expand the passage pool and question rationales. |
| Structure Scan | A/B | **Keep core** | Purposeful goal-and-heading use. Separate locate accuracy from preview time. |
| Power Reader | W/tool | **Redesign, de-emphasize** | Rename Guided Reader; readable width, typography/offline/privacy controls; target pace is a setting, not achievement. |
| Flash Recall | C | **Merge** | Duplicates Word Flash. Retain route/history but expose one recognition lab. |
| Comprehension | A | **Redesign** | Use longer varied passages and three dependent question types; share the new content model with baseline practice. |
| Schulte Numbers | C | **Keep as manual Lab** | Requested familiar task, but no reading-transfer claim. Manual grid size; score only time/errors. |
| Schulte Letters | C | **Merge/legacy Lab** | Near duplicate of Numbers; expose through a Schulte mode selector later. |
| Schulte Mix | C | **De-emphasize** | Task-switching variant, not reading. Preserve for users who want it. |
| Eye Reset | W | **Keep comfort** | Honest blink/look-away flow; no eyesight or speed claim. |
| Visual Span | C | **De-emphasize** | Trained recall task with no demonstrated far transfer. Remove “expansion” implication in copy. |
| Patterns | C | **Merge later** | One generic visual-search lab is sufficient. |
| Word Flash | B/C | **Keep one Lab** | Word recognition only; do not treat display rate as reading WPM. |
| Phrase Flash | B/C | **Redesign/merge** | Replace flash exposure with connected phrase-boundary practice or retain as legacy. |
| Word Pairs | B | **Replace visibly** | Shallow associations; Context Builder is closer to real vocabulary use. Preserve legacy route. |
| Text Search | B | **Keep and redesign** | Purposeful connected-text scanning. Add paraphrased goals and evidence, not only exact word matching. |
| Word Search | C/B | **De-emphasize Lab** | Familiar and usable, but grid performance is not reading speed. |
| Number Search | C | **Legacy Lab** | No meaningful language proximity; keep history and manual difficulty. |
| Letter Hunt | B/C | **Merge later** | Fold into a single word/visual-recognition lab. |
| Number Hunt | C | **Legacy Lab** | Reaction classification, not reading. |
| Symbol Hunt | C | **Legacy Lab** | Reaction classification, not reading. |
| Word Jumble | B/C | **De-emphasize** | Spelling/vocabulary task with weak reading proximity; Context Builder is preferable. |
| Odd Word | B/C | **Merge later** | Similar visual discrimination can live in one recognition lab. |
| Even or Odd | C | **Do not feature** | Redundant arithmetic reaction task; preserve only for route/history compatibility. |
| Memory Recall | C | **Legacy Lab** | Digit-span improvement should not appear in reading progress. |

## New exercise proposals

Every proposal requires manual Easy/Medium/Hard. “Adaptive” means a transparent next-session suggestion, never a silent mid-round change, and the user can override it.

### 1. Evidence Hunt — BUILD NOW

- **Goal/tier:** Find and justify an answer in connected text; A/B.
- **Rules/flow:** Show an information question; user scans a 160–350-word passage, selects one or two supporting sentences, answers a four-option question, sees the correct evidence and rationale, then completes four rounds.
- **Truthful metrics:** evidence selections correct / required, answer accuracy, median locate time, wrong selections. No WPM or generalized-speed claim.
- **Difficulty:** Easy—short passage, explicit word overlap, one evidence sentence, untimed; Medium—paraphrased prompt, longer passage, one sentence, optional soft timer; Hard—inference, plausible distractors, two evidence sentences, longer passage. Manual always; suggest the next level only after both accuracies are at least 80% over two complete sessions.
- **Content/accessibility:** Stable sentence IDs, dependent questions, evidence keys, rationales, genre/complexity metadata. Sentence-sized buttons, not tiny inline words; selected state announced; keyboard and screen-reader order; untimed mode at every level.
- **Failure/replay/cleanup:** Time expiry submits unanswered items, never zeroes completed work; replay resets question/order/timers; Back cancels timers and reports nothing; completion reports exactly once.
- **Anti-gaming:** Shuffle passages/options, count wrong taps, require evidence before answer, exclude immediate identical replays from trend medians.
- **Acceptance:** All three levels change content dimensions; answer and evidence metrics persist separately; wrong-then-right cannot yield full accuracy; accessible labels/states exist; start, completion, report-once, replay, Back confirmation, and unmount tests pass.

### 2. Context Builder — BUILD NOW

- **Goal/tier:** Infer an unfamiliar word from context and identify the clue; B.
- **Rules/flow:** Read a paragraph with a semantically marked target word, choose its meaning, select the clue sentence/phrase, rate confidence optionally, review the explanation, and complete five rounds.
- **Truthful metrics:** meaning accuracy, clue accuracy, optional confidence calibration, and attempts. No WPM.
- **Difficulty:** Easy—common morphology and explicit synonym/definition clues; Medium—contrast/example clues and closer distractors; Hard—subtle multi-sentence clues, less frequent words, morphology plus context. Manual always; suggest upward only when meaning and clue accuracy reach 80% across two sessions.
- **Content/accessibility:** Licensed/original paragraphs, definition, accepted clue IDs, morphology notes, rationale, frequency/complexity metadata. Target identified in text and accessibility label without color alone; clue choices are large buttons; no mandatory timer.
- **Failure/replay/cleanup:** Unanswered round can be skipped and is marked omitted; replay receives a fresh set before recycling; unmount clears pending feedback and reports nothing; completion once.
- **Anti-gaming:** Rotate words and contexts, shuffle distractors, require clue selection, do not reveal answer after confidence alone, do not promote repeated-item memorization as vocabulary mastery.
- **Acceptance:** Metrics and difficulty dimensions are tested; target/clue semantics work with screen reader and keyboard; skip, wrong answer, replay, report-once, and unmount paths are covered.

### 3. Gist–Detail Switch — NEXT

- **Goal/tier:** Deliberately change reading behavior for gist, detail, or locate goals; A.
- **Rules/flow:** Receive one stated goal, read, answer goal-matched questions, then repeat with another goal and a different passage; feedback compares accuracy within the same goal only.
- **Metrics:** elapsed time and accuracy by goal; no single blended “speed score.”
- **Difficulty:** Easy—one goal/short explicit text; Medium—two goal types/denser text; Hard—three goal types/inference. Manual, with next-session suggestion based on at least 80% goal accuracy.
- **Content/accessibility:** Goal-tagged question bank, headings and passage metadata; goal announced before text and retained in an accessible summary.
- **Failure/replay/cleanup:** Optional timer, pause allowed, skipped question recorded; fresh passages on replay; timers cleaned.
- **Anti-gaming:** Different passage per goal, dependent questions, no comparison of unlike goal rates.
- **Acceptance:** Goal-specific storage/charting, all difficulty dimensions, pause/untimed, lifecycle, and accessibility tests.

### 4. Pace Ladder — NEXT

- **Goal/tier:** Explore a modest faster pace while maintaining understanding in connected text; A.
- **Rules/flow:** Set a manual target or use a baseline-derived suggestion; read a full paragraph with a gentle line/phrase guide, freely pause/backtrack, answer three questions, and receive a next-session suggestion of at most 5–10%.
- **Metrics:** actual elapsed WPM and correct/total separately; guided target shown only as a setting. A round is not “successful” when comprehension falls below the configured threshold.
- **Difficulty:** Easy—short/simple and baseline pace; Medium—longer/+5%; Hard—denser/+10%, never an arbitrary 500+ target. Manual control always; adaptation only between sessions.
- **Content/accessibility:** Equivalent connected passages and dependent question mix; reduce-motion disables animated guide, static line markers remain; pause and untimed alternatives.
- **Failure/replay/cleanup:** Backgrounding pauses; focus-loss noted; replay gets another passage; guide/timers cleanly cancel.
- **Anti-gaming:** Minimum visibility time, unique passage, actual versus target distinguished, extreme attempts quality-flagged.
- **Acceptance:** Reduced-motion, pause/background, metric separation, quality flags, lifecycle, and three-question paths pass.

### 5. Summary Recall — NEXT

- **Goal/tier:** Retrieve the central claim and key supports after reading; A.
- **Rules/flow:** Read, hide passage, write one optional sentence, then select the best main claim and two supports; show a model summary and allow self-comparison without scoring prose.
- **Metrics:** structured claim/support accuracy and retrieval time; typed prose is never algorithmically graded.
- **Difficulty:** Easy—short explicit thesis/one support; Medium—implicit thesis/two supports; Hard—competing detail and qualification. Manual; adaptation from structured accuracy only.
- **Content/accessibility:** Claim/support keys and rationale; text entry optional, voice-input compatible, clear hide/show control.
- **Failure/replay/cleanup:** Reveal after a submitted attempt; replay uses new text; draft kept only during active session and deleted on exit unless user explicitly saves.
- **Anti-gaming:** Passage hidden before selection, randomized options, no credit for viewing model first.
- **Acceptance:** No free-text score, correct structured metrics, privacy cleanup, lifecycle and assistive-input tests.

### 6. Inference Bridge — NEXT

- **Goal/tier:** Combine separated facts into a supported inference; A.
- **Rules/flow:** Read a passage, choose an inference, then select the two sentences that jointly support it; feedback distinguishes implication from stated fact.
- **Metrics:** inference accuracy, both-evidence accuracy, median decision time.
- **Difficulty:** Easy—adjacent explicit facts; Medium—separated paragraphs; Hard—qualification/causal alternatives. Manual; suggest after two ≥80% sessions.
- **Content/accessibility:** Two necessary evidence IDs, plausible distractors, explanation; sentence buttons and no color-only relations.
- **Failure/replay/cleanup:** Partial evidence is recorded, not rounded up; new item on replay; timers clean.
- **Anti-gaming:** Require both evidence links, shuffle options, no repeated passage in one session.
- **Acceptance:** Partial-credit math, two-evidence selection, difficulty, lifecycle, and accessibility tests.

### 7. Reference Resolver — NEXT

- **Goal/tier:** Track pronouns, substitutions, and connective relationships in connected text; B.
- **Rules/flow:** Read a paragraph, select what a highlighted reference points to, identify the relationship signaled by a connector, then review the resolved sentence.
- **Metrics:** antecedent and relationship accuracy; no speed claim.
- **Difficulty:** Easy—nearby singular reference; Medium—multiple candidates; Hard—paragraph-spanning reference/implicit cohesion. Manual; transparent suggestion from accuracy.
- **Content/accessibility:** Linguistically reviewed keys/rationales; highlight has semantic label, and answers are buttons rather than drag targets.
- **Failure/replay/cleanup:** Skip allowed; fresh item on replay; pending feedback cleared.
- **Anti-gaming:** Randomized candidates and context variants; reference cannot be solved from grammar alone in scored items.
- **Acceptance:** Both metric types, ambiguity review, keyboard/screen reader, lifecycle, and level tests.

### 8. Outline Builder — NEXT

- **Goal/tier:** Reconstruct an article’s structure after reading; A/B.
- **Rules/flow:** Preview/read a structured article, hide it, order headings and attach one summary to each, then reveal the source outline.
- **Metrics:** correct positions, correct heading-summary matches, and revisions; not WPM.
- **Difficulty:** Easy—three distinct sections; Medium—four similar sections; Hard—five with nested/implicit structure. Manual; suggest from two-session accuracy.
- **Content/accessibility:** Valid outline tree and summaries; Move up/down buttons and numbered picker replace mandatory drag-and-drop.
- **Failure/replay/cleanup:** Submit partial outline with omissions; replay uses a new article; local transient arrangement cleared.
- **Anti-gaming:** Hide source during reconstruction, shuffle heading order, score final state once.
- **Acceptance:** Non-drag completion, partial-state scoring, focus order, lifecycle, and level tests.

### 9. Prediction and Verify — LATER

- **Goal/tier:** Make a purpose-based prediction, then revise it using evidence; A/B.
- **Rules/flow:** Read title/opening, choose a predicted direction and reason, reveal the next section, classify the prediction as confirmed/revised/rejected, and select evidence.
- **Metrics:** evidence judgment and revision quality through structured choices; prediction itself is not marked “wrong.”
- **Difficulty:** Easy—strong signposting; Medium—several plausible paths; Hard—qualification/surprise. Manual; no automatic increase until enough content calibration exists.
- **Content/accessibility:** Staged passages, acceptable predictions, evidence IDs; every reveal is announced without stealing focus.
- **Failure/replay/cleanup:** Skip/reveal produces no scored judgment; fresh passage on replay; staged state clears.
- **Anti-gaming:** Score verification, not lucky prediction; evidence required.
- **Acceptance:** No penalty for initial prediction, staged focus, evidence metrics, lifecycle, and difficulty tests.

### 10. Argument Map — LATER

- **Goal/tier:** Distinguish claim, evidence, reason, and counterclaim; A/B.
- **Rules/flow:** Read an argument, label selected sentences, connect evidence to claims, identify a counterclaim, and review the canonical map.
- **Metrics:** role-label and relationship accuracy; no speed metric.
- **Difficulty:** Easy—explicit markers/one claim; Medium—two supports/counterclaim; Hard—implicit warrant and qualification. Manual; adaptation only after calibrated item data.
- **Content/accessibility:** Expert-reviewed argument graph and rationale; list-based “assign to” controls as full alternative to canvas/drag.
- **Failure/replay/cleanup:** Partial map accepted with omissions; new argument on replay; transient graph clears.
- **Anti-gaming:** Score relationships as well as labels; randomize sentence order only after reading; no answer-by-color.
- **Acceptance:** Accessible non-canvas path equals drag path, relationship scoring, lifecycle, and level tests.

### 11. Cross-text Synthesis — LATER

- **Goal/tier:** Compare two short sources and identify agreement, difference, and stronger evidence; A.
- **Rules/flow:** Read source A and B with visible provenance, complete an agreement/difference matrix, choose evidence from each, and review a synthesis.
- **Metrics:** comparison and dual-evidence accuracy plus completion time; sources are not ranked by ideology.
- **Difficulty:** Easy—short direct agreement; Medium—different emphasis; Hard—method/qualification conflict. Manual only until content is carefully calibrated.
- **Content/accessibility:** Two licensed sources, provenance, relationship keys/rationale; tabs must not hide context from screen readers, and a stacked layout is available.
- **Failure/replay/cleanup:** Save active answers only during session; partial submit allowed; new pair on replay.
- **Anti-gaming:** Evidence required from both texts, balanced option order, topic diversity audit.
- **Acceptance:** Both-source evidence, stacked compact layout, provenance display, lifecycle, and difficulty tests.

### 12. Spaced Context Review — LATER

- **Goal/tier:** Retrieve previously practiced vocabulary in a new context after a real delay; B.
- **Rules/flow:** Queue only words previously completed in Context Builder, present a new sentence after scheduled intervals, choose meaning and clue, then reschedule using a transparent simple rule.
- **Metrics:** first-attempt retention by interval, meaning/clue accuracy, due/completed count; no speed score.
- **Difficulty:** Easy—same sense/explicit clue; Medium—new context; Hard—near-sense distractors/implicit clue. User selects level; spacing adapts item interval, not level.
- **Content/accessibility:** Multiple reviewed contexts per sense, interval metadata stored locally; due-state is text, not color; postponing has no penalty.
- **Failure/replay/cleanup:** “Not now” preserves due state, delete vocabulary history supported, replay does not immediately re-award retention.
- **Anti-gaming:** First response counts, immediate repeats excluded, different context required.
- **Acceptance:** Deterministic scheduling tests, clock-boundary tests, delete/export behavior, lifecycle, and accessibility tests.

## Priority roadmap

### BUILD NOW — bounded release

1. Evidence Hunt.
2. Context Builder.
3. Today plan that is deterministic, explained, swappable, and skippable.
4. Honest baseline/result/history hierarchy.
5. Responsive shell, readable text column, responsive charts, and key-flow accessibility.

Do not include dark mode, imports, content sync, AI scoring, or a broad redesign of all legacy games in this release.

### NEXT

- Gist–Detail Switch, Pace Ladder, Summary Recall, Inference Bridge, Reference Resolver, and Outline Builder.
- Larger calibrated passage/question pool and authoring validator.
- Settings/Privacy with export/delete; resilient save status.
- Dark theme/dynamic color after semantic-token migration.
- Native device, screen-reader, large-text, and orientation end-to-end coverage.

### LATER

- Prediction and Verify, Argument Map, Cross-text Synthesis, Spaced Context Review.
- Guided Reader import/offline-cache work, localization, content editorial tooling.

### DO NOT BUILD

- More RSVP/flash variants presented as reading improvement.
- Forced peripheral-span or moving-dot “eye training” with treatment/speed claims.
- More number/symbol/reaction games.
- Leaderboards, lost-streak threats, artificial scarcity, or countdown pressure.
- AI-generated/scored comprehension without licensed source tracking, deterministic fallback, content review, and validity work.
- Social, cloud, or read-it-later scope before the direct practice model is proven useful.

## BUILD NOW implementation contract

### Today and baseline

- Today shows at most three ordered cards: one direct reading/baseline item, one skill item based on an explained rule or user goal, and optional Eye Reset after sustained use.
- Every card says why it was selected. Swap and Skip are always available and never break a streak.
- New users may skip baseline. Baseline uses three distinct passages and at least three dependent questions per passage; result is median valid WPM plus total correct/total.
- Until three valid distinct passages exist, show “Not enough readings for a personal estimate,” not a fake baseline.
- Home and setup duration labels use one shared duration function.

### Results and History

- Remove percentage rings for WPM and arbitrary scores. Show labeled cards for reading rate, comprehension, evidence/context accuracy, and attempts.
- Reading History is the default; Practice and Labs are explicit filters.
- Cross-passage reading trend uses activity + metric + difficulty + authored comparison band, never same passage alone; repeated-reading passes remain separate.
- Extreme/too-short attempts remain viewable but are excluded from baseline and clearly marked.
- Never combine scores from different goal types or games into one index.

### Responsive and accessible UI

- Create a shared bounded shell: compact `<600`, medium `600–839`, expanded `≥840`; expanded content maximum about 1200 pixels.
- Connected reading text is centered at maximum 680–720 pixels / approximately 60–75 characters.
- Charts measure their actual container (`onLayout` or equivalent), update after resize/orientation, and expose a text summary/data list.
- Key flows pass at 320 CSS pixels and 200% text without horizontal page scroll, clipped controls, or lost content.
- Interactive targets are at least 44×44 points on native; keyboard focus is visible and unobscured on web.
- Evidence/Context tasks support screen reader, keyboard, reduce motion, and untimed play.
- Replace functional emoji with the established icon component and use semantic color roles.

### Content and lifecycle

- Add content schemas and validators for both new tasks; at least 12 reviewed rounds per difficulty before release, with no item repeated inside a session.
- Register both games in IDs, registry, catalog, search/categories, navigation/result typing, and history normalization without changing old IDs.
- Manual Easy/Medium/Hard is visible before every session. Adaptive suggestion never changes shuffle/grid difficulty mid-game and never overrides the user.
- Both games satisfy the all-game lifecycle contract: idle, start, active Back confirmation, exactly one result, no late report, clean replay, unmount cleanup.
- Result details are typed and versioned so stored history remains readable after content updates.

### Likely implementation files

- Existing: `mobile/src/data/gameIds.ts`, `mobile/src/data/gameCatalog.ts`, `mobile/src/games/registry.tsx`, `mobile/src/navigation/types.ts`, `mobile/src/navigation/RootNavigator.tsx`.
- Today/baseline: `mobile/src/screens/HomeScreen.tsx`, `mobile/src/screens/ExerciseScreen.tsx`, `mobile/src/data/textSamples.ts`, `mobile/src/domain/results.ts`.
- Results/history: `mobile/src/screens/ResultScreen.tsx`, `mobile/src/screens/HistoryScreen.tsx`, `mobile/src/ui/ProgressChart.tsx`, `mobile/src/ui/ProgressCharts.tsx`, `mobile/src/ui/LineChart.tsx`.
- Shared UI/theme: `mobile/src/theme/colors.ts`, new responsive shell/reading-container components under `mobile/src/ui/`.
- New games/content: `mobile/src/games/EvidenceHunt/`, `mobile/src/games/ContextBuilder/`, and typed data modules under `mobile/src/data/`.
- Tests: catalog/registry/lifecycle/adaptive suites plus focused screen, chart, content-validation, accessibility-state, responsive-layout, and result-domain tests.

### Release validation

- `npm run typecheck -- --pretty false`
- `npm run test:ci -- --silent`
- Expo export/build command already used by the project.
- `git diff --check`
- Automated: IDs/catalog/registry agree; every registered game starts/completes/reports once/replays/unmounts; content validators pass; responsive calculations and chart summaries pass.
- Manual web and native matrix: widths 320, 390, 768, 1024, and 1440+; portrait/landscape; text at 100% and 200%; keyboard-only web; VoiceOver/TalkBack smoke test; reduce motion; offline launch and completion; background/foreground; save failure.
- Reviewer re-runs the full matrix after implementation, reports failures to the implementer, reviews fixes, and performs one final regression pass before acceptance.

## Reviewer self-review

Pass 1 narrowed the proposal from a broad “add more games” request to task-proximal reading practice and separated evidence tiers from competitor patterns.
Pass 2 removed an overlapping third BUILD NOW game, capped the release at two exercises, added truthful measurement and content contracts, and made accessibility, replay, cleanup, anti-gaming, and acceptance behavior explicit for every proposed exercise.

## Final reviewer verdict

The accepted current build is stable, but it still overstates the importance of labs through navigation and visual hierarchy, and its wide-screen reading/results layouts weaken the core experience. The best next release is not a larger catalog. It is a clearer Today plan, honest reading-first results, readable responsive layouts, and two evidence-near exercises—Evidence Hunt and Context Builder—with full difficulty and lifecycle contracts.
