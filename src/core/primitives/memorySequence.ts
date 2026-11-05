import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface MemorySequenceState extends PrimitiveState {
  sequence: number[];
  playerInput: number[];
  currentIndex: number;
  mistakes: number;
  missLimit: number;
}

export const memorySequencePrimitive: Primitive<MemorySequenceState> = {
  id: "MemorySequence",
  configSchema: {
    sequenceLength: "number",
    symbolCount: "number",
    missLimit: "number",
  },
  create(seed, config) {
    const rng = createRng(seed);
    const length = (config.sequenceLength as number) ?? 4;
    const symbolCount = (config.symbolCount as number) ?? 4;
    const missLimit = (config.missLimit as number) ?? 3;
    const sequence: number[] = [];
    for (let i = 0; i < length; i++) {
      sequence.push(Math.floor(rng() * symbolCount));
    }
    return {
      status: "playing",
      sequence,
      playerInput: [],
      currentIndex: 0,
      mistakes: 0,
      missLimit,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (typeof action === "number") {
      const input = action;
      const expected = state.sequence[state.currentIndex];
      if (input === expected) {
        const next = state.currentIndex + 1;
        const playerInput = [...state.playerInput, input];
        if (next >= state.sequence.length) {
          return { ...state, playerInput, status: "won" };
        }
        return { ...state, playerInput, currentIndex: next };
      }
      const mistakes = state.mistakes + 1;
      return {
        ...state,
        mistakes,
        status: mistakes >= state.missLimit ? "lost" : "playing",
      };
    }
    return state;
  },
};
