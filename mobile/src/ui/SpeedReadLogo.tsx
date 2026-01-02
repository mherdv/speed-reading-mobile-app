import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  size?: number;
};

export function SpeedReadLogo({ size = 32 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Speed Lines */}
      <Path d="M5 35H25M5 50H20M5 65H25" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
      {/* Book Pages with Layers */}
      <Path d="M35 30C35 25 45 20 60 20C75 20 85 25 85 30V80C85 85 75 90 60 90C45 90 35 85 35 80V30Z" fill="#8B5CF6" />
      <Path d="M35 30C35 35 45 40 60 40C75 40 85 35 85 30" stroke="#FFF" strokeWidth="2" />
      {/* Top Gauge/Needle */}
      <Circle cx="60" cy="20" r="12" stroke="#4F46E5" strokeWidth="3" fill="#FFF" />
      <Path d="M60 20L68 12" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}
