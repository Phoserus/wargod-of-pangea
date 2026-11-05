import { describe, it, expect } from "vitest";
import { memorySequencePrimitive } from "./memorySequence";

describe("memorySequence primitive", () => {
  it("seeded replay identical", () => {
    const a = memorySequencePrimitive.create(7, {
      sequenceLength: 4,
      symbolCount: 4,
      missLimit: 3,
    });
    const b = memorySequencePrimitive.create(7, {
      sequenceLength: 4,
      symbolCount: 4,
      missLimit: 3,
    });
    expect(a).toEqual(b);
  });

  it("win on correct sequence", () => {
    const s = memorySequencePrimitive.create(1, {
      sequenceLength: 1,
      symbolCount: 2,
      missLimit: 3,
    });
    const first = s.sequence[0];
    const st = memorySequencePrimitive.apply(s, first);
    expect(st.status).toBe("won");
  });

  it("lose on wrong input", () => {
    const s = memorySequencePrimitive.create(1, {
      sequenceLength: 1,
      symbolCount: 2,
      missLimit: 1,
    });
    const wrong = s.sequence[0] === 0 ? 1 : 0;
    const st = memorySequencePrimitive.apply(s, wrong);
    expect(st.status).toBe("lost");
  });
});
