**Text Search – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** Text Search

**Purpose:**
Text Search is a timed visual scanning exercise designed to strengthen **selective attention**, **visual search efficiency**, and **reading/scanning speed**. Users must locate a target word/phrase (or character pattern) within a field of text as quickly and accurately as possible.

**Primary Goals:**
- Increase scanning speed without sacrificing accuracy.
- Improve ability to find specific information in dense text.
- Strengthen attention switching and inhibition of distractors.

**Session Duration:**
- Quick drill: 2–4 minutes.
- Full session: 5–10 minutes.

---

**Page 2: Cognitive Skills Trained**

- Visual search and selective attention.
- Distractor suppression.
- Rapid pattern recognition.
- Working memory (holding the target while scanning).

**Training Rationale:**
Many real-world tasks (studying, professional reading) require locating specific information quickly; Text Search trains the underlying perceptual and attentional mechanisms.

---

**Page 3: Core Mechanics (High-Level)**

**What the user does:**
- Receives a target (e.g., “photosynthesis”).
- Scans a body of text or a grid of tokens.
- Selects the matching occurrence(s).

**Common Variants:**
1) **Single Target, Single Hit:** find one instance.
2) **Single Target, Multiple Hits:** find all instances.
3) **Multiple Targets:** find several targets in order.
4) **Near-Miss Distractors:** similar-looking words (e.g., “form” vs “from”).

---

**Page 4: Step-by-Step Session Flow**

1. Mode selection (single-hit vs multi-hit).
2. Difficulty selection (text length, distractor similarity).
3. Instruction screen explains selection method.
4. Countdown.
5. Trial begins: target shown at top + text field below.
6. User taps/clicks match(es).
7. System evaluates selection(s), records time.
8. Feedback shown.
9. Adaptive difficulty adjusts parameters.
10. Session ends after N trials or time.
11. Summary screen displays metrics.

---

**Page 5: UI/UX Layout (Single Hit)**

**Regions:**
- Top bar: Title + Exit.
- Target strip: “Find: ______”
- Timer and trial counter.
- Text field: scrollable or paginated.
- Optional hint button (training mode only).

**ASCII Layout:**
```
┌─────────────────────────────┐
│ Text Search          00:40 ✕│
├─────────────────────────────┤
│ Find:  photosynthesis       │
│ Trial 2/10     Streak: 1    │
├─────────────────────────────┤
│ [Scrollable text block…]    │
│ … plants convert light …    │
│ … photosynthesis occurs …   │
│ …                           │
└─────────────────────────────┘
```

**Selection:**
- Tap the word inside the text (tokenized) OR tap a line then pick the word.

---

**Page 6: UI/UX Layout (Multi-Hit / Highlight Mode)**

**Behavior:** user taps multiple matches, then presses Submit.

**ASCII Layout:**
```
┌─────────────────────────────┐
│ Text Search          01:10 ✕│
├─────────────────────────────┤
│ Find ALL:  “the”            │
│ Hits: 3 selected            │
├─────────────────────────────┤
│ … the … [the] … the …       │
│ … [the] … … … [the] …       │
│ … the … …                   │
├─────────────────────────────┤
│        [ Submit ]           │
└─────────────────────────────┘
```

---

**Page 7: Scoring System and Reaction Time**

**Metrics tracked per trial:**
- Time-to-first-hit (ms).
- Total completion time (ms).
- False positives and misses.

**Example scoring:**
| Event | Points |
|------|--------|
| Correct selection | +10 |
| Missed target | -5 |
| False positive | -3 |
| Fast completion bonus | +0–5 |
| Streak multiplier | x1.1–x2 |

**Streak rule:** consecutive perfect trials increase multiplier.

---

**Page 8: Adaptive Difficulty**

Adaptable parameters:
- Text length (short paragraph → long passage).
- Token density and line length.
- Similarity of distractors (near-homographs).
- Target frequency (rare vs common).
- Time pressure (shorter max time).

Example adaptive rules:
- Accuracy ≥ 90% and median time improves → increase text length or distractor similarity.
- Accuracy < 70% → reduce similarity or shorten text.

---

**Page 9: Feedback System**

**Immediate feedback:**
- Correct: highlight selection(s) as correct.
- Incorrect: highlight false positives and show missed locations.

**Audio cues:** optional; must be disable-able.

**Coaching text examples:**
- “Watch for near-miss words: ‘form’ vs ‘from’.”
- “Try scanning line starts for anchors.”

---

**Page 10: Accessibility Requirements**

- Font scaling and line spacing adjustments.
- High contrast mode.
- Color-blind safe feedback (icons + underlines + text labels).
- Screen-reader: target and instructions always readable.
- Optional “Reduce scrolling” mode using pages instead of long scroll.

---

**Page 11: Session Analytics**

Summary includes:
- Accuracy.
- Average time-to-hit.
- False positive rate.
- Best streak.
- Difficulty level progression.

Optional graphs:
- Time-to-hit trend line.
- Error breakdown.

---

**Page 12: Gamification**

- Daily challenge: “Find 10 targets with ≥ 90% accuracy”.
- Badges:
  - “Eagle Eye” (perfect 10 trials).
  - “Speed Scanner” (median time < threshold).

Leaderboards (optional): ranked by speed but only if accuracy above threshold.

---

**Page 13: Thorough Acceptance Criteria (Given/When/Then)**

**AC-1 Start and Target Display**
- Given the user is on the Text Search start state, when Start is pressed, then a target is displayed and the timer begins.

**AC-2 Single Hit Selection**
- Given a single-hit trial is active, when the user selects the correct target occurrence, then the trial is marked correct and completion time is recorded.

**AC-3 Multi-Hit Submission**
- Given a multi-hit trial is active, when the user selects multiple tokens and presses Submit, then the system evaluates all selections and shows correct/missed/false-positive markers.

**AC-4 Scoring Rules**
- Given a correct selection, when the trial completes, then points are added.
- Given a false positive selection, when the trial completes, then points are deducted.

**AC-5 Accessibility**
- Given color-blind mode is enabled, when feedback is shown, then correctness is conveyed via non-color indicators (icons/underline/text).

---

**Page 14: Testing Scenarios and Edge Cases**

Testing scenarios:
- Target present vs absent.
- Multi-hit evaluation accuracy.
- Timing accuracy across devices.
- Very long text handling.
- Keyboard selection support on web.

Edge cases:
- Target is punctuation or whitespace.
- Multiple identical occurrences adjacent.
- App backgrounding mid-trial.

---

**Page 15: Performance Optimization and Implementation Guidance**

Performance tips:
- Tokenize text once per trial.
- Use efficient renderers for large text blocks.
- Avoid per-frame state updates; measure time on key events.

Implementation guidance:
- Separate concerns: content generation, evaluation, scoring, UI.
- Persist per-trial metrics for history.

**Summary:**
Text Search trains fast, accurate scanning with measurable speed and error rates, supported by adaptive difficulty and thorough acceptance criteria.

---

[End of Text Search Full 15-Page Documentation]
