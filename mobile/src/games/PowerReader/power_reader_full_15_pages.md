**PowerReader – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** PowerReader

**Purpose:**
PowerReader is a multi-skill reading training module combining **flash reading**, **visual span expansion**, and **comprehension reinforcement**. It is designed as a “primary workout” that blends speed and understanding rather than training one micro-skill in isolation.

**Primary Goals:**
- Increase reading throughput (speed) while maintaining comprehension.
- Train peripheral intake and reduce fixation count.
- Improve recall through brief, structured checks.

**Session Duration:**
- Quick workout: 3–5 minutes.
- Full workout: 7–12 minutes.

---

**Page 2: Cognitive Skills Trained**

- Visual span / peripheral processing.
- Attentional control and resistance to distraction.
- Working memory integration across chunks.
- Comprehension consolidation (micro-questions / recall prompts).

**Training Principle:**
Progress comes from repeatedly presenting “just challenging enough” chunks, validating comprehension, and adapting cadence and chunk size based on performance.

---

**Page 3: Session Structure (Workout Blocks)**

PowerReader is structured into blocks:
1. **Warm-up:** short phrases at moderate cadence.
2. **Main sets:** chunked phrases/sentences at higher cadence.
3. **Comprehension checks:** intermittent micro-questions.
4. **Cooldown:** slightly reduced cadence with accuracy focus.

**Block Flow:**
- Present chunk → user confirms readiness or answers quick prompt → adapt cadence.

---

**Page 4: Core Mechanics (Chunk Presentation)**

**Chunk Types:**
- Single word.
- 2–4 word chunk.
- Full sentence (advanced).

**Presentation Modes:**
- RSVP (Rapid Serial Visual Presentation): center flashes.
- Chunk cards: a chunk displayed until timeout.

**Response Types:**
- Tap “Got it” (confidence signal).
- Answer a micro-question.
- Recall keywords.

---

**Page 5: Scoring and Progress Metrics**

**Core Metrics:**
- Cadence achieved (chunks/min, words/min estimate).
- Accuracy on comprehension checks.
- Consistency (variance of response times).

**Score (Example):**
| Event | Points |
|------|--------|
| Successful chunk confirmation | +2 |
| Correct comprehension check | +10 |
| Incorrect comprehension check | -5 |
| Streak bonus | +1 per consecutive correct check |

**Validation Rule:**
Speed estimates are only “validated” if comprehension accuracy stays above a threshold.

---

**Page 6: Adaptive Difficulty Logic**

Adapt these dimensions:
- Chunk size (words per chunk).
- Display duration.
- Complexity of text.
- Frequency of comprehension checks.

**Adaptive Rules (Example):**
- If last 5 comprehension checks ≥ 80% and response times stable → increase chunk size or reduce duration.
- If comprehension drops < 60% → decrease chunk size or slow cadence.

---

**Page 7: UI/UX Layout (Workout Screen)**

**Regions:**
- Top: Title, timer, pause.
- Progress row: current block, chunk count.
- Center: chunk display card.
- Bottom: primary response buttons.
- Feedback overlay: correct/incorrect, pace info.

**ASCII Layout:**

```
┌─────────────────────────────┐
│ PowerReader         03:10 ✕ │
├─────────────────────────────┤
│ Block: Main Set 2   12/40    │
├─────────────────────────────┤
│          CHUNK              │
│   “expand your visual span” │
├─────────────────────────────┤
│ [ Got it ]   [ Not sure ]   │
│                             │
│ Pace: 260 wpm (validated)   │
└─────────────────────────────┘
```

---

**Page 8: UI/UX Layout (Comprehension Check Screen)**

**Question Styles:**
- Multiple choice.
- Fill-in-the-blank keyword.
- True/False.

**Rules:**
- Must be answerable from recent chunks.
- Clear countdown indicator.

**ASCII Layout:**

```
┌─────────────────────────────┐
│ Comprehension Check   00:12 │
├─────────────────────────────┤
│ What was the main topic?    │
│  ○ Visual span              │
│  ○ Math facts               │
│  ○ Geography                │
│  ○ Music theory             │
├─────────────────────────────┤
│        [ Submit ]           │
└─────────────────────────────┘
```

---

**Page 9: Feedback System**

- Correct: green + check + “Nice! Keep pace.”
- Incorrect: red + cross + “Slow slightly for accuracy.”
- Confidence mismatch (user taps “Got it” but fails check): show coaching.

Audio cues optional; must be toggleable.

---

**Page 10: Accessibility Requirements**

- Font scaling; chunk card reflows gracefully.
- High-contrast and color-blind safe feedback.
- Reduced motion support.
- Screen reader labels on all controls.
- Optional “Longer display time” setting.

---

**Page 11: Session Analytics**

Summary includes:
- Validated speed estimate.
- Comprehension accuracy.
- Best streak.
- Block-by-block breakdown.

Suggested per-block record:
- chunkSize, durationMs, accuracy, pace.

---

**Page 12: Gamification**

- Daily workout streak.
- Badges for validated pace thresholds.
- Achievements for “accuracy under speed.”
- Weekly challenge: complete 3 full workouts.

---

**Page 13: Thorough Acceptance Criteria**

**AC-1 Start/Timer:**
- Given the user is on the PowerReader start state, when Start is pressed, then the first chunk is shown and the timer starts.

**AC-2 Chunk Progression:**
- Given a chunk is shown, when the display duration elapses (or user confirms), then the next chunk is shown and progress increments.

**AC-3 Comprehension Checks:**
- Given the session reaches a check interval, when a comprehension check is triggered, then the chunk display pauses and a question UI is shown.

**AC-4 Scoring:**
- Given a correct check answer, when submitted, then score increases and accuracy increases.
- Given an incorrect answer, then score decreases (or does not increase) and coaching feedback appears.

**AC-5 Adaptation:**
- Given recent accuracy is high, when adaptation runs, then either chunk size increases or duration decreases.
- Given recent accuracy is low, then chunk size decreases or duration increases.

**AC-6 Accessibility:**
- Given color-blind mode, when feedback is shown, then icons/text convey correctness without relying on color.

---

**Page 14: Edge Cases and Testing Scenarios**

**Edge Cases:**
- Empty content set.
- Very long sentence chunks.
- Rapid pause/resume.
- App background/foreground mid-block.

**Testing Scenarios:**
- Timer accuracy.
- Chunk transitions at high cadence.
- Check trigger frequency.
- Accessibility label coverage.

---

**Page 15: Performance Optimization and Implementation Guidance**

**Performance:**
- Precompute chunk sequences.
- Avoid expensive layout recalculations per frame.
- Keep transitions simple; limit animations.

**Implementation Guidance:**
- Separate: content generation, adaptation, scoring, UI rendering.
- Persist session summary for history screen integration.

**Summary:**
PowerReader is a blended speed+comprehension workout with adaptive pacing, clear UI, and validated metrics.

---

[End of PowerReader Full 15-Page Documentation]
