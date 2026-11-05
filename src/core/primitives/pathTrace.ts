import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface PathTraceState extends PrimitiveState {
  nodes: { id: number; x: number; y: number; decoy: boolean }[];
  order: number[];
  currentIndex: number;
  mistakes: number;
  missLimit: number;
}

export const pathTracePrimitive: Primitive<PathTraceState> = {
  id: "PathTrace",
  configSchema: {
    nodeCount: "number",
    decoyCount: "number",
    missLimit: "number",
  },
  create(seed, config) {
    const rng = createRng(seed);
    const nodeCount = (config.nodeCount as number) ?? 6;
    const decoyCount = (config.decoyCount as number) ?? 2;
    const missLimit = (config.missLimit as number) ?? 3;
    const nodes: PathTraceState["nodes"] = [];
    const order: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: Math.floor(rng() * 100),
        y: Math.floor(rng() * 100),
        decoy: false,
      });
      order.push(i);
    }
    for (let i = 0; i < decoyCount; i++) {
      nodes.push({
        id: nodeCount + i,
        x: Math.floor(rng() * 100),
        y: Math.floor(rng() * 100),
        decoy: true,
      });
    }
    return {
      status: "playing",
      nodes,
      order,
      currentIndex: 0,
      mistakes: 0,
      missLimit,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (typeof action === "number") {
      const nodeId = action;
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return state;
      if (node.decoy) {
        const mistakes = state.mistakes + 1;
        return {
          ...state,
          mistakes,
          status: mistakes >= state.missLimit ? "lost" : "playing",
        };
      }
      const expected = state.order[state.currentIndex];
      if (nodeId === expected) {
        const next = state.currentIndex + 1;
        return {
          ...state,
          currentIndex: next,
          status: next >= state.order.length ? "won" : "playing",
        };
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
