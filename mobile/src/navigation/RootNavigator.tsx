import React, { useState } from 'react';
import { usePreventRemove } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from './types';
import type { AttemptResult, TextSample } from '../domain/types';
import { saveResult } from '../data/resultsStore';
import { normalizeGameId } from '../data/gameIds';
import { TEXT_SAMPLES } from '../data/textSamples';

import { HomeScreen } from '../screens/HomeScreen';
import { ExerciseScreen } from '../screens/ExerciseScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { GameScreen } from '../screens/GameScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Generate unique session key to force component remount
let gameSessionCounter = 0;
function getNextGameSessionKey() {
  return `game-session-${++gameSessionCounter}`;
}

type GameRouteProps = NativeStackScreenProps<RootStackParamList, 'Game'> & {
  onResultsChanged: () => void;
};

function confirmGameRemoval(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (
      globalThis.confirm(
        'Leave this training session? Any active round will be discarded.'
      )
    ) {
      onConfirm();
    }
    return;
  }

  Alert.alert(
    'Leave training?',
    'Any active round will be discarded and will not be saved.',
    [
      { text: 'Keep training', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: onConfirm },
    ]
  );
}

function GameRoute({
  navigation,
  route,
  onResultsChanged,
}: GameRouteProps) {
  const bypassWarningRef = React.useRef(false);
  const [sessionDirty, setSessionDirty] = React.useState(false);

  usePreventRemove(sessionDirty, ({ data }) => {
    if (bypassWarningRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    confirmGameRemoval(() => navigation.dispatch(data.action));
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <GameScreen
        key={route.params.sessionKey ?? route.params.gameId}
        gameId={route.params.gameId}
        sessionKey={route.params.sessionKey}
        autoStart={route.params.autoStart}
        difficulty={route.params.difficulty}
        onSessionDirtyChange={setSessionDirty}
        onBack={() => {
          onResultsChanged();
          navigation.goBack();
        }}
        onFinish={(result: AttemptResult) => {
          bypassWarningRef.current = true;
          onResultsChanged();
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Home' },
              {
                name: 'Result',
                params: { result },
                key: `result-${result.id}`,
              },
            ],
          });
        }}
      />
    </SafeAreaView>
  );
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
        contentStyle: { backgroundColor: colors.cardBackground },
      }}
    >
      <Stack.Screen name="Home">
        {({ navigation }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <HomeScreen
              refreshToken={refreshToken}
              onStart={(sample: TextSample) => navigation.navigate('Exercise', { sample })}
              onOpenHistory={() => navigation.navigate('History', undefined)}
              onOpenGame={(gameId: string) => navigation.navigate('Game', {
                gameId: normalizeGameId(gameId),
                autoStart: false,
                sessionKey: getNextGameSessionKey(),
              })}
            />
          </SafeAreaView>
        )}
      </Stack.Screen>

      <Stack.Screen name="Exercise">
        {({ navigation, route }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ExerciseScreen
              sample={route.params.sample}
              onCancel={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
              onFinish={async (payload) => {
                const sample = route.params.sample;
                const result: AttemptResult = {
                  id: makeId(),
                  sampleId: sample.id,
                  sampleTitle: sample.title,
                  ...payload,
                };
                void saveResult(result).catch(() => undefined);
                refreshResults();
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

      <Stack.Screen name="Game">
        {(props) => (
          <GameRoute {...props} onResultsChanged={refreshResults} />
        )}
      </Stack.Screen>

      <Stack.Screen name="Result">
        {({ navigation, route }) => {
          return (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ResultScreen
              key={route.params.result.id}
              result={route.params.result}
              onDone={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
              onOpenHistory={() =>
                navigation.navigate('History', {
                  optimisticResult: route.params.result,
                })
              }
              onPlayAgain={() => {
                const readingSample = TEXT_SAMPLES.find(
                  (sample) => sample.id === route.params.result.sampleId
                );
                if (readingSample) {
                  navigation.reset({
                    index: 1,
                    routes: [
                      { name: 'Home' },
                      { name: 'Exercise', params: { sample: readingSample } },
                    ],
                  });
                  return;
                }

                const newSessionKey = getNextGameSessionKey();
                const storedDifficulty = route.params.result.details?.difficulty;
                const difficulty =
                  storedDifficulty === 'easy' ||
                  storedDifficulty === 'medium' ||
                  storedDifficulty === 'hard'
                    ? storedDifficulty
                    : undefined;
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    {
                      name: 'Game',
                      params: {
                        gameId: normalizeGameId(route.params.result.sampleId),
                        autoStart: true,
                        sessionKey: newSessionKey,
                        difficulty,
                      },
                      key: `game-${newSessionKey}`,
                    },
                  ],
                });
              }}
            />
          </SafeAreaView>
        );}}
      </Stack.Screen>

      <Stack.Screen name="History">
        {({ navigation, route }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <HistoryScreen
              refreshToken={refreshToken}
              optimisticResult={route.params?.optimisticResult}
              onBack={() => navigation.goBack()}
            />
          </SafeAreaView>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
