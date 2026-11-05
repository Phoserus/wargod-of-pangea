import { describe, it, expect } from "vitest";
import { craft } from "./crafting";

describe("crafting", () => {
  it("smelt ore to bar", () => {
    const r = craft({ ore: 4 }, "smelt");
    expect(r.ok).toBe(true);
    expect(r.inventory).toEqual({ ore: 2, bar: 1 });
  });
  it("fails without enough ore", () => {
    const r = craft({ ore: 1 }, "smelt");
    expect(r.ok).toBe(false);
  });
  it("full chain to sword", () => {
    let inv: Record<string, number> = { ore: 6 };
    let r = craft(inv, "smelt");
    inv = r.inventory;
    r = craft(inv, "smelt");
    inv = r.inventory;
    r = craft(inv, "smelt");
    inv = r.inventory;
    r = craft(inv, "forge");
    inv = r.inventory;
    expect(inv.sword).toBe(1);
  });
});
