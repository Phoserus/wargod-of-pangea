import { z } from "zod";
import { createRng } from "../rng";
import type { Puzzle, PuzzleState } from "./puzzle";

// Mining: dig cells to uncover an ore vein. Numbers on safe cells count neighbouring ore and
// hazards, so the vein can be deduced. Hazards cost stability; every dig costs a swing.
export const gridRevealConfig = z
  .object({
    width: z.number().int().min(3).max(12),
    height: z.number().int().min(3).max(12),
    ore: z.number().int().min(1),
    target: z.number().int().min(1),
    hazards: z.number().int().min(0),
    swings: z.number().int().min(1),
    stability: z.number().int().min(1),
  })
  .refine((c) => c.target <= c.ore, { message: "target must not exceed ore" })
  .refine((c) => c.ore + c.hazards < c.width * c.height, { message: "grid too small" });
export type GridRevealConfig = z.infer<typeof gridRevealConfig>;

export type GridRevealInput = { type: "dig"; index: number };

export type Cell = "empty" | "ore" | "hazard";

export interface GridRevealState extends PuzzleState {
  cfg: GridRevealConfig;
  cells: Cell[];
  revealed: boolean[];
  collected: number;
  swingsLeft: number;
  stabilityLeft: number;
  lastEvent: "empty" | "ore" | "hazard" | null;
}

export function neighbours(cfg: { width: number; height: number }, index: number): number[] {
  const x = index % cfg.width;
  const y = Math.floor(index / cfg.width);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < cfg.width && ny < cfg.height) out.push(ny * cfg.width + nx);
    }
  }
  return out;
}

export function adjacent(state: GridRevealState, index: number): { ore: number; hazard: number } {
  let ore = 0;
  let hazard = 0;
  for (const n of neighbours(state.cfg, index)) {
    if (state.cells[n] === "ore") ore++;
    else if (state.cells[n] === "hazard") hazard++;
  }
  return { ore, hazard };
}

function generate(seed: number, cfg: GridRevealConfig): Cell[] {
  const rng = createRng(seed);
  const size = cfg.width * cfg.height;
  const cells: Cell[] = Array<Cell>(size).fill("empty");
  const vein: number[] = [Math.floor(rng() * size)];
  cells[vein[0]] = "ore";
  while (vein.length < cfg.ore) {
    const from = vein[Math.floor(rng() * vein.length)];
    const options = neighbours(cfg, from).filter((n) => cells[n] === "empty");
    if (options.length === 0) continue;
    const pick = options[Math.floor(rng() * options.length)];
    cells[pick] = "ore";
    vein.push(pick);
  }
  let placed = 0;
  while (placed < cfg.hazards) {
    const i = Math.floor(rng() * size);
    if (cells[i] === "empty") {
      cells[i] = "hazard";
      placed++;
    }
  }
  return cells;
}

export const gridRevealPuzzle: Puzzle<GridRevealState, GridRevealInput, GridRevealConfig> = {
  id: "GridReveal",
  configSchema: gridRevealConfig,
  create(seed, cfg) {
    return {
      status: "playing",
      elapsedMs: 0,
      rng: seed >>> 0,
      cfg,
      cells: generate(seed, cfg),
      revealed: Array<boolean>(cfg.width * cfg.height).fill(false),
      collected: 0,
      swingsLeft: cfg.swings,
      stabilityLeft: cfg.stability,
      lastEvent: null,
    };
  },
  step(state, input, dtMs) {
    if (state.status !== "playing") return state;
    const s = { ...state, elapsedMs: state.elapsedMs + dtMs };
    if (input?.type !== "dig") return s;
    const i = input.index;
    if (!Number.isInteger(i) || i < 0 || i >= s.cells.length || s.revealed[i]) return s;

    const revealed = s.revealed.slice();
    revealed[i] = true;
    const cell = s.cells[i];
    const collected = s.collected + (cell === "ore" ? 1 : 0);
    const stabilityLeft = s.stabilityLeft - (cell === "hazard" ? 1 : 0);
    const swingsLeft = s.swingsLeft - 1;
    const status =
      collected >= s.cfg.target
        ? "won"
        : stabilityLeft <= 0 || swingsLeft <= 0
          ? "lost"
          : "playing";
    return { ...s, revealed, collected, stabilityLeft, swingsLeft, lastEvent: cell, status };
  },
};
