import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface LaneDodgeState extends PrimitiveState {
  lane: number; // 0 = left, 1 = right
  branchSide: number; // 0 = left, 1 = right (dangerous side)
  hits: number;
  requiredHits: number;
  misses: number;
  missLimit: number;
}

export const laneDodgePrimitive: Primitive<LaneDodgeState> = {
  id: "LaneDodge",
  configSchema: {
    chopSpeed: "number",
    branchDensity: "number",
    requiredHits: "number",
    missLimit: "number",
  },
  create(seed, config) {
    const rng = createRng(seed);
    const requiredHits = (config.requiredHits as number) ?? 10;
    const missLimit = (config.missLimit as number) ?? 3;
    const branchSide = Math.floor(rng() * 2);
    return {
      status: "playing",
      lane: 0,
      branchSide,
      hits: 0,
      requiredHits,
      misses: 0,
      missLimit,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "chop-left" || action === "chop-right") {
      const chosenLane = action === "chop-left" ? 0 : 1;
      const nextLane = chosenLane;
      if (nextLane === state.branchSide) {
        const misses = state.misses + 1;
        return {
          ...state,
          lane: nextLane,
          branchSide: Math.floor(Math.random() * 2),
          misses,
          status: misses >= state.missLimit ? "lost" : "playing",
        };
      }
      const hits = state.hits + 1;
      return {
        ...state,
        lane: nextLane,
        branchSide: Math.floor(Math.random() * 2),
        hits,
        status: hits >= state.requiredHits ? "won" : "playing",
      };
    }
    return state;
  },
};
