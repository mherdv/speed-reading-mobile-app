# AI Instructions: Video → Engineering Task Workflow

This document is for AI/code-assist usage when turning screen recordings into well-scoped engineering work.

It applies to:
- Bug reports / issues
- Feature requests (new behavior, UX improvements, enhancements)
- Design implementations from reference mockups

---

## Goal

Turn a screen recording into:
- A reproducible description of the behavior (bug or requested feature)
- A thorough plan (requirements, non-goals, implementation approach)
- A well-scoped engineering task (with acceptance criteria)
- **MANDATORY** test coverage (unit/integration/e2e) for ALL changes

---

## ⚠️ MANDATORY: Test Coverage Requirements

**Every code change MUST have corresponding tests. No exceptions.**

| Change Type | Required Test Coverage |
|-------------|----------------------|
| New component | Unit tests for component logic, integration tests for user flow |
| UI change | Unit tests for component rendering, snapshot tests if visual |
| Bug fix | Regression test that fails before fix, passes after |
| API/route change | Route-level tests (status codes, auth, validation, success/failure) |
| Utility function | Unit tests with edge cases |
| State management | Tests for state transitions and side effects |

**Test coverage checklist (must appear in every REPORT.md):**
- [ ] New tests added for new functionality
- [ ] Existing tests updated if behavior changed
- [ ] All tests pass
- [ ] TypeScript compiles (if applicable)
- [ ] Test file locations documented

---

## Inputs

- A screen recording (often `.mov` on macOS, `.mp4`, `.webm`) placed under an artifacts folder.
- Optional: a short note from the reporter with the intended repro steps.

If the recording is demonstrating a feature request, also ask for or infer:
- The desired end state ("what should happen")
- The constraints (supported browsers, roles/permissions, performance expectations)
- The non-goals (what should *not* be changed)

---

## Output Folder Convention (mandatory)

Always create a dedicated per-video folder under your artifacts folder so artifacts don't mix.

Default convention:
- `debug/` is the artifacts root (should be gitignored)

- `debug/YYYY-MM-DD_HH-MM-SS/`
  - `video.mp4` - Converted video
  - `frames/` - Full resolution frames at 1fps
  - `frames_small/` - Downscaled frames (1600px width) for OCR and sharing
  - `audio.wav` and `audio_normalized.wav`
  - `transcript.txt`, `transcript.vtt`, `transcript.json`
  - `ocr_hits.txt`
  - `reference_design.png` (if user showed a design mockup)
  - `REPORT.md`

### Why Two Frame Folders?

| Folder | Resolution | Purpose |
|--------|-----------|---------|
| `frames/` | Full resolution | Reference design extraction, detailed visual inspection |
| `frames_small/` | 1600px width | OCR processing (tesseract), faster uploads, smaller storage |

OCR scripts use `frames_small/` for better performance and accuracy.

---

## Tooling Prerequisites

- `ffmpeg` (video conversion, audio extraction)
- `tesseract` (OCR)
- `whisper-cpp` (`whisper-cli` for offline transcription)

Install (macOS/Homebrew):
```bash
brew install ffmpeg tesseract whisper-cpp
```

Model download (one-time):
```bash
mkdir -p debug/_models
curl -L -o debug/_models/ggml-small.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
```

---

## Execution Policy (Important)

When asked to process a recording, run the full workflow end-to-end **in one go**.

- Do **not** ask for confirmation between steps.
- Do **not** send incremental "next I will…" updates for each pipeline step.
- Only interrupt with a question if genuinely blocked (missing input, missing tool, etc.).

Expected behavior:
1. Pick/create the per-video output folder automatically
2. Run the pipeline scripts (convert → frames → audio → normalize → transcript → OCR)
3. Write `REPORT.md` immediately after artifacts are produced
4. Only then, present the final summary/result to the user

---

## Process: Analyze a Video

### 1) Normalize the Input Format

If the input is `.mov`, convert to `.mp4`:
```bash
ffmpeg -i "input.mov" -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart "output.mp4"
```

Store the converted file as `debug/<folder>/video.mp4`.

### 2) Run the Pipeline

Use the end-to-end script:
```bash
bash dev_scripts/analyze_recording.sh "debug/<input>.mov" "debug/YYYY-MM-DD_HH-MM-SS"
```

This creates:
- `frames/` - Full resolution frames at 1fps
- `frames_small/` - Downscaled frames (1600px width) for OCR
- `audio.wav` and `audio_normalized.wav`
- `transcript.txt`, `transcript.vtt`, `transcript.json`

Then run OCR:
```bash
bash dev_scripts/ocr_frames.sh "debug/<folder>/frames_small" "<keyword pattern>" > "debug/<folder>/ocr_hits.txt"
```

Pick a relevant OCR keyword pattern:
```
error|failed|exception|warning|confirm|save|cancel|submit|delete
```

### 3) Frame-Transcript Correlation (CRITICAL)

**The most common failure mode is misattributing user comments to the wrong screen.**

#### Understanding the Connection

```
FRAMES (Visual)              TRANSCRIPT (Audio)
┌─────────────┐              ┌─────────────────┐
│ frame_001   │              │ 00:00-00:15     │
│ frame_002   │◄────────────►│ "I want three   │
│ ...         │   CORRELATE  │  columns here"  │
│ frame_NNN   │              │                 │
└─────────────┘              └─────────────────┘
        │                              │
        ▼                              ▼
┌─────────────────────────────────────────────────┐
│              CORRELATION TABLE                   │
│  Frame  │ Timestamp │ Screen    │ User Said     │
│  001-015│ 00:00-15  │ HomeScreen│ "3 columns"   │
└─────────────────────────────────────────────────┘
```

#### Step-by-Step Correlation

