export type SchulteGridMode = 'stable' | 'reshuffle';

export {
  measuredElapsedMs,
  monotonicNowMs,
  type MillisecondClock as SchulteClock,
} from '../domain/timing';

export function shuffleSchulteGrid<T>(
  values: readonly T[],
  random: () => number = Math.random
): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function reshuffleSchulteGrid<T>(
  values: readonly T[],
  random: () => number = Math.random
): T[] {
  const reshuffled = shuffleSchulteGrid(values, random);
  const layoutChanged = reshuffled.some(
    (value, index) => value !== values[index]
  );

  if (layoutChanged || reshuffled.length < 2) {
    return reshuffled;
  }

  return [...reshuffled.slice(1), reshuffled[0]];
}
