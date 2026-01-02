# AI instructions: dev_scripts (video → task workflow)

This document is for AI/code-assist usage when turning screen recordings into well-scoped engineering work.

It applies to:
- bug reports / issues
- feature requests (new behavior, UX improvements, enhancements)

## Goal

Turn a screen recording into:
- a reproducible description of the behavior (bug or requested feature)
- a thorough plan (requirements, non-goals, implementation approach)
- a well-scoped engineering task (with acceptance criteria)
- **MANDATORY** test coverage (unit/integration/e2e) for ALL changes

---

## ⚠️ MANDATORY: Test Coverage Requirements

**Every code change MUST have corresponding tests. No exceptions.**

| Change Type | Required Test Coverage |
|-------------|----------------------|
| New game/component | Unit tests for all game logic, integration tests for user flow |
| UI change | Unit tests for component rendering, snapshot tests if visual |
| Bug fix | Regression test that fails before fix, passes after |
| API/route change | Route-level tests (status codes, auth, validation, success/failure) |
| Utility function | Unit tests with edge cases |
| State management | Tests for state transitions and side effects |

**Test coverage checklist (must appear in every REPORT.md):**
- [ ] New tests added for new functionality
- [ ] Existing tests updated if behavior changed
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Test file locations documented

---

## Non-negotiable: API route changes must be tested + documented

If you create a new backend route or change the behavior of an existing route:
- Add/extend automated tests for that route (status codes, auth, validation, and at least one success/failure path).
- Do not merge/commit route changes without tests unless there is a clear, written rationale.
- In `REPORT.md`, explicitly include a short section listing:
   - which routes were added/changed
   - which test files were added/updated
   - what the new/updated tests assert

---

## ⚠️ MANDATORY: Vision Tools for Design Implementation

**When implementing UI/design changes from a reference design, OCR is NOT sufficient.**

### 🚨 CRITICAL: Automatic Image Attachment (NO USER INPUT REQUIRED)

When processing a video that contains a design reference, the AI MUST:
1. **Automatically attach all relevant images** in the same message/response
2. **NOT ask the user to attach images** - do it yourself
3. **Proceed with full analysis** in one go

**The workflow is FULLY AUTOMATED - do not interrupt to ask for attachments.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTOMATED VISION WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ❌ WRONG (interrupts user):          ✅ CORRECT (fully automated):    │
│   ┌─────────────────────┐              ┌─────────────────────────────┐  │
│   │ 1. Process video    │              │ 1. Process video            │  │
│   │ 2. Save images      │              │ 2. Save images              │  │
│   │ 3. ASK user to      │              │ 3. ATTACH images in same    │  │
│   │    attach images    │              │    response (no asking!)    │  │
│   │ 4. Wait for user... │              │ 4. Analyze with AI vision   │  │
│   │ 5. Then analyze     │              │ 5. Implement changes        │  │
│   └─────────────────────┘              │ 6. Run tests                │  │
│                                        │ 7. Done in ONE go           │  │
│   Result: User must do                 └─────────────────────────────┘  │
│   extra work, flow broken              Result: Fully automated,         │
│                                        no user intervention needed      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Correct Workflow for Design Implementation (FULLY AUTOMATED)

**Step 1: Save the reference design image**
```bash
# Copy reference frame or design image
cp debug/<folder>/frames/frame_XXX.png debug/<folder>/reference_design.png
```

**Step 2: Include images in your response for AI vision analysis**

When you need to analyze a design, include the image paths in your response. The system will automatically make them available for vision analysis. Do NOT ask the user to attach - proceed with analysis.

**Step 3: AI performs vision analysis**

Analyze the design using the vision prompts defined below:
- Analyze colors, spacing, sizing, borders, shadows
- Compare with current implementation
- Extract specific style values
- Create detailed implementation plan

**Step 4: Implement and verify**
```bash
# Run tests
cd mobile && npm test

# Open app in browser for verification
open http://localhost:8081
```

### What OCR CAN vs. CANNOT Do

| Capability | OCR (tesseract) | AI Vision (attached image) |
|------------|-----------------|---------------------------|
| Extract text labels | ✅ Yes | ✅ Yes |
| Read game names | ✅ Yes | ✅ Yes |
| Analyze colors | ❌ No | ✅ Yes |
| Measure spacing | ❌ No | ✅ Yes |
| Detect borders/shadows | ❌ No | ✅ Yes |
| Compare layouts | ❌ No | ✅ Yes |
| Identify icon shapes | ❌ No | ✅ Yes |

See the "🎨 DESIGN REFERENCE EXTRACTION" section below for complete workflow.

---

## Inputs

- A screen recording (often `.mov` on macOS) placed under an artifacts folder (commonly `debug/` or `artifacts/`).
- Optional: a short note from the reporter with the intended repro steps.

If the recording is demonstrating a feature request, also ask for or infer:
- the desired end state (“what should happen”)
- the constraints (supported browsers, roles/permissions, performance expectations)
- the non-goals (what should *not* be changed)

## Output folder convention (mandatory)

Always create a dedicated per-video folder under your artifacts folder so artifacts don’t mix.

Default convention used here:
- `debug/` is the artifacts root (and should usually be gitignored).

- `debug/YYYY-MM-DD_HH-MM-SS/`
  - `video.mp4`
  - `frames/` and `frames_small/`
  - `audio.wav` and `audio_normalized.wav`
  - `transcript.txt`, `transcript.vtt`, `transcript.json`
  - `ocr_hits.txt`
  - `REPORT.md`

