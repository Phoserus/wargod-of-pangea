import { z } from "zod";
import { draw, type Puzzle, type PuzzleState } from "./puzzle";

// Attack: hit the real targets, ignore decoys, don't let targets slip away.
export const targetShotConfig = z.object({
  requiredHits: z.number().int().min(1),
  missLimit: z.number().int().min(1),
  spawnMs: z.number().min(200),
  lifetimeMs: z.number().min(500),
  maxActive: z.number().int().min(1).max(8),
  decoyChance: z.number().min(0).max(0.8),
  /** Hit radius in arena percent (arena is 0..100 on both axes). */
  radius: z.number().min(3).max(20),
});
export type TargetShotConfig = z.infer<typeof targetShotConfig>;

export type TargetShotInput = { type: "shoot"; x: number; y: number };

export interface Target {
  id: number;
  x: number;
  y: number;
  decoy: boolean;
  bornMs: number;
}

export interface TargetShotState extends PuzzleState {
  cfg: TargetShotConfig;
  targets: Target[];
  nextId: number;
  nextSpawnMs: number;
  hits: number;
  misses: number;
  lastEvent: "hit" | "miss" | "decoy" | "expired" | null;
}

const FIRST_SPAWN_MS = 300;

function spawn(state: TargetShotState): TargetShotState {
  let rng = state.rng;
  const x = draw(rng);
  const y = draw(x.rng);
  const d = draw(y.rng);
  rng = d.rng;
  const target: Target = {
    id: state.nextId,
    x: 10 + x.value * 80,
    y: 10 + y.value * 80,
    decoy: d.value < state.cfg.decoyChance,
    bornMs: state.elapsedMs,
  };
  return { ...state, rng, nextId: state.nextId + 1, targets: [...state.targets, target] };
}

function withMiss(state: TargetShotState, event: "miss" | "decoy" | "expired"): TargetShotState {
  const misses = state.misses + 1;
  return {
    ...state,
    misses,
    lastEvent: event,
    status: misses >= state.cfg.missLimit ? "lost" : state.status,
  };
}

export const targetShotPuzzle: Puzzle<TargetShotState, TargetShotInput, TargetShotConfig> = {
  id: "TargetShot",
  configSchema: targetShotConfig,
  create(seed, cfg) {
    return {
      status: "playing",
      elapsedMs: 0,
      rng: seed >>> 0,
      cfg,
      targets: [],
      nextId: 1,
      nextSpawnMs: FIRST_SPAWN_MS,
      hits: 0,
      misses: 0,
      lastEvent: null,
    };
  },
  step(state, input, dtMs) {
    if (state.status !== "playing") return state;
    let s: TargetShotState = { ...state, elapsedMs: state.elapsedMs + dtMs };

    const expired = s.targets.filter((t) => s.elapsedMs - t.bornMs >= s.cfg.lifetimeMs);
    if (expired.length > 0) {
      s = { ...s, targets: s.targets.filter((t) => !expired.includes(t)) };
      for (const t of expired) {
        if (!t.decoy && s.status === "playing") s = withMiss(s, "expired");
      }
    }

    while (s.status === "playing" && s.elapsedMs >= s.nextSpawnMs) {
      s = s.targets.length < s.cfg.maxActive ? spawn(s) : s;
      s = { ...s, nextSpawnMs: s.nextSpawnMs + s.cfg.spawnMs };
    }

    if (input?.type !== "shoot" || s.status !== "playing") return s;

    let best: Target | null = null;
    let bestDist = Infinity;
    for (const t of s.targets) {
      const dist = Math.hypot(t.x - input.x, t.y - input.y);
      if (dist <= s.cfg.radius && dist < bestDist) {
        best = t;
        bestDist = dist;
      }
    }
    if (!best) return withMiss(s, "miss");

    const hit = best;
    s = { ...s, targets: s.targets.filter((t) => t !== hit) };
    if (hit.decoy) return withMiss(s, "decoy");
    const hits = s.hits + 1;
    return {
      ...s,
      hits,
      lastEvent: "hit",
      status: hits >= s.cfg.requiredHits ? "won" : "playing",
    };
  },
};
