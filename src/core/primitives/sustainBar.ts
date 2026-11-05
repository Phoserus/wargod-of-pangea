import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface SustainBarState extends PrimitiveState {
  value: number;
  bandCenter: number;
  bandWidth: number;
  progress: number;
  targetProgress: number;
  drain: number;
}

export const sustainBarPrimitive: Primitive<SustainBarState> = {
  id: "SustainBar",
  create(seed, config) {
    const rng = createRng(seed);
    const bandWidth = (config.bandWidth as number) ?? 20;
    const targetProgress = (config.targetProgress as number) ?? 100;
    const bandCenter = Math.floor(rng() * 100);
    return {
      status: "playing",
      value: 50,
      bandCenter,
      bandWidth,
      progress: 0,
      targetProgress,
      drain: 1,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "tick") {
      const inBand = Math.abs(state.value - state.bandCenter) <= state.bandWidth / 2;
      const progress = inBand ? state.progress + 1 : Math.max(0, state.progress - state.drain);
      return {
        ...state,
        progress,
        status: progress >= state.targetProgress ? "won" : "playing",
      };
    }
    if (typeof action === "number") {
      return { ...state, value: action };
    }
    if (action === "fail") {
      return { ...state, status: "lost" };
    }
    return state;
  },
};
