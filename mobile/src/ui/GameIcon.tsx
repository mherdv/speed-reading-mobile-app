import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

type Props = {
  name: string;
  size?: number;
  color?: string;
};

// SVG icon paths for each game
const ICON_DATA: Record<string, React.ReactNode> = {
  PowerReader: (
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  ),
  FlashReading: (
    <>
      <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
      <Path d="M9 18h6" />
      <Path d="M10 22h4" />
    </>
  ),
  ComprehensionTest: (
    <>
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  SchulteNumbers: (
    <>
      <Rect width="18" height="18" x="3" y="3" rx="2" />
      <Path d="M3 9h18" />
      <Path d="M3 15h18" />
      <Path d="M9 3v18" />
      <Path d="M15 3v18" />
    </>
  ),
  SchulteLetters: (
    <>
      <Rect width="18" height="18" x="3" y="3" rx="2" />
      <Path d="M3 9h18" />
      <Path d="M3 15h18" />
      <Path d="M9 3v18" />
      <Path d="M15 3v18" />
    </>
  ),
  SchulteMix: (
    <>
      <Rect width="18" height="18" x="3" y="3" rx="2" />
      <Path d="M3 9h18" />
      <Path d="M3 15h18" />
      <Path d="M9 3v18" />
      <Path d="M15 3v18" />
    </>
  ),
  EyeMovementTraining: (
    <>
      <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  VisualSpanExpansion: (
    <>
      <Path d="M12 4.5V2" />
      <Path d="M12 22v-2.5" />
      <Path d="M4.5 12H2" />
      <Path d="M22 12h-2.5" />
      <Path d="m17.3 17.3 1.7 1.7" />
      <Path d="m5 5 1.7 1.7" />
      <Path d="m17.3 6.7 1.7-1.7" />
      <Path d="m5 19 1.7-1.7" />
      <Circle cx="12" cy="12" r="4" />
    </>
  ),
  PatternScanning: (
    <>
      <Path d="M3 3h6v6H3z" />
      <Path d="M15 3h6v6h-6z" />
      <Path d="M3 15h6v6H3z" />
      <Path d="M15 15h6v6h-6z" />
    </>
  ),
  TimedWordRecognition: (
    <>
      <Path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
    </>
  ),
  TimedPhraseRecognition: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="12 6 12 12 16 14" />
    </>
  ),
  WordPairs: (
    <>
      <Path d="m7 10 5-5 5 5" />
      <Path d="m7 14 5 5 5-5" />
    </>
  ),
  TextSearch: (
    <>
      <Circle cx="11" cy="11" r="8" />
      <Path d="m21 21-4.3-4.3" />
    </>
  ),
  WordSearchGame: (
    <>
      <Circle cx="11" cy="11" r="8" />
      <Path d="m21 21-4.3-4.3" />
    </>
  ),
  NumberSearch: (
    <>
      <Line x1="10" x2="21" y1="6" y2="6" />
      <Line x1="10" x2="21" y1="12" y2="12" />
      <Line x1="10" x2="21" y1="18" y2="18" />
      <Path d="M4 6h1v4" />
      <Path d="M4 10h2" />
      <Path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </>
  ),
  LetterRecognition: (
    <>
      <Polyline points="4 7 4 4 20 4 20 7" />
      <Line x1="9" x2="15" y1="20" y2="20" />
      <Line x1="12" x2="12" y1="4" y2="20" />
    </>
  ),
  NumberRecognition: (
    <>
      <Line x1="10" x2="21" y1="6" y2="6" />
      <Line x1="10" x2="21" y1="12" y2="12" />
      <Line x1="10" x2="21" y1="18" y2="18" />
      <Path d="M4 6h1v4" />
      <Path d="M4 10h2" />
      <Path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </>
  ),
  SymbolRecognition: (
    <Path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
  ),
  MemoryRecall: (
    <>
      <Path d="M12 4.5V2" />
      <Path d="M12 22v-2.5" />
      <Path d="M4.5 12H2" />
      <Path d="M22 12h-2.5" />
      <Circle cx="12" cy="12" r="4" />
    </>
  ),
  LetterJumble: (
    <>
      <Path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
      <Path d="m18 2 4 4-4 4" />
      <Path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <Path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
      <Path d="m18 14 4 4-4 4" />
    </>
  ),
  WordMismatchGrid: (
    <>
      <Line x1="5" x2="19" y1="9" y2="9" />
      <Line x1="5" x2="19" y1="15" y2="15" />
      <Line x1="19" x2="5" y1="5" y2="19" />
    </>
  ),
  EvenNumbers: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 12h8" />
      <Path d="M12 8v8" />
    </>
  ),
};

export function GameIcon({ name, size = 24, color = '#FFFFFF' }: Props) {
  const iconContent = ICON_DATA[name];
  
  if (!iconContent) {
    // Fallback to a simple circle
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
      </Svg>
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconContent}
    </Svg>
  );
}
