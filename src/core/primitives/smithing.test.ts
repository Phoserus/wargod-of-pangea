import { describe, it, expect } from "vitest";
import { smithingPrimitive } from "./smithing";

describe("smithing primitive", () => {
  it("seeded replay identical", () => {
    const a = smithingPrimitive.create(7, { target: 3 });
    const b = smithingPrimitive.create(7, { target: 3 });
    expect(a).toEqual(b);
  });
  it("win on hammer", () => {
    const s = smithingPrimitive.create(1, { target: 2 });
    const st = smithingPrimitive.apply(smithingPrimitive.apply(s, "hammer"), "hammer");
    expect(st.status).toBe("won");
  });
  it("lose on shatter", () => {
    const s = smithingPrimitive.create(1, { target: 2 });
    const st = smithingPrimitive.apply(s, "shatter");
    expect(st.status).toBe("lost");
  });
});
