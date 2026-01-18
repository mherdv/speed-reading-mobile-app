#!/bin/bash

# Icon generation script using Gemini API - generates icons from game descriptions
MODEL="${MODEL:-gemini-2.5-pro}"
API_KEY="$GEMINI_API_KEY"

if [ -z "$API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set."
  exit 1
fi

read -r -d '' PROMPT << 'EOF'
You are an expert SVG icon designer. Design simple, clean icons for a speed reading app.

## GAMES AND THEIR DESCRIPTIONS:

1. **PowerReader** - Rapid text chunks displayed to increase reading speed → Icon: Lightning bolt (⚡)
2. **LetterRecognition** - Find target letters in a grid → Icon: Letter "Aa" 
3. **TextSearch** - Locate target words in passages → Icon: Document with magnifying glass
4. **EyeMovementTraining** - Follow moving target for eye muscles → Icon: Eye with arrow
5. **VisualSpanExpansion** - Widen visual field, peripheral vision → Icon: Concentric circles/target
6. **FlashReading** - Words flash briefly for instant recognition → Icon: Lightbulb or flash
7. **ComprehensionTest** - Read and answer questions → Icon: Open book with checkmark
8. **MemoryRecall** - Memorize and recall sequences → Icon: Brain
9. **NumberRecognition** - Identify target numbers quickly → Icon: "123" or digits
10. **SymbolRecognition** - Identify symbols among distractors → Icon: Infinity symbol (∞)
11. **PatternScanning** - Locate visual patterns in grid → Icon: 4 dots/squares pattern
12. **TimedPhraseRecognition** - Phrases flash briefly → Icon: Clock with text
13. **TimedWordRecognition** - Words appear briefly → Icon: Document with timer
14. **WordMismatchGrid** - Find the different word → Icon: Not-equal symbol (≠)
15. **WordPairs** - Match related words → Icon: Two arrows exchanging ⇄
16. **LetterJumble** - Unscramble letters → Icon: Shuffle/crossed arrows
17. **SchulteNumbers** - Find 1-25 in grid, peripheral vision → Icon: Number "5"
18. **SchulteLetters** - Find A-Y in order → Icon: Letter "Z"
19. **SchulteMix** - Alternating 1,A,2,B sequence → Icon: Hash "#"
20. **WordSearchGame** - Find words in letter grid → Icon: Magnifying glass
21. **NumberSearch** - Find target numbers in grid → Icon: Grid with numbers
22. **EvenNumbers** - Identify even numbers → Icon: Number "2"

## REQUIREMENTS:

1. viewBox="0 0 24 24" - paths must fit in 24x24 coordinate system
2. Keep paths SIMPLE - max 50-80 characters per path
3. Icons display at 20px white on colored backgrounds
4. Use stroke-based paths: strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
5. For solid shapes use fill="currentColor"

## OUTPUT FORMAT (TypeScript for React Native):

```typescript
const ICON_DATA: Record<string, React.ReactNode> = {
  // PowerReader - Lightning bolt
  PowerReader: (
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
  ),
  // Continue for ALL 22 games...
};
```

Output ONLY the code block, no explanations.
EOF

echo "Generating icons from game descriptions..."
echo "Using model: $MODEL"
echo ""

# Create temp files
TEMP_PROMPT=$(mktemp)
TEMP_JSON=$(mktemp)

printf '%s' "$PROMPT" > "$TEMP_PROMPT"

jq -n \
  --rawfile prompt "$TEMP_PROMPT" \
  '{
    contents: [{
      role: "user",
      parts: [
        { text: $prompt }
      ]
    }]
  }' > "$TEMP_JSON"

curl -s \
  -X POST "https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_JSON" | jq -r '.candidates[0].content.parts[0].text'

rm -f "$TEMP_PROMPT" "$TEMP_JSON"
