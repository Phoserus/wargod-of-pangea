import type { Primitive, PrimitiveState } from "../primitive";

export interface CraftingState extends PrimitiveState {
  pieces: number;
  target: number;
}
export const craftingPrimitive: Primitive<CraftingState> = {
  id: "Crafting",
  configSchema: { target: "number" },
  create(_seed, config) {
    const target = (config.target as number) ?? 3;
    return { status: "playing", pieces: 0, target };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "combine") {
      const pieces = state.pieces + 1;
      return {
        ...state,
        pieces,
        status: pieces >= state.target ? "won" : "playing",
      };
    }
    if (action === "ruin") return { ...state, status: "lost" };
    return state;
  },
};