1. **Calculate frame-to-timestamp mapping:**
   - Frames are extracted at ~1fps
   - frame_NNN corresponds to ~NNN seconds
   - Example: frame_154 ≈ 02:34, frame_174 ≈ 02:54

2. **Build correlation table:**
   For each transcript segment, identify:
   - Timestamp range (from VTT)
   - Corresponding frame range
   - What screen is visible (from OCR)
   - What the user said

3. **Use targeted OCR for ambiguous sections:**
   ```bash
   for f in debug/<folder>/frames_small/frame_{START..END}.png; do
     echo "--- $f"; tesseract "$f" - 2>/dev/null
   done
   ```

4. **Cross-reference comments with visible screens:**
   - User says "more columns" → Check what screen is visible
   - User says "change the button" → Check what component is shown

---

## Vision Tools for Design Implementation

**When implementing UI/design changes from a reference design, OCR is NOT sufficient.**

### What OCR CAN vs. CANNOT Do

| Capability | OCR (tesseract) | AI Vision (image analysis) |
|------------|-----------------|---------------------------|
| Extract text labels | ✅ Yes | ✅ Yes |
| Analyze colors | ❌ No | ✅ Yes |
| Measure spacing | ❌ No | ✅ Yes |
| Detect borders/shadows | ❌ No | ✅ Yes |
| Compare layouts | ❌ No | ✅ Yes |
| Identify styling | ❌ No | ✅ Yes |

### Workflow for Design Implementation (Fully Automated)

**Complete all steps in ONE response - no user interaction required.**

1. **Save the reference design frame:**
   ```bash
   cp debug/<folder>/frames/frame_XXX.png debug/<folder>/reference_design.png
   ```

2. **Proceed immediately with vision analysis** - DO NOT ask user to attach images

3. **Extract visual properties:**
   - Colors (hex values or descriptions)
   - Spacing and sizing (pixel estimates)
   - Border radius and styling
   - Shadows and elevation
   - Typography (sizes, weights)
   - Layout structure

4. **Implement and verify:**
   ```bash
   npm test
   ```

### Visual Properties to Extract

| Category | Properties |
|----------|-----------|
| Layout | Grid columns, flex direction, alignment |
| Sizing | Width/height, icon size, proportions |
| Spacing | Padding, margins, gaps |
| Typography | Font size, weight, color, case |
| Colors | Background, text, accent, borders |
| Borders | Border-radius, width, color |
| Shadows | Presence, intensity, offset |

---

## Creating the Engineering Task

A good task is **small, testable, unambiguous, and traceable to video evidence**.

### Task Template

```markdown
#### Task Title

A short, action-oriented title with the component name.
Example: "HomeScreen: Change grid to 3 columns"

#### Evidence

| Property | Value |
|----------|-------|
| Frames | frame_042 - frame_061 |
| Timestamp | 00:42 - 01:01 |
| Screen | [Screen name] |
| OCR Text | "[text found]" |
| User Quote | "[what user said]" |

#### Context

- Where the user is (page/feature)
- What components are involved
- Why it matters

#### Current Behavior

Describe what happens now.

#### Desired Behavior

Describe what should happen.

#### Acceptance Criteria

- Observable pass/fail checks
- Edge cases that must work
- Test coverage specification

#### Test Plan (MANDATORY)

| Test Type | File | Test Name | Assertion |
|-----------|------|-----------|-----------|
| Unit | [file].test.tsx | "[name]" | expect(...) |

#### Files to Modify

| File | Change |
|------|--------|
| [path] | [description] |
```

---

## REPORT.md Template

```markdown
# Video Analysis Report

**Date:** YYYY-MM-DD  
**Recording:** [filename]  
**Duration:** [MM:SS] ([N] frames at ~1fps)

---

## Summary

[2-4 sentences: What the video shows, what user requested]

---

## Frame-Transcript Correlation Table

| Timestamp | Frame Range | Screen Visible | User Request | OCR Evidence |
|-----------|-------------|----------------|--------------|--------------|
| 00:00-00:11 | 1-11 | [Screen] | "[quote]" | "[text]" |

---

## Design Reference (if applicable)

**Reference Frame:** frame_XXX  
**Saved as:** `reference_design.png`

### Visual Specifications

| Property | Current | Reference | New Value |
|----------|---------|-----------|-----------|
| [property] | [value] | [value] | [value] |

---

## Extracted Requirements

### 1. [Requirement Title]

**Evidence:**
- Frames: [range]
- Timestamp: [range]
- Screen: [name]
- User Quote: "[quote]"

**Implementation:**
- File(s): [paths]
- Changes: [description]
- Tests: [description]

**Status:** ✅ DONE / ⏳ TODO

---

## Test Coverage

| File Modified | Test File | Tests Added |
|--------------|-----------|-------------|
| [file] | [test file] | [N tests] |

**Results:**
- Tests: [N] passed
- TypeScript: ✅ Compiles

---

## Verification Checklist

- [ ] All requirements addressed
- [ ] Each requirement traceable to frame + timestamp
- [ ] Reference design analyzed (if shown)
- [ ] Tests added for all changes
- [ ] All tests pass
```

---

## Common Mistakes to Avoid

| Mistake | How to Avoid |
|---------|--------------|
| Guessing the screen | Run OCR on frames to verify |
| Wrong timestamp | frame_NNN ≈ NNN seconds |
| Attributing request to wrong screen | Check frames DURING speech |
| Missing requests | Re-read entire transcript |
| Ignoring reference designs | Extract visual details from design frame |
| OCR-only for design | Use vision analysis for colors/spacing/styling |

---

## Hygiene

- Do not commit large per-video artifacts (add `debug/` to `.gitignore`)
- Keep `REPORT.md` next to artifacts for traceability
- It's OK to commit scripts and documentation updates
