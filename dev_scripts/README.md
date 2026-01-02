Development scripts

This folder contains development-only helpers used for debugging and analysis (e.g., extracting frames from screen recordings).

AI instructions
- See [dev_scripts/AI_INSTRUCTIONS.md](dev_scripts/AI_INSTRUCTIONS.md) for the recommended video → report → task workflow.

Scripts
- dev_scripts/extract_video_frames.sh: Extracts PNG frames at 1 fps (full + downscaled).
- dev_scripts/ocr_frames.sh: Runs OCR on frames and filters by a regex.
- dev_scripts/extract_audio.sh: Extracts mono 16kHz WAV audio for transcription.
- dev_scripts/normalize_audio.sh: Normalizes audio loudness for clearer speech.
- dev_scripts/transcribe_audio.sh: Transcribes audio using whisper.cpp (timestamped VTT + text).
- dev_scripts/analyze_recording.sh: End-to-end pipeline (convert, frames, audio, normalize, transcribe).

Usage
- Organize outputs per video: create a dedicated subfolder under `debug/` for each recording (frames, OCR, audio, reports) so results don’t mix.
- Run scripts via `bash` to avoid executable-bit issues:
	- `bash dev_scripts/extract_video_frames.sh "debug/Screen Recording ....mp4" debug/frames_run`
	- `bash dev_scripts/ocr_frames.sh debug/frames_run_small "(template|error|signature)"`
	- `bash dev_scripts/extract_audio.sh "debug/Screen Recording ....mp4" debug/audio.wav`
	- `bash dev_scripts/normalize_audio.sh debug/audio.wav debug/audio_normalized.wav`
	- `bash dev_scripts/transcribe_audio.sh debug/audio_normalized.wav debug/transcript`
- Or make them executable once: `chmod +x dev_scripts/*.sh`

Example per-video layout
- `debug/2025-12-23_10-27-31/`
	- `frames/` and `frames_small/`
	- `ocr_hits.txt` - OCR text from all frames with frame markers
	- `audio.wav` and `audio_normalized.wav`
	- `transcript.txt`, `transcript.vtt`, `transcript.json`
	- `REPORT.md` - Must include frame-transcript correlation table

## Frame-Transcript Correlation (Critical)

**The key to accurate video analysis is correlating what the user says with what screen is visible.**

### Understanding the relationship:
- **Frames**: Extracted at ~1 fps, so `frame_NNN.png` corresponds to ~NNN seconds into the video
- **Transcript (VTT)**: Contains timestamped speech in HH:MM:SS.mmm format
- **OCR hits**: Contains text recognized from each frame, prefixed with frame filename

### Correlation workflow:
1. Parse transcript to identify user comments and their timestamps
2. Convert timestamps to frame numbers (e.g., 02:34 → frame_154)
3. Check OCR for those frames to identify what screen/game is visible
4. Build a correlation table mapping comments to screens

### Targeted OCR for specific frame ranges:
```bash
# Run OCR on frames 154-170 to identify what game is open
for f in debug/<folder>/frames_small/frame_{154..170}.png; do
  echo "--- $f"; tesseract "$f" - 2>/dev/null
done
```

### What to look for in OCR:
- Game/screen titles (e.g., "Text Search", "Pattern Scanning", "Word Mismatch")
- Component names in DevTools (e.g., "TextSearch", "PatternScanning")
- UI-specific elements that identify the context

### Common pitfalls to avoid:
- **Don't assume**: A comment about "variations" could apply to any game visible at that timestamp
- **Check DevTools**: When DevTools is open, component names reveal the current game
- **Verify frame numbers**: VTT timestamps must be converted to frame numbers accurately

After running the scripts
- Write a short summary of what the video demonstrates (what page/flow, what actions, what outcome) and capture a concrete engineering task.
- Recommended: keep both in the per-video folder in a `REPORT.md` (summary + timeline + task + acceptance criteria), so anyone can review the artifacts and immediately know what needs fixing.

Transcription tooling (recommended)
- Install whisper.cpp CLI: `brew install whisper-cpp`
- Download a model (example):
	- `mkdir -p debug/_models`
	- `curl -L -o debug/_models/ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin`
- Then run transcription:
	- `bash dev_scripts/transcribe_audio.sh debug/audio_normalized.wav debug/transcript`
	- Output: `debug/transcript.txt`, `debug/transcript.vtt`, `debug/transcript.json`

One-command pipeline
- `bash dev_scripts/analyze_recording.sh "debug/Screen Recording ....mov" "debug/2025-12-23_11-21-16"`

If your recording is a .mov
- Some macOS screen recordings may be saved as `.mov`. Convert to `.mp4` first, then run the scripts as usual.
- Example (requires `ffmpeg`):
	- `ffmpeg -i "input.mov" -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart "output.mp4"`

Notes
- These scripts are not required for production.
- This folder is gitignored on purpose.
