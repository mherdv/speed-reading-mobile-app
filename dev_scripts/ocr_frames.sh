#!/usr/bin/env bash
set -euo pipefail

# Development-only helper
# OCR extracted frames and grep for keywords to find where UI text appears.
# Requires: tesseract
# Usage:
#   dev_scripts/ocr_frames.sh "debug/frames_small" "variable types|signature|string\[\]|error"

FRAMES_DIR="${1:-}"
PATTERN="${2:-}"

if [[ -z "$FRAMES_DIR" || -z "$PATTERN" ]]; then
  echo "Usage: $0 <frames_dir> <grep_pattern>" >&2
  exit 2
fi

shopt -s nullglob

for f in "$FRAMES_DIR"/*.png; do
  txt=$(tesseract "$f" stdout --psm 6 2>/dev/null | tr '\n' ' ' | sed 's/  */ /g')
  if echo "$txt" | grep -Eiq "$PATTERN"; then
    echo "--- $f"
    echo "$txt" | head -c 800
    echo
  fi
done
