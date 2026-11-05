const SAVE_KEY = "skillbound.save";
const CURRENT_VERSION = 1;

export interface SaveData {
  version: number;
  skills: Record<string, number>;
}

// Migrations: keys are "fromVersion -> toVersion". Each migrates a save of the
// source version to the next version. Add a new entry whenever CURRENT_VERSION bumps.
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  // 1 is current; no migrations yet. Example for future:
  // 1: (d) => ({ ...d, version: 2, newField: d.newField ?? 0 }),
};

export function migrateSave(raw: Record<string, unknown>): SaveData {
  let data: Record<string, unknown> = { ...raw };
  let version = typeof data.version === "number" ? data.version : 0;
  // Treat missing/unknown version as 0.
  if (version < 1) version = 0;
  while (version < CURRENT_VERSION) {
    const m = MIGRATIONS[version];
    if (!m) throw new Error(`No migration from save version ${version}`);
    data = m(data);
    version = typeof data.version === "number" ? data.version : version + 1;
  }
  if (version !== CURRENT_VERSION) throw new Error(`Unsupported save version ${version}`);
  return {
    version: CURRENT_VERSION,
    skills: (data.skills as Record<string, number>) ?? {},
  };
}

export function saveGame(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: CURRENT_VERSION }));
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return migrateSave(parsed);
  } catch {
    return null;
  }
}

export { CURRENT_VERSION as SAVE_VERSION };
