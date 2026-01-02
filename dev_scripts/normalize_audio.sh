#!/usr/bin/env bash
set -euo pipefail

# Development-only helper
# Normalize audio loudness for easier listening/transcription.
# Usage:
#   bash dev_scripts/normalize_audio.sh <in.wav> <out.wav>
# Example:
#   bash dev_scripts/normalize_audio.sh debug/audio.wav debug/audio_normalized.wav

IN_WAV="${1:-}"
OUT_WAV="${2:-}"

if [[ -z "$IN_WAV" || -z "$OUT_WAV" ]]; then
  echo "Usage: $0 <in.wav> <out.wav>" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUT_WAV")"

# Single-pass loudnorm. Good enough for speech intelligibility.
# Output: 16kHz mono PCM WAV (keeps whisper.cpp happy).
ffmpeg -hide_banner -y -i "$IN_WAV" \
  -af "loudnorm=I=-16:LRA=11:TP=-1.5" \
  -ac 1 -ar 16000 -c:a pcm_s16le \
  "$OUT_WAV"

echo "Wrote: $OUT_WAV"
