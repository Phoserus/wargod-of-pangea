import { describe, it, expect } from "vitest";
import { xpForLevel } from "./xp";

describe("xp", () => {
  it("reference points", () => {
    expect(xpForLevel(50)).toBe(101333);
    expect(xpForLevel(75)).toBe(1210421);
    expect(xpForLevel(99)).toBe(13034431);
    expect(xpForLevel(100)).toBe(14391160);
  });
});
