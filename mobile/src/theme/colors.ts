/**
 * App color palette - modern gradient-based design
 * Primary: Deep blue to purple gradient feel
 * Secondary: Vibrant accents
 */

export const colors = {
  // Primary brand colors
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  
  // Secondary accent colors
  secondary: '#EC4899', // Pink
  secondaryLight: '#F472B6',
  
  // Game category colors (for card icons)
  categorySpeed: '#6366F1', // Indigo - speed/timing games
  categoryMemory: '#8B5CF6', // Purple - memory games
  categoryFocus: '#06B6D4', // Cyan - focus/attention games
  categoryVision: '#10B981', // Emerald - visual training
  categoryWord: '#F59E0B', // Amber - word/letter games
  categoryNumber: '#EF4444', // Red - number games
  
  // Background colors
  background: '#F8FAFC',
  backgroundDark: '#F1F5F9',
  cardBackground: '#FFFFFF',
  
  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  
  // UI feedback colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Neutral colors
  border: '#E2E8F0',
  divider: '#CBD5E1',
  white: '#FFFFFF',
  black: '#000000',
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