Use the filename timestamp if available; otherwise use the date/time you received it.

## Tooling prerequisites

- `ffmpeg` (video conversion, audio extraction)
- `tesseract` (OCR)
- `whisper-cpp` (`whisper-cli` for offline transcription)

Install (macOS/Homebrew):
- `brew install ffmpeg tesseract whisper-cpp`

Model download (one-time):
- `mkdir -p debug/_models`
- `curl -L -o debug/_models/ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin`

## Process: analyze a video

## Execution policy for dev_scripts (important)

When the user asks you to process a recording with `dev_scripts`, you should run the full workflow end-to-end **in one go**.

- Do **not** ask for confirmation between steps.
- Do **not** send incremental “next I will…” updates for each pipeline step.
- Only interrupt with a question if you are genuinely blocked (missing input file, missing tool/model, unclear output folder, etc.).

Expected behavior:
- Pick/create the per-video output folder automatically (see the mandatory folder convention below).
- Run the pipeline scripts (convert → frames → audio → normalize → transcript → OCR).
- Write `REPORT.md` immediately after artifacts are produced.
- Only then, present the final summary/result to the user.

### 1) Normalize the input format

If the input is `.mov`, convert to `.mp4` before further processing:
- `ffmpeg -i "input.mov" -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart "output.mp4"`

Store the converted file as `debug/<folder>/video.mp4`.

### 2) Run the one-command pipeline

Prefer the end-to-end script:
- `bash dev_scripts/analyze_recording.sh "debug/<input>.mov" "debug/YYYY-MM-DD_HH-MM-SS"`

This should:
- create frames (full + small)
- extract audio
- normalize audio
- generate transcripts (txt/vtt/json)

Then run OCR (always):
- `bash dev_scripts/ocr_frames.sh "debug/<folder>/frames_small" "<your keyword pattern>" > "debug/<folder>/ocr_hits.txt"`

Pick a broad but relevant OCR keyword pattern (examples):
- `error|failed|exception|stack|warning|confirm|discard|save|template|invoice|annex|drive|google|sheet|doc`

If you need to run parts manually, use the scripts in `dev_scripts/README.md`.

### 3) Frame-Transcript Correlation (CRITICAL for accurate analysis)

**The most common failure mode is misattributing user comments to the wrong screen/game.**

---

### 🎯 UNDERSTANDING FRAME-TRANSCRIPT-REQUIREMENT CONNECTIONS

The relationship between frames, transcript, and requirements is the **core of this workflow**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        VIDEO ANALYSIS PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   FRAMES (Visual)              TRANSCRIPT (Audio)                       │
│   ┌─────────────┐              ┌─────────────────┐                      │
│   │ frame_001   │              │ 00:00-00:15     │                      │
│   │ frame_002   │◄────────────►│ "I want three   │                      │
│   │ ...         │   CORRELATE  │  columns here"  │                      │
│   │ frame_NNN   │              │                 │                      │
│   └─────────────┘              └─────────────────┘                      │
│         │                              │                                │
│         │                              │                                │
│         ▼                              ▼                                │
│   ┌─────────────────────────────────────────────────┐                   │
│   │              CORRELATION TABLE                   │                   │
│   │  Frame  │ Timestamp │ Screen/Game │ User Said   │                   │
│   │  001-015│ 00:00-15  │ HomeScreen  │ "3 columns" │                   │
│   └─────────────────────────────────────────────────┘                   │
│                          │                                              │
│                          ▼                                              │
│   ┌─────────────────────────────────────────────────┐                   │
│   │           EXTRACTED REQUIREMENT                  │                   │
│   │  • What: Change layout to 3 columns              │                   │
│   │  • Where: HomeScreen game cards                  │                   │
│   │  • Evidence: Frame 001-015, Transcript 00:00-15  │                   │
│   │  • User Quote: "I want three columns here"       │                   │
│   └─────────────────────────────────────────────────┘                   │
│                          │                                              │
│                          ▼                                              │
│   ┌─────────────────────────────────────────────────┐                   │
│   │           IMPLEMENTATION TASK                    │                   │
│   │  • File: HomeScreen.tsx                          │                   │
│   │  • Change: width '47%' → '31%'                   │                   │
│   │  • Tests: Verify 3-column rendering              │                   │
│   └─────────────────────────────────────────────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**KEY PRINCIPLE**: Every requirement MUST trace back to:
1. Specific frame number(s) showing WHAT screen/game
2. Specific timestamp showing WHEN user spoke
3. Exact user quote showing WHAT they requested
4. Verification via OCR showing the visual context

---

### Step-by-Step Correlation Process

**Step 1: Calculate frame-to-timestamp mapping:**
   - Frames are extracted at ~1fps, so frame_NNN corresponds to ~NNN seconds into the video
   - VTT timestamps are in HH:MM:SS.mmm format
   - Example: frame_154 ≈ 02:34, frame_174 ≈ 02:54

**Step 2: Build a correlation table:**
   For each major transcript segment, identify:
   - Timestamp range (from VTT)
   - Corresponding frame range (timestamp seconds → frame number)
   - What screen/game is visible in those frames (from OCR)
   - What the user said (from transcript)

