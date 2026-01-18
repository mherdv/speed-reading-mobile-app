/**
 * App color palette - SpeedRead design system
 * Extracted from Gemini Vision analysis
 * Purple/Pink gradients with light blue background
 */

export const colors = {
  // Primary brand colors (Purple) - from Gemini analysis
  primary: '#8E5DFF',
  primaryDark: '#7A4DE6',
  primaryLight: '#A87FFF',
  
  // Secondary accent colors (Pink/Magenta) - from Gemini analysis
  secondary: '#C775D0',
  secondaryLight: '#D599DC',
  secondaryDark: '#B55DC0',
  
  // Gradient colors for buttons (Purple → Pink) - from Gemini analysis
  gradientStart: '#8E5DFF',
  gradientEnd: '#C775D0',
  
  // Alternative gradient colors for card icons (Blue to Purple)
  gradientIconStart: '#6D7BFF',
  gradientIconEnd: '#A958FF',
  
  // Progress bar gradient
  gradientProgressStart: '#A88BEB',
  gradientProgressEnd: '#6E53B0',
  
  // Game category colors (for card icons)
  categorySpeed: '#6C4EC7', // Purple - speed/timing games
  categoryMemory: '#9B7BD4', // Light Purple - memory games
  categoryFocus: '#5BC0DE', // Cyan - focus/attention games
  categoryVision: '#5CB85C', // Green - visual training
  categoryWord: '#E642A5', // Pink - word/letter games
  categoryNumber: '#FF5B37', // Orange - number games
  
  // Background colors
  background: '#D6E8FC', // Light blue background
  backgroundDark: '#C5DCEF',
  backgroundGradientStart: '#D6E8FC',
  backgroundGradientEnd: '#E0F0FF',
  cardBackground: '#FFFFFF',
  
  // Text colors (from Gemini analysis)
  textPrimary: '#343A40',
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',
  
  // UI feedback colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#5BC0DE',
  
  // Accent
  accent: '#FF5B37',
  
  // Neutral colors (from Gemini analysis)
  border: '#E9ECEF',
  divider: '#E9ECEF',
  white: '#FFFFFF',
  black: '#000000',
  
  // Shadow
  shadow: 'rgba(0,0,0,0.1)',
  
  // Star rating color
  starActive: '#F5A623',
  starInactive: '#E1E8ED',
};

// Spacing system (pixels)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow presets (React Native format)
export const shadows = {
  small: {
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Typography presets
export const typography = {
  h1: { fontSize: 24, fontWeight: '600' as const, color: colors.textPrimary, lineHeight: 32 },
  h2: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600' as const, color: colors.white },
};

// Game icon backgrounds based on category
export const gameColors: Record<string, string> = {
  PowerReader: colors.categorySpeed,
  LetterRecognition: colors.categoryWord,
  TextSearch: colors.categoryFocus,
  EyeMovementTraining: colors.categoryVision,
  VisualSpanExpansion: colors.categoryVision,
  FlashReading: colors.categorySpeed,
  ComprehensionTest: colors.categoryMemory,
  MemoryRecall: colors.categoryMemory,
  NumberRecognition: colors.categoryNumber,
  SymbolRecognition: colors.categoryFocus,
  PatternScanning: colors.categoryFocus,
  TimedPhraseRecognition: colors.categorySpeed,
  TimedWordRecognition: colors.categorySpeed,
  WordMismatchGrid: colors.categoryWord,
  WordPairs: colors.categoryWord,
  LetterJumble: colors.categoryWord,
  SchulteNumbers: colors.categoryNumber,
  SchulteLetters: colors.categoryWord,
  SchulteMix: colors.categoryFocus,
  WordSearchGame: colors.categoryWord,
  NumberSearch: colors.categoryNumber,
  EvenNumbers: colors.categoryNumber,
};

// Gradient definitions for expo-linear-gradient
export const gradients = {
  background: {
    colors: ['#F7FBFF', '#E0F0FF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  button: {
    colors: ['#834BFF', '#FF4B8F'] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  cardIcon: {
    colors: ['#6D7BFF', '#A958FF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  progress: {
    colors: ['#834BFF', '#FF4B8F'] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
};

// Per-game icon gradient colors - from Gemini-3-Flash-Preview Vision analysis
export const gameGradients: Record<string, readonly [string, string]> = {
  // Orange games - Gradient: ['#FF6E37', '#FD8951'] or ['#FF7641', '#FFA86A']
  PowerReader: ['#FF6E37', '#FD8951'],
  FlashReading: ['#FF7641', '#FFA86A'],
  EyeMovementTraining: ['#FF7641', '#FFA86A'],
  SymbolRecognition: ['#FF7641', '#FFA86A'],
  
  // Orange-Pink games - Gradient: ['#FF6E37', '#FF9F64']
  ComprehensionTest: ['#FF6E37', '#FF9F64'],
  
  // Pink games - Gradient: ['#FF4B8F', '#FF86A7']
  VisualSpanExpansion: ['#FF4B8F', '#FF86A7'],
  TimedPhraseRecognition: ['#FF4B8F', '#FF86A7'],
  WordPairs: ['#FF4B8F', '#FF86A7'],
  NumberSearch: ['#FF4B8F', '#FF86A7'],
  LetterRecognition: ['#FF4B8F', '#FF86A7'],
  LetterJumble: ['#FF4B8F', '#FF86A7'],
  WordMismatchGrid: ['#FF4B8F', '#FF86A7'],
  EvenNumbers: ['#FF4B8F', '#FF86A7'],
  MemoryRecall: ['#FF4B8F', '#FF86A7'],
  
  // Purple games - Gradient: ['#A44FFD', '#C47DFF']
  PatternScanning: ['#A44FFD', '#C47DFF'],
  SchulteLetters: ['#A44FFD', '#C47DFF'],
  SchulteMix: ['#A44FFD', '#C47DFF'],
  NumberRecognition: ['#A44FFD', '#C47DFF'],
  
  // Teal games - Gradient: ['#2FB9FF', '#5FD4FF']
  TimedWordRecognition: ['#2FB9FF', '#5FD4FF'],
  SchulteNumbers: ['#2FB9FF', '#5FD4FF'],
  WordSearchGame: ['#2FB9FF', '#5FD4FF'],
  
  // Blue games - Gradient: ['#2FB9FF', '#2D9FFF']
  TextSearch: ['#2FB9FF', '#2D9FFF'],
};
