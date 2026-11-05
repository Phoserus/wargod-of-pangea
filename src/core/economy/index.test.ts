import { describe, it, expect } from "vitest";
import { createEconomy, moveItem, buy, sell } from "./index";

describe("economy", () => {
  it("move item between containers", () => {
    const s = { ...createEconomy(), inventory: { ore: 5 } };
    const n = moveItem(s, "ore", 2, "inventory", "bank");
    expect(n.inventory.ore).toBe(3);
    expect(n.bank.ore).toBe(2);
  });
  it("buy adjusts currency and inventory", () => {
    const s = { ...createEconomy(), currency: 100 };
    const n = buy(s, { itemId: "ore", price: 10 }, 3);
    expect(n.currency).toBe(70);
    expect(n.inventory.ore).toBe(3);
  });
  it("sell adjusts currency", () => {
    const s = { ...createEconomy(), currency: 0, inventory: { ore: 2 } };
    const n = sell(s, "ore", 5, 2);
    expect(n.currency).toBe(10);
    expect(n.inventory.ore).toBe(0);
  });
});
