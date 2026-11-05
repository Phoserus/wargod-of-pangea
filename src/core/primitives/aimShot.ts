import { createRng } from "../rng";
import type { Primitive, PrimitiveState } from "../primitive";

export interface AimShotState extends PrimitiveState {
  targets: { x: number; y: number; decoy: boolean }[];
  requiredHits: number;
  hits: number;
  misses: number;
  missLimit: number;
}

export const aimShotPrimitive: Primitive<AimShotState> = {
  id: "AimShot",
  configSchema: {
    decoyCount: "number",
    requiredHits: "number",
    missLimit: "number",
  },
  create(seed, config) {
    const rng = createRng(seed);
    const decoyCount = (config.decoyCount as number) ?? 2;
    const requiredHits = (config.requiredHits as number) ?? 3;
    const missLimit = (config.missLimit as number) ?? 3;
    const targets: AimShotState["targets"] = [];
    targets.push({
      x: Math.floor(rng() * 100),
      y: Math.floor(rng() * 100),
      decoy: false,
    });
    for (let i = 0; i < decoyCount; i++) {
      targets.push({
        x: Math.floor(rng() * 100),
        y: Math.floor(rng() * 100),
        decoy: true,
      });
    }
    return {
      status: "playing",
      targets,
      requiredHits,
      hits: 0,
      misses: 0,
      missLimit,
    };
  },
  apply(state, action) {
    if (state.status !== "playing") return state;
    if (action === "hit") {
      const nextHits = state.hits + 1;
      return {
        ...state,
        hits: nextHits,
        status: nextHits >= state.requiredHits ? "won" : "playing",
      };
    }
    if (action === "miss") {
      const nextMisses = state.misses + 1;
      return {
        ...state,
        misses: nextMisses,
        status: nextMisses >= state.missLimit ? "lost" : "playing",
      };
    }
    if (action === "hit-decoy") {
      const nextMisses = state.misses + 1;
      return {
        ...state,
        misses: nextMisses,
        status: nextMisses >= state.missLimit ? "lost" : "playing",
      };
    }
    return state;
  },
};
