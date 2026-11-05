import type { ZodType } from "zod";
import { nextRandom } from "../rng";

export type PuzzleStatus = "playing" | "won" | "lost";

// Fixed simulation step. Puzzle logic only ever sees this dt, so replays are exact.
export const STEP_MS = 16;

export interface PuzzleState {
  status: PuzzleStatus;
  elapsedMs: number;
  /** RNG state; advance it with `draw` so randomness stays inside the state. */
  rng: number;
}

export interface Puzzle<S extends PuzzleState, I, C> {
  id: string;
  configSchema: ZodType<C>;
  create(seed: number, config: C): S;
  /** Pure: advance time by dtMs, then apply the input (if any). */
  step(state: S, input: I | null, dtMs: number): S;
}

export function draw(rng: number): { value: number; rng: number } {
  return nextRandom(rng);
}

export function drawInt(rng: number, min: number, max: number): { value: number; rng: number } {
  const r = nextRandom(rng);
  return { value: min + Math.floor(r.value * (max - min + 1)), rng: r.rng };
}
