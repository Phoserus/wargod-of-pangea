import { describe, it, expect } from "vitest";
import { telegraphBlockPrimitive } from "./telegraphBlock";

describe("telegraphBlock primitive", () => {
  it("seeded replay identical", () => {
    const a = telegraphBlockPrimitive.create(7, {
      sequenceLength: 4,
      missLimit: 2,
    });
    const b = telegraphBlockPrimitive.create(7, {
      sequenceLength: 4,
      missLimit: 2,
    });
    expect(a).toEqual(b);
  });
  it("win on full sequence", () => {
    const s = telegraphBlockPrimitive.create(1, {
      sequenceLength: 2,
      missLimit: 2,
    });
    let st = s;
    for (const d of s.sequence) st = telegraphBlockPrimitive.apply(st, d);
    expect(st.status).toBe("won");
  });
  it("lose on misses", () => {
    const s = telegraphBlockPrimitive.create(1, {
      sequenceLength: 2,
      missLimit: 1,
    });
    const st = telegraphBlockPrimitive.apply(s, "X");
    expect(st.status).toBe("lost");
  });
});
