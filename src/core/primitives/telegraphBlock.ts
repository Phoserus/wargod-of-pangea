import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface TelegraphBlockState extends PrimitiveState {
  sequence: string[];
  index: number;
  missLimit: number;
  misses: number;
}

const DIRS = ["N", "E", "S", "W"];

export const telegraphBlockPrimitive: Primitive<TelegraphBlockState> = {
  id: "TelegraphBlock",
  create(seed, config) {
    const rng = createRng(seed);
    const len = (config.sequenceLength as number) ?? 5;
    const missLimit = (config.missLimit as number) ?? 3;
    const seq: string[] = [];
    for (let i = 0; i < len; i++) seq.push(DIRS[Math.floor(rng() * DIRS.length)]);
    return { status: "playing", sequence: seq, index: 0, missLimit, misses: 0 };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    const expected = state.sequence[state.index];
    if (action === expected) {
      const next = state.index + 1;
      return {
        ...state,
        index: next,
        status: next >= state.sequence.length ? "won" : "playing",
      };
    }
    const misses = state.misses + 1;
    return {
      ...state,
      misses,
      status: misses >= state.missLimit ? "lost" : "playing",
    };
  },
};
