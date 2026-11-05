import { z } from "zod";
import { draw, type Puzzle, type PuzzleState } from "./puzzle";

// Smithing: strike the hot metal while the marker is inside the glowing zone.
export const rhythmTapConfig = z.object({
  strikes: z.number().int().min(1),
  missLimit: z.number().int().min(1),
  zoneWidth: z.number().min(4).max(60),
  /** Marker speed in bar-percent per second. */
  speed: z.number().min(10).max(300),
  /** Zone width lost after each good strike. */
  shrink: z.number().min(0).max(20),
});
export type RhythmTapConfig = z.infer<typeof rhythmTapConfig>;

export type RhythmTapInput = { type: "strike" };

export interface RhythmTapState extends PuzzleState {
  cfg: RhythmTapConfig;
  position: number;
  zoneCenter: number;
  zoneWidth: number;
  hits: number;
  misses: number;
  lastResult: "hit" | "miss" | null;
}

const MIN_ZONE = 6;

export function markerPosition(elapsedMs: number, speed: number): number {
  const travelled = ((elapsedMs / 1000) * speed) % 200;
  return travelled <= 100 ? travelled : 200 - travelled;
}

function placeZone(rng: number, width: number): { center: number; rng: number } {
  const r = draw(rng);
  return { center: width / 2 + r.value * (100 - width), rng: r.rng };
}

export const rhythmTapPuzzle: Puzzle<RhythmTapState, RhythmTapInput, RhythmTapConfig> = {
  id: "RhythmTap",
  configSchema: rhythmTapConfig,
  create(seed, cfg) {
    const zone = placeZone(seed >>> 0, cfg.zoneWidth);
    return {
      status: "playing",
      elapsedMs: 0,
      rng: zone.rng,
      cfg,
      position: 0,
      zoneCenter: zone.center,
      zoneWidth: cfg.zoneWidth,
      hits: 0,
      misses: 0,
      lastResult: null,
    };
  },
  step(state, input, dtMs) {
    if (state.status !== "playing") return state;
    const elapsedMs = state.elapsedMs + dtMs;
    let next: RhythmTapState = {
      ...state,
      elapsedMs,
      position: markerPosition(elapsedMs, state.cfg.speed),
    };
    if (input?.type !== "strike") return next;

    const inZone = Math.abs(next.position - next.zoneCenter) <= next.zoneWidth / 2;
    if (inZone) {
      const hits = next.hits + 1;
      const zoneWidth = Math.max(MIN_ZONE, next.zoneWidth - next.cfg.shrink);
      const zone = placeZone(next.rng, zoneWidth);
      next = {
        ...next,
        hits,
        zoneWidth,
        zoneCenter: zone.center,
        rng: zone.rng,
        lastResult: "hit",
        status: hits >= next.cfg.strikes ? "won" : "playing",
      };
    } else {
      const misses = next.misses + 1;
      next = {
        ...next,
        misses,
        lastResult: "miss",
        status: misses >= next.cfg.missLimit ? "lost" : "playing",
      };
    }
    return next;
  },
};
