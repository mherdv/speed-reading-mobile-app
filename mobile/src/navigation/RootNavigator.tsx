import React, { useState } from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from './types';
import type { AttemptResult, TextSample } from '../domain/types';
import { loadResults, saveResult } from '../data/resultsStore';
import { normalizeGameId } from '../data/gameIds';
import {
  BASELINE_TEXT_SAMPLES,
  TEXT_SAMPLES,
} from '../data/textSamples';
import {
  getNextSessionAction,
  selectFreshComparableSample,
} from '../domain/nextSession';
import { waitForProgressUpdates } from '../data/progressStore';
import type { TodayPlanLaunchContext } from '../data/todayPlanStore';
import {
  getOptimisticTodayPlanCompletionIds,
  resolveNextTodayPlanItem,
} from './todayPlanFlow';

import { HomeScreen } from '../screens/HomeScreen';
import { ExerciseScreen } from '../screens/ExerciseScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { GameScreen } from '../screens/GameScreen';
import { colors } from '../theme/colors';
import { useReadingDisplay } from '../ui/ReadingDisplayPreferences';

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

function GameRoute({
  navigation,
  route,
  onResultsChanged,
}: GameRouteProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <GameScreen
        key={route.params.sessionKey ?? route.params.gameId}
        gameId={route.params.gameId}
        sessionKey={route.params.sessionKey}
        autoStart={route.params.autoStart}
        difficulty={route.params.difficulty}
        schulteGridMode={route.params.schulteGridMode}
        excludedContentId={route.params.excludedContentId}
        suggestedWpm={route.params.suggestedWpm}
        forceManualDifficulty={route.params.forceManualDifficulty}
        onBack={() => {
          onResultsChanged();
          navigation.goBack();
        }}
        onFinish={(result: AttemptResult) => {
          onResultsChanged();
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Home' },
              {
                name: 'Result',
                params: {
                  result,
                  todayPlanContext: route.params.todayPlanContext,
                },
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
  const { reload: reloadReadingDisplay } = useReadingDisplay();

  const refreshResults = () => {
    setRefreshToken((t) => t + 1);
  };

  const refreshRestoredData = async () => {
    refreshResults();
    await reloadReadingDisplay?.();
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
              onStart={(
                sample: TextSample,
                todayPlanContext?: TodayPlanLaunchContext
              ) =>
                navigation.navigate('Exercise', {
                  sample,
                  ...(todayPlanContext ? { todayPlanContext } : {}),
                })
              }
              onOpenHistory={() => navigation.navigate('History', undefined)}
              onOpenGame={(
                gameId: string,
                todayPlanContext?: TodayPlanLaunchContext
              ) =>
                navigation.navigate('Game', {
                  gameId: normalizeGameId(gameId),
                  autoStart: false,
                  sessionKey: getNextGameSessionKey(),
                  ...(todayPlanContext ? { todayPlanContext } : {}),
                })
              }
            />
          </SafeAreaView>
        )}
      </Stack.Screen>

      <Stack.Screen name="Exercise">
        {({ navigation, route }) => (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ExerciseScreen
              sample={route.params.sample}
              suggestedWpm={route.params.suggestedWpm}
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
                    {
                      name: 'Result',
                      params: {
                        result,
                        todayPlanContext: route.params.todayPlanContext,
                      },
                      key: `result-${result.id}`,
                    },
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
          const result = route.params.result;
          const todayPlanContext = route.params.todayPlanContext;
          const nextSessionAction = getNextSessionAction(result);
          const contentId =
            typeof result.details?.contentId === 'string'
              ? result.details.contentId
              : result.sampleId;
          const storedDifficulty = result.details?.difficulty;
          const difficulty =
            storedDifficulty === 'easy' ||
            storedDifficulty === 'medium' ||
            storedDifficulty === 'hard'
              ? storedDifficulty
              : undefined;
          const storedGridMode = result.details?.gridMode;
          const schulteGridMode =
            storedGridMode === 'stable' ||
            storedGridMode === 'reshuffle'
              ? storedGridMode
              : undefined;
          const resetToGame = ({
            gameId,
            autoStart,
            nextDifficulty,
            excludedContentId,
            suggestedWpm,
            forceManualDifficulty,
            nextTodayPlanContext,
          }: {
            gameId: string;
            autoStart: boolean;
            nextDifficulty?: 'easy' | 'medium' | 'hard';
            excludedContentId?: string;
            suggestedWpm?: number;
            forceManualDifficulty?: boolean;
            nextTodayPlanContext?: TodayPlanLaunchContext;
          }) => {
            const newSessionKey = getNextGameSessionKey();
            navigation.reset({
              index: 1,
              routes: [
                { name: 'Home' },
                {
                  name: 'Game',
                  params: {
                    gameId: normalizeGameId(gameId),
                    autoStart,
                    sessionKey: newSessionKey,
                    difficulty: nextDifficulty,
                    schulteGridMode,
                    excludedContentId,
                    suggestedWpm,
                    forceManualDifficulty,
                    ...(nextTodayPlanContext
                      ? { todayPlanContext: nextTodayPlanContext }
                      : {}),
                  },
                  key: `game-${newSessionKey}`,
                },
              ],
            });
          };
          const launchRecommendedSession = async () => {
            await waitForProgressUpdates();
            refreshResults();
            if (nextSessionAction.kind === 'finish') {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              return;
            }
            if (todayPlanContext) {
              const storedResults = await loadResults().catch(() => []);
              const nextItem = resolveNextTodayPlanItem({
                context: todayPlanContext,
                result,
                storedResults,
                samples: TEXT_SAMPLES,
              });
              if (!nextItem) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
                return;
              }
              const nextTodayPlanContext: TodayPlanLaunchContext = {
                snapshot: todayPlanContext.snapshot,
                itemId: nextItem.id,
                optimisticallyCompletedItemIds:
                  getOptimisticTodayPlanCompletionIds(
                    todayPlanContext,
                    result
                  ),
              };
              if (nextItem.kind === 'reading') {
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    {
                      name: 'Exercise',
                      params: {
                        sample: nextItem.sample,
                        todayPlanContext: nextTodayPlanContext,
                      },
                    },
                  ],
                });
                return;
              }
              resetToGame({
                gameId: nextItem.gameId,
                autoStart: false,
                nextTodayPlanContext,
              });
              return;
            }
            if (nextSessionAction.kind === 'measured-reading') {
              resetToGame({
                gameId: 'WpmTest',
                autoStart: false,
                excludedContentId: contentId,
              });
              return;
            }
            if (nextSessionAction.kind === 'fresh-reading') {
              const directReadingSample = TEXT_SAMPLES.some(
                (sample) => sample.id === result.sampleId
              );
              if (directReadingSample) {
                const recentResults = await loadResults().catch(() => []);
                const sample = selectFreshComparableSample(
                  result,
                  BASELINE_TEXT_SAMPLES,
                  [
                    result,
                    ...recentResults.filter(
                      (stored) => stored.id !== result.id
                    ),
                  ]
                );
                if (sample) {
                  navigation.reset({
                    index: 1,
                    routes: [
                      { name: 'Home' },
                      {
                        name: 'Exercise',
                        params: {
                          sample,
                          suggestedWpm: nextSessionAction.targetWpm,
                        },
                      },
                    ],
                  });
                  return;
                }
                resetToGame({
                  gameId: 'WpmTest',
                  autoStart: false,
                  excludedContentId: contentId,
                  suggestedWpm: nextSessionAction.targetWpm,
                });
                return;
              }
              resetToGame({
                gameId: result.sampleId,
                autoStart: false,
                nextDifficulty: difficulty,
                excludedContentId: contentId,
                suggestedWpm: nextSessionAction.targetWpm,
              });
              return;
            }
            resetToGame({
              gameId: result.sampleId,
              autoStart: nextSessionAction.autoStart,
              nextDifficulty:
                nextSessionAction.difficulty ?? difficulty,
            });
          };
          const returnHome = async () => {
            await waitForProgressUpdates();
            refreshResults();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          };
          const replayCompletedSetup = async () => {
            await waitForProgressUpdates();
            const readingSample = TEXT_SAMPLES.find(
              (sample) => sample.id === result.sampleId
            );
            if (readingSample) {
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Home' },
                  {
                    name: 'Exercise',
                    params: {
                      sample: readingSample,
                      ...(todayPlanContext ? { todayPlanContext } : {}),
                    },
                  },
                ],
              });
              return;
            }

            resetToGame({
              gameId: result.sampleId,
              autoStart: true,
              nextDifficulty: difficulty,
              forceManualDifficulty:
                result.details?.difficultyMode === 'adaptive',
              nextTodayPlanContext: todayPlanContext,
            });
          };

          return (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ResultScreen
              key={result.id}
              result={result}
              todayPlanContext={todayPlanContext}
              onDone={returnHome}
              onOpenHistory={() =>
                navigation.navigate('History', {
                  optimisticResult: result,
                })
              }
              onNextSession={launchRecommendedSession}
              onPlayAgain={replayCompletedSetup}
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
              onDataRestored={refreshRestoredData}
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
