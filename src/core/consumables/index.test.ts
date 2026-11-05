import { describe, it, expect } from "vitest";
import { applyConsumable, consumeAmmo } from "./index";

describe("consumables", () => {
  it("food heals", () => {
    const r = applyConsumable(5, "bread", { bread: 1 });
    expect(r.ok).toBe(true);
    expect(r.hp).toBe(15);
    expect(r.inventory.bread).toBe(0);
  });
  it("fails without item", () => {
    const r = applyConsumable(5, "bread", {});
    expect(r.ok).toBe(false);
  });
  it("ammo consumed", () => {
    const r = consumeAmmo({ arrow: 2 }, "arrow");
    expect(r.ok).toBe(true);
    expect(r.inventory.arrow).toBe(1);
  });
  it("ammo depleted fails", () => {
    const r = consumeAmmo({}, "arrow");
    expect(r.ok).toBe(false);
  });
});
