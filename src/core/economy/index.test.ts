import { describe, it, expect } from "vitest";
import { createEconomy, moveItem, buy, sell } from "./index";

describe("economy", () => {
  it("move item between containers", () => {
    const s = { ...createEconomy(), inventory: { copper_ore: 5 } };
    const n = moveItem(s, "copper_ore", 2, "inventory", "bank");
    expect(n.inventory.copper_ore).toBe(3);
    expect(n.bank.copper_ore).toBe(2);
  });
  it("buy adjusts currency and inventory", () => {
    const s = { ...createEconomy(), currency: 100 };
    const n = buy(s, { itemId: "copper_ore", price: 10 }, 3);
    expect(n.currency).toBe(70);
    expect(n.inventory.copper_ore).toBe(3);
  });
  it("sell adjusts currency and prunes empty stacks", () => {
    const s = { ...createEconomy(), inventory: { copper_ore: 2 } };
    const n = sell(s, "copper_ore", 5, 2);
    expect(n.currency).toBe(10);
    expect(n.inventory.copper_ore).toBeUndefined();
  });
  it("rejects zero, negative and fractional quantities", () => {
    const s = { ...createEconomy(), currency: 100, inventory: { copper_ore: 5 } };
    for (const q of [0, -1, 1.5, NaN]) {
      expect(buy(s, { itemId: "copper_ore", price: 10 }, q)).toBe(s);
      expect(sell(s, "copper_ore", 5, q)).toBe(s);
      expect(moveItem(s, "copper_ore", q, "inventory", "bank")).toBe(s);
    }
  });
  it("cannot overspend or oversell", () => {
    const s = { ...createEconomy(), currency: 5, inventory: { copper_ore: 1 } };
    expect(buy(s, { itemId: "copper_ore", price: 10 }, 1)).toBe(s);
    expect(sell(s, "copper_ore", 5, 2)).toBe(s);
  });
});
