/** SpeedRead light theme: expressive accents on calm, high-contrast surfaces. */

export const colors = {
  primary: '#6D3FE8',
  primaryDark: '#5426C8',
  primaryLight: '#8D6AEE',

  secondary: '#C33B82',
  secondaryLight: '#E56BA7',
  secondaryDark: '#98245F',

  gradientStart: '#6D3FE8',
  gradientEnd: '#C33B82',

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

  // Surface roles
  background: '#F7F7FB',
  backgroundDark: '#ECECF3',
  backgroundGradientStart: '#FBFAFF',
  backgroundGradientEnd: '#EEF5FF',
  cardBackground: '#FFFFFF',
  surfaceTonal: '#F2EEFF',

  textPrimary: '#252333',
  textSecondary: '#625F70',
  textMuted: '#6F6B7A',

  // Accessible semantic interaction roles. Foreground/background pairings are
  // tested in colors.test.ts and should be preferred over raw accent hex codes.
  onInteractive: '#FFFFFF',
  interactivePrimary: '#5426C8',
  interactivePrimaryPressed: '#431D9F',
  interactiveTeal: '#0F766E',
  interactiveWarm: '#9A3412',
  interactiveInfo: '#175AAB',
  focusRing: '#5426C8',
  disabledForeground: '#5F5B6C',
  disabledSurface: '#ECECF3',
  successForeground: '#116149',
  successSurface: '#E8F5EF',
  errorForeground: '#9F253A',
  errorSurface: '#FDECF0',
  warningForeground: '#704000',
  warningSurface: '#FFF3D6',
  infoForeground: '#174F9C',
  infoSurface: '#EAF2FF',

  // UI feedback colors
  success: '#16815B',
  error: '#C63D4F',
  warning: '#A86100',
  info: '#246BCE',

  // Accent
  accent: '#FF5B37',

  // Neutral colors
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
  display: { fontSize: 40, fontWeight: '800' as const, color: colors.textPrimary, lineHeight: 46 },
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.textPrimary, lineHeight: 33 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.textPrimary, lineHeight: 25 },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '700' as const, color: colors.white },
};

// Game icon backgrounds based on category
export const gameColors: Record<string, string> = {
  RepeatedReading: colors.categorySpeed,
  MainIdeaSprint: colors.categoryMemory,
  StructureScan: colors.categoryFocus,
  EvidenceHunt: colors.categoryFocus,
  ContextBuilder: colors.categoryWord,
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
  LastWordRecall: colors.categoryMemory,
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
    colors: [colors.backgroundGradientStart, colors.backgroundGradientEnd] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  button: {
    colors: [colors.gradientStart, colors.gradientEnd] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  cardIcon: {
    colors: ['#6D7BFF', '#A958FF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  progress: {
    colors: [colors.gradientStart, colors.gradientEnd] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
};

// Per-game icon gradient colors
export const gameGradients: Record<string, readonly [string, string]> = {
  RepeatedReading: ['#1468C7', '#3446C8'],
  MainIdeaSprint: ['#7140D8', '#9B35B8'],
  StructureScan: ['#087F8C', '#1468C7'],
  EvidenceHunt: ['#087F8C', '#1468C7'],
  ContextBuilder: ['#7140D8', '#9B35B8'],
  PowerReader: ['#E94B20', '#B93D17'],
  FlashReading: ['#E94B20', '#B93D17'],
  EyeMovementTraining: ['#1F8A70', '#48A868'],
  SymbolRecognition: ['#E94B20', '#B93D17'],

  ComprehensionTest: ['#D9472C', '#AD275B'],

  VisualSpanExpansion: ['#D93474', '#A32261'],
  TimedPhraseRecognition: ['#D93474', '#A32261'],
  LastWordRecall: ['#7140D8', '#9B35B8'],
  WordPairs: ['#D93474', '#A32261'],
  NumberSearch: ['#D93474', '#A32261'],
  LetterRecognition: ['#D93474', '#A32261'],
  LetterJumble: ['#D93474', '#A32261'],
  WordMismatchGrid: ['#D93474', '#A32261'],
  EvenNumbers: ['#D93474', '#A32261'],
  MemoryRecall: ['#D93474', '#A32261'],

  PatternScanning: ['#7140D8', '#9B35B8'],
  SchulteLetters: ['#7140D8', '#9B35B8'],
  SchulteMix: ['#7140D8', '#9B35B8'],
  NumberRecognition: ['#7140D8', '#9B35B8'],

  TimedWordRecognition: ['#007F9B', '#1C6EBA'],
  SchulteNumbers: ['#007F9B', '#1C6EBA'],
  WordSearchGame: ['#007F9B', '#1C6EBA'],

  TextSearch: ['#1468C7', '#3446C8'],
};
