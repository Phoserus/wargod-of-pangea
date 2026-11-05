import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface WoodcuttingState extends PrimitiveState {
  chops: number;
  required: number;
}
export const woodcuttingPrimitive: Primitive<WoodcuttingState> = {
  id: "Woodcutting",
  configSchema: { required: "number" },
  create(seed, config) {
    const rng = createRng(seed);
    const required = (config.required as number) ?? 5;
    return {
      status: "playing",
      chops: 0,
      required: required + Math.floor(rng() * 3),
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "chop") {
      const chops = state.chops + 1;
      return {
        ...state,
        chops,
        status: chops >= state.required ? "won" : "playing",
      };
    }
    if (action === "break") return { ...state, status: "lost" };
    return state;
  },
};
