import { describe, it, expect } from "vitest";
import { pathTracePrimitive } from "./pathTrace";

describe("pathTrace primitive", () => {
  it("seeded replay identical", () => {
    const a = pathTracePrimitive.create(7, {
      nodeCount: 4,
      decoyCount: 1,
      missLimit: 3,
    });
    const b = pathTracePrimitive.create(7, {
      nodeCount: 4,
      decoyCount: 1,
      missLimit: 3,
    });
    expect(a).toEqual(b);
  });

  it("win on correct sequence", () => {
    const s = pathTracePrimitive.create(1, {
      nodeCount: 2,
      decoyCount: 0,
      missLimit: 3,
    });
    const first = pathTracePrimitive.apply(s, s.order[0]);
    expect(first.status).toBe("playing");
    const second = pathTracePrimitive.apply(first, s.order[1]);
    expect(second.status).toBe("won");
  });

  it("lose on wrong node", () => {
    const s = pathTracePrimitive.create(1, {
      nodeCount: 2,
      decoyCount: 0,
      missLimit: 1,
    });
    const wrong = (s.order[0] + 1) % 10;
    const st = pathTracePrimitive.apply(s, wrong);
    expect(st.status).toBe("lost");
  });
});
