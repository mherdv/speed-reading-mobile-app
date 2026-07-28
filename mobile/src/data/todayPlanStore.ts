import AsyncStorage from '@react-native-async-storage/async-storage';

import { GAME_IDS, type GameId } from './gameIds';

export type TodayPlanItemId = 'reading' | 'skill' | 'comfort';

export const TODAY_PLAN_STORAGE_KEY = 'speed-reading:today-plan:v2';
export const LEGACY_TODAY_SKIPS_STORAGE_KEY =
  'speed-reading:today-skips:v1';

export type TodayPlanSnapshot = {
  schemaVersion: 2;
  localDate: string;
  createdAtIso: string;
  reading: {
    sampleId: string;
    assignedAtIso: string;
    swapOffset: number;
  };
  skill: {
    gameId: GameId;
    assignedAtIso: string;
    swapOffset: number;
  };
  comfort?: {
    gameId: 'EyeMovementTraining';
    assignedAtIso: string;
  };
  skipped: TodayPlanItemId[];
};

export type TodayPlanSnapshotDefaults = {
  readingSampleId: string;
  eligibleReadingSampleIds: readonly string[];
  skillGameId: GameId;
  includeComfort: boolean;
};

let writeQueue: Promise<void> = Promise.resolve();

export function getLocalDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isPlanItemId(value: unknown): value is TodayPlanItemId {
  return value === 'reading' || value === 'skill' || value === 'comfort';
}

function isGameId(value: unknown): value is GameId {
  return (
    typeof value === 'string' &&
    (GAME_IDS as readonly string[]).includes(value)
  );
}

function isValidIso(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    Number.isFinite(new Date(value).getTime())
  );
}

function safeOffset(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.max(0, value)
    : 0;
}

function parseSnapshot(
  raw: string | null,
  now: Date
): TodayPlanSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TodayPlanSnapshot>;
    if (
      parsed.schemaVersion !== 2 ||
      parsed.localDate !== getLocalDateKey(now) ||
      !isValidIso(parsed.createdAtIso) ||
      !parsed.reading ||
      typeof parsed.reading.sampleId !== 'string' ||
      !parsed.reading.sampleId.trim() ||
      !isValidIso(parsed.reading.assignedAtIso) ||
      !parsed.skill ||
      !isGameId(parsed.skill.gameId) ||
      !isValidIso(parsed.skill.assignedAtIso) ||
      !Array.isArray(parsed.skipped)
    ) {
      return null;
    }

    const comfort =
      parsed.comfort?.gameId === 'EyeMovementTraining' &&
      isValidIso(parsed.comfort.assignedAtIso)
        ? {
            gameId: 'EyeMovementTraining' as const,
            assignedAtIso: parsed.comfort.assignedAtIso,
          }
        : undefined;

    return {
      schemaVersion: 2,
      localDate: parsed.localDate,
      createdAtIso: parsed.createdAtIso,
      reading: {
        sampleId: parsed.reading.sampleId,
        assignedAtIso: parsed.reading.assignedAtIso,
        swapOffset: safeOffset(parsed.reading.swapOffset),
      },
      skill: {
        gameId: parsed.skill.gameId,
        assignedAtIso: parsed.skill.assignedAtIso,
        swapOffset: safeOffset(parsed.skill.swapOffset),
      },
      comfort,
      skipped: [...new Set(parsed.skipped.filter(isPlanItemId))],
    };
  } catch {
    return null;
  }
}

async function loadLegacySkips(now: Date): Promise<TodayPlanItemId[]> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_TODAY_SKIPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      localDate?: unknown;
      skipped?: unknown;
    };
    if (
      parsed.localDate !== getLocalDateKey(now) ||
      !Array.isArray(parsed.skipped)
    ) {
      return [];
    }
    return [...new Set(parsed.skipped.filter(isPlanItemId))];
  } catch {
    return [];
  }
}

function createSnapshot(
  defaults: TodayPlanSnapshotDefaults,
  now: Date,
  skipped: readonly TodayPlanItemId[]
): TodayPlanSnapshot {
  const assignedAtIso = now.toISOString();
  return {
    schemaVersion: 2,
    localDate: getLocalDateKey(now),
    createdAtIso: assignedAtIso,
    reading: {
      sampleId: defaults.readingSampleId,
      assignedAtIso,
      swapOffset: 0,
    },
    skill: {
      gameId: defaults.skillGameId,
      assignedAtIso,
      swapOffset: 0,
    },
    comfort: defaults.includeComfort
      ? {
          gameId: 'EyeMovementTraining',
          assignedAtIso,
        }
      : undefined,
    skipped: [...new Set(skipped)],
  };
}

function enqueueStorageOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const queued = writeQueue.catch(() => undefined).then(operation);
  writeQueue = queued.then(
    () => undefined,
    () => undefined
  );
  return queued;
}