**Step 3: Use targeted OCR for ambiguous sections:**
   ```bash
   # Run OCR on specific frame range to identify what game is open
   for f in debug/<folder>/frames_small/frame_{START..END}.png; do
     echo "--- $f"; tesseract "$f" - 2>/dev/null
   done
   ```

**Step 4: Look for game-specific indicators in OCR:**
   - Game title at top of screen (e.g., "Text Search", "Pattern Scanning")
   - DevTools showing component names (e.g., "WordMismatchGrid", "PatternScanning")
   - Game-specific UI elements (buttons, grids, timers)

**Step 5: Cross-reference user comments with visible screens:**
   - User says "more columns" → Check what grid-based game is visible
   - User says "15 variations" → Check what game with variations is visible
   - User says "one button" → Check what game with selection buttons is visible

---

### Master Correlation Table Format (REQUIRED in REPORT.md)

```markdown
## Frame-Transcript-Game Correlation Table

| Timestamp | Frame Range | Game/Screen Visible | User Request | OCR Evidence |
|-----------|-------------|---------------------|--------------|--------------|
| 00:00-00:11 | 1-11 | Home Screen | "Three columns per row" | "Speed Reading Trainer", game icons |
| 00:42-01:01 | 42-61 | SchulteNumbers | "Change sizes to fit screen" | "Schulte Table", "1-25" |
| 01:28-01:48 | 88-108 | PatternScanning | "Select pattern automatically" | "Pattern Scanning", "Find the pattern" |
```

**Each row MUST include:**
1. **Timestamp**: Exact range from VTT file (e.g., "00:42-01:01")
2. **Frame Range**: Calculated from timestamp (42 seconds = frame 42)
3. **Game/Screen Visible**: Verified via OCR, not guessed
4. **User Request**: Exact or summarized quote from transcript
5. **OCR Evidence**: Key text found in those frames proving the game identity

---

### Requirement Extraction Template (REQUIRED for each requirement)

```markdown
### Requirement #N: [Short Title]

**Source Evidence:**
- Frames: [frame range, e.g., 88-108]
- Timestamp: [time range, e.g., 01:28-01:48]
- Screen: [verified game/screen name]
- OCR Proof: "[key text found in frames]"

**User's Exact Words:**
> "[Direct quote from transcript]"

**Interpreted Requirement:**
[Clear, actionable statement of what needs to change]

**Implementation:**
- File(s): [specific files to modify]
- Change: [specific changes to make]
- Tests: [specific tests to add/update]

**Status:** [ ] Not Started / [ ] In Progress / [x] Completed
```

---

### Common Correlation Mistakes to AVOID

| Mistake | Example | How to Avoid |
|---------|---------|--------------|
| Guessing the game | "User said 'grid' so it's probably Schulte" | Run OCR on frames to verify game title |
| Wrong timestamp | Misreading VTT format | frame_NNN ≈ NNN seconds |
| Conflating requests | Attributing request to wrong screen | Check frames DURING the speech, not before/after |
| Missing requests | User made 7 requests, you found 5 | Re-read entire transcript, match each statement to frames |
| Misunderstanding | User said "2 columns" but meant "3 columns" | Check reference design frames if user shows one |
| **Ignoring reference designs** | User shows a design mockup but you ignore it | Extract visual details from reference frame (see below) |

---

### 🎨 DESIGN REFERENCE EXTRACTION (CRITICAL)

**When a user mentions a design change and shows a reference design in the video, that design frame MUST be used as the implementation source.**

#### ⚠️ CRITICAL: Automatic Image Analysis (NO USER INPUT)

**OCR alone is NOT sufficient for design implementation.** The AI must automatically proceed with vision analysis - DO NOT ask the user to attach images.

---

### 🔧 REQUIRED WORKFLOW FOR VISUAL DESIGN ANALYSIS (FULLY AUTOMATED)

**Complete all steps in ONE response - no user interaction required.**

#### Step 1: Save the reference design image
```bash
# Copy the reference design frame
cp debug/<folder>/frames/frame_XXX.png debug/<folder>/reference_design.png
```

#### Step 2: Immediately proceed with vision analysis

**DO NOT ask the user to attach images.** The AI should:
1. Reference the saved image path in the response
2. Proceed directly to analysis and implementation
3. Complete the entire workflow without stopping

#### Step 3: AI performs vision analysis

Analyze the design:
- Exact colors (hex values or color descriptions)
- Spacing and sizing (approximate pixel values)
- Border radius and styling
- Shadows and elevation
- Typography (font sizes, weights)
- Layout structure (columns, alignment)
- Icon styling and positioning

#### Step 4: Implement changes and run tests

Complete the implementation in the same response:
```bash
# Run tests after implementation
cd mobile && npm test
```

---

### 🔬 VISION ANALYSIS PROMPT (Use Automatically)

When a reference design image is attached to the conversation, the AI should use this analysis framework:

