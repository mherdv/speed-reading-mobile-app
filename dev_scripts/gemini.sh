#!/bin/bash

# ================================
# CONFIGURATION
# ================================
MODEL="gemini-2.5-flash"
API_KEY="$GEMINI_API_KEY"

if [ $# -eq 0 ]; then
  echo "Usage: ./gemini.sh path/to/image1.png [path/to/image2.png ...]"
  exit 1
fi

if [ -z "$API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set."
  exit 1
fi

# ================================
# REQUEST PROMPT
# ================================
read -r -d '' PROMPT << 'EOF'
Analyze the provided UI screenshot and extract EXACT, READY-TO-USE styles for EVERY visible component.

## CRITICAL: Component-by-Component Analysis

For EACH visible UI block/component, provide:
1. **Component Name** - What is this component called
2. **Purpose** - What is this block for, what does it do
3. **Exact Styles** - All CSS/React Native styles needed to recreate it

---

## SECTION 1: COMPONENT INVENTORY

List EVERY visible component from top to bottom, left to right:

### Component: [Name]
**Purpose:** [What this component does / its function in the UI]
**Location:** [Where it appears - e.g., "Header", "Main content", "Bottom navigation"]

```javascript
// React Native StyleSheet
{
  // Container styles
  backgroundColor: '#XXXXXX',
  width: Xpx | 'X%',
  height: Xpx | 'auto',
  padding: Xpx,
  paddingHorizontal: Xpx,
  paddingVertical: Xpx,
  margin: Xpx,
  marginTop: Xpx,
  marginBottom: Xpx,
  
  // Border & Shape
  borderRadius: Xpx,
  borderWidth: Xpx,
  borderColor: '#XXXXXX',
  
  // Layout
  flexDirection: 'row' | 'column',
  justifyContent: 'center' | 'space-between' | 'flex-start',
  alignItems: 'center' | 'flex-start' | 'stretch',
  gap: Xpx,
  
  // Shadow (if visible)
  shadowColor: '#XXXXXX',
  shadowOffset: { width: X, height: X },
  shadowOpacity: X.X,
  shadowRadius: X,
  elevation: X,
}

// Text styles within this component
{
  fontSize: Xpx,
  fontWeight: 'XXX',
  color: '#XXXXXX',
  lineHeight: Xpx,
  textAlign: 'center' | 'left' | 'right',
}

// Gradient (if applicable)
colors: ['#XXXXXX', '#XXXXXX']
start: { x: X, y: X }
end: { x: X, y: X }
```

---

## SECTION 2: ICONS (SVG CODE)

For EACH icon visible in the UI, provide:

### Icon: [Name/Description]
**Used in:** [Which component uses this icon]
**Size:** Xpx × Xpx
**Color:** #XXXXXX

```svg
<svg width="X" height="X" viewBox="0 0 X X" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Provide the EXACT SVG path data to recreate this icon -->
  <path d="M..." fill="#XXXXXX" />
</svg>
```

**React Native SVG:**
```jsx
<Svg width={X} height={X} viewBox="0 0 X X">
  <Path d="M..." fill="#XXXXXX" />
</Svg>
```

---

## SECTION 3: GLOBAL STYLES

### Color Palette
```javascript
export const colors = {
  primary: '#XXXXXX',        // Main brand color
  secondary: '#XXXXXX',      // Secondary brand color
  background: '#XXXXXX',     // Page/screen background
  surface: '#XXXXXX',        // Card/container background
  textPrimary: '#XXXXXX',    // Main text color
  textSecondary: '#XXXXXX',  // Muted text color
  accent: '#XXXXXX',         // Accent/highlight color
  border: '#XXXXXX',         // Border color
  success: '#XXXXXX',
  error: '#XXXXXX',
  warning: '#XXXXXX',
};
```

### Gradients
```javascript
export const gradients = {
  primary: {
    colors: ['#XXXXXX', '#XXXXXX'],
    start: { x: X, y: X },
    end: { x: X, y: X },
  },
  background: {
    colors: ['#XXXXXX', '#XXXXXX'],
    start: { x: X, y: X },
    end: { x: X, y: X },
  },
};
```

### Spacing
```javascript
export const spacing = {
  xs: X,   // Xpx
  sm: X,   // Xpx
  md: X,   // Xpx
  lg: X,   // Xpx
  xl: X,   // Xpx
  xxl: X,  // Xpx
};
```

### Border Radius
```javascript
export const borderRadius = {
  sm: X,
  md: X,
  lg: X,
  xl: X,
  full: 9999,
};
```

### Typography
```javascript
export const typography = {
  h1: { fontSize: X, fontWeight: 'X', lineHeight: X },
  h2: { fontSize: X, fontWeight: 'X', lineHeight: X },
  body: { fontSize: X, fontWeight: 'X', lineHeight: X },
  caption: { fontSize: X, fontWeight: 'X', lineHeight: X },
  button: { fontSize: X, fontWeight: 'X', lineHeight: X },
};
```

### Shadows
```javascript
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: X },
    shadowOpacity: X.X,
    shadowRadius: X,
    elevation: X,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: X },
    shadowOpacity: X.X,
    shadowRadius: X,
    elevation: X,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: X },
    shadowOpacity: X.X,
    shadowRadius: X,
    elevation: X,
  },
};
```

---

## SECTION 4: LAYOUT STRUCTURE

```
Screen Layout:
├── [Component 1] - height: Xpx, purpose: XXX
│   ├── [Sub-component] - purpose: XXX
│   └── [Sub-component] - purpose: XXX
├── [Component 2] - height: Xpx, purpose: XXX
│   └── Grid (Xx columns, gap: Xpx)
│       ├── [Card component]
│       └── [Card component]
└── [Component 3] - height: Xpx, purpose: XXX
```

---

## Instructions

1. **Be EXHAUSTIVE** - Document EVERY visible component, no matter how small
2. **Extract EXACT values** - Use pixel values, hex colors, precise measurements
3. **Describe PURPOSE** - Explain what each component does functionally
4. **Generate SVG icons** - Provide actual SVG path data that matches the visual appearance
5. **Mark estimates** - Use [estimate] for values you cannot determine exactly
6. **Copy-paste ready** - All code should be directly usable in React Native

Focus on making this a complete implementation guide where a developer can recreate the EXACT UI from your analysis.
EOF

# ================================
# PROCESS EACH IMAGE
# ================================
for IMAGE_PATH in "$@"; do
  if [ ! -f "$IMAGE_PATH" ]; then
    echo "Error: Image file not found: $IMAGE_PATH"
    continue
  fi

  echo ""
  echo "========================================"
  echo "Analyzing: $IMAGE_PATH"
  echo "========================================"
  echo ""

  # Encode image (macOS compatible)
  IMAGE_BASE64=$(base64 -i "$IMAGE_PATH" | tr -d '\n')

  # Create temp files for proper JSON escaping
  TEMP_PROMPT=$(mktemp)
  TEMP_IMAGE=$(mktemp)
  TEMP_JSON=$(mktemp)
  
  # Write prompt and image to temp files
  printf '%s' "$PROMPT" > "$TEMP_PROMPT"
  printf '%s' "$IMAGE_BASE64" > "$TEMP_IMAGE"
  
  # Build JSON using jq with file inputs (avoids argument length limits)
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

  # API call
  curl -s \
    -X POST "https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_JSON" | jq -r '.candidates[0].content.parts[0].text'

  # Cleanup
  rm -f "$TEMP_PROMPT" "$TEMP_IMAGE" "$TEMP_JSON"
done
