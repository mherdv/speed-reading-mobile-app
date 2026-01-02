import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const statusBarStyle = useMemo(() => 'dark' as const, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style={statusBarStyle} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