```
You are a multimodal vision–language system.

Analyze the provided image by embedding it into a shared image–text semantic space
(similar to CLIP / vision transformers). Do NOT rely on pixel rules or subjective
descriptions.

Your task:
1. Infer UI / visual style via zero-shot similarity against textual style concepts.
2. Base all conclusions on learned visual patterns (layout, spacing, color, depth,
   blur, shadows, shapes).
3. Do NOT assume access to DOM, CSS, Figma layers, or metadata.
4. Do NOT claim certainty; report confidence scores.

Evaluate similarity against these style concepts:
- material design UI
- iOS / human interface guidelines
- flat design
- minimalist UI
- glassmorphism
- neumorphism
- brutalist UI
- dense information UI
- modern dashboard UI

Return output in JSON ONLY:

{
  "style_scores": { "<style>": <0.0–1.0> },
  "primary_style": "<style>",
  "secondary_styles": ["<style>", "<style>"],
  "visual_signals": {
    "color_density": "low|medium|high",
    "spacing_rhythm": "tight|moderate|loose",
    "depth_cues": "none|subtle|strong",
    "blur_presence": "none|low|high"
  },
  "confidence": <0.0–1.0>
}
```

**After style analysis, extract specific UI properties:**

```
Analyze the attached UI design image and extract implementation-ready properties.

For each UI component visible, extract:

1. LAYOUT:
   - Grid structure (columns, rows)
   - Component alignment (flex direction, justify, align)
   - Spacing between elements (gap estimates in px)

2. COLORS (describe or estimate hex):
   - Background colors
   - Text colors (primary, secondary, muted)
   - Accent/brand colors
   - Icon background colors
   - Border colors

3. TYPOGRAPHY:
   - Relative font sizes (small/medium/large or px estimates)
   - Font weights (normal/medium/semibold/bold)
   - Text transforms (uppercase/lowercase/capitalize)
   - Line heights (tight/normal/relaxed)

4. SPACING:
   - Padding (internal spacing)
   - Margins (external spacing)
   - Gaps between repeated elements

5. BORDERS & CORNERS:
   - Border radius (px estimates: 0/4/8/12/16/full)
   - Border width and style
   - Border colors

6. SHADOWS & DEPTH:
   - Shadow presence (none/subtle/medium/strong)
   - Shadow direction and blur
   - Elevation levels

7. ICONS & IMAGES:
   - Icon sizes
   - Icon container styling
   - Image aspect ratios

Return as structured JSON:
{
  "components": [
    {
      "name": "<component name>",
      "layout": { ... },
      "colors": { ... },
      "typography": { ... },
      "spacing": { ... },
      "borders": { ... },
      "shadows": { ... }
    }
  ],
  "global_styles": {
    "color_palette": [...],
    "spacing_scale": [...],
    "border_radius_scale": [...]
  },
  "confidence": <0.0–1.0>
}
```

---

### ⚠️ CRITICAL: Vision Analysis Workflow (FULLY AUTOMATED)

**Complete all steps in ONE response - DO NOT ask user for input.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VISUAL DESIGN ANALYSIS WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Step 1: IDENTIFY design reference frames in video                    │
│           └── Use OCR to find frames showing mockup/design             │
│                                                                         │
│   Step 2: SAVE the reference design frame                              │
│           └── cp frames/frame_XXX.png reference_design.png              │
│                                                                         │
│   Step 3: IMMEDIATELY proceed with vision analysis                     │
│           └── DO NOT ask user to attach - just analyze                 │
│           └── Reference the image path and proceed                     │
│                                                                         │
│   Step 4: ANALYZE the visual design                                    │
│           └── Extract: colors, spacing, sizing, borders, shadows       │
│           └── Document all visual properties                           │
│                                                                         │
│   Step 5: COMPARE with current implementation                          │
│           └── Read current code to get existing values                 │
│           └── Create diff table: current vs. reference                 │
│                                                                         │
│   Step 6: IMPLEMENT style changes                                      │
│           └── Make code changes based on visual analysis               │
│                                                                         │
│   Step 7: RUN tests and verify                                         │
│           └── npm test                                                 │
│           └── All in ONE response - no user interaction                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🚫 WRONG vs ✅ CORRECT Approach

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DESIGN ANALYSIS COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ❌ WRONG: OCR Only                    ❌ WRONG: Ask user to attach    │
│   ┌─────────────────────────┐          ┌─────────────────────────────┐  │
│   │ 1. tesseract → text     │          │ 1. Save reference frame     │  │
│   │ 2. Read "Word pairs"    │          │ 2. "Please attach image"    │  │
│   │ 3. Done! (NO STYLES!)   │          │ 3. Wait for user...         │  │
│   └─────────────────────────┘          │ 4. Breaks automation!       │  │
│                                        └─────────────────────────────┘  │
│   Result: Text correct,                                                 │
│   but no visual analysis               Result: Workflow interrupted     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ✅ CORRECT: Fully automated analysis                                  │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ 1. Save reference frame                                         │   │
│   │ 2. Immediately proceed with vision analysis                     │   │
│   │ 3. AI VISION analyzes image:                                    │   │
│   │    - Actual pixel colors    - Border radius                     │   │
│   │    - Element dimensions     - Shadow/elevation                  │   │
│   │    - Spacing/gaps           - Typography styles                 │   │
│   │ 4. Document style values                                        │   │
│   │ 5. Implement exact styles                                       │   │
│   │ 6. Run tests - ALL IN ONE GO                                    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   Result: Complete automation, no user interruption                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Example: Correct Automated Vision Analysis Workflow

**Scenario:** User shows a Figma mockup in video at frame_045

**Step 1: Save reference frame**
```bash
cp debug/2026-01-01_12-30-00/frames/frame_045.png \
   debug/2026-01-01_12-30-00/reference_design.png
```

**Step 2: Immediately proceed with vision analysis (AI documents the visual properties):**

