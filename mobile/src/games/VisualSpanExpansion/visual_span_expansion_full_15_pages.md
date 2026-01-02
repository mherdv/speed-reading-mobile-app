**Visual Span Expansion – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** Visual Span Expansion

**Purpose:**
Visual Span Expansion trains the ability to perceive multiple symbols/letters/words in a single fixation, strengthening **peripheral intake** and reducing the number of fixations required for reading.

**Primary Goals:**
- Increase the number of items recognized per glance.
- Improve accuracy of multi-element recognition.
- Train stable fixation and reduce regressions.

---

**Page 2: Cognitive Skills Trained**

- Peripheral vision utilization.
- Visual attention distribution.
- Working memory for short multi-item retention.
- Processing speed.

---

**Page 3: Core Mechanics**

**Trial structure:**
1. Fixation cue appears (center dot or cross).
2. A set of items flashes briefly around center.
3. User responds by selecting/typing what they saw.

**Stimulus Types:**
- Letters.
- Numbers.
- Short words.
- Symbols.

---

**Page 4: Modes**

1) **Flash + Recall (Primary):**
- Display array for a short duration.
- User recalls items in order or selects from choices.

2) **Flash + Multiple Choice:**
- Show 4 options, user chooses which array matched.

3) **Grid Recognition:**
- Show 3x3 or 4x4 briefly; user taps remembered cells.

---

**Page 5: UI/UX Layout (Flash + Recall)**

**Regions:**
- Top: timer, trial counter.
- Center: fixation mark.
- Flash layer: items appear briefly.
- Response area: inputs or selection grid.

**ASCII Layout:**
```
┌─────────────────────────────┐
│ Visual Span         00:25 ✕ │
├─────────────────────────────┤
│ Trial 4/20   Level 3        │
├─────────────────────────────┤
│           +                 │
│   A     7     K             │
│      (flash)                │
├─────────────────────────────┤
│ Recall: [ _ ] [ _ ] [ _ ]   │
│        [ Submit ]           │
└─────────────────────────────┘
```

---

**Page 6: UI/UX Layout (Grid Recognition)**

**ASCII Layout:**
```
┌─────────────────────────────┐
│ Grid Recall        00:18 ✕  │
├─────────────────────────────┤
│ (flash) 3x3 items shown     │
├─────────────────────────────┤
│ Tap the cells you remember  │
│ [ ] [X] [ ]                 │
│ [X] [ ] [ ]                 │
│ [ ] [ ] [X]                 │
├─────────────────────────────┤
│          [ Submit ]         │
└─────────────────────────────┘
```

---

**Page 7: Scoring System**

Per-trial scoring example:
| Event | Points |
|------|--------|
| Correct item | +5 |
| Incorrect item | -2 |
| Perfect trial bonus | +10 |
| Fast response bonus | +0–5 |

**Accuracy:**
- Item-level accuracy and trial-level accuracy.

---

**Page 8: Adaptive Difficulty**

Adjust:
- Number of items shown (span size).
- Flash duration (ms).
- Similarity of distractors.
- Spatial spread of items.

Rules:
- If last 10 trials ≥ 85% item accuracy → add an item or reduce duration.
- If last 5 trials < 70% → remove an item or increase duration.

---

**Page 9: Feedback System**

- Show which items were correct/incorrect.
- For grid: highlight correct cells.
- Provide coaching: “Try focusing on center cross.”

Audio cues optional.

---

**Page 10: Accessibility**

- Reduced motion and longer flash duration option.
- High contrast mode.
- Non-color-only correctness indicators.
- Screen reader: announce trial start/end; avoid reading flash contents.

---

**Page 11: Session Analytics**

Summary:
- Max span achieved.
- Average item accuracy.
- Flash duration progression.
- Reaction time.

---

**Page 12: Gamification**

- Badges for max span milestones.
- Daily goal: reach or maintain a span for N trials.

---

**Page 13: Thorough Acceptance Criteria**

**AC-1 Fixation + Flash**
- Given a trial starts, when the fixation cue is displayed, then the flash stimulus appears after a consistent delay and remains visible for the configured duration.

**AC-2 Response Capture**
- Given the flash ends, when the user enters/selects items and presses Submit, then the system evaluates item correctness and records accuracy.

**AC-3 Scoring**
- Given a correct item, when scoring occurs, then points are added.
- Given an incorrect item, then points are deducted (or not added) according to rules.

**AC-4 Adaptation**
- Given sustained high accuracy, when adaptation is applied, then the span size increases or flash duration decreases.
- Given low accuracy, then span size decreases or flash duration increases.

**AC-5 Accessibility**
- Given longer-flash mode is enabled, when stimuli present, then durations use the longer configuration.

---

**Page 14: Testing Scenarios + Edge Cases**

Testing:
- Flash duration precision.
- Evaluation correctness.
- Adaptation boundaries (min/max span).

Edge cases:
- Extremely short durations.
- Large spans causing overlap.
- Small screens.

---

**Page 15: Performance + Implementation Guidance**

- Precompute stimulus arrays.
- Avoid heavy animations; prefer simple visibility toggles.
- Keep evaluation pure and deterministic.

**Summary:**
Visual Span Expansion trains multi-item recognition per fixation with adaptive span size, robust UI, and thorough acceptance criteria.

---

[End of Visual Span Expansion Full 15-Page Documentation]
