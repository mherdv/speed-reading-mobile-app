You are a UX/UI Design AI agent. Design a complete, mobile-first (phone) UX/UI for a “Speed Reading & Cognitive Training” app suitable to hand off for Figma implementation. Your output must be a detailed, screen-by-screen and game-by-game specification with layouts, components, variants, states, navigation flows, interaction logic, scoring/feedback, and empty/loading/error states. Treat this as a real production app design, not a concept. Use a modern, friendly, premium look.

## 1) Product Summary (what you’re designing)
A training app that helps users improve reading speed, comprehension, visual span, attention, and scanning skills via:
- A “Reading Exercise” flow (read a passage, then answer a comprehension question; compute WPM).
- A suite of mini-games (each game has an idle/intro state, a running state, and an end state; results are saved; difficulty progresses per game over time).

Primary loop:
Home → pick a game → play → Result → (Play Again or Home).
Secondary loop:
Home → History → view charts/list → clear results (optional).

## 2) Design Principles & Constraints
- Mobile-first, portrait, one-handed-friendly.
- Prioritize clarity, fast start, and “game-like” feedback without being childish.
- Consistent “Game Shell” UI pattern across all games (header + stats + gameplay + actions).
- Must be Figma-ready: define a component library, typography scale, color tokens, spacing system, radius, shadows, and component variants.
- Accessibility: large tap targets, strong contrast, supports Dynamic Type (specify responsive behavior), color-blind-safe cues (don’t rely only on color to show correct/wrong).
- Use a vibrant brand with purple/pink gradients as a base. Each game also has a distinctive accent/gradient to help recognition.

## 3) Information Architecture & Navigation
App uses a simple stack navigation (no bottom tabs):
1) Home (hub)
2) Game (dynamic container showing a chosen game)
3) Reading Exercise (reading + question)
4) Result (shown after finishing either a game or reading exercise)
5) History (charts + list)

Navigation behaviors:
- Back from a game should exit the game without reporting a result (confirm dialog if mid-run).
- When a game finishes, go directly to Result and avoid “back into the finished game” (treat as a reset stack behavior).
- Result screen offers:
  - “Play Again” (restarts same activity)
  - “Home”
- History has back to Home and “Clear History” action with confirmation.

## 4) Data & Progress Model (must reflect in UI)

### Results
Each attempt stores: started time, finished time, elapsed time, optional WPM + wordCount + comprehension correctness (reading exercise), or score/accuracy/details (games). The user can see latest attempt on Home and detailed history in History.

### Per-game progression
Each game tracks: level (1–15), streak, total plays, best score, last played.
- Difficulty mapping by level:
  - Level 1–5: Easy
  - Level 6–10: Medium
  - Level 11–15: Hard
- Level adjustment logic:
  - Level up after 5 successes
  - Level down after 3 failures
- Stars are derived from level (show 1–5 stars).
UI must show:
- On each game’s idle/intro screen: Level + Stars (and optionally a “Difficulty” label derived from level).
- On end/result: show Level, Stars, and a “progress changed” micro-message (“Level up!” / “Keep practicing”).
- Home game cards: show a simple progress indicator (e.g., a bar based on level).

## 5) Global Design System (deliver as tokens + components)

### Color & Brand
- Core brand: purple/pink gradient background (soft, readable).
- Cards: white/near-white with subtle shadow.
- Text: dark primary, muted secondary.
- Feedback colors: success (green), error (red), warning (amber), info (blue).
- Each game has a unique accent gradient used for its icon badge on Home and as a subtle highlight in the game header.

### Typography
Define a type scale:
- Display (for big numbers like WPM/Score)
- H1/H2 (screen titles)
- Body (descriptions)
- Caption (labels, timers)
Specify font weights, line heights, and responsive behavior.

### Spacing, Radius, Shadows
- 8-pt spacing system (xs/sm/md/lg/xl).
- Rounded cards (12–20 radius).
- Soft shadows for elevation.

