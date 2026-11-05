import { describe, it, expect } from "vitest";
import { aimShotPrimitive } from "./aimShot";

describe("aimShot primitive", () => {
  it("seeded replay identical", () => {
    const a = aimShotPrimitive.create(7, {
      decoyCount: 2,
      requiredHits: 2,
      missLimit: 2,
    });
    const b = aimShotPrimitive.create(7, {
      decoyCount: 2,
      requiredHits: 2,
      missLimit: 2,
    });
    expect(a).toEqual(b);
  });
  it("win on hits", () => {
    const s = aimShotPrimitive.create(1, {
      decoyCount: 0,
      requiredHits: 1,
      missLimit: 3,
    });
    const st = aimShotPrimitive.apply(s, "hit");
    expect(st.status).toBe("won");
  });
  it("lose on misses", () => {
    const s = aimShotPrimitive.create(1, {
      decoyCount: 0,
      requiredHits: 3,
      missLimit: 1,
    });
    const st = aimShotPrimitive.apply(s, "miss");
    expect(st.status).toBe("lost");
  });
});
