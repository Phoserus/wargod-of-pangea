import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface FishingState extends PrimitiveState {
  bites: number;
  caught: number;
  target: number;
}
export const fishingPrimitive: Primitive<FishingState> = {
  id: "Fishing",
  configSchema: { target: "number" },
  create(seed, config) {
    const rng = createRng(seed);
    const target = (config.target as number) ?? 3;
    return {
      status: "playing",
      bites: Math.floor(rng() * 5) + 1,
      caught: 0,
      target,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "hook") {
      const caught = state.caught + 1;
      return {
        ...state,
        caught,
        status: caught >= state.target ? "won" : "playing",
      };
    }
    if (action === "snap") return { ...state, status: "lost" };
    return state;
  },
};
