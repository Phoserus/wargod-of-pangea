import { describe, it, expect, beforeEach } from "vitest";
import { useGame } from "./store";
import { contentProblems, outputQuantity } from "./content";
import { initPersistence } from "./persistence";
import { loadGame } from "./save";

describe("content", () => {
  it("has no cross-reference problems", () => {
    expect(contentProblems()).toEqual([]);
  });
  it("scales yields with level", () => {
    const o = { item: "copper_ore", qty: 1, bonusEveryLevels: 25 };
    expect(outputQuantity(o, 1)).toBe(1);
    expect(outputQuantity(o, 25)).toBe(2);
    expect(outputQuantity(o, 50)).toBe(3);
  });
});

describe("store", () => {
  beforeEach(() => {
    localStorage.clear();
    useGame.getState().resetGame();
  });

  it("mining gives ore and xp", () => {
    const r = useGame.getState().completeAction("mining", "mine_copper");
    expect(r.ok).toBe(true);
    expect(useGame.getState().inventory.copper_ore).toBe(1);
    expect(useGame.getState().skills.mining).toBe(10);
  });

  it("smithing consumes ore and gives a bar; missing materials changes nothing", () => {
    expect(useGame.getState().completeAction("smithing", "smelt_copper").ok).toBe(false);
    expect(useGame.getState().skills.smithing).toBeUndefined();
    useGame.getState().loadSave({
      version: 2,
      skills: {},
      inventory: { copper_ore: 2 },
      bank: {},
      currency: 0,
      equipment: {},
    });
    expect(useGame.getState().completeAction("smithing", "smelt_copper").ok).toBe(true);
    expect(useGame.getState().inventory).toEqual({ copper_bar: 1 });
  });

  it("gates actions by level", () => {
    expect(useGame.getState().canPerform("mining", "mine_iron")).toMatchObject({ ok: false });
  });

  it("buy, sell and equip", () => {
    useGame.setState({ currency: 100 });
    expect(useGame.getState().buyItem("copper_ore", 2)).toBe(true);
    expect(useGame.getState().currency).toBe(92);
    expect(useGame.getState().buyItem("copper_sword", 1)).toBe(false);
    expect(useGame.getState().sellItem("copper_ore", 2)).toBe(true);
    expect(useGame.getState().currency).toBe(96);
    expect(useGame.getState().sellItem("copper_ore", 1)).toBe(false);
    useGame.setState({ inventory: { copper_sword: 1 } });
    expect(useGame.getState().equipItem("copper_sword")).toBe(true);
    expect(useGame.getState().equipment.weapon).toBe("copper_sword");
  });

  it("persists across a reload", async () => {
    const stop = initPersistence();
    useGame.getState().completeAction("mining", "mine_copper");
    stop();
    expect(loadGame()?.inventory).toEqual({ copper_ore: 1 });
    useGame.getState().resetGame();
    const stop2 = initPersistence();
    expect(useGame.getState().inventory).toEqual({ copper_ore: 1 });
    expect(useGame.getState().skills.mining).toBe(10);
    stop2();
  });
});