function repairReadingAssignment(
  snapshot: TodayPlanSnapshot,
  defaults: TodayPlanSnapshotDefaults,
  now: Date
): TodayPlanSnapshot {
  const eligibleSampleIds = [
    ...new Set(
      defaults.eligibleReadingSampleIds.filter(
        (sampleId) => typeof sampleId === 'string' && sampleId.trim()
      )
    ),
  ];
  if (
    eligibleSampleIds.length === 0 ||
    eligibleSampleIds.includes(snapshot.reading.sampleId)
  ) {
    return snapshot;
  }

  const replacementSampleId = eligibleSampleIds.includes(
    defaults.readingSampleId
  )
    ? defaults.readingSampleId
    : eligibleSampleIds[0]!;
  return {
    ...snapshot,
    reading: {
      sampleId: replacementSampleId,
      assignedAtIso: now.toISOString(),
      swapOffset: 0,
    },
  };
}

export function saveTodayPlanSnapshot(
  snapshot: TodayPlanSnapshot
): Promise<void> {
  return enqueueStorageOperation(() =>
    AsyncStorage.setItem(TODAY_PLAN_STORAGE_KEY, JSON.stringify(snapshot))
  );
}

export async function loadOrCreateTodayPlanSnapshot(
  defaults: TodayPlanSnapshotDefaults,
  now = new Date()
): Promise<TodayPlanSnapshot> {
  return enqueueStorageOperation(async () => {
    const existing = parseSnapshot(
      await AsyncStorage.getItem(TODAY_PLAN_STORAGE_KEY),
      now
    );
    if (existing) {
      const repaired = repairReadingAssignment(existing, defaults, now);
      if (repaired !== existing) {
        await AsyncStorage.setItem(
          TODAY_PLAN_STORAGE_KEY,
          JSON.stringify(repaired)
        );
      }
      return repaired;
    }

    const legacySkips = await loadLegacySkips(now);
    const snapshot = createSnapshot(defaults, now, legacySkips);
    await AsyncStorage.setItem(
      TODAY_PLAN_STORAGE_KEY,
      JSON.stringify(snapshot)
    );
    await AsyncStorage.removeItem(LEGACY_TODAY_SKIPS_STORAGE_KEY);
    return snapshot;
  });
}

export function replaceTodayPlanReading(
  snapshot: TodayPlanSnapshot,
  sampleId: string,
  swapOffset: number,
  now = new Date()
): TodayPlanSnapshot {
  return {
    ...snapshot,
    reading: {
      sampleId,
      assignedAtIso: now.toISOString(),
      swapOffset: safeOffset(swapOffset),
    },
    skipped: snapshot.skipped.filter((item) => item !== 'reading'),
  };
}

export function replaceTodayPlanSkill(
  snapshot: TodayPlanSnapshot,
  gameId: GameId,
  swapOffset: number,
  now = new Date()
): TodayPlanSnapshot {
  return {
    ...snapshot,
    skill: {
      gameId,
      assignedAtIso: now.toISOString(),
      swapOffset: safeOffset(swapOffset),
    },
    skipped: snapshot.skipped.filter((item) => item !== 'skill'),
  };
}

export function setTodayPlanItemSkipped(
  snapshot: TodayPlanSnapshot,
  itemId: TodayPlanItemId,
  skipped: boolean
): TodayPlanSnapshot {
  return {
    ...snapshot,
    skipped: skipped
      ? [...new Set([...snapshot.skipped, itemId])]
      : snapshot.skipped.filter((item) => item !== itemId),
  };
}

export function restoreTodayPlanItems(
  snapshot: TodayPlanSnapshot
): TodayPlanSnapshot {
  return { ...snapshot, skipped: [] };
}

/**
 * Compatibility reader for the former skip-only API. New code should load a
 * complete snapshot so assignments and swap state remain stable.
 */
export async function loadTodayPlanSkips(
  now = new Date()
): Promise<TodayPlanItemId[]> {
  await writeQueue.catch(() => undefined);
  const snapshot = parseSnapshot(
    await AsyncStorage.getItem(TODAY_PLAN_STORAGE_KEY),
    now
  );
  return snapshot?.skipped ?? loadLegacySkips(now);
}

/**
 * Compatibility writer used only by older callers during migration.
 */
export async function saveTodayPlanSkips(
  skipped: readonly TodayPlanItemId[],
  now = new Date()
): Promise<void> {
  await writeQueue.catch(() => undefined);
  const snapshot = parseSnapshot(
    await AsyncStorage.getItem(TODAY_PLAN_STORAGE_KEY),
    now
  );
  if (snapshot) {
    await saveTodayPlanSnapshot({
      ...snapshot,
      skipped: [...new Set(skipped.filter(isPlanItemId))],
    });
    return;
  }
  await AsyncStorage.setItem(
    LEGACY_TODAY_SKIPS_STORAGE_KEY,
    JSON.stringify({
      localDate: getLocalDateKey(now),
      skipped: [...new Set(skipped.filter(isPlanItemId))],
    })
  );
}
