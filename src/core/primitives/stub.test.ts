import { describe, it, expect } from "vitest";
import { stubPrimitive } from "./stub";

describe("stub primitive", () => {
  it("seeded replay identical", () => {
    const a = stubPrimitive.create(7, { threshold: 50 });
    const b = stubPrimitive.create(7, { threshold: 50 });
    expect(a).toEqual(b);
  });
  it("apply win sets won", () => {
    const s = stubPrimitive.create(1, { threshold: 0 });
    const next = stubPrimitive.apply(s, "win");
    expect(next.status).toBe("won");
  });
  it("apply lose sets lost", () => {
    const s = stubPrimitive.create(1, { threshold: 0 });
    const next = stubPrimitive.apply(s, "lose");
    expect(next.status).toBe("lost");
  });
});
