#!/bin/bash

# ================================
# GEMINI UI REDESIGN AUTOMATION
# ================================

MODEL="gemini-2.5-flash"
OUTPUT_DIR="../debug/design"
mkdir -p "$OUTPUT_DIR"

# Load API key
if [ -z "$GEMINI_API_KEY" ]; then
  if [ -f "../mobile/.env" ]; then
    export $(grep -v '^#' ../mobile/.env | xargs)
  fi
fi

API_KEY="$GEMINI_API_KEY"
if [ -z "$API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set."
  exit 1
fi

# Define Components
GAMES=(
  "ComprehensionTest" "EvenNumbers" "EyeMovementTraining" "FlashReading"
  "LetterJumble" "LetterRecognition" "MemoryRecall" "NumberRecognition"
  "NumberSearch" "PatternScanning" "PowerReader" "SchulteLetters"
  "SchulteMix" "SchulteNumbers" "SymbolRecognition" "TextSearch"
  "TimedPhraseRecognition" "TimedWordRecognition" "VisualSpanExpansion"
  "WordMismatchGrid" "WordPairs" "WordSearchGame"
)

SCREENS=("ExerciseScreen" "GameScreen")

# Function to get file path
get_file_path() {
  local name="$1"
  if [[ " ${SCREENS[@]} " =~ " ${name} " ]]; then
    echo "../mobile/src/screens/${name}.tsx"
  else
    echo "../mobile/src/games/${name}/${name}.tsx"
  fi
}

# Function to generate prompt
generate_prompt() {
  local name="$1"
  local code_path="$2"
  local code_content=$(cat "$code_path")
  local icon_path="../debug/iconify_icons/${name}.svg"
  local icon_svg=""
  
  if [ -f "$icon_path" ]; then
    icon_svg=$(cat "$icon_path")
  fi

  cat << EOF
You are an expert mobile UI/UX designer specializing in React Native applications. 
I need you to redesign the '$name' component for a speed reading training app.
The goal is to redesign this page to MATCH THE HOME SCREEN DESIGN style, using the specific color palette and design system provided below.

## PROJECT CONTEXT
This is a mobile speed reading training app. The design should be:
- **Premium & Modern**: Subtle shadows, smooth gradients, refined typography.
- **Consistent**: Match the Home screen's visual language (light blue background, purple/pink accents).
- **Engaging**: Micro-interactions, clear feedback.
- **Accessible**: High contrast, large touch targets.

## DESIGN SYSTEM (from mobile/src/theme/colors.ts)

\`\`\`typescript
export const colors = {
  // Primary brand colors (Purple)
  primary: '#8E5DFF',
  primaryDark: '#7A4DE6',
  primaryLight: '#A87FFF',
  
  // Secondary accent colors (Pink/Magenta)
  secondary: '#C775D0',
  secondaryLight: '#D599DC',
  secondaryDark: '#B55DC0',
  
  // Gradients
  gradientStart: '#8E5DFF',
  gradientEnd: '#C775D0',
  backgroundGradientStart: '#D6E8FC',
  backgroundGradientEnd: '#E0F0FF',
  
  // Backgrounds
  background: '#D6E8FC', // Light blue background
  cardBackground: '#FFFFFF',
  
  // Text
  textPrimary: '#343A40',
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',
  
  // Feedback
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  
  // UI Elements
  border: '#E9ECEF',
  shadow: 'rgba(0,0,0,0.1)',
  borderRadius: { md: 12, lg: 16, xl: 24 },
  spacing: { sm: 8, md: 16, lg: 24, xl: 32 }
};
\`\`\`

## COMPONENT TO REDESIGN: $name

### Current Code:
\`\`\`tsx
$code_content
\`\`\`

### Current Icon (Reference):
\`\`\`svg
$icon_svg
\`\`\`

---

## REDESIGN INSTRUCTIONS

Please provide a comprehensive redesign specification in Markdown format.

### 1. Visual Design Analysis
- Analyze current state vs. desired "Home Screen" style.
- Identify UI/UX improvements.

### 2. Redesigned Layout Specification
- **Structure**: Header (transparent/gradient?), Game Area (card-based?), Controls (floating/fixed?).
- **Background**: Use \`LinearGradient\` with \`backgroundGradientStart\` -> \`backgroundGradientEnd\`.
- **Cards**: Use \`cardBackground\` with \`borderRadius.xl\` and \`shadows\`.
- **Typography**: Define styles using the provided colors.

### 3. Icon & Graphics
- If the component needs an icon, provide an updated SVG code that matches the style (e.g., using gradients or specific colors).
- Specify where to place the icon.

### 4. Animation (Reanimated)
- Specify entry animations (FadeInUp).
- Feedback animations for interactions.

### 5. Implementation Details
- Provide a complete \`StyleSheet.create({ ... })\` block with exact values.
- Explain how to apply the \`LinearGradient\` background.

### 6. Full Component Code Structure (Optional but helpful)
- Outline the component structure with the new design applied.

**IMPORTANT**: The output must be ready for a developer to implement immediately. Be specific with values.

EOF
}

# Process Component
process_component() {
  local name="$1"
  local file_path=$(get_file_path "$name")
  
  if [ ! -f "$file_path" ]; then
    echo "  Error: File not found: $file_path"
    return
  fi
  
  echo "Processing $name..."
  
  local prompt=$(generate_prompt "$name" "$file_path")
  
  # Escape for JSON
  local escaped_prompt=$(echo "$prompt" | jq -Rs .)
  
  local payload=$(cat << PAYLOAD
{
  "contents": [{
    "parts": [{
      "text": $escaped_prompt
    }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 8192
  }
}
PAYLOAD
)

  # Call API
  local response=$(curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload")
    
  # Extract text
  local result=$(echo "$response" | jq -r '.candidates[0].content.parts[0].text // empty')
  
  if [ -z "$result" ]; then
    echo "  Error: No response from Gemini"
    echo "$response" > "$OUTPUT_DIR/${name}_error.json"
  else
    echo "$result" > "$OUTPUT_DIR/${name}_redesign.md"
    echo "  Saved to $OUTPUT_DIR/${name}_redesign.md"
  fi
}

# Main Loop
echo "Starting Redesign Process..."
echo "Target: Match Home Screen Design"

# Process Games
for game in "${GAMES[@]}"; do
  process_component "$game"
  sleep 2 # Rate limiting
done

# Process Screens
for screen in "${SCREENS[@]}"; do
  process_component "$screen"
  sleep 2
done

echo "Done!"
