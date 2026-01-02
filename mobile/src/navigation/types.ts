import type { AttemptResult, TextSample } from '../domain/types';

export type RootStackParamList = {
  Home: undefined;
  Exercise: { sample: TextSample };
  Game: { gameId: string; autoStart?: boolean; sessionKey?: string; difficulty?: 'easy' | 'medium' | 'hard' };
  Result: { result: AttemptResult };
  History: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
