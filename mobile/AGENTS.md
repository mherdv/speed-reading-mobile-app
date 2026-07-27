# Mobile project guidance

## Stack and checks

- Package manager: npm.
- Framework: Expo SDK 54, React Native 0.81, React Navigation 7.
- Source: `src/`; app entry: `App.tsx`; static assets: `assets/`.
- This project has no generated-code workflow.
- Before handing off a change, run `npm run typecheck`, `npm run test:ci`, and `npm run doctor`.
- For a production web smoke build, run `npm run export:web -- --output-dir <temporary-directory>`.

## Game lifecycle contract

- Every registered game must support `idle`, active, and `ended` states.
- A completed game must render its ended state before or while reporting its result.
- Report at most once per attempt. Reset report and cancellation refs whenever a replay starts.
- Clear intervals and timeouts on unmount. An old attempt must never report after the user leaves.
- `autoStart` must wait for required asynchronous progress/content and start only once.
- Add or update a focused test for start, finish/report, replay, and timer cleanup whenever changing a game loop.

## Difficulty contract

- Every registered game receives `easy`, `medium`, or `hard` through `GameScreen` and must make those settings meaningfully different.
- Use the shared `GameDifficultyControl`; do not add a second game-specific difficulty picker.
- Adaptive mode may derive the next session from the stored 15-level progression. Reading-practice games default to Adaptive; skill/experimental labs default to Manual.
- A game component reads difficulty from its prop and must never mutate that difficulty after a result. Progression affects a later session through `GameScreen`, so replay preserves the active setting.
- Schulte Numbers, Schulte Letters, Schulte Mix, and Eye Reset are manual-only. Their selected grid size or break length must not change after a result.
- Preserve explicit prop overrides in focused tests while using the selected difficulty for production defaults.

## Results and training claims

- Use WPM only when `wordCount` and actual reading duration are available.
- Stop measured-reading time before the comprehension phase.
- Do not claim comprehension for guided pacing or recognition drills.
- Store truthful score/accuracy values; do not derive placeholder percentages.
- Curated exercises should practice a reading behavior directly. Describe visual or reaction drills as task-specific warm-ups, not proven reading-transfer methods.

## Authored content contract

- Use original, licensed, or public-domain material. Do not copy a competitor's proprietary passages, questions, word lists, or answer sets.
- Keep authored pool sizes and replay limits in executable validators. A fixed count stated in the catalog or report must be enforced by a test.
- Require stable unique IDs, a present correct answer, unique answer options, and computed rather than hand-maintained word counts for measured passages.
- Shuffle without replacement when a game promises a deck, and avoid an immediate repeat when the pool permits it.
- Label the implemented exercise language honestly. Network translation or book retrieval must not be presented as bundled multilingual or offline content.
- When adding or changing a content pool, update its validator test, catalog description, and the exact replay inventory in `SPEED_READING_PLATFORM_REPORT.md`.

## Exercise catalog compatibility

- `src/data/gameIds.ts` keeps every durable exercise ID used by saved results.
- `src/data/gameCatalog.ts` is the authoritative source for every title, category, tier, rule, keyword, and exact difficulty effect. The registry, library, home labels, and shared difficulty control must consume it rather than duplicating copy.
- `GAME_REGISTRY` combines the catalog with components and keeps every game available for legacy replay.
- `CORE_GAME_IDS` controls direct reading practice. `SCANNING_GAME_IDS` controls the separately labeled scanning and attention labs. `EYE_COMFORT_GAME_IDS` contains screen-wellness activities. `SUPPORTING_GAME_IDS` and `CURATED_GAME_IDS` are ordered unions.
- Put an exercise in the core only when it directly practices connected-text fluency, comprehension, retrieval, or purposeful scanning. Supporting labs must state that their score is task-specific and must not imply reading transfer.
- Retire a low-value exercise by removing it from the appropriate visible list; do not delete or rename its durable ID without a result migration.
- New visible exercises need truthful result fields, shared progress integration, and a focused lifecycle test. Supporting exercises must add a distinct behavior rather than duplicate an existing core or lab activity.
- Eye-comfort activities may encourage breaks and natural blinking, but must not claim to correct eyesight, treat digital eye strain, or improve reading speed.
- Keep the all-game auto-start audit in sync with every registered component, including replay-only legacy exercises.
- When an exercise or difficulty changes, update the catalog, its focused lifecycle test, the library test if behavior changes, and `SPEED_READING_PLATFORM_REPORT.md`; then run both catalog completeness and all-game auto-start audits.

## UI conventions

- Reuse theme roles from `src/theme/colors.ts`, shared buttons, idle panels, and icons.
- Interactive controls need a semantic accessibility role and a practical touch target of at least 44 points (48 preferred).
- Avoid nested vertical scrolling containers.
- Keep reading copy at a comfortable size and line height; never expose a measured passage before its timer begins.
