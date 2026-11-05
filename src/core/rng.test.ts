import { describe, it, expect } from "vitest";
import { createRng } from "./rng";

describe("rng", () => {
  it("same seed produces same sequence", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });
  it("different seeds differ", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });
});
