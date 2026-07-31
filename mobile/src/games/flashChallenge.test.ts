import {
  FLASH_CHALLENGE_MAX_LEVEL,
  createFlashChallengeSessionState,
  exposureMsForFlashChallengeLevel,
  getFlashChallengeProfile,
  getFlashChallengeStreamRange,
  getProgressiveFlashContent,
  resumeWpmForFlashChallenge,
  updateFlashChallengeSession,
  wpmForFlashChallengeLevel,
} from './flashChallenge';

describe('flash challenge ladder', () => {
  it('raises content and speed before introducing the opaque marker', () => {
    const profiles = Array.from(
      { length: FLASH_CHALLENGE_MAX_LEVEL },
      (_, index) => getFlashChallengeProfile(index + 1)
    );

    expect(profiles.slice(0, 9).every(({ maskFraction }) => maskFraction === 0))
      .toBe(true);
    expect(profiles[9]?.maskFraction).toBe(0.1);
    expect(profiles.at(-1)?.maskFraction).toBe(0.38);
    expect(
      profiles.every(
        (profile, index) =>
          index === 0 ||
          profile.contentFraction >=
            (profiles[index - 1]?.contentFraction ?? 0)
      )
    ).toBe(true);
    expect(
      profiles.every(
        (profile, index) =>
          index === 0 ||
          profile.wpmBonus >
            (profiles[index - 1]?.wpmBonus ?? -1)
      )
    ).toBe(true);
  });

  it('moves through increasingly complex content without changing small authored sets', () => {
    const content = [
      'ink',
      'calm',
      'focus',
      'signal',
      'patient',
      'attention',
      'quiet focus',
      'careful attention',
      'read the complete signal',
      'compare the central idea carefully',
    ];

    const early = getProgressiveFlashContent(content, 1, 2);
    const middle = getProgressiveFlashContent(content, 6, 2);
    const late = getProgressiveFlashContent(content, 15, 2);

    const averageCharacters = (values: string[]) =>
      values.reduce((sum, value) => sum + value.length, 0) /
      values.length;
    expect(averageCharacters(early)).toBeLessThan(
      averageCharacters(middle)
    );
    expect(averageCharacters(middle)).toBeLessThan(
      averageCharacters(late)
    );
    expect(late).toContain('compare the central idea carefully');
    expect(late).not.toContain('ink');
    expect(getProgressiveFlashContent(['one', 'two'], 1)).toEqual([
      'one',
      'two',
    ]);
  });

  it('advances only after a complete correct run and lowers live load on misses', () => {
    let state = createFlashChallengeSessionState(5);

    for (let answer = 0; answer < 3; answer += 1) {
      const outcome = updateFlashChallengeSession(state, true, 4);
      state = outcome.state;
      expect(outcome.levelDelta).toBe(0);
    }
    const promotion = updateFlashChallengeSession(state, true, 4);
    expect(promotion.state.level).toBe(6);
    expect(promotion.qualified).toBe(true);

    const firstMiss = updateFlashChallengeSession(
      promotion.state,
      false,
      4
    );
    expect(firstMiss.state).toMatchObject({
      level: 5,
      correctStreak: 0,
      missStreak: 1,
    });
    const recovery = updateFlashChallengeSession(
      firstMiss.state,
      true,
      4
    );
    expect(recovery.state.missStreak).toBe(0);
  });

  it('requests a saved rollback only on the third consecutive miss', () => {
    let state = createFlashChallengeSessionState(8);
    const outcomes = [1, 2, 3, 4, 5].map(() => {
      const outcome = updateFlashChallengeSession(state, false, 4, 3);
      state = outcome.state;
      return outcome;
    });

    expect(outcomes.map(({ shouldSaveRollback }) => shouldSaveRollback)).toEqual(
      [false, false, true, false, false]
    );
    expect(state.level).toBe(3);
  });

  it('clamps levels and keeps exposure changes monotonic', () => {
    expect(createFlashChallengeSessionState(-10).level).toBe(1);
    const top = createFlashChallengeSessionState(999);
    expect(top.level).toBe(FLASH_CHALLENGE_MAX_LEVEL);
    expect(
      updateFlashChallengeSession(top, true, 1).state.level
    ).toBe(FLASH_CHALLENGE_MAX_LEVEL);

    const exposures = Array.from(
      { length: FLASH_CHALLENGE_MAX_LEVEL },
      (_, index) =>
        exposureMsForFlashChallengeLevel(1_600, index + 1, 300)
    );
    expect(
      exposures.every(
        (value, index) =>
          index === 0 || value <= (exposures[index - 1] ?? Infinity)
      )
    ).toBe(true);
    expect(wpmForFlashChallengeLevel(120, 15, 3_000)).toBe(470);
    expect(getFlashChallengeStreamRange(1)).toEqual({ min: 3, max: 4 });
    expect(getFlashChallengeStreamRange(15)).toEqual({ min: 6, max: 10 });
  });

  it('resumes at the stronger demonstrated pace without applying the stage bonus twice', () => {
    expect(resumeWpmForFlashChallenge(120, 2, 145, 3_000)).toBe(145);
    expect(resumeWpmForFlashChallenge(120, 6, null, 3_000)).toBe(245);
    expect(resumeWpmForFlashChallenge(120, 15, 2_775, 3_000)).toBe(2_775);
    expect(resumeWpmForFlashChallenge(120, 15, 3_500, 3_000)).toBe(3_000);
  });
});
