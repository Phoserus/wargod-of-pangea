import { describe, it, expect } from "vitest";
import { craft } from "./crafting";

describe("crafting", () => {
  it("smelts ore into a bar", () => {
    const r = craft({ copper_ore: 4 }, "smelt_copper");
    expect(r.ok).toBe(true);
    expect(r.inventory).toEqual({ copper_ore: 2, copper_bar: 1 });
  });
  it("fails without enough ore and leaves inventory untouched", () => {
    const inv = { copper_ore: 1 };
    const r = craft(inv, "smelt_copper");
    expect(r.ok).toBe(false);
    expect(r.inventory).toBe(inv);
  });
  it("unknown recipe fails", () => {
    expect(craft({}, "nope").ok).toBe(false);
  });
  it("full chain to a sword", () => {
    let inv: Record<string, number> = { copper_ore: 6 };
    for (let i = 0; i < 3; i++) inv = craft(inv, "smelt_copper").inventory;
    const r = craft(inv, "forge_copper_sword");
    expect(r.ok).toBe(true);
    expect(r.inventory).toEqual({ copper_sword: 1 });
  });
});
