**Number Recognition – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** Number Recognition

**Purpose:**
Number Recognition trains rapid identification and discrimination of numeric stimuli to improve **numerical cognition**, **attention**, and **processing speed**. Users respond to numbers presented sequentially or in grids.

**Primary Goals:**
- Improve speed of recognizing digits and multi-digit numbers.
- Reduce confusion between similar numbers (6/9, 1/7, etc.).
- Build accuracy under time pressure.

---

**Page 2: Cognitive Skills Trained**

- Number recognition and encoding.
- Selective attention.
- Visual discrimination.
- Decision speed.

---

**Page 3: Core Variants**

1) **Target Match:**
- Target number displayed; user taps “Match” if current equals target.

2) **Compare (Greater/Less):**
- Show two numbers; user selects which is larger.

3) **Grid Find:**
- Show grid containing target numbers; user taps all matches.

---

**Page 4: Step-by-Step Flow**

1. Choose mode and difficulty.
2. Instructions.
3. Countdown.
4. Present trials.
5. Capture response and reaction time.
6. Immediate feedback.
7. Adaptive difficulty updates.
8. Summary.

---

**Page 5: UI/UX Layout (Sequential Target Match)**

**ASCII:**
```
┌─────────────────────────────┐
│ Number Recognition   00:25 ✕│
├─────────────────────────────┤
│ Target:  37   Streak: 3     │
├─────────────────────────────┤
│            73               │
├─────────────────────────────┤
│ [ Match ]        [ No ]     │
└─────────────────────────────┘
```

---

**Page 6: UI/UX Layout (Compare Mode)**

**ASCII:**
```
┌─────────────────────────────┐
│ Compare Numbers     00:18 ✕ │
├─────────────────────────────┤
│ Which is larger?            │
│   [  48  ]    [  84  ]      │
├─────────────────────────────┤
│ Tap the larger number       │
└─────────────────────────────┘
```

---

**Page 7: Scoring and Timing**

| Event | Points |
|------|--------|
| Correct | +10 |
| Incorrect | -5 |
| Timeout | -3 |
| Fast bonus | +0–5 |

Track reaction time for each trial.

---

**Page 8: Adaptive Difficulty**

Adjust:
- Number range (1–20 → 1–5000).
- Digit length (1-digit → 4-digit).
- Similarity of distractors.
- Presentation speed.
- Grid size.

Rules:
- Accuracy ≥ 90% over last 20 → increase range or speed.
- Accuracy < 70% over last 10 → decrease.

---

**Page 9: Feedback System**

- Correct: highlight and check.
- Incorrect: show correct response.
- Coaching: “Watch transposed digits.”

Audio cues optional.

---

**Page 10: Accessibility**

- Large digit display.
- High contrast.
- Color-blind safe feedback.
- Screen reader labels for controls.

---

**Page 11: Session Analytics**

- Accuracy.
- Median reaction time.
- Error categories: transposition, confusion pairs.
- Highest level reached.

---

**Page 12: Gamification**

- Badges: “No Mistakes at Level 5”.
- Daily goal: N trials.
- Streak-based multipliers.

---

**Page 13: Thorough Acceptance Criteria**

**AC-1 Start**
- Given the user is not started, when Start is pressed, then the first trial appears and the timer begins.

**AC-2 Correctness**
- Given a trial is active, when the user selects the correct response, then score increases and the next trial is shown.

**AC-3 Timeout**
- Given a trial has a timeout, when the user does not respond before timeout, then the trial is marked timeout and proceeds.

**AC-4 Adaptation**
- Given high accuracy, when adaptation applies, then the next trials use higher range or faster speed.

**AC-5 Accessibility**
- Given high contrast mode, when numbers display, then digits remain readable and feedback remains distinguishable without relying solely on color.

---

**Page 14: Testing Scenarios and Edge Cases**

Testing:
- Compare mode correctness.
- Grid evaluation.
- Timer precision.

Edge cases:
- Very large numbers.
- Small screens.
- Rapid repeated taps.

---

**Page 15: Performance + Implementation Guidance**

- Precompute trial sets.
- Keep scoring and adaptation pure.
- Avoid heavy layout churn.

**Summary:**
Number Recognition improves numeric discrimination and reaction speed with adaptive range and thorough acceptance criteria.

---

[End of Number Recognition Full 15-Page Documentation]
