import { describe, it, expect } from "vitest";
import { woodcuttingPrimitive } from "./woodcutting";

describe("woodcutting primitive", () => {
  it("seeded replay identical", () => {
    const a = woodcuttingPrimitive.create(7, { required: 3 });
    const b = woodcuttingPrimitive.create(7, { required: 3 });
    expect(a).toEqual(b);
  });
  it("win on chop", () => {
    const s = woodcuttingPrimitive.create(1, { required: 1 });
    let st = s;
    for (let i = 0; i < 10; i++) st = woodcuttingPrimitive.apply(st, "chop");
    expect(st.status).toBe("won");
  });
  it("lose on break", () => {
    const s = woodcuttingPrimitive.create(1, { required: 2 });
    const st = woodcuttingPrimitive.apply(s, "break");
    expect(st.status).toBe("lost");
  });
});
