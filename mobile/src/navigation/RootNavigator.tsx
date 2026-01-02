import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from './types';
import type { AttemptResult, TextSample } from '../domain/types';
import { saveResult } from '../data/resultsStore';

import { HomeScreen } from '../screens/HomeScreen';
import { ExerciseScreen } from '../screens/ExerciseScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { GameScreen } from '../screens/GameScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Generate unique session key to force component remount
let gameSessionCounter = 0;
function getNextGameSessionKey() {
  return `game-session-${++gameSessionCounter}`;
}

export function RootNavigator() {
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshResults = () => {
    setRefreshToken((t) => t + 1);
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Home">
        {({ navigation }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
              <HomeScreen
                refreshToken={refreshToken}
                onStart={(sample: TextSample) => navigation.navigate('Exercise', { sample })}
                onOpenHistory={() => navigation.navigate('History')}
                onOpenGame={(gameId: string) => navigation.navigate('Game', { gameId, autoStart: false, sessionKey: getNextGameSessionKey() })}
              />
            </ScrollView>
          </SafeAreaView>
        )}
      </Stack.Screen>

      <Stack.Screen name="Exercise">
        {({ navigation, route }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
              <ExerciseScreen
                sample={route.params.sample}
                onCancel={() => navigation.navigate('Home')}
                onFinish={async (payload) => {
                  const sample = route.params.sample;
                  const result: AttemptResult = {
                    id: makeId(),
                    sampleId: sample.id,
                    sampleTitle: sample.title,
                    ...payload,
                  };
                  await saveResult(result);
                  refreshResults();
                  navigation.navigate('Result', { result });
                }}
              />
            </ScrollView>
          </SafeAreaView>
        )}
      </Stack.Screen>

      <Stack.Screen name="Game">
        {({ navigation, route }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <GameScreen
              key={route.params?.sessionKey ?? route.params.gameId}
              gameId={route.params.gameId}
              sessionKey={route.params?.sessionKey}
              autoStart={route.params?.autoStart}
              onBack={() => navigation.navigate('Home')}
              onFinish={(result: AttemptResult) => {
                console.log('[RootNavigator] onFinish called with result id:', result.id, 'score:', result.score);
                refreshResults();
                // Reset navigation stack to Home -> Result to avoid stale screens
                // Use result.id as a unique key to force new Result screen instance
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    { name: 'Result', params: { result }, key: `result-${result.id}` },
                  ],
                });
              }}
            />
          </SafeAreaView>
        )}
      </Stack.Screen>

      <Stack.Screen name="Result">
        {({ navigation, route }) => {
          console.log('[ResultScreen] Rendering with result id:', route.params.result.id, 'score:', route.params.result.score);
          return (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
              <ResultScreen
                key={route.params.result.id}
                result={route.params.result}
                onDone={() => navigation.navigate('Home')}
                onOpenHistory={() => navigation.navigate('History')}
                onPlayAgain={() => {
                  const newSessionKey = getNextGameSessionKey();
                  console.log('[ResultScreen] Play Again - resetting to Game with sessionKey:', newSessionKey);
                  // Reset to Home -> Game to fully clear the old Result screen
                  navigation.reset({
                    index: 1,
                    routes: [
                      { name: 'Home' },
                      { name: 'Game', params: { gameId: route.params.result.sampleId, autoStart: true, sessionKey: newSessionKey }, key: `game-${newSessionKey}` },
                    ],
                  });
                }}
              />
            </ScrollView>
          </SafeAreaView>
        );}}
      </Stack.Screen>

      <Stack.Screen name="History">
        {({ navigation }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
              <HistoryScreen
                refreshToken={refreshToken}
                onBack={() => navigation.navigate('Home')}
              />
            </ScrollView>
          </SafeAreaView>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
