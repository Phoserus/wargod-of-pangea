import { describe, it, expect } from "vitest";
import { timingBarPrimitive } from "./timingBar";

describe("timingBar primitive", () => {
  it("seeded replay identical", () => {
    const a = timingBarPrimitive.create(7, {
      zoneWidth: 20,
      requiredHits: 2,
      missLimit: 2,
    });
    const b = timingBarPrimitive.create(7, {
      zoneWidth: 20,
      requiredHits: 2,
      missLimit: 2,
    });
    expect(a).toEqual(b);
  });
  it("win on hits in zone", () => {
    const s = timingBarPrimitive.create(1, {
      zoneWidth: 100,
      requiredHits: 1,
      missLimit: 3,
    });
    const st = timingBarPrimitive.apply(s, "hit");
    expect(st.status).toBe("won");
  });
  it("lose on misses", () => {
    const s = timingBarPrimitive.create(1, {
      zoneWidth: 1,
      requiredHits: 3,
      missLimit: 1,
    });
    const st = timingBarPrimitive.apply(s, "hit");
    expect(st.status).toBe("lost");
  });
});
