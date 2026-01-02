#!/usr/bin/env bash
set -euo pipefail

# Development-only helper
# End-to-end pipeline:
# - Create per-video debug folder
# - Convert .mov -> .mp4 (if needed)
# - Extract 1fps frames (full + downscaled)
# - Extract audio wav
# - Normalize audio for speech
# - Transcribe (whisper.cpp) to txt/vtt/json
#
# Usage:
#   bash dev_scripts/analyze_recording.sh "debug/Screen Recording ....mov" debug/2025-12-23_11-21-16

IN_VIDEO="${1:-}"
OUT_DIR="${2:-}"

if [[ -z "$IN_VIDEO" || -z "$OUT_DIR" ]]; then
  echo "Usage: $0 <input_video.(mov|mp4)> <out_dir>" >&2
  exit 2
fi

mkdir -p "$OUT_DIR"

VIDEO_EXT="${IN_VIDEO##*.}"
VIDEO_MP4="$OUT_DIR/video.mp4"

if [[ "$VIDEO_EXT" == "mov" || "$VIDEO_EXT" == "MOV" ]]; then
  ffmpeg -hide_banner -y -i "$IN_VIDEO" -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart "$VIDEO_MP4" >/dev/null
else
  # If it's already mp4, copy to the standard location to keep later steps consistent.
  cp -f "$IN_VIDEO" "$VIDEO_MP4"
fi

echo "Video: $VIDEO_MP4"

bash dev_scripts/extract_video_frames.sh "$VIDEO_MP4" "$OUT_DIR/frames"

bash dev_scripts/extract_audio.sh "$VIDEO_MP4" "$OUT_DIR/audio.wav" || {
  echo "No audio stream found; skipping transcription." >&2
  exit 0
}

bash dev_scripts/normalize_audio.sh "$OUT_DIR/audio.wav" "$OUT_DIR/audio_normalized.wav"

# Optional: voice activity segments (requires whisper-cpp vad-speech-segments + Silero VAD model)
# Note: transcript.vtt already contains speech timestamps, so VAD is often redundant
# MODELS_DIR="$(dirname "$0")/../debug/_models"
# if command -v vad-speech-segments >/dev/null 2>&1 && [[ -f "$MODELS_DIR/silero-vad.bin" ]]; then
#   vad-speech-segments -vm "$MODELS_DIR/silero-vad.bin" -f "$OUT_DIR/audio_normalized.wav" -np > "$OUT_DIR/vad_segments.txt" 2>/dev/null || true
#   echo "Wrote: $OUT_DIR/vad_segments.txt"
# fi

bash dev_scripts/transcribe_audio.sh "$OUT_DIR/audio_normalized.wav" "$OUT_DIR/transcript" || true

echo "Done: $OUT_DIR"
