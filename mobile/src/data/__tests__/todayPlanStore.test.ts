import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LEGACY_TODAY_SKIPS_STORAGE_KEY,
  TODAY_PLAN_STORAGE_KEY,
  getLocalDateKey,
  loadOrCreateTodayPlanSnapshot,
  replaceTodayPlanReading,
  replaceTodayPlanSkill,
  saveTodayPlanSnapshot,
  setTodayPlanItemSkipped,
} from '../todayPlanStore';

const initialDefaults = {
  readingSampleId: 'sample-1',
  eligibleReadingSampleIds: ['sample-1', 'sample-2', 'sample-3'],
  skillGameId: 'ContextBuilder' as const,
  includeComfort: false,
};

describe('durable Today plan snapshot', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps the assigned reading and skill stable on the same local day', async () => {
    const now = new Date(2026, 6, 26, 12);
    const first = await loadOrCreateTodayPlanSnapshot(initialDefaults, now);
    const restored = await loadOrCreateTodayPlanSnapshot(
      {
        readingSampleId: 'sample-2',
        eligibleReadingSampleIds: ['sample-1', 'sample-2', 'sample-3'],
        skillGameId: 'EvidenceHunt',
        includeComfort: true,
      },
      new Date(2026, 6, 26, 18)
    );

    expect(restored).toEqual(first);
    expect(restored.reading.sampleId).toBe('sample-1');
    expect(restored.skill.gameId).toBe('ContextBuilder');
    expect(restored.comfort).toBeUndefined();
  });

  it('persists reading and skill swaps with assignment timestamps', async () => {
    const created = await loadOrCreateTodayPlanSnapshot(
      initialDefaults,
      new Date('2026-07-26T08:00:00.000Z')
    );
    const readingSwap = replaceTodayPlanReading(
      created,
      'sample-2',
      1,
      new Date('2026-07-26T09:00:00.000Z')
    );
    const skillSwap = replaceTodayPlanSkill(
      readingSwap,
      'EvidenceHunt',
      2,
      new Date('2026-07-26T09:05:00.000Z')
    );
    await saveTodayPlanSnapshot(skillSwap);

    const restored = await loadOrCreateTodayPlanSnapshot(
      initialDefaults,
      new Date(2026, 6, 26, 18)
    );
    expect(restored.reading).toEqual({
      sampleId: 'sample-2',
      assignedAtIso: '2026-07-26T09:00:00.000Z',
      swapOffset: 1,
    });
    expect(restored.skill).toEqual({
      gameId: 'EvidenceHunt',
      assignedAtIso: '2026-07-26T09:05:00.000Z',
      swapOffset: 2,
    });
  });

  it('migrates same-day legacy skips without losing the user choice', async () => {
    const now = new Date(2026, 6, 26, 12);
    await AsyncStorage.setItem(
      LEGACY_TODAY_SKIPS_STORAGE_KEY,
      JSON.stringify({
        localDate: '2026-6-26',
        skipped: ['reading', 'skill', 'invalid'],
      })
    );

    const snapshot = await loadOrCreateTodayPlanSnapshot(initialDefaults, now);
    expect(snapshot.skipped).toEqual(['reading', 'skill']);
    expect(
      await AsyncStorage.getItem(LEGACY_TODAY_SKIPS_STORAGE_KEY)
    ).toBeNull();
    expect(await AsyncStorage.getItem(TODAY_PLAN_STORAGE_KEY)).toBeTruthy();
  });

  it('atomically repairs a removed reading assignment before returning it', async () => {
    const assignedAt = new Date(2026, 6, 26, 8);
    const repairedAt = new Date(2026, 6, 26, 12);
    await AsyncStorage.setItem(
      TODAY_PLAN_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        localDate: getLocalDateKey(repairedAt),
        createdAtIso: assignedAt.toISOString(),
        reading: {
          sampleId: 'removed-sample',
          assignedAtIso: assignedAt.toISOString(),
          swapOffset: 4,
        },
        skill: {
          gameId: 'ContextBuilder',
          assignedAtIso: assignedAt.toISOString(),
          swapOffset: 2,
        },
        skipped: ['skill'],
      })
    );

    const repaired = await loadOrCreateTodayPlanSnapshot(
      initialDefaults,
      repairedAt
    );
    const persisted = JSON.parse(
      (await AsyncStorage.getItem(TODAY_PLAN_STORAGE_KEY))!
    );

    expect(repaired.reading).toEqual({
      sampleId: 'sample-1',
      assignedAtIso: repairedAt.toISOString(),
      swapOffset: 0,
    });
    expect(repaired.skill.gameId).toBe('ContextBuilder');
    expect(repaired.skipped).toEqual(['skill']);
    expect(persisted).toEqual(repaired);
  });

  it('starts a fresh assignment and clears skips after local date rollover', async () => {
    const first = await loadOrCreateTodayPlanSnapshot(
      initialDefaults,
      new Date(2026, 6, 26, 23)
    );
    await saveTodayPlanSnapshot(
      setTodayPlanItemSkipped(first, 'reading', true)
    );

    const nextDay = await loadOrCreateTodayPlanSnapshot(
      {
        readingSampleId: 'sample-3',
        eligibleReadingSampleIds: ['sample-1', 'sample-2', 'sample-3'],
        skillGameId: 'EvidenceHunt',
        includeComfort: true,
      },
      new Date(2026, 6, 27, 0, 1)
    );
    expect(nextDay.localDate).toBe('2026-6-27');
    expect(nextDay.reading.sampleId).toBe('sample-3');
    expect(nextDay.skill.gameId).toBe('EvidenceHunt');
    expect(nextDay.comfort?.gameId).toBe('EyeMovementTraining');
    expect(nextDay.skipped).toEqual([]);
  });

  it('replaces malformed saved state with a safe current snapshot', async () => {
    await AsyncStorage.setItem(
      TODAY_PLAN_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        localDate: '2026-6-26',
        reading: { sampleId: '' },
      })
    );
    const snapshot = await loadOrCreateTodayPlanSnapshot(
      initialDefaults,
      new Date(2026, 6, 26, 12)
    );
    expect(snapshot.reading.sampleId).toBe('sample-1');
    expect(snapshot.skill.gameId).toBe('ContextBuilder');
  });
});
