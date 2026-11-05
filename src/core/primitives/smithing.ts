import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface SmithingState extends PrimitiveState {
  heat: number;
  progress: number;
  target: number;
}
export const smithingPrimitive: Primitive<SmithingState> = {
  id: "Smithing",
  configSchema: { target: "number" },
  create(seed, config) {
    const rng = createRng(seed);
    const target = (config.target as number) ?? 5;
    return {
      status: "playing",
      heat: Math.floor(rng() * 100),
      progress: 0,
      target,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "hammer") {
      const progress = state.progress + 1;
      return {
        ...state,
        progress,
        status: progress >= state.target ? "won" : "playing",
      };
    }
    if (action === "shatter") return { ...state, status: "lost" };
    return state;
  },
};
