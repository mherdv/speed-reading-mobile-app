export type MillisecondClock = () => number;

/**
 * Returns a monotonic timestamp for measuring elapsed time.
 *
 * Unlike the civil clock, this clock is not affected when the device time,
 * time zone, or network-synchronized wall clock changes during an attempt.
 */
export function monotonicNowMs(): number {
  if (
    typeof globalThis.performance !== 'undefined' &&
    typeof globalThis.performance.now === 'function'
  ) {
    return globalThis.performance.now();
  }
  return Date.now();
}

/**
 * Returns an epoch timestamp for persisted, human-readable civil timestamps.
 * Never subtract values from this clock to measure an exercise duration.
 */
export function epochNowMs(): number {
  return Date.now();
}

export function measuredElapsedMs(
  startedAt: number,
  clock: MillisecondClock = monotonicNowMs
): number {
  return Math.max(0, Math.round(clock() - startedAt));
}
