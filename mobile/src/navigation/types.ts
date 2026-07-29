import type { AttemptResult, TextSample } from '../domain/types';

export type RootStackParamList = {
  Home: undefined;
  Exercise: { sample: TextSample };
  Game: {
    gameId: string;
    autoStart?: boolean;
    sessionKey?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    schulteGridMode?: 'stable' | 'reshuffle';
  };
  Result: { result: AttemptResult };
  History: { optimisticResult?: AttemptResult } | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
