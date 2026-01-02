#!/usr/bin/env bash
set -euo pipefail

# Development-only helper
# Transcribe audio using whisper.cpp (installed via `brew install whisper-cpp`).
# Produces both .txt and .vtt outputs for timestamp alignment.
#
# Usage:
#   bash dev_scripts/transcribe_audio.sh <in.wav> <out_prefix> [model]
#
# Example:
#   bash dev_scripts/transcribe_audio.sh debug/audio_normalized.wav debug/transcript
#
# Notes:
# - Requires a model file. If missing, this script prints download instructions.

IN_WAV="${1:-}"
OUT_PREFIX="${2:-}"
MODEL_PATH="${3:-}"  # optional

if [[ -z "$IN_WAV" || -z "$OUT_PREFIX" ]]; then
  echo "Usage: $0 <in.wav> <out_prefix> [model_path]" >&2
  exit 2
fi

WHISPER_BIN="$(command -v whisper-cli || true)"
if [[ -z "$WHISPER_BIN" ]]; then
  echo "Missing whisper-cli. Install via: brew install whisper-cpp" >&2
  exit 2
fi

# Default model location inside repo-local debug folder to avoid polluting HOME.
DEFAULT_MODEL="debug/_models/ggml-small.en.bin"
MODEL="${MODEL_PATH:-$DEFAULT_MODEL}"

if [[ ! -f "$MODEL" ]]; then
  echo "Missing model file: $MODEL" >&2
  echo "Download one of the ggml models (e.g. small.en) and place it here." >&2
  echo "Example:" >&2
  echo "  mkdir -p debug/_models" >&2
  echo "  curl -L -o \"$DEFAULT_MODEL\" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUT_PREFIX")"

# Generate:
# - <prefix>.txt  (plain transcript)
# - <prefix>.vtt  (timestamps)
# - <prefix>.json (segment metadata)
"$WHISPER_BIN" \
  -m "$MODEL" \
  -f "$IN_WAV" \
  -otxt -ovtt -oj \
  -of "$OUT_PREFIX" \
  >/dev/null

echo "Wrote: ${OUT_PREFIX}.txt"
echo "Wrote: ${OUT_PREFIX}.vtt"
echo "Wrote: ${OUT_PREFIX}.json"
