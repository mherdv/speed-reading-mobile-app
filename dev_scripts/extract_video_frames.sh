#!/usr/bin/env bash
set -euo pipefail

# Development-only helper
# Extract 1 fps frames (full + downscaled) from a screen recording for debugging.
# Usage:
#   dev_scripts/extract_video_frames.sh "debug/Screen Recording 2025-12-23 at 09.50.15.mp4" [OUT_DIR]

VIDEO_PATH="${1:-}"
OUT_DIR="${2:-debug/frames}"
OUT_DIR_SMALL="${OUT_DIR%/}_small"

if [[ -z "$VIDEO_PATH" ]]; then
  echo "Missing input video path" >&2
  exit 2
fi

mkdir -p "$OUT_DIR" "$OUT_DIR_SMALL"

# Full-res PNG frames at 1fps
ffmpeg -hide_banner -y -i "$VIDEO_PATH" -vf "fps=1" "$OUT_DIR/frame_%03d.png" >/dev/null

# Downscaled frames at 1fps (better for sharing/OCR)
ffmpeg -hide_banner -y -i "$VIDEO_PATH" -vf "fps=1,scale=1600:-1" "$OUT_DIR_SMALL/frame_%03d.png" >/dev/null

echo "Wrote: $OUT_DIR ($(ls -1 "$OUT_DIR" | wc -l | tr -d ' ') frames)"
echo "Wrote: $OUT_DIR_SMALL ($(ls -1 "$OUT_DIR_SMALL" | wc -l | tr -d ' ') frames)"
