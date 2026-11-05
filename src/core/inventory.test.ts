import { describe, it, expect } from "vitest";
import { equip, unequip, equipmentStats } from "./equipment";
import { exchange, removeItem, hasAll } from "./inventory";

describe("inventory", () => {
  it("removeItem prunes zeros and refuses overdraw", () => {
    expect(removeItem({ a: 2 }, "a", 2)).toEqual({});
    expect(removeItem({ a: 2 }, "a", 3)).toBeNull();
  });
  it("exchange is atomic", () => {
    expect(exchange({ a: 1 }, { a: 2 }, { b: 1 })).toBeNull();
    expect(exchange({ a: 3 }, { a: 2 }, { b: 1 })).toEqual({ a: 1, b: 1 });
    expect(hasAll({ a: 1 }, { a: 1, b: 1 })).toBe(false);
  });
});

describe("equipment", () => {
  it("equips from inventory and swaps the previous item back", () => {
    const a = equip({ copper_sword: 1, iron_sword: 1 }, {}, "copper_sword");
    expect(a.ok).toBe(true);
    expect(a.equipment.weapon).toBe("copper_sword");
    const b = equip(a.inventory, a.equipment, "iron_sword");
    expect(b.equipment.weapon).toBe("iron_sword");
    expect(b.inventory).toEqual({ copper_sword: 1 });
  });
  it("refuses non-equipment and missing items", () => {
    expect(equip({ copper_ore: 1 }, {}, "copper_ore").ok).toBe(false);
    expect(equip({}, {}, "copper_sword").ok).toBe(false);
  });
  it("unequips and sums stats", () => {
    const e = equip({ iron_sword: 1 }, {}, "iron_sword");
    expect(equipmentStats(e.equipment)).toMatchObject({ attack: 8, strength: 6 });
    const u = unequip(e.inventory, e.equipment, "weapon");
    expect(u.inventory).toEqual({ iron_sword: 1 });
    expect(equipmentStats(u.equipment).attack).toBe(0);
  });
});