```markdown
## Visual Analysis of reference_design.png

### What I See (AI Vision Analysis):

**Layout:**
- 3 columns of cards arranged in a grid
- Cards have equal width with ~8px gaps between them
- Container has ~16px horizontal padding

**Card Appearance:**
- Cards have white background
- Border-radius appears to be ~12px (noticeably rounded corners)
- Subtle shadow/elevation visible (cards appear raised)
- Card padding appears to be ~12px internal

**Icon Container:**
- Square container in top-left of each card
- Background color: light purple/indigo tint (#E8E8FF approximately)
- Border-radius: ~8px (rounded but not circular)
- Size: approximately 40px × 40px

**Typography:**
- Card titles: ~14px, semibold weight, dark gray color
- No description text visible (removed from design)
- Text appears to be sentence case

**Difficulty Indicators:**
- Vertical stack of 5 small circles (not stars!)
- Filled circles: solid indigo/purple color
- Empty circles: light gray outline or fill
- Circle size: ~6px diameter
- Position: right side of card
```

**Step 3: Compare with current code values and implement changes**

---

**OCR tells you WHAT text is shown. Vision analysis tells you HOW it looks.**

---

#### Visual Style Properties to Extract (MANDATORY)

When analyzing a reference design image, you MUST extract these properties:

| Category | Properties to Extract | AI Vision Analysis |
|----------|----------------------|---------------------|
| **Layout** | Grid columns, flex direction, alignment | AI vision counts items per row, observes alignment |
| **Sizing** | Card width/height, icon size, element proportions | AI vision estimates relative sizes |
| **Spacing** | Padding, margins, gaps between elements | AI vision measures whitespace |
| **Typography** | Font size (relative), weight, color, case | AI vision compares text sizes, identifies bold/normal |
| **Colors** | Background, text, accent, icon backgrounds | AI vision identifies exact colors or color relationships |
| **Borders** | Border-radius, border width, border color | AI vision observes rounded corners, outlines |
| **Shadows** | Shadow presence, intensity, offset | AI vision observes depth/elevation effects |
| **Icons** | Size, shape, position within container | AI vision notes icon placement and sizing |
| **States** | Selected/unselected, active/inactive styles | AI vision compares different element states |

---

#### Step-by-Step Visual Design Analysis (Fully Automated)

**Step 1: Save the reference design frame for analysis**
```bash
# Copy the best reference frame to a dedicated file
cp debug/<folder>/frames/frame_XXX.png debug/<folder>/reference_design.png
```

**Step 2: Immediately proceed with vision analysis (NO user input required)**
```markdown
The AI proceeds directly to analyze the image and document visual properties.
DO NOT ask the user to attach the image - just proceed with analysis.
```

**Step 3: AI Vision Analysis (what the AI documents)**

```markdown
## Visual Style Specification (from reference_design.png)

### Overall Layout
- Grid: [N] columns with [X]px gaps
- Container padding: approximately [X]px
- Section spacing: approximately [X]px between sections

### Card Component Styles
- Width: approximately [X]% of container (or fixed width)
- Border-radius: [X]px (observe corner rounding)
- Background: [color description or hex if determinable]
- Shadow: [none / subtle / prominent] - elevation level
- Padding: [X]px internal spacing

### Icon Styles
- Size: [X]px × [X]px (relative to card)
- Border-radius: [X]px (square / rounded / circle)
- Background: [colored / gradient / transparent]
- Position: [top-left / centered / etc.]

### Typography Styles
- Title: [size relative to other text], [weight: bold/normal], [color]
- Subtitle/description: [size], [weight], [color]
- Text case: [UPPERCASE / Title Case / lowercase / Sentence case]

### Additional Visual Elements
- Stars/ratings: [horizontal / vertical], [filled/empty style]
- Badges/indicators: [position], [style]
- Decorative elements: [any borders, dividers, backgrounds]
```

**Step 4: Create a side-by-side visual comparison**

```markdown
### Visual Comparison: Current vs. Reference

| Visual Property | Current Implementation | Reference Design | Style Change Needed |
|-----------------|----------------------|------------------|---------------------|
| Card border-radius | 8px | 12px (more rounded) | Increase to 12px |
| Icon size | 24px | 36px | Increase to 36px |
| Icon border-radius | 4px | 10px | Increase to 10px |
| Title font size | 14px | 12px | Decrease to 12px |
| Title font weight | 600 | 700 | Increase to bold |
| Card shadow | none | subtle elevation | Add shadow |
| Gap between cards | 8px | 10px | Increase gap |
| Text case | Title Case | lowercase | Change to sentence case |
```

**Step 4: Map visual properties to code changes**

```markdown
### Implementation Mapping

| Visual Property | CSS/Style Property | Current Value | New Value |
|-----------------|-------------------|---------------|-----------|
| Card corners | borderRadius | 8 | 12 |
| Icon container | width, height | 24, 24 | 36, 36 |
| Icon corners | borderRadius | 4 | 10 |
| Title size | fontSize | 14 | 12 |
| Title weight | fontWeight | '600' | '700' |
| Card elevation | shadowOpacity, elevation | 0 | 0.1, 2 |
| Grid gap | marginHorizontal | 4 | 5 |
```

**Step 6: Implement and verify visually**

After implementing the style changes, open the app and compare against the reference:
```bash
# Open reference design for comparison
open debug/<folder>/reference_design.png

# Open the app in browser
open http://localhost:8081
```

