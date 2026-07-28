import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { PwaUpdateBanner } from './src/ui/PwaUpdateBanner';
import { ReadingDisplayProvider } from './src/ui/ReadingDisplayPreferences';

export default function App() {
  const statusBarStyle = useMemo(() => 'dark' as const, []);

  return (
    <SafeAreaProvider>
      <ReadingDisplayProvider>
        <NavigationContainer>
          <RootNavigator />
          <PwaUpdateBanner />
          <StatusBar style={statusBarStyle} />
        </NavigationContainer>
      </ReadingDisplayProvider>
    </SafeAreaProvider>
  );
}
