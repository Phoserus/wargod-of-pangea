import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface MiningState extends PrimitiveState {
  rocks: number;
  extracted: number;
  target: number;
}
export const miningPrimitive: Primitive<MiningState> = {
  id: "Mining",
  configSchema: { rocks: "number", target: "number" },
  create(seed, config) {
    const rng = createRng(seed);
    const rocks = (config.rocks as number) ?? 5;
    const target = (config.target as number) ?? 3;
    return {
      status: "playing",
      rocks: Math.floor(rng() * rocks) + 1,
      extracted: 0,
      target,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "mine") {
      const extracted = state.extracted + 1;
      return {
        ...state,
        extracted,
        status: extracted >= state.target ? "won" : "playing",
      };
    }
    if (action === "collapse") return { ...state, status: "lost" };
    return state;
  },
};
