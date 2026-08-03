/** SpeedRead light theme, derived from the navy and cyan brand mark. */

export const colors = {
  brandNavy: '#0E4979',
  brandCyan: '#1BA3DD',

  primary: '#0E4979',
  primaryDark: '#083B65',
  primaryLight: '#1A6798',

  secondary: '#0B628F',
  secondaryLight: '#1BA3DD',
  secondaryDark: '#0B557E',

  gradientStart: '#0E4979',
  gradientEnd: '#0B628F',

  gradientIconStart: '#155A88',
  gradientIconEnd: '#0D769E',

  gradientProgressStart: '#1BA3DD',
  gradientProgressEnd: '#0B628F',

  // Game category colors (for card icons)
  categorySpeed: '#0E4979',
  categoryMemory: '#155A88',
  categoryFocus: '#0B628F',
  categoryVision: '#166A9A',
  categoryWord: '#0D769E',
  categoryNumber: '#19759B',

  // Surface roles
  background: '#F6FAFC',
  backgroundDark: '#E8F1F5',
  backgroundGradientStart: '#FBFDFE',
  backgroundGradientEnd: '#EAF7FC',
  cardBackground: '#FFFFFF',
  surfaceTonal: '#E7F5FB',

  textPrimary: '#142836',
  textSecondary: '#506572',
  textMuted: '#607481',

  // Accessible semantic interaction roles. Foreground/background pairings are
  // tested in colors.test.ts and should be preferred over raw accent hex codes.
  onInteractive: '#FFFFFF',
  interactivePrimary: '#0E4979',
  interactivePrimaryPressed: '#083B65',
  interactiveTeal: '#0F766E',
  interactiveWarm: '#9A3412',
  interactiveInfo: '#0E5D8A',
  focusRing: '#0E4979',
  disabledForeground: '#586C78',
  disabledSurface: '#E8F1F5',
  successForeground: '#116149',
  successSurface: '#E8F5EF',
  errorForeground: '#9F253A',
  errorSurface: '#FDECF0',
  warningForeground: '#704000',
  warningSurface: '#FFF3D6',
  infoForeground: '#0E4979',
  infoSurface: '#E7F5FB',

  // UI feedback colors
  success: '#16815B',
  error: '#C63D4F',
  warning: '#A86100',
  info: '#0B628F',

  // Accent
  accent: '#0D769E',

  // Neutral colors
  border: '#D9E8EF',
  divider: '#D9E8EF',
  white: '#FFFFFF',
  black: '#000000',

  // Shadow
  shadow: 'rgba(14,73,121,0.12)',

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
  WpmTest: colors.categorySpeed,
  MainIdeaSprint: colors.categoryMemory,
  StructureScan: colors.categoryFocus,
  EvidenceHunt: colors.categoryFocus,
  ContextBuilder: colors.categoryWord,
  PowerReader: colors.categorySpeed,
  CenterLineReader: colors.categorySpeed,
  LetterRecognition: colors.categoryWord,
  TextSearch: colors.categoryFocus,
  EyeMovementTraining: colors.categoryVision,
  ReadingSaccades: colors.categoryVision,
  VisualSpanExpansion: colors.categoryVision,
  FlashReading: colors.categorySpeed,
  WordsRecall: colors.categoryMemory,
  SentenceRecall: colors.categoryMemory,
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
    colors: [colors.gradientIconStart, colors.gradientIconEnd] as const,
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
  RepeatedReading: ['#0E4979', '#155A88'],
  WpmTest: ['#0E4979', '#155A88'],
  MainIdeaSprint: ['#155A88', '#0B628F'],
  StructureScan: ['#0B628F', '#0D769E'],
  EvidenceHunt: ['#0B628F', '#0D769E'],
  ContextBuilder: ['#155A88', '#0B628F'],
  PowerReader: ['#0E4979', '#0D769E'],
  CenterLineReader: ['#0E4979', '#0D769E'],
  FlashReading: ['#0E4979', '#0D769E'],
  WordsRecall: ['#155A88', '#0B628F'],
  SentenceRecall: ['#155A88', '#0B628F'],
  EyeMovementTraining: ['#166A9A', '#19759B'],
  ReadingSaccades: ['#0B557E', '#0D769E'],
  SymbolRecognition: ['#0E4979', '#0D769E'],

  ComprehensionTest: ['#0E4979', '#0B628F'],

  VisualSpanExpansion: ['#0B557E', '#0D769E'],
  TimedPhraseRecognition: ['#0B557E', '#0D769E'],
  LastWordRecall: ['#155A88', '#0B628F'],
  WordPairs: ['#0B557E', '#0D769E'],
  NumberSearch: ['#0B557E', '#0D769E'],
  LetterRecognition: ['#0B557E', '#0D769E'],
  LetterJumble: ['#0B557E', '#0D769E'],
  WordMismatchGrid: ['#0B557E', '#0D769E'],
  EvenNumbers: ['#0B557E', '#0D769E'],
  MemoryRecall: ['#0B557E', '#0D769E'],

  PatternScanning: ['#155A88', '#0B628F'],
  SchulteLetters: ['#155A88', '#0B628F'],
  SchulteMix: ['#155A88', '#0B628F'],
  NumberRecognition: ['#155A88', '#0B628F'],

  TimedWordRecognition: ['#0E5D8A', '#0D769E'],
  SchulteNumbers: ['#0E5D8A', '#0D769E'],
  WordSearchGame: ['#0E5D8A', '#0D769E'],

  TextSearch: ['#0E4979', '#155A88'],
};