The AI should visually verify the implementation matches the reference design.

---

#### Identifying Reference Design Frames

A reference design is visible when the user:
- Opens a design tool (Figma, Sketch, Adobe XD, browser with mockup)
- Shows a screenshot or image of desired UI
- Points to another app or website as a reference
- Has a side-by-side comparison (current vs. desired)
- Shows a static mockup before demonstrating the current broken behavior

**OCR indicators of reference designs:**
- Design tool names: "Figma", "Sketch", "Adobe XD", "InVision"
- Image viewer: "Preview", "Photos", "Quick Look"
- File extensions: ".png", ".jpg", ".pdf", ".fig"
- Design-specific UI: artboards, layers panel, component names

#### Design Reference Extraction Process

**Step 1: Identify design frames**
```bash
# Look for design tool indicators
for f in debug/<folder>/frames_small/frame_*.png; do
  result=$(tesseract "$f" - 2>/dev/null | grep -iE "figma|sketch|design|mockup|preview")
  if [ -n "$result" ]; then echo "--- $f: $result"; fi
done
```

**Step 2: Extract visual specifications from reference frames**

For each reference design frame, document:

| Visual Property | How to Extract | Example |
|-----------------|----------------|---------|
| Layout structure | Count columns/rows, note spacing | "3 columns, 8px gap" |
| Component presence | List visible elements | "No description text, no level indicator" |
| Component ordering | Note section order | "Games section before Results section" |
| Typography | Note relative sizes, weights | "Title larger than subtitle, bold" |
| Colors | Note color relationships | "Purple accent, white background" |
| Spacing | Note padding, margins | "Card has 12px padding" |
| Icons/imagery | Note presence/absence | "Icon at top-left of card" |
| Text content | Note exact labels | "Section titled 'Exercises' not 'Games'" |

**Step 3: Create a Design Specification Table**

```markdown
## Design Reference Analysis

**Reference Frame(s):** frame_045 - frame_052  
**Timestamp:** 00:45 - 00:52  
**Design Source:** [Figma mockup / Screenshot / Reference app]

### Visual Specifications Extracted:

| Element | Current State | Reference Design | Change Required |
|---------|---------------|------------------|-----------------|
| Header | Logo + Title + Subtitle | No header | Remove header section |
| Section title | "Games" | "Exercises" | Rename section |
| Card content | Icon + Title + Description + Level | Icon + Title + Stars | Remove description, remove level text |
| Stars layout | Horizontal | Vertical | Change orientation prop |
| Section order | Latest Result, then Games | Games, then Latest Result | Reorder sections |
```

**Step 4: Reference the design in requirements**

Each design-related requirement MUST include:

```markdown
### Requirement #N: [UI Change Title]

**Evidence Chain:**
| Property | Value |
|----------|-------|
| Frames | [current UI frames] AND [reference design frames] |
| Timestamp | [when user shows/discusses design] |
| Screen/Game | [affected screen] |
| **Reference Design Frame** | frame_XXX (the mockup/design shown) |
| OCR Proof | "[text from reference design]" |

**Design Comparison:**
| Element | Current (frame_AAA) | Desired (frame_XXX) |
|---------|---------------------|---------------------|
| [element] | [current state] | [desired state] |

**User's Exact Words:**
> "[Quote about the design change]"

**Visual Implementation Details (from reference frame):**
- [Specific visual detail 1 extracted from design frame]
- [Specific visual detail 2 extracted from design frame]
- [Specific visual detail 3 extracted from design frame]
```

#### Design Implementation Checklist

When implementing design changes:

- [ ] Reference design frame(s) identified and saved as `reference_design.png`
- [ ] **Visual analysis performed (not just OCR)** - actually looked at the image
- [ ] **All visual style properties documented** (colors, spacing, sizing, borders, shadows)
- [ ] All visual differences between current and reference catalogued
- [ ] **Each visual change has a specific style value** (e.g., borderRadius: 12, not "more rounded")
- [ ] Design changes verified against reference frame visually
- [ ] Implementation matches reference design appearance, not just content

#### Example: User Shows Design Reference

**Scenario:** User says "I want it to look like this" while showing a Figma mockup.

**Wrong approach:** Only run OCR, extract text labels, implement based on words alone.

**Correct approach:**
1. Find frames where Figma/mockup is visible (e.g., frame_045-052)
2. **Save the reference frame for visual analysis**
3. **Open and visually inspect the design** - don't just run OCR
4. **Document all visual style properties** (colors, spacing, borders, shadows, sizing)
5. Run OCR to extract text labels (this is secondary to visual analysis)
6. Create visual comparison table: current styles vs. reference styles
7. Map each visual difference to specific code/style changes
8. Implement based on VISUAL APPEARANCE first, text content second
9. **Verify implementation visually matches reference frame**
3. Manually inspect the visual structure (columns, spacing, elements)
4. Create a visual diff table comparing current vs. reference
5. Implement based on BOTH user words AND visual reference
6. Verify implementation matches the reference frame visually

---

**Example Correlation Table:**
| Timestamp | Frame Range | Screen Visible | User Comment |
|-----------|-------------|----------------|--------------|
| 02:08-02:23 | 128-143 | Word Mismatch (DevTools) | "more columns, columns next to each other" |
| 02:34-02:50 | 154-170 | Text Search (DevTools) | "variations, style changes" |
| 02:54-03:11 | 174-191 | Pattern Scanning (DevTools) | "15 variations, one button" |

