import { describe, it, expect, beforeEach } from "vitest";
import {
  saveGame,
  loadGame,
  loadGameResult,
  migrateSave,
  emptySave,
  exportSave,
  importSave,
  SAVE_VERSION,
} from "./save";

describe("save", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a save", () => {
    const data = {
      ...emptySave(),
      skills: { attack: 5 },
      inventory: { copper_ore: 3 },
      currency: 7,
    };
    saveGame(data);
    expect(loadGame()).toEqual(data);
  });

  it("returns null when no save", () => {
    expect(loadGame()).toBeNull();
    expect(loadGameResult()).toEqual({ kind: "none" });
  });

  it("migrates a v1 save to v2 keeping skills", () => {
    expect(migrateSave({ version: 1, skills: { mining: 40 } })).toEqual({
      ...emptySave(),
      skills: { mining: 40 },
    });
  });

  it("rejects unknown future versions and invalid shapes", () => {
    expect(() => migrateSave({ version: SAVE_VERSION + 1 })).toThrow();
    expect(() => migrateSave({ version: SAVE_VERSION, currency: -5 })).toThrow();
    expect(() => migrateSave({ version: SAVE_VERSION, inventory: { a: 1.5 } })).toThrow();
  });

  it("backs up a corrupt save and reports it", () => {
    localStorage.setItem("skillbound.save", "{not json");
    const r = loadGameResult();
    expect(r.kind).toBe("corrupt");
    if (r.kind === "corrupt") expect(localStorage.getItem(r.backupKey)).toBe("{not json");
    expect(loadGame()).toBeNull();
  });

  it("exports and imports", () => {
    const data = { ...emptySave(), skills: { mining: 9 }, bank: { iron_ore: 2 } };
    expect(importSave(exportSave(data))).toEqual({ ok: true, data });
  });

  it("import reports errors instead of throwing", () => {
    expect(importSave("garbage").ok).toBe(false);
    expect(importSave("WOP2:!!!").ok).toBe(false);
  });
});
