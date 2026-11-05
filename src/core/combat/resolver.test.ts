import { describe, it, expect } from "vitest";
import { resolveCombat } from "./resolver";

describe("combat", () => {
  it("deterministic for seed", () => {
    const a = {
      name: "P",
      attack: 10,
      defense: 5,
      strength: 5,
      health: 20,
      hp: 20,
    };
    const b = {
      name: "E",
      attack: 5,
      defense: 5,
      strength: 3,
      health: 15,
      hp: 15,
    };
    const r1 = resolveCombat(42, a, b);
    const r2 = resolveCombat(42, a, b);
    expect(r1).toEqual(r2);
  });
  it("starter beats starter enemy", () => {
    const a = {
      name: "P",
      attack: 20,
      defense: 10,
      strength: 10,
      health: 30,
      hp: 30,
    };
    const b = {
      name: "E",
      attack: 5,
      defense: 5,
      strength: 3,
      health: 15,
      hp: 15,
    };
    const r = resolveCombat(1, a, b);
    expect(r.winner).toBe("P");
  });
});