### 4) Extract the behavior precisely

Use **transcript + frames + OCR** together. Never rely on transcript alone.

In `REPORT.md`, include:
- **Master Timeline Table**: A complete frame-by-frame correlation table for the entire video
- **Summary**: 2–4 sentences describing the flow and the observed behavior.
- **Repro steps**: numbered, minimal, deterministic.
- **Expected vs actual** (for bugs) OR **Current vs desired** (for feature requests).
- **Timestamps**: quote the exact relevant transcript lines and list the time window (e.g. `00:00:22.540–00:00:29.960`).
- **Frame references**: which frames show the relevant screen/game
- **Scope**: what is affected and what is not.

**IMPORTANT**: For each user request, explicitly list:
1. The exact timestamp from transcript
2. The corresponding frame number(s)
3. What screen/game is visible in those frames (verified via OCR)
4. The user's exact words
5. The interpreted requirement

This ensures no requests are missed or misattributed.

If OCR produced hits, include the relevant hits and which frame(s).

### 5) Create the engineering task (THOROUGH TASK DESCRIPTIONS)

A good task is **small, testable, unambiguous, and traceable back to video evidence**.

Use this template inside `REPORT.md`:

#### Task title

A short, action-oriented title WITH the component name.
Example: "SchulteNumbers: Fix grid wrapping on 5x5 layout"

#### Evidence (REQUIRED - links task to video)

| Property | Value |
|----------|-------|
| Frames | frame_042 - frame_061 |
| Timestamp | 00:42 - 01:01 |
| Screen | Schulte Numbers game |
| OCR Text | "Schulte Table", "Tap 1-25" |
| User Quote | "change sizes of numbers if necessary" |

#### Context

- Where the user is (page/feature)
- What components/systems are involved
- Why it matters (broken workflow, missing capability, user friction, etc.)

#### Current Behavior

Describe what happens now (observed in video frames).

#### Desired Behavior  

