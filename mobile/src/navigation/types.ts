import type { AttemptResult, TextSample } from '../domain/types';
import type { TodayPlanLaunchContext } from '../data/todayPlanStore';

export type RootStackParamList = {
  Home: undefined;
  Exercise: {
    sample: TextSample;
    suggestedWpm?: number;
    todayPlanContext?: TodayPlanLaunchContext;
  };
  Game: {
    gameId: string;
    autoStart?: boolean;
    sessionKey?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    schulteGridMode?: 'stable' | 'reshuffle';
    excludedContentId?: string;
    suggestedWpm?: number;
    forceManualDifficulty?: boolean;
    todayPlanContext?: TodayPlanLaunchContext;
  };
  Result: {
    result: AttemptResult;
    todayPlanContext?: TodayPlanLaunchContext;
  };
  History: { optimisticResult?: AttemptResult } | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
