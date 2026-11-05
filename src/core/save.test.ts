import { describe, it, expect, beforeEach } from "vitest";
import { saveGame, loadGame, migrateSave, SAVE_VERSION } from "./save";

describe("save", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a save", () => {
    saveGame({ version: SAVE_VERSION, skills: { attack: 5 } });
    expect(loadGame()).toEqual({
      version: SAVE_VERSION,
      skills: { attack: 5 },
    });
  });

  it("returns null when no save", () => {
    expect(loadGame()).toBeNull();
  });

  it("migrateSave passes through current version", () => {
    expect(migrateSave({ version: SAVE_VERSION, skills: { x: 1 } })).toEqual({
      version: SAVE_VERSION,
      skills: { x: 1 },
    });
  });

  it("migrateSave defaults missing skills to {}", () => {
    expect(migrateSave({ version: SAVE_VERSION })).toEqual({
      version: SAVE_VERSION,
      skills: {},
    });
  });

  it("loadGame returns null on corrupt JSON", () => {
    localStorage.setItem("skillbound.save", "{not json");
    expect(loadGame()).toBeNull();
  });
});
