#!/bin/bash

# Icon extraction script using Gemini Vision API
MODEL="gemini-2.5-flash"
API_KEY="$GEMINI_API_KEY"

if [ $# -eq 0 ]; then
  echo "Usage: ./gemini_icons.sh path/to/image.png"
  exit 1
fi

if [ -z "$API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set."
  exit 1
fi

IMAGE_PATH="$1"

read -r -d '' PROMPT << 'EOF'
You are a UI design extraction expert specializing in SVG icon paths. Analyze this SpeedRead app screenshot EXTREMELY carefully.

## TASK: EXTRACT EXACT SVG ICONS AND GRADIENTS

Look at EACH game card icon and extract the EXACT SVG path. The icons are white on colored circular backgrounds.

### REQUIRED OUTPUT FORMAT:

For each icon, output EXACTLY this format (ready for React Native):

```typescript
// ICON: [GameName] - [Description]
// Gradient: ['#START_HEX', '#END_HEX']
[GameId]: (
  <Path d="M... exact path here ..." />
),
```

### ICONS TO EXTRACT (look at the image carefully):

1. **PowerReader** - Lightning bolt (⚡) - orange/red gradient background
2. **FlashReading** - Lightbulb - orange gradient background  
3. **ComprehensionTest** - Open book with pages - orange/pink gradient
4. **VisualSpanExpansion** (Span) - Target/bullseye - pink/magenta gradient
5. **PatternScanning** (Patterns) - 4 dots in square pattern - purple gradient
6. **TimedWordRecognition** (Words) - Document with pencil - teal/cyan gradient
7. **TimedPhraseRecognition** (Phrases) - Clock face - pink gradient
8. **WordPairs** (Pairs) - Two arrows exchanging - pink gradient
9. **SchulteNumbers** (Schulte) - Number "5" - teal gradient
10. **SchulteLetters** (Letters) - Letter "Z" - purple gradient
11. **SchulteMix** (Mix) - Hash symbol "#" - purple gradient
12. **EyeMovementTraining** (Eyes) - Eye symbol - orange gradient
13. **VisualSpanExpansion** (Span with brain) - Brain icon - pink gradient  
14. **PatternScanning** - 4 squares grid - purple gradient
15. **TextSearch** (Text) - Document with horizontal lines - blue gradient
16. **WordSearchGame** (Search) - Magnifying glass - teal gradient
17. **NumberSearch** (Numbers) - "2 4 5 6" grid - pink gradient
18. **LetterRecognition** (Letters Aa) - "Aa" text - pink gradient
19. **NumberRecognition** (Digits 123) - "123" text - purple gradient
20. **SymbolRecognition** (Symbols) - Infinity "∞" - orange gradient
21. **LetterJumble** (Jumble) - Crossed/shuffle arrows - pink gradient
22. **WordMismatchGrid** (Mismatch) - Not-equal "≠" - pink gradient
23. **EvenNumbers** (Even) - Number "2" - pink gradient

### GRADIENT COLORS TO EXTRACT:

Look at each icon's circular background and identify the gradient:
- Orange/Red: starts warm, goes to deeper orange/red
- Pink/Magenta: various pink shades
- Purple/Blue: purple to blue tones
- Teal/Cyan: blue-green tones

Output gradients as:
```typescript
gameGradients: {
  PowerReader: ['#FF6B35', '#FF8E53'],
  // ... etc for each game
}
```

### PROGRESS BAR GRADIENT:
Extract the exact gradient used in the progress bars (the thin colored bars at bottom of cards).

BE EXTREMELY PRECISE. These SVG paths must render correctly in React Native.
Each path should use viewBox="0 0 24 24" coordinate system.
Use stroke-based paths where appropriate (stroke="currentColor" strokeWidth="2").
EOF

echo "Analyzing: $IMAGE_PATH"
echo "Extracting icons and gradients..."
echo ""

# Encode image
IMAGE_BASE64=$(base64 -i "$IMAGE_PATH" | tr -d '\n')

# Create temp files
TEMP_PROMPT=$(mktemp)
TEMP_IMAGE=$(mktemp)
TEMP_JSON=$(mktemp)

printf '%s' "$PROMPT" > "$TEMP_PROMPT"
printf '%s' "$IMAGE_BASE64" > "$TEMP_IMAGE"

jq -n \
  --rawfile prompt "$TEMP_PROMPT" \
  --rawfile image_data "$TEMP_IMAGE" \
  '{
    contents: [{
      role: "user",
      parts: [
        { text: $prompt },
        {
          inline_data: {
            mime_type: "image/png",
            data: $image_data
          }
        }
      ]
    }]
  }' > "$TEMP_JSON"

curl -s \
  -X POST "https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_JSON" | jq -r '.candidates[0].content.parts[0].text'

rm -f "$TEMP_PROMPT" "$TEMP_IMAGE" "$TEMP_JSON"