### Component Library (with variants/states)
Design these as reusable components:
- GradientBackground wrapper
- ScreenHeader: title + optional subtitle + back button
- PrimaryButton / SecondaryButton / DestructiveButton (disabled/loading)
- GameCard (Home grid item): icon badge + title + description + progress bar
- StatPill / StatCard (score/time/attempts/accuracy)
- ProgressBar (with gradient fill)
- StarRating (1–5)
- ResultHero (big number + label + optional ring/progress)
- ChartCard (line chart placeholder style)
- ModalConfirm (exit game / clear history / reset difficulty)
- Toast/Snackbar (optional for “Saved”, “Level up”, etc.)
- InputField (for Letter Jumble typing)
- ChoiceButtons (Even/Odd, multiple choice)
- GridCell components (for Schulte, Word Search, Pattern/Letter grids)
Include component specs: padding, corner radius, sizes, icons, states.

## 6) Screen-by-Screen UX/UI Specification (Figma-ready)

### A) Home (Hub)
Goal: immediate start + browsing games + lightweight progress motivation.

Layout:
- Full-screen gradient background.
- Header area:
  - App logo image (centered)
  - “Welcome back!” text
  - Daily streak badge: “Daily Streak: X Days” with flame icon
- Primary CTA: “Quick-start” (Recommended Exercise)
  - Subtitle: “Recommended Exercise”
  - Starts a recommended activity (use “Power Read” / PowerReader as the default)
- Games grid (3 columns):
  - Each GameCard shows:
    - Circular gradient icon badge (game-specific gradient) + icon
    - Title (2 lines max)
    - Short description (2 lines max)
    - Mini progress bar showing level progression (simple: level × 20% capped)
- Bottom section:
  - Two action buttons:
    - History
    - Reset (difficulty/progress reset)
  - Latest result card (if exists): “Latest: …” single-line summary

Interactions:
- Tap game card → Game screen for that game.
- Tap Quick-start → starts Power Read game.
- Tap History → History screen.
- Tap Reset → confirm modal:
  - Title: Reset Difficulty
  - Body: resets all games to level 1
  - Actions: Cancel / Reset (destructive)

States:
- Empty state: no results yet → hide Latest card, show gentle prompt (“Start your first session”).
- Loading state: show skeleton cards or shimmer for grid.
- Error state: show retry banner.

### B) Game (Dynamic Container / “Game Shell”)
Goal: host any mini-game in a consistent frame.

Common layout pattern:
- Top header row:
  - Back button
  - Game title
- Optional subtitle (game-specific instruction)
- Content area: the game UI itself
- Consistent spacing and safe areas

Common behaviors:
- If the user presses back mid-run: show confirm modal “Quit this game?”; quitting does not record a result.
- On completion: navigate to Result screen with:
  - score (if any)
  - accuracy (0–1)
  - elapsed time
  - game-specific details

### C) Reading Exercise (Reading + Comprehension)
Goal: timed reading, then comprehension check, then Result with WPM.

Phases:
1) Idle/Setup:
   - Title: Reading Exercise
   - Show passage title/metadata (duration estimate, difficulty label)
   - “Start” button
2) Reading:
   - Passage text in a clean reader view
   - Timer running
   - Controls:
     - “Finish” button (ends reading)
3) Question:
   - Multiple-choice question (single correct)
   - Options as tappable cards
   - “Submit” button
4) Completion:
   - Navigate to Result with WPM + comprehension correctness

WPM calculation:
- Use wordCount and elapsed time for WPM.
- Result should show:
  - WPM prominently
  - Time spent
  - Comprehension: Correct/Incorrect

### D) Result
Goal: make the result satisfying, clear, and actionable.

Layout:
- Hero metric:
  - If reading exercise: big WPM number + “WPM”
  - If game: big Score number (or % accuracy if more meaningful) + label
- Secondary stats row:
  - Time
  - Accuracy (if provided)
  - Additional details (words found, rounds, mistakes, etc.)
- Star rating / achievement:
  - Derive a 1–5 star display (use either accuracy thresholds or progress-derived stars; be consistent and specify the rule you choose)
- “Recent Progress” mini chart (line chart, last N attempts)
- Actions:
  - Primary: Play Again
  - Secondary: Home

Microcopy:
- Positive reinforcement based on performance (e.g., “Great focus!” / “Try again to beat your best!”).

### E) History
Goal: show progress over time, highlight streaks, and allow clearing.

Layout:
- Header: “History” + back button
- Summary stats cards:
  - Total training time
  - Average speed (WPM) or average score (depending on content)
