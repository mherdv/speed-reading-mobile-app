import { createContext, useContext } from 'react';

const GameSessionActivityContext = createContext<(() => void) | null>(null);

export const GameSessionActivityProvider = GameSessionActivityContext.Provider;

export function useMarkGameSessionActive(): () => void {
  return useContext(GameSessionActivityContext) ?? (() => undefined);
}
