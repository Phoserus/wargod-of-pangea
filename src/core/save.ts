import { z } from "zod";

const SAVE_KEY = "skillbound.save";
const BACKUP_PREFIX = "skillbound.save.backup.";
const EXPORT_PREFIX = "WOP2:";
const CURRENT_VERSION = 2;

const count = z.number().int().min(0);
const bag = z.record(z.string(), count);

export const saveSchema = z.object({
  version: z.literal(CURRENT_VERSION),
  skills: z.record(z.string(), z.number().min(0)),
  inventory: bag,
  bank: bag,
  currency: count,
  equipment: z.record(z.string(), z.string()),
});
export type SaveData = z.infer<typeof saveSchema>;

export function emptySave(): SaveData {
  return {
    version: CURRENT_VERSION,
    skills: {},
    inventory: {},
    bank: {},
    currency: 0,
    equipment: {},
  };
}

// Migrations: keys are the source version; each returns data for the next version.
// Add an entry (and a test) whenever CURRENT_VERSION bumps.
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  1: (d) => ({ ...d, version: 2, inventory: {}, bank: {}, currency: 0, equipment: {} }),
};

/** Upgrades any known save version to the current one and validates it. Throws on bad data. */
export function migrateSave(raw: Record<string, unknown>): SaveData {
  let data: Record<string, unknown> = { ...raw };
  let version = typeof data.version === "number" ? data.version : 0;
  while (version < CURRENT_VERSION) {
    const m = MIGRATIONS[version];
    if (!m) throw new Error(`No migration from save version ${version}`);
    data = m(data);
    version = typeof data.version === "number" ? data.version : version + 1;
  }
  if (version !== CURRENT_VERSION) throw new Error(`Unsupported save version ${version}`);
  const merged = { ...emptySave(), ...data };
  const parsed = saveSchema.safeParse(merged);
  if (!parsed.success) throw new Error(`Invalid save: ${parsed.error.issues[0]?.message}`);
  return parsed.data;
}

export function saveGame(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: CURRENT_VERSION }));
}

export type LoadResult =
  { kind: "none" } | { kind: "ok"; data: SaveData } | { kind: "corrupt"; backupKey: string };

/** Loads the save; a corrupt one is copied to a backup key so it can be recovered by hand. */
export function loadGameResult(): LoadResult {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { kind: "none" };
  try {
    return { kind: "ok", data: migrateSave(JSON.parse(raw) as Record<string, unknown>) };
  } catch {
    const backupKey = `${BACKUP_PREFIX}${Date.now()}`;
    localStorage.setItem(backupKey, raw);
    return { kind: "corrupt", backupKey };
  }
}

export function loadGame(): SaveData | null {
  const r = loadGameResult();
  return r.kind === "ok" ? r.data : null;
}

export function exportSave(data: SaveData): string {
  return EXPORT_PREFIX + btoa(JSON.stringify(data));
}

export function importSave(
  text: string,
): { ok: true; data: SaveData } | { ok: false; error: string } {
  try {
    const body = text.trim();
    if (!body.startsWith(EXPORT_PREFIX)) throw new Error("Not a Wargod of Pangea save string");
    const parsed = JSON.parse(atob(body.slice(EXPORT_PREFIX.length))) as Record<string, unknown>;
    return { ok: true, data: migrateSave(parsed) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not read save string" };
  }
}

export { CURRENT_VERSION as SAVE_VERSION };
