import { queryAccessibilityPreference } from './useAccessibilityPreferences';

describe('queryAccessibilityPreference', () => {
  it('returns false when a platform does not implement a preference query', async () => {
    await expect(queryAccessibilityPreference(undefined)).resolves.toBe(false);
  });

  it('uses a supported preference query and safely handles rejection', async () => {
    await expect(
      queryAccessibilityPreference(async () => true)
    ).resolves.toBe(true);
    await expect(
      queryAccessibilityPreference(async () => {
        throw new Error('Unavailable');
      })
    ).resolves.toBe(false);
  });
});
