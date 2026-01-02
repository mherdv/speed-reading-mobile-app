import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ScrollView, StyleSheet } from 'react-native';

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
          <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
            <HomeScreen
              refreshToken={refreshToken}
              onStart={(sample: TextSample) => navigation.navigate('Exercise', { sample })}
              onOpenHistory={() => navigation.navigate('History')}
              onOpenGame={(gameId: string) => navigation.navigate('Game', { gameId, autoStart: false })}
            />
          </ScrollView>
        )}
      </Stack.Screen>

      <Stack.Screen name="Exercise">
        {({ navigation, route }) => (
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
        )}
      </Stack.Screen>

      <Stack.Screen name="Game">
        {({ navigation, route }) => (
          <GameScreen
            gameId={route.params.gameId}
            autoStart={route.params?.autoStart}
            onBack={() => navigation.navigate('Home')}
            onFinish={(result: AttemptResult) => {
              refreshResults();
              navigation.navigate('Result', { result });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Result">
        {({ navigation, route }) => (
          <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
            <ResultScreen
              result={route.params.result}
              onDone={() => navigation.navigate('Home')}
              onOpenHistory={() => navigation.navigate('History')}
              onPlayAgain={() => navigation.navigate('Game', { 
                gameId: route.params.result.sampleId, 
                autoStart: true 
              })}
            />
          </ScrollView>
        )}
      </Stack.Screen>

      <Stack.Screen name="History">
        {({ navigation }) => (
          <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
            <HistoryScreen
              refreshToken={refreshToken}
              onBack={() => navigation.navigate('Home')}
            />
          </ScrollView>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
});
