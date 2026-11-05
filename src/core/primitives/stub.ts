import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface StubState extends PrimitiveState {
  value: number;
  target: number;
}

export const stubPrimitive: Primitive<StubState> = {
  id: "stub",
  configSchema: { threshold: "number" },
  create(seed, config) {
    const rng = createRng(seed);
    const target = Math.floor(rng() * 100);
    const value = Math.floor(rng() * 100);
    const threshold = (config.threshold as number) ?? 50;
    return {
      status: value >= threshold ? "won" : "playing",
      value,
      target,
    };
  },
  apply(state, action) {
    if (action === "win") return { ...state, status: "won" };
    if (action === "lose") return { ...state, status: "lost" };
    return state;
  },
};
