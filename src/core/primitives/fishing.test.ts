import { describe, it, expect } from "vitest";
import { fishingPrimitive } from "./fishing";

describe("fishing primitive", () => {
  it("seeded replay identical", () => {
    const a = fishingPrimitive.create(7, { target: 3 });
    const b = fishingPrimitive.create(7, { target: 3 });
    expect(a).toEqual(b);
  });
  it("win on hook", () => {
    const s = fishingPrimitive.create(1, { target: 2 });
    const st = fishingPrimitive.apply(fishingPrimitive.apply(s, "hook"), "hook");
    expect(st.status).toBe("won");
  });
  it("lose on snap", () => {
    const s = fishingPrimitive.create(1, { target: 2 });
    const st = fishingPrimitive.apply(s, "snap");
    expect(st.status).toBe("lost");
  });
});