- Main chart card:
  - Tabs or segmented control:
    - “Charts” (line chart for WPM/Score over time)
    - “List” (chronological attempt list)
- Attempt list item:
  - Activity name (game name or passage title)
  - Date/time
  - Primary metric (WPM or Score)
  - Secondary: accuracy/comprehension, duration
- “Clear History” destructive action with confirmation modal

States:
- Empty history: show illustration + CTA back to Home.

## 7) Game-by-Game Detailed Mechanics (must map to UI states, controls, scoring, feedback)

For every game, design:
- Idle/Intro screen: description, Level + Stars, Start button
- Running screen: stats row + gameplay + feedback cues
- End screen: summary + Level/Stars + Play Again
- Difficulty display derived from level: Easy/Medium/Hard
- A consistent visual language for: time pressure, correctness feedback, errors/mistakes, progress.

### 1) Power Read (PowerReader)
Core mechanic:
- RSVP-style word chunk flashing from an article.
- User picks an intensity preset:
  - Beginner / Intermediate / Advanced (higher WPM + larger chunk size)
- Game shows word chunks at an interval based on target WPM and chunk size.
- Ends when article completes.
Scoring:
- Score = achieved WPM (computed from wordsRead and elapsed time).
Accuracy:
- Always 100% (completion-based).
UI requirements:
- Big central word/chunk display.
- Controls: Start, Pause/Resume (if you include it, specify), End.
- Progress indicator: chunks shown / total.
- End summary: WPM, words read, intensity.

### 2) Flash Reading (FlashReading)
Mechanic:
- Show a word/short phrase briefly, then user recalls/chooses the correct one.
- 5 rounds.
- Difficulty config:
  - Easy: 500ms flash
  - Medium: 200ms flash
  - Hard: 200ms + masking overlay
Scoring:
- +20 per correct.
Accuracy:
- correct / rounds.
Progression:
- Difficulty can auto-adjust locally based on streak (5 correct up, 3 wrong down); still show global Level/Stars as the overarching progression.
UI:
- Phase-based: Idle → Flash → Recall (4-option choices) → Feedback → Next round.
- Strong “flash” animation and feedback (haptic suggestion).

### 3) Comprehension Test
Mechanic:
- Read a passage, then answer multiple questions.
Phases:
- Idle → Reading → Questions → End
Scoring:
- +25 per correct answer.
Accuracy:
- correctCount / questionsTotal
UI:
- Reader view for passage.
- Question cards with multiple-choice answers.
- Clear progress indicator (question X of N).

### 4) Timed Word Recognition
Mechanic:
- Show a word for a brief time, then user chooses the seen word from 4 options.
Scoring:
- +10 per correct.
Accuracy:
- correct / rounds
Success:
- accuracy ≥ 70% considered “success” for progression.
UI:
- Show phase: “Memorize” (countdown) → choices grid.
- Display time depends on difficulty.

### 5) Timed Phrase Recognition
Mechanic:
- Similar to word recognition but with phrases.
- 5 rounds, ~500ms display.
Scoring:
- +20 per correct.
Accuracy:
- correct / rounds

### 6) Letter Recognition
Mechanic:
- A grid of letters; user must tap all occurrences of a target letter.
Difficulty mapping:
- Easy: 4x4 grid, 3 targets, 30s
- Medium: 5x5, 5 targets, 25s
- Hard: 6x6, 8 targets, 20s
Scoring (per round):
- (correct*10) − (wrong*5) − (missed*5), floored at 0
Flow:
- New round auto-generated after completion.
- Auto-submit when all targets selected with no wrong selections.
Accuracy:
- correct / (rounds * targetCount)
Success:
- accuracy ≥ 70%
UI:
- Target letter prominently displayed.
- Grid cells with selected states.
- Clear feedback for wrong taps (shake + red outline).

### 7) Text Search
Mechanic:
- User taps every occurrence of a target word within a paragraph.
Difficulty selectable on idle:
- Easy: no time limit, show total count
- Medium: 30s, show total count
- Hard: 20s, hide total count
Scoring:
- foundCount * 10
Accuracy:
- found / totalTargets
End:
- when all found or time runs out
UI:
- Target word badge.
- Paragraph with tappable word tokens (found state highlights).
- In hard mode, do not show “X total”.

