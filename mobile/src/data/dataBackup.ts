import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const BACKUP_VERSION = 1;
export const BACKUP_APP_ID = 'speed-reading-mobile-app';

export const BACKED_UP_STORAGE_KEYS = [
  'speed-reading:results:v1',
  'speed-reading:progress:v1',
  'speed-reading:flash-challenge-progress:v1',
  'speed-reading:difficulty-preferences:v1',
  'speed-reading:game-pins:v1',
  'speed-reading:today-plan:v2',
  'speed-reading:today-skips:v1',
  'speed-reading:reading-display:v1',
  'powerReaderBookProgress',
  'powerReaderRecentBooks',
  'powerReaderLocalLibrary:v1',
] as const;

export type AppDataBackup = {
  app: typeof BACKUP_APP_ID;
  version: typeof BACKUP_VERSION;
  createdAtIso: string;
  entries: Record<string, string>;
};

const MAX_BACKUP_CHARACTERS = 12_000_000;

export async function createDataBackup(
  now = new Date()
): Promise<AppDataBackup> {
  const storedEntries = await AsyncStorage.multiGet([
    ...BACKED_UP_STORAGE_KEYS,
  ]);
  const entries = Object.fromEntries(
    storedEntries.filter(
      (entry): entry is [string, string] => entry[1] !== null
    )
  );
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    createdAtIso: now.toISOString(),
    entries,
  };
}

export function parseDataBackup(raw: string): AppDataBackup {
  if (raw.length > MAX_BACKUP_CHARACTERS) {
    throw new Error('This backup file is too large.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('This is not a valid SpeedRead backup file.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('This is not a valid SpeedRead backup file.');
  }

  const candidate = parsed as Partial<AppDataBackup>;
  if (
    candidate.app !== BACKUP_APP_ID ||
    candidate.version !== BACKUP_VERSION ||
    !candidate.entries ||
    typeof candidate.entries !== 'object'
  ) {
    throw new Error('This backup format is not supported.');
  }

  const allowed = new Set<string>(BACKED_UP_STORAGE_KEYS);
  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(candidate.entries)) {
    if (!allowed.has(key) || typeof value !== 'string') continue;
    try {
      JSON.parse(value);
    } catch {
      throw new Error(`The saved data for ${key} is damaged.`);
    }
    entries[key] = value;
  }

  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    createdAtIso:
      typeof candidate.createdAtIso === 'string'
        ? candidate.createdAtIso
        : new Date(0).toISOString(),
    entries,
  };
}

export async function restoreDataBackup(
  backup: AppDataBackup
): Promise<void> {
  const entries = Object.entries(backup.entries);
  if (entries.length === 0) {
    throw new Error('This backup does not contain any saved app data.');
  }
  const restoredKeys = new Set(Object.keys(backup.entries));
  const absentKeys = BACKED_UP_STORAGE_KEYS.filter(
    (key) => !restoredKeys.has(key)
  );
  // Write the imported snapshot before removing keys it omits. If storage is
  // full or unavailable, the user's current data remains intact.
  await AsyncStorage.multiSet(entries);
  if (absentKeys.length > 0) {
    await AsyncStorage.multiRemove([...absentKeys]);
  }
}

function requireWebDocument(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('Data files are available in the browser app.');
  }
}

export async function downloadDataBackup(): Promise<AppDataBackup> {
  requireWebDocument();
  const backup = await createDataBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = backup.createdAtIso.slice(0, 10);
  link.href = url;
  link.download = `speedread-backup-${date}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return backup;
}

export async function pickDataBackup(): Promise<AppDataBackup> {
  requireWebDocument();
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    let settled = false;
    const cleanup = () => {
      window.removeEventListener('focus', detectCancelledSelection);
    };
    const rejectCancelled = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const error = new Error('Backup selection cancelled.');
      error.name = 'AbortError';
      reject(error);
    };
    const detectCancelledSelection = () => {
      window.setTimeout(() => {
        if (!input.files?.length) rejectCancelled();
      }, 300);
    };

    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('cancel', rejectCancelled, { once: true });
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        rejectCancelled();
        return;
      }
      settled = true;
      cleanup();
      file
        .text()
        .then(parseDataBackup)
        .then(resolve)
        .catch(reject);
    };
    window.addEventListener('focus', detectCancelledSelection, { once: true });
    input.click();
  });
}
