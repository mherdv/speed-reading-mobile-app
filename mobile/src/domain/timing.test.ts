import { measuredElapsedMs } from './timing';

describe('timing', () => {
  it('rounds monotonic elapsed time and never returns a negative duration', () => {
    expect(measuredElapsedMs(100, () => 1432.4)).toBe(1332);
    expect(measuredElapsedMs(100, () => 90)).toBe(0);
  });
});
