**Eye Movement Training – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** Eye Movement Training

**Purpose:**
Eye Movement Training develops efficient visual behavior (saccades and fixation control) to support faster reading and scanning. Users practice shifting gaze between targets smoothly, reducing unnecessary regressions and improving attentional control.

**Primary Goals:**
- Improve saccade speed and accuracy.
- Reduce fixation duration through controlled practice.
- Strengthen gaze shifting and attentional switching.

**Session Duration:**
- 2–5 minutes per session.

---

**Page 2: Cognitive and Perceptual Principles**

- Saccades are rapid eye movements between fixation points.
- Efficient reading relies on controlled saccades and stable fixations.
- Training can increase confidence in peripheral intake and reduce backtracking.

---

**Page 3: Core Exercise Variants**

1) **Tap-the-Target:**
- Targets appear at different screen positions.
- User taps target quickly.

2) **Follow-the-Sequence:**
- Targets labeled 1..N.
- User taps in order.

3) **Anti-saccade (Advanced):**
- Target flashes on one side; user must tap opposite side.

4) **Smooth pursuit imitation (Optional):**
- Target moves; user follows and periodically confirms position.

---

**Page 4: Step-by-Step Flow**

1. Mode selection + difficulty.
2. Instruction screen with a short demo.
3. Countdown.
4. Targets appear in timed sequence.
5. User taps targets.
6. System captures reaction time + accuracy.
7. Feedback after each tap or batch.
8. Adaptive difficulty updates spacing/speed.
9. Session ends after time or count.

---

**Page 5: UI/UX Layout (Tap-the-Target)**

**Regions:**
- Top bar: title, timer, pause/exit.
- Playfield: full-screen area where targets appear.
- Bottom strip: score + streak + level.

**ASCII Layout:**
```
┌─────────────────────────────┐
│ Eye Movement        00:30 ✕ │
├─────────────────────────────┤
│                             │
│      ● Target               │
│                             │
│                 ●           │
│                             │
├─────────────────────────────┤
│ Score: 40  Streak: 4  L2    │
└─────────────────────────────┘
```

Target design guidance:
- Large enough for touch.
- Non-color-only cue (shape + label).

---

**Page 6: UI/UX Layout (Sequence Mode)**

Targets appear with numbers; user taps 1 then 2 then 3.

**ASCII:**
```
┌─────────────────────────────┐
│ Sequence            00:20 ✕ │
├─────────────────────────────┤
│    (1)                      │
│                 (3)         │
│          (2)                │
├─────────────────────────────┤
│ Next: 1     Errors: 0       │
└─────────────────────────────┘
```

---

**Page 7: Scoring and Timing**

Per-tap metrics:
- Reaction time from target appearance to tap.
- Tap accuracy (correct target vs wrong).

Example scoring:
| Event | Points |
|------|--------|
| Correct tap | +5 |
| Wrong tap | -3 |
| Timeout | -2 |
| Fast reaction bonus | +0–3 |
| Streak bonus | +1 per 5 correct |

---

**Page 8: Adaptive Difficulty**

Adjust:
- Distance between successive targets.
- Target size.
- Display time / timeout.
- Distractors (optional).

Adaptive rules:
- High accuracy + fast RT → increase distance, reduce size slightly, reduce timeout.
- Low accuracy → increase size, reduce distance, increase timeout.

---

**Page 9: Feedback System**

- Correct: brief highlight on target.
- Wrong: shake indicator or red outline (respect reduce-motion).
- Timeout: subtle “missed” indicator.

Optional audio cues with toggle.

---

**Page 10: Accessibility**

- Larger target mode.
- High contrast mode.
- Color-blind safe feedback (shape/icon/text).
- Reduced motion option.
- Screen reader: announce start/end; avoid announcing live target locations (would spoil).

---

**Page 11: Session Analytics**

Summary metrics:
- Accuracy.
- Median reaction time.
- Slowest/fastest quartiles.
- Streak max.
- Heatmap of misses (optional).

---

**Page 12: Gamification**

- Daily goal: “Complete 3 sessions”.
- Badges: “Lightning Tap” (median RT under threshold).
- Streaks for consecutive perfect taps.

---

**Page 13: Thorough Acceptance Criteria**

**AC-1 Start/End**
- Given the user is on the start state, when Start is pressed, then the timer starts and the first target appears.
- Given time reaches 0, when the session ends, then an end summary is shown and no further taps affect score.

**AC-2 Correct Tap**
- Given a target is active, when the user taps the target, then a correct event is recorded, score increases, and the next target is scheduled.

**AC-3 Wrong Tap**
- Given a target is active, when the user taps outside the target (or wrong target in sequence mode), then an incorrect event is recorded and score decreases.

**AC-4 Timeout**
- Given a target is active, when the timeout is reached without a tap, then a timeout event is recorded and the next target appears.

**AC-5 Accessibility**
- Given larger-target mode is enabled, when targets render, then target hit area is increased while maintaining layout stability.

---

**Page 14: Testing Scenarios and Edge Cases**

Testing:
- Reaction time correctness.
- Sequence order enforcement.
- Pause/resume behavior.
- Reduced-motion feedback.

Edge cases:
- Very small screens.
- Multi-touch events.
- App background mid-target.

---

**Page 15: Performance + Implementation Guidance**

- Use a single timer scheduler rather than multiple intervals.
- Avoid re-rendering the full playfield; only update active target.
- Record events in a lightweight array.

**Summary:**
Eye Movement Training improves saccade control and visual switching with simple, measurable interactions and strong acceptance criteria.

---

[End of Eye Movement Training Full 15-Page Documentation]