Describe what should happen (from user's request).

#### Repro (for bugs)

1. …
2. …
3. …

#### Acceptance criteria

- Define observable pass/fail checks.
- Include browser/device constraints if relevant.
- Include edge cases that must work.
- **MANDATORY: Test coverage specification** (see Test plan below)

#### Test plan (MANDATORY - not optional)

| Test Type | File | Test Name | Assertion |
|-----------|------|-----------|-----------|
| Unit | [file].test.tsx | "[test name]" | expect(...) |
| Integration | [file].test.tsx | "[test name]" | expect(...) |

**Before implementation:**
- [ ] Identify existing tests that may need updating
- [ ] Write failing test for the bug/feature (TDD preferred)

**After implementation:**
- [ ] All new tests pass
- [ ] All existing tests pass  
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Test count documented (e.g., "21 suites, 81 tests")

**Manual verification steps:**
1. [Step to verify visually]
2. [Expected result]

#### Constraints

- Keep changes minimal.
- Avoid scope creep.
- Prefer fixing the root cause over superficial patches.

#### Requirements (for feature requests)

- List functional requirements (bulleted).
- List non-functional requirements (performance, accessibility, compatibility).

#### Non-goals (for feature requests)

- Explicitly list what you are *not* building/changing in this task.

#### Proposed approach

- 3–7 bullets describing the likely implementation steps.
- Include data model/API changes if any.
- Call out risks and unknowns.

#### Files to modify

| File | Change |
|------|--------|
| [path/to/file.tsx] | [specific change description] |

#### Tests to add/update

| Test File | Test Description | Assertions |
|-----------|------------------|------------|
| [path/to/file.test.tsx] | [what the test verifies] | [what to expect] |

---

## Starting the task (how to proceed)

When starting implementation:

1. **Create/confirm a minimal reproduction (bugs) or a minimal spec (features)**
   - Bugs: identify the smallest surface area that reproduces.
   - Features: define the smallest useful increment and how it will be validated.

2. **Add/extend automated coverage FIRST (TDD approach preferred)**
   - Write a failing test that captures the expected behavior BEFORE implementing
   - Prefer unit/integration tests when behavior is deterministic and local.
   - Use E2E when behavior depends on real browser focus/scroll, cross-origin iframes, timing, or multiple subsystems.
   - If you add/change any API route: include tests that cover the route.

3. **Implement the smallest safe change**
   - Bugs: fix the root cause, then verify the regression test passes.
   - Features: implement the planned increment, then verify test coverage.

4. **Verify + document**
   - Run the project's test suite: `npm test`
   - Run TypeScript check: `npx tsc --noEmit`
   - Update `REPORT.md` with: what changed, what tests were added, final test counts.
   - If routes were added/changed: list the routes and the tests covering them.

## When to use E2E (Playwright)

Use E2E when:
- behavior depends on real browser focus/scroll behavior
- interactions cross component boundaries or involve multiple services
- the iframe is cross-origin and jsdom cannot simulate it

E2E acceptance checks typically look like:
- record initial `window.scrollY` (and/or container scrollTop)
- perform click/double-click sequence on the iframe area
- assert scroll position stays within a small tolerance

## Hygiene

- Do not commit large per-video artifacts unless your repo explicitly wants them tracked.
- Prefer gitignored artifact roots (e.g. `debug/`, `artifacts/`).
- It is OK to commit scripts and documentation updates.
- Keep `REPORT.md` next to the artifacts so reviewers can follow the evidence.

---

## 📋 COMPLETE REPORT.md TEMPLATE

Use this exact structure for every video analysis:

```markdown
# Video Analysis Report

**Date:** YYYY-MM-DD  
**Recording:** [filename.mov]  
**Duration:** [MM:SS] ([N] frames at ~1fps)  
**Analysis Method:** Frame-by-frame OCR correlation with transcript timestamps

---

## Executive Summary

[2-4 sentences: What the video shows, what the user requested, how many requirements extracted]

---

## Frame-Transcript-Game Correlation Table

| Timestamp | Frame Range | Game/Screen Visible | User Request | OCR Evidence |
|-----------|-------------|---------------------|--------------|--------------|
| 00:00-00:11 | 1-11 | [Screen name] | "[user quote]" | "[OCR text]" |
| ... | ... | ... | ... | ... |

---

## Design Reference Analysis (if applicable)

**Reference Frame(s):** [frame range where design/mockup is shown]  
**Reference Image Saved:** `reference_design.png`  
**Timestamp:** [when user shows the reference]  
**Design Source:** [Figma / Screenshot / Reference app / Mockup]

### Visual Style Specification (extracted by visually inspecting reference_design.png)

#### Layout & Structure
- Grid columns: [N] columns
- Container padding: [X]px
- Card gap/spacing: [X]px
- Section order: [list sections in order]

#### Card Component Styles
- Card width: [percentage or fixed]
- Card padding: [X]px
- Border-radius: [X]px
- Background color: [color]
- Shadow/elevation: [none/subtle/prominent]

#### Icon Styles
- Icon container size: [X]px × [X]px
- Icon border-radius: [X]px
- Icon background: [color or description]
- Icon position: [top-left / centered / etc.]

#### Typography
- Section title: [size]px, [weight], [color]
- Card title: [size]px, [weight], [color], [case: lowercase/Title Case/etc.]
- Description text: [size]px, [weight], [color] (or "not present")

#### Additional Elements
- Stars/ratings: [horizontal/vertical], [style]
- Other decorations: [describe]

### Visual Comparison Table

| Visual Property | Current Code Value | Reference Design | New Value |
|-----------------|-------------------|------------------|-----------|
| Card borderRadius | [current] | [observed in design] | [new value] |
| Icon size | [current] | [observed in design] | [new value] |
| Title fontSize | [current] | [observed in design] | [new value] |
| Gap between cards | [current] | [observed in design] | [new value] |
| ... | ... | ... | ... |

---

## Extracted Requirements

### 1. [STATUS EMOJI] Requirement Title

**Evidence Chain:**
| Property | Value |
|----------|-------|
| Frames | [e.g., 88-108] |
| Timestamp | [e.g., 01:28-01:48] |
| Screen/Game | [verified via OCR] |
| OCR Proof | "[key text found in frames]" |

**User's Exact Words:**
> "[Direct quote from transcript.vtt]"

**Interpreted Requirement:**
[Clear, actionable statement of what needs to change]

**Implementation:**
- **File(s):** `path/to/file.tsx`
- **Changes:** [specific modifications to make]
- **Tests:** [specific tests to add/update]

**Status:** ✅ IMPLEMENTED / 🔍 IN PROGRESS / ⏳ NOT STARTED

---

[Repeat ### block for each additional requirement]

---

## Test Coverage Summary

| File Modified | Test File | Tests Added/Updated | What They Verify |
|--------------|-----------|---------------------|------------------|
| [Component.tsx] | [Component.test.tsx] | [N tests] | [description] |
| ... | ... | ... | ... |

**Test Results:**
- Test Suites: [N] passed, [N] total
- Tests: [N] passed, [N] total
- TypeScript: ✅ Compiles (`npx tsc --noEmit`)

---

## Files Modified

| Component/Feature | File Path | Change Made |
|------------------|-----------|-------------|
| [name] | [path] | [description] |
| ... | ... | ... |

---

## Verification Checklist

- [ ] All requirements from video addressed
- [ ] Each requirement traceable to frame + timestamp + OCR evidence
- [ ] **Design reference frame saved as `reference_design.png` (if user showed a design)**
- [ ] **Requested user to attach reference image** for AI vision analysis
- [ ] **AI vision analysis performed on attached image** - AI actually "looked at" the image (not just OCR)
- [ ] **All visual properties documented** (colors, spacing, sizing, borders, shadows, typography)
- [ ] **Style values mapped to code changes** (e.g., borderRadius: 12, not "more rounded")
- [ ] **Implementation verified visually** - opened current app and compared to reference
- [ ] Tests added for EVERY code change
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Manual visual verification against reference design completed

---

## Analysis Method Used

1. Extracted [N] frames at 1fps from video
2. Transcribed audio using Whisper  
3. Ran targeted OCR on frame ranges to identify screens
4. Correlated timestamps (VTT) with frame numbers (frame_NNN ≈ NNN seconds)
5. Verified game/screen context via OCR before attributing user requests
6. **Saved reference design frame(s) as `reference_design.png`**
7. **Requested user to attach the reference image to conversation**
8. **AI vision analyzed attached image** - extracted colors, spacing, sizing, borders, shadows, typography
9. Created correlation table linking frames → timestamps → screens → requirements
10. **Mapped visual properties to specific code/style changes**
11. **Verified implementation visually matches reference design**
```
