import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadTodayPlanSkips,
  saveTodayPlanSkips,
} from '../todayPlanStore';

describe('Today plan skip persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores skips on the same local day', async () => {
    const today = new Date(2026, 6, 26, 12);
    await saveTodayPlanSkips(['reading', 'skill'], today);
    await expect(loadTodayPlanSkips(today)).resolves.toEqual([
      'reading',
      'skill',
    ]);
  });

  it('clears skips on the next local day', async () => {
    await saveTodayPlanSkips(['reading'], new Date(2026, 6, 26, 23));
    await expect(
      loadTodayPlanSkips(new Date(2026, 6, 27, 0, 1))
    ).resolves.toEqual([]);
  });
});
