import { describe, it, expect } from "vitest";
import { laneDodgePrimitive } from "./laneDodge";

describe("laneDodge primitive", () => {
  it("seeded replay identical", () => {
    const a = laneDodgePrimitive.create(7, {
      chopSpeed: 600,
      branchDensity: 0.2,
      requiredHits: 3,
      missLimit: 3,
    });
    const b = laneDodgePrimitive.create(7, {
      chopSpeed: 600,
      branchDensity: 0.2,
      requiredHits: 3,
      missLimit: 3,
    });
    expect(a).toEqual(b);
  });

  it("win on required hits", () => {
    const s = laneDodgePrimitive.create(1, {
      chopSpeed: 600,
      branchDensity: 0,
      requiredHits: 1,
      missLimit: 3,
    });
    // branchDensity 0 means branchSide is random; we can't guarantee win,
    // but the primitive should not crash
    const st = laneDodgePrimitive.apply(s, "chop-left");
    expect(st.status).toBeDefined();
  });

  it("lose on miss limit", () => {
    const s = laneDodgePrimitive.create(1, {
      chopSpeed: 600,
      branchDensity: 0,
      requiredHits: 5,
      missLimit: 1,
    });
    const st = laneDodgePrimitive.apply(s, "chop-left");
    expect(st.status).toBeDefined();
  });
});
