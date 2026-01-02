**Timed Phrase Recognition – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** Timed Phrase Recognition

**Purpose:**
Timed Phrase Recognition trains rapid recognition of short phrases under strict timing to strengthen **reading fluency**, **chunking**, and **comprehension at speed**.

**Primary Goals:**
- Improve phrase-level recognition speed.
- Strengthen chunk-based processing.
- Maintain accuracy and meaning extraction.

---

**Page 2: Cognitive Skills Trained**

- Phrase parsing and chunking.
- Working memory integration.
- Attention stability.
- Decision speed.

---

**Page 3: Core Mechanics**

**Trial loop:**
1. Display phrase briefly.
2. Hide phrase.
3. Prompt recognition task:
   - Choose correct phrase among distractors.
   - Answer a detail question.
   - Reconstruct phrase order.

---

**Page 4: Session Flow**

1. Choose difficulty (duration, phrase complexity).
2. Instructions.
3. Countdown.
4. Trials present.
5. User responds.
6. Feedback.
7. Adaptation.
8. Summary.

---

**Page 5: UI/UX Layout (Flash + MCQ Recognition)**

**ASCII:**
```
┌─────────────────────────────┐
│ Phrase Recognition  00:40 ✕ │
├─────────────────────────────┤
│ Trial 5/20   Level 3        │
├─────────────────────────────┤
│ (flash) “in the long run”   │
├─────────────────────────────┤
│ Which did you see?          │
│  ○ in the long run          │
│  ○ in the wrong run         │
│  ○ on the long run          │
│  ○ in the long rung         │
├─────────────────────────────┤
│          [ Submit ]         │
└─────────────────────────────┘
```

---

**Page 6: UI/UX Layout (Reconstruction Mode)**

**Behavior:**
- Show shuffled words.
- User taps in order.

**ASCII:**
```
┌─────────────────────────────┐
│ Reconstruct        00:18 ✕  │
├─────────────────────────────┤
│ Tap words in order:         │
│ [long] [run] [the] [in]     │
│ Selected: in • the • …      │
├─────────────────────────────┤
│          [ Submit ]         │
└─────────────────────────────┘
```

---

**Page 7: Scoring and Reaction Time**

| Event | Points |
|------|--------|
| Correct recognition | +10 |
| Incorrect | -5 |
| Timeout | -3 |
| Fast bonus | +0–5 |
| Streak multiplier | x1.1–x2 |

Track:
- Flash duration.
- Response time post-flash.

---

**Page 8: Adaptive Difficulty**

Adjust:
- Flash duration.
- Phrase length.
- Distractor similarity (edit distance).
- Question type frequency.

Rules:
- High accuracy → reduce duration and increase similarity.
- Low accuracy → increase duration and simplify.

---

**Page 9: Feedback System**

- Correct: highlight and check.
- Incorrect: show correct phrase and where user went wrong.
- Coaching: “Focus on phrase anchors (first/last word).”

Audio optional.

---

**Page 10: Accessibility**

- Longer flash duration option.
- High contrast.
- Reduced motion.
- Non-color-only correctness indicators.
- Screen reader: announce controls but not the flashed phrase during flash.

---

**Page 11: Session Analytics**

- Accuracy.
- Median response time.
- Best streak.
- Difficulty progression.

---

**Page 12: Gamification**

- Badges for speed thresholds.
- Daily challenge: maintain accuracy at a chosen duration.

---

**Page 13: Thorough Acceptance Criteria**

**AC-1 Flash Timing**
- Given a trial begins, when the phrase is flashed, then it is visible for the configured duration.

**AC-2 Recognition**
- Given options are shown, when the user selects an option and submits, then the selection is evaluated and correctness feedback shown.

**AC-3 Reconstruction**
- Given reconstruction mode, when the user taps words and submits, then the reconstructed order is evaluated.

**AC-4 Adaptation**
- Given high accuracy, when next trials generate, then flash duration decreases or distractors become more similar.

**AC-5 Accessibility**
- Given longer-duration mode is enabled, when phrases flash, then the longer duration is used.

---

**Page 14: Testing Scenarios and Edge Cases**

Testing:
- Flash duration precision.
- Distractor similarity generation.
- Reconstruction evaluation.

Edge cases:
- Very long phrases.
- Multi-language phrases.
- Backgrounding mid-trial.

---

**Page 15: Performance + Implementation Guidance**

- Precompute phrase sets and distractors.
- Avoid expensive diffs until submit.
- Track timings at key events only.

**Summary:**
Timed Phrase Recognition accelerates phrase chunking under strict timing with adaptive difficulty and thorough acceptance criteria.

---

[End of Timed Phrase Recognition Full 15-Page Documentation]
