import { describe, it, expect } from "vitest";
import { miningPrimitive } from "./mining";

describe("mining primitive", () => {
  it("seeded replay identical", () => {
    const a = miningPrimitive.create(7, { rocks: 5, target: 3 });
    const b = miningPrimitive.create(7, { rocks: 5, target: 3 });
    expect(a).toEqual(b);
  });
  it("win on mining", () => {
    const s = miningPrimitive.create(1, { rocks: 1, target: 2 });
    const st = miningPrimitive.apply(miningPrimitive.apply(s, "mine"), "mine");
    expect(st.status).toBe("won");
  });
  it("lose on collapse", () => {
    const s = miningPrimitive.create(1, { rocks: 1, target: 2 });
    const st = miningPrimitive.apply(s, "collapse");
    expect(st.status).toBe("lost");
  });
});
