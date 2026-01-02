/**
 * App color palette - SpeedRead design system
 * Light blue background with white cards
 * Orange/blue accent colors
 */

export const colors = {
  // Primary brand colors
  primary: '#4A90D9', // Main blue
  primaryDark: '#3A7BC8',
  primaryLight: '#6BA8E5',
  
  // Secondary accent colors (orange/gradient)
  secondary: '#F5A623', // Orange
  secondaryLight: '#F7B84C',
  secondaryDark: '#E09000',
  
  // Gradient colors for buttons
  gradientStart: '#F5A623', // Orange
  gradientEnd: '#E97B3C', // Darker orange
  
  // Game category colors (for card icons)
  categorySpeed: '#6A8FD4', // Blue - speed/timing games
  categoryMemory: '#9B7BD4', // Purple - memory games
  categoryFocus: '#5BC0DE', // Cyan - focus/attention games
  categoryVision: '#5CB85C', // Green - visual training
  categoryWord: '#F5A623', // Orange - word/letter games
  categoryNumber: '#D9534F', // Red - number games
  
  // Background colors
  background: '#E8F4FC', // Light blue background
  backgroundDark: '#D5EAF7',
  cardBackground: '#FFFFFF',
  
  // Text colors
  textPrimary: '#2C3E50',
  textSecondary: '#5D6D7E',
  textMuted: '#95A5A6',
  
  // UI feedback colors
  success: '#5CB85C',
  error: '#D9534F',
  warning: '#F5A623',
  info: '#5BC0DE',
  
  // Neutral colors
  border: '#E1E8ED',
  divider: '#D5DCE1',
  white: '#FFFFFF',
  black: '#000000',
  
  // Star rating color
  starActive: '#F5A623',
  starInactive: '#E1E8ED',
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
};
