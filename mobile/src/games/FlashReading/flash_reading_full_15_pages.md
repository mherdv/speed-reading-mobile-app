**Flash Reading – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** Flash Reading

**Purpose:**
Flash Reading trains rapid intake of words and short phrases by flashing content briefly at the center of the screen. It develops **processing speed**, **attention stability**, and the ability to extract meaning quickly.

**Primary Goals:**
- Increase speed of word/phrase recognition.
- Improve stability of attention under fast presentation.
- Maintain comprehension under higher rates.

**Session Duration:**
- 2–6 minutes.

---

**Page 2: Cognitive Skills Trained**

- Rapid visual processing.
- Lexical access and phrase parsing.
- Attentional control.
- Working memory integration across flashes.

---

**Page 3: Core Mechanics**

**Basic loop:**
1. Show fixation cue or blank.
2. Flash word/phrase for a duration.
3. User responds (tap/choose/recall).
4. Repeat.

**Presentation styles:**
- RSVP single item.
- Chunked phrases.

---

**Page 4: Session Flow**

1. Select level (speed + chunk size).
2. Instruction screen explains response mapping.
3. Countdown.
4. Flash stream begins.
5. User interacts per chosen mode:
   - “Next” tap to acknowledge.
   - Occasional comprehension checks.
   - Recall prompts.
6. Score and feedback updates.
7. Adaptive difficulty.
8. Summary screen.

---

**Page 5: UI/UX Layout (RSVP Mode)**

**Regions:**
- Top: timer, progress, streak.
- Center: flash card.
- Bottom: response controls.

**ASCII:**
```
┌─────────────────────────────┐
│ Flash Reading       00:22 ✕ │
├─────────────────────────────┤
│ 15/60   Level 3   Streak: 6 │
├─────────────────────────────┤
│           WORD              │
│         “momentum”          │
├─────────────────────────────┤
│ [ Got it ]  [ Not sure ]    │
└─────────────────────────────┘
```

---

**Page 6: UI/UX Layout (Comprehension Check)**

After N flashes, prompt a micro-question.

**ASCII:**
```
┌─────────────────────────────┐
│ Quick Check         00:10 ✕ │
├─────────────────────────────┤
│ Which word appeared?        │
│  ○ momentum                 │
│  ○ monument                 │
│  ○ moment                   │
│  ○ mountain                 │
├─────────────────────────────┤
│        [ Submit ]           │
└─────────────────────────────┘
```

---

**Page 7: Scoring System**

Example:
| Event | Points |
|------|--------|
| Correct check | +10 |
| Incorrect check | -5 |
| “Got it” tap (confidence) | +1 |
| Confidence mismatch penalty | -2 |
| Streak bonus | multiplier |

Also track:
- Flash duration.
- Reaction time to confirm/answer.

---

**Page 8: Adaptive Difficulty**

Adapt:
- Flash duration.
- Chunk size.
- Similar distractors in checks.
- Check frequency.

Rules:
- High check accuracy and stable responses → reduce duration or increase chunk size.
- Low accuracy → increase duration and add more checks.

---

**Page 9: Feedback System**

- Visual correctness indicator.
- Coaching: “Slow down to maintain accuracy.”
- Optional audio cues.

---

**Page 10: Accessibility**

- Longer flash duration option.
- High contrast.
- Reduce motion.
- Non-color-only feedback.
- Screen reader: announce controls, not flashed content.

---

**Page 11: Session Analytics**

Summary:
- Validated speed (based on check accuracy).
- Accuracy on checks.
- Best streak.
- Duration progression.

---

**Page 12: Gamification**

- Badges: “Fast & Accurate” milestones.
- Daily challenge: maintain ≥ 80% accuracy at a target duration.

---

**Page 13: Thorough Acceptance Criteria**

**AC-1 Start**
- Given the user is on the start state, when Start is pressed, then the flash stream begins and timer starts.

**AC-2 Flash Timing**
- Given a configured flash duration, when items display, then each item remains visible for that duration (within expected timer precision).

**AC-3 Checks**
- Given the stream reaches a check interval, when a check appears, then the stream pauses and resumes after check submission.

**AC-4 Scoring**
- Given a correct answer on a check, when scored, then points increase and accuracy updates.

**AC-5 Accessibility**
- Given longer-duration mode, when flashes occur, then the longer duration is used consistently.

---

**Page 14: Edge Cases + Testing**

Edge cases:
- Empty item set.
- Extremely long phrases.
- Background/foreground mid-stream.

Testing:
- Flash duration accuracy.
- Check evaluation correctness.
- Adaptation boundaries.

---

**Page 15: Performance + Implementation Guidance**

- Preload items and checks.
- Keep rendering lightweight.
- Track times via monotonic clock when available.

**Summary:**
Flash Reading develops rapid word/phrase processing via short presentations, validated by comprehension checks and supported by thorough acceptance criteria.

---

[End of Flash Reading Full 15-Page Documentation]
