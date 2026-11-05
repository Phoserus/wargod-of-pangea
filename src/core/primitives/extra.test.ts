import { describe, it, expect } from "vitest";
import type { Primitive, PrimitiveState } from "../primitive";
import * as extra from "./extra";

describe("extra primitives", () => {
  const cases: [string, Primitive<PrimitiveState>, string, string][] = [
    ["Cooking", extra.cookingPrimitive, "cook", "burn"],
    ["Firemaking", extra.firemakingPrimitive, "strike", "fizzle"],
    ["Farming", extra.farmingPrimitive, "water", "wither"],
    ["Herblore", extra.herblorePrimitive, "pour", "spill"],
    ["Prayer", extra.prayerPrimitive, "pray", "drain"],
    ["Magic", extra.magicPrimitive, "cast", "fizzle"],
    ["Ranged", extra.rangedPrimitive, "shoot", "miss"],
    ["Construction", extra.constructionPrimitive, "place", "collapse"],
    ["Summoning", extra.summoningPrimitive, "summon", "dismiss"],
  ];
  for (const [name, prim, win, lose] of cases) {
    it(`${name} seeded replay identical`, () => {
      const a = prim.create(7, { target: 3 });
      const b = prim.create(7, { target: 3 });
      expect(a).toEqual(b);
    });
    it(`${name} win`, () => {
      const s = prim.create(1, { target: 2 });
      const st = prim.apply(prim.apply(s, win), win);
      expect(st.status).toBe("won");
    });
    it(`${name} lose`, () => {
      const s = prim.create(1, { target: 2 });
      const st = prim.apply(s, lose);
      expect(st.status).toBe("lost");
    });
  }
});