### 8) Word Search
Mechanic:
- A letter grid hides one word horizontally in a random row.
- User can tap any single letter that belongs to the hidden word to “solve” it.
- After a correct tap, it immediately loads a new word (same difficulty).
Difficulty by level:
- Easy: 6x6, 90s
- Medium: 8x8, 60s
- Hard: 10x10, 45s
Scoring:
- +10 per found word
Accuracy:
- Always 100% (completion-based within time)
UI:
- “Find this word: WORD”
- Grid of letters; tapping correct letter triggers celebratory highlight (mark the full word cells as found).
- Continuous mode until timer ends.
End:
- shows Words Found and Score.

### 9) Eye Movement Training
Mechanic:
- A dot/highlight moves across a grid; user follows with eyes (no tapping required).
Difficulty:
- Easy: 3x3, 10 rounds, 900ms per move
- Medium: 3x3, 15 rounds, 700ms
- Hard: 4x4, 20 rounds, 500ms
Scoring:
- rounds * 10
Accuracy:
- Always 100%
UI:
- Calm instruction, minimal distractions.
- Animated highlight; optional “I’m ready” start.

### 10) Visual Span Expansion
Mechanic:
- Show a digit sequence briefly, then user types it.
Difficulty:
- Start length 4/6/8 and display 1500/1200/1000ms (easy/medium/hard).
Flow:
- If correct: level increments, sequence length grows, continue.
- If wrong: game ends immediately.
Scoring:
- score += level * 10 per correct round
Accuracy:
- attempts-based (treat as “streak performance”; also show maxLevel reached)
Success:
- accuracy ≥ 70%
UI:
- Big digits display phase → keypad input phase.
- Clear “Next level” animation.

### 11) Memory Recall
Mechanic:
- Similar to Visual Span but input via keypad taps.
Flow:
- Continue until first mistake.
Scoring:
- score += level * 10 per correct
UI:
- Emphasize “memory streak” and max level achieved.

### 12) Number Recognition
Mechanic:
- A stream of digits appears; user taps MATCH or NO depending on whether the current digit matches the target digit.
- Target changes after a correct MATCH.
Timing:
- ~20s session, fixed-length stream.
Scoring:
- +10 per correct
Accuracy:
- correct / attempts
UI:
- Target digit badge + current digit large.
- Two large buttons: MATCH / NO.

### 13) Symbol Recognition
Mechanic:
- Same as Number Recognition but with symbols and fixed target.
Scoring:
- +10 per correct
UI:
- Target symbol badge + current symbol large.

### 14) Pattern Scanning
Mechanic:
- Grid of symbols; find and tap all instances of a target symbol.
Difficulty:
- Grid size 4/5/6
- Duration 45/35/30s
- Target density increases by difficulty
Flow:
- When all targets found in a round, auto-start next round with new target; totalFound accumulates.
Scoring:
- +10 per correct find
Success:
- totalFound ≥ 3
UI:
- Target pattern display.
- Grid with tappable symbols; found state highlights.

### 15) Word Mismatch Grid
Mechanic:
- Multiple “cards” each representing a word pair; user selects cards where the pair is different (mismatch).
Difficulty:
- 4/6/8 cards; 35/30/25s
Flow:
- Auto-submit when all mismatches selected with no wrong selections.
Scoring (per round):
- correctSelections − wrongSelections − missedMismatches (floored at 0)
Accuracy:
- based on score per round and mismatch count; treat it as performance quality.
Success:
- accuracy ≥ 70%
UI:
- Card grid; each card shows two words; selection state.
- Clear mismatch rule explanation and feedback.

### 16) Word Pairs
Mechanic:
- Antonym matching multiple-choice.
Timing:
- 30s
Scoring:
- +1 per correct
Accuracy:
- correct / attempts
UI:
- Prompt word and four options; fast tap flow; show remaining time.

### 17) Schulte Table (Numbers)
Mechanic:
- Tap numbers 1 → N in order as fast as possible.
Difficulty:
- Easy 4x4, Medium 5x5, Hard 7x7
Scoring:
- Score = total cells (completion-based)
Accuracy:
- total / (total + mistakes) where mistakes are wrong taps
Success:
- accuracy ≥ 70%
UI:
- Stats: Next number, Progress (tapped/total), Errors
- Grid with responsive cell sizing; tapped cells lock/turn completed color.

