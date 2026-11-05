import { describe, it, expect } from "vitest";
import { sustainBarPrimitive } from "./sustainBar";

describe("sustainBar primitive", () => {
  it("seeded replay identical", () => {
    const a = sustainBarPrimitive.create(7, {
      bandWidth: 20,
      targetProgress: 2,
    });
    const b = sustainBarPrimitive.create(7, {
      bandWidth: 20,
      targetProgress: 2,
    });
    expect(a).toEqual(b);
  });
  it("win on progress", () => {
    const s = sustainBarPrimitive.create(1, {
      bandWidth: 100,
      targetProgress: 1,
    });
    const st = sustainBarPrimitive.apply(s, "tick");
    expect(st.status).toBe("won");
  });
  it("lose on fail", () => {
    const s = sustainBarPrimitive.create(1, {
      bandWidth: 20,
      targetProgress: 10,
    });
    const st = sustainBarPrimitive.apply(s, "fail");
    expect(st.status).toBe("lost");
  });
});
