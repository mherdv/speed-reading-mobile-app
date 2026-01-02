**Comprehension Test – Full 15-Page Detailed Documentation**

---

**Page 1: Introduction and Purpose**

**Exercise Name:** Comprehension Test

**Purpose:**
Comprehension Test measures and trains **reading comprehension** under time constraints. Users read a passage (or a set of short passages) and answer questions that assess understanding, inference, recall, and detail recognition.

**Primary Goals:**
- Maintain comprehension while increasing reading speed.
- Improve recall of key details and main ideas.
- Strengthen inference and reasoning from text.

**Session Duration:**
- 3–8 minutes per session.

---

**Page 2: Cognitive Skills Trained**

- Language comprehension.
- Working memory (holding passage meaning).
- Attention to detail.
- Inference making.
- Decision-making under time pressure.

---

**Page 3: Content Types and Question Taxonomy**

**Passage Types:**
- Narrative paragraphs.
- Expository/educational text.
- Instructional text.

**Question Types:**
- Main idea.
- Detail recall.
- Vocabulary-in-context.
- Inference.
- Sequencing.

**Answer Formats:**
- Multiple choice (single-select).
- True/False.
- Short answer / keyword.

---

**Page 4: Step-by-Step Session Flow**

1. User selects difficulty (passage length, question complexity, time pressure).
2. Instruction screen explains scoring and timing.
3. Passage is shown with Start Reading action.
4. Timer starts (either immediately or on first interaction).
5. User reads the passage.
6. User presses “Finish Reading” to proceed.
7. Questions are shown one-by-one.
8. User submits answers under remaining time (or per-question timer).
9. Feedback and scoring are applied.
10. Summary screen shows comprehension metrics.

---

**Page 5: UI/UX Layout – Passage Reading Screen**

**Regions:**
- Header: title, timer, exit.
- Passage area: scrollable text.
- Reading controls: font size, line spacing, high contrast.
- Primary action: Finish Reading.

**ASCII Layout:**
```
┌─────────────────────────────┐
│ Comprehension       03:00 ✕ │
├─────────────────────────────┤
│ [Aa] [Spacing] [Contrast]   │
├─────────────────────────────┤
│  (Scrollable passage)       │
│  ...                        │
│  ...                        │
│                             │
├─────────────────────────────┤
│      [ Finish Reading ]     │
└─────────────────────────────┘
```

UI guidance:
- Keep comfortable margins.
- Ensure smooth scrolling.
- Avoid distracting animation during reading.

---

**Page 6: UI/UX Layout – Question Screen**

**Regions:**
- Header: question index, timer.
- Prompt: question text.
- Options list: large tap targets.
- Submit action.

**ASCII Layout:**
```
┌─────────────────────────────┐
│ Q 2/5              01:20 ✕  │
├─────────────────────────────┤
│ What is the main point?     │
│  ○ Option A                 │
│  ○ Option B                 │
│  ○ Option C                 │
│  ○ Option D                 │
├─────────────────────────────┤
│          [ Submit ]         │
└─────────────────────────────┘
```

Behavior:
- Disable Submit until an option is selected (for MCQ).

---

**Page 7: Scoring System**

**Core Metrics:**
- Comprehension accuracy = correct answers / total answers.
- Reading time.

**Example Points:**
| Event | Points |
|------|--------|
| Correct answer | +10 |
| Incorrect answer | 0 or -5 (configurable) |
| Fast completion bonus | +0–5 |

**Validity Rule:**
If user finishes passage too quickly (below reasonable minimum), optionally flag results.

---

**Page 8: Adaptive Difficulty**

Adapt:
- Passage length.
- Complexity (vocabulary, sentence length).
- Question difficulty.
- Time limits.

Example rules:
- Accuracy ≥ 85% over last 3 sessions → longer passages or harder questions.
- Accuracy < 60% → shorter passages or more direct questions.

---

**Page 9: Feedback System**

Two supported policies:
1) **Immediate feedback:** after each question.
2) **Delayed feedback:** only in summary.

Feedback must be:
- Non-color-only (text + icon).
- Clear about correct answer (if product allows).

---

**Page 10: Accessibility Requirements**

- Font scaling and spacing controls.
- High contrast.
- Screen reader: passage and questions accessible.
- Reduce motion.
- Keyboard navigation on web.

Important: avoid reading the correct answer automatically via screen reader when not intended.

---

**Page 11: Session Analytics**

Summary screen includes:
- Reading time.
- Accuracy by question type.
- Incorrect questions list (optional review).
- Trend across sessions.

Suggested session record:
- passageId, wordsCount, elapsedMsReading, questionResults[]

---

**Page 12: Gamification**

- Daily goal: complete 1–3 passages.
- Badges:
  - “Perfect Comprehension” (100%).
  - “Inference Master” (high inference accuracy).
- Weekly challenge: maintain ≥ 80% accuracy across 5 sessions.

---

**Page 13: Thorough Acceptance Criteria (Given/When/Then)**

**AC-1 Start Reading**
- Given the user is on the passage screen, when Start/Begin is triggered (or the user scrolls if auto-start), then the reading timer starts.

**AC-2 Finish Reading**
- Given the passage is visible, when the user presses Finish Reading, then the app transitions to the first question.

**AC-3 Answer Submission**
- Given a question is displayed, when the user selects an option and presses Submit, then the answer is recorded and the next question is shown.

**AC-4 Scoring**
- Given an answer is correct, when the session ends, then the summary accuracy increases accordingly.

**AC-5 Timeout Behavior**
- Given time expires during reading or questions (depending on rules), when time reaches 0, then the session ends and results reflect completed answers.

**AC-6 Accessibility**
- Given screen reader is enabled, then passage text and question options are navigable and properly labeled.

---

**Page 14: Testing Scenarios and Edge Cases**

Testing scenarios:
- Immediate vs delayed feedback.
- Per-question timer mode vs global timer.
- Passage font scaling.
- Review flow.

Edge cases:
- Extremely long passages.
- Zero questions.
- Background/foreground transitions.

---

**Page 15: Performance Optimization and Implementation Guidance**

- Cache passages locally.
- Avoid expensive layout updates while user scrolls.
- Keep scoring and analytics in pure functions.

**Summary:**
Comprehension Test strengthens understanding and recall under time constraints with accessible reading UI and thorough acceptance criteria.

---

[End of Comprehension Test Full 15-Page Documentation]
