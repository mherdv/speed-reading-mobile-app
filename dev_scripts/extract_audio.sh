#!/usr/bin/env bash
set -euo pipefail

# Development-only helper
# Extract audio track from a screen recording (useful for transcription).
# Usage:
#   dev_scripts/extract_audio.sh "debug/Screen Recording ... .mp4" [OUT_WAV]

VIDEO_PATH="${1:-}"
OUT_WAV="${2:-debug/audio.wav}"

if [[ -z "$VIDEO_PATH" ]]; then
  echo "Missing input video path" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUT_WAV")"

# If there's no audio stream, ffmpeg will fail; we surface that clearly.
ffmpeg -hide_banner -y -i "$VIDEO_PATH" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$OUT_WAV"

echo "Wrote: $OUT_WAV"
