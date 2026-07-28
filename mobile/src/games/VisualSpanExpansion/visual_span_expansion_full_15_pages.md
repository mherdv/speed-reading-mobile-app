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
1. A center cross appears for 650 ms so the eyes can settle.
2. Equal-length words flash at several positions around the cross.
3. The words disappear and one position is marked.
4. The user selects which word occupied that position.

**Stimulus Types:**
- Letters.
- Numbers.
- Short words.
- Symbols.

---

**Page 4: Modes**

1) **Spatial Word Recall (implemented primary mode):**
- Display words around a fixed center.
- Mark one position after the flash.
- User selects that position’s word from equal-length choices that include other
  displayed words.

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
│ Which word was upper right? │
│ [ amber ] [ stone ] [ field ]│
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

Per-trial scoring:
| Event | Points |
|------|--------|
| Correct position | +10 × active positions |
| Incorrect position | -5, never below zero |

**Accuracy:**
- Item-level accuracy and trial-level accuracy.

---

**Page 8: Adaptive Difficulty**

The selected difficulty controls the maximum span, flash duration, choice count,
and spatial spread. A miss temporarily removes one position, down to three.
Three consecutive correct recalls restore one position up to the selected
ceiling. Three consecutive misses end the set after the correction is reviewed.

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
- Position-recall accuracy.
- Final span and presentation duration.
- Consecutive misses and finish reason.

---

**Page 12: Gamification**

- Badges for max span milestones.
- Daily goal: reach or maintain a span for N trials.

---

**Page 13: Thorough Acceptance Criteria**

**AC-1 Fixation + Flash**
- Given a trial starts, the fixation cue appears for 650 ms, then the word
  stimulus remains visible for the difficulty’s configured duration.

**AC-2 Response Capture**
- Given the flash ends, one position is marked and the user selects its word
  from equal-length alternatives.

**AC-3 Scoring**
- A correct position adds points according to the active span.
- A miss deducts five points without producing a negative score.

**AC-4 Adaptation**
- A miss removes one position temporarily.
- Three correct recalls restore one position without exceeding the selected
  difficulty ceiling.

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
Visual Span now uses spatial word-position recall around a central fixation
point. It no longer duplicates keypad Memory Recall’s serial digit mechanic.

---

[End of Visual Span Expansion Full 15-Page Documentation]