### 18) Schulte Letters
Mechanic:
- Tap letters A → (last letter) in order.
Difficulty:
- Easy 4x4, Medium 5x5, Hard 7x7 (using A…)
Scoring/Accuracy:
- Same structure as Schulte Numbers (mistakes penalize accuracy)
UI:
- Stats: Next letter, Progress, Errors
- Completed letters lock.

### 19) Schulte Mix
Mechanic:
- Mixed grid of numbers and letters; user must alternate: 1, A, 2, B, 3, C…
Sequence:
- Interleaves numbers and letters until all are completed.
Difficulty:
- Easy 4x4, Medium 5x5, Hard 7x7
Scoring/Accuracy:
- Completion-based score; accuracy penalized by mistakes like other Schulte games.
UI:
- “Next” indicator shows whether next is a number or letter.
- Cells visually distinguish number vs letter.

### 20) Letter Jumble
Mechanic:
- User sees a jumbled word and types the correct word.
- Optional Hint reveals first and last letters.
Timing:
- 60s default
Scoring:
- +1 per correct word
Accuracy:
- correct / attempts (attempt increments on submit or skip)
Success:
- accuracy ≥ 70%
UI:
- Jumbled letters displayed large with letter spacing.
- Input field (auto-focus), Submit button, Skip button, Hint button.
- End shows “Words solved” and accuracy.

### 21) Even Numbers
Mechanic:
- User classifies numbers as EVEN or ODD as fast as possible.
Difficulty:
- Easy: maxNumber 20, 30s
- Medium: maxNumber 99, 20s
- Hard: maxNumber 999, 15s
Scoring:
- Correct: +10
- Wrong: −5 (floored at 0)
Combo:
- Track consecutive correct; reset on wrong; highlight high combo.
Accuracy:
- correctCount / attempts
Success:
- accuracy ≥ 70%
UI:
- Big number card; two huge buttons EVEN/ODD.
- Immediate feedback flash: green/red border; subtle shake on wrong.

### 22) Number Search
Mechanic:
- User must find a target number in a grid; tapping cells counts as attempts.
- On correct: increments score by 1 and regenerates a new grid/target.
- On wrong: shows brief wrong feedback but keeps the same grid.
Timing:
- 45s default
Grid:
- Default 5x5 (configurable)
Scoring:
- score = number of correct finds
Accuracy:
- score / attempts
UI:
- Target number card (with feedback highlight correct/wrong).
- Grid with uniform cells and strong tap affordance.

## 8) Cross-Cutting UX Details (apply everywhere)
- Feedback system:
  - Correct: quick color flash + subtle haptic suggestion + microcopy (“Nice!”)
  - Wrong: red outline + brief shake + optional haptic error
- Timers:
  - Show remaining time in seconds (or 0.1s for very short games if you choose).
  - When time is nearly up (<5s), animate the timer pill.
- End screens:
  - Always show key stats + Level/Stars + Play Again.
  - If a game is completion-based, show elapsed time prominently (Schulte).
- Consistency:
  - Keep stat pills in a consistent row style across games.
  - Keep primary action button placement consistent.
- Safety:
  - Confirm dialogs for quitting mid-run and destructive actions (clear history/reset difficulty).
- Edge cases:
  - Auto-start mode exists (some games may launch immediately). Design should still show a minimal “Get ready” micro-state (1s) to avoid confusion.

## 9) Figma Deliverables (what to produce)
Provide:
- A site map / flow diagram (textual is fine)
- Full screen designs for:
  - Home
  - Game Shell template + at least 4 representative game screens (grid-based, input-based, choice-based, reader-based)
  - Reading Exercise phases
  - Result
  - History (charts + list)
  - Confirm modals
- Component library with variants and states
- Token table (colors, gradients, typography, spacing)
- Interaction notes: transitions, animations, and micro-interactions

Output format:
- Use structured headings and bullet lists.
- Be specific: sizes, spacing, component hierarchy, and state transitions.
- Include clear “what happens when user taps X” for each interactive element.
