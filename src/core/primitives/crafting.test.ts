import { describe, it, expect } from "vitest";
import { craftingPrimitive } from "./crafting";

describe("crafting primitive", () => {
  it("seeded replay identical", () => {
    const a = craftingPrimitive.create(7, { target: 3 });
    const b = craftingPrimitive.create(7, { target: 3 });
    expect(a).toEqual(b);
  });
  it("win on combine", () => {
    const s = craftingPrimitive.create(1, { target: 2 });
    const st = craftingPrimitive.apply(craftingPrimitive.apply(s, "combine"), "combine");
    expect(st.status).toBe("won");
  });
  it("lose on ruin", () => {
    const s = craftingPrimitive.create(1, { target: 2 });
    const st = craftingPrimitive.apply(s, "ruin");
    expect(st.status).toBe("lost");
  });
});
