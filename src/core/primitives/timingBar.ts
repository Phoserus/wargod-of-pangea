import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface TimingBarState extends PrimitiveState {
  zoneStart: number;
  zoneWidth: number;
  position: number;
  requiredHits: number;
  hits: number;
  misses: number;
  missLimit: number;
}

export const timingBarPrimitive: Primitive<TimingBarState> = {
  id: "TimingBar",
  create(seed, config) {
    const rng = createRng(seed);
    const zoneWidth = (config.zoneWidth as number) ?? 20;
    const requiredHits = (config.requiredHits as number) ?? 3;
    const missLimit = (config.missLimit as number) ?? 3;
    const zoneStart = Math.floor(rng() * (100 - zoneWidth));
    return {
      status: "playing",
      zoneStart,
      zoneWidth,
      position: 0,
      requiredHits,
      hits: 0,
      misses: 0,
      missLimit,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "hit") {
      const inZone =
        state.position >= state.zoneStart && state.position < state.zoneStart + state.zoneWidth;
      if (inZone) {
        const hits = state.hits + 1;
        return {
          ...state,
          hits,
          status: hits >= state.requiredHits ? "won" : "playing",
        };
      }
      const misses = state.misses + 1;
      return {
        ...state,
        misses,
        status: misses >= state.missLimit ? "lost" : "playing",
      };
    }
    if (typeof action === "number") {
      return { ...state, position: action };
    }
    return state;
  },
};
