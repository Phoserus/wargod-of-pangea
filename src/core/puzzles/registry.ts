import type { Puzzle, PuzzleState } from "./puzzle";
import { gridRevealPuzzle } from "./gridReveal";
import { rhythmTapPuzzle } from "./rhythmTap";
import { targetShotPuzzle } from "./targetShot";

// Heterogeneous registry: state/input/config types are erased here and re-checked by each
// puzzle's zod configSchema at the boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPuzzle = Puzzle<any, any, any>;

export const puzzles: Record<string, AnyPuzzle> = {
  [gridRevealPuzzle.id]: gridRevealPuzzle,
  [rhythmTapPuzzle.id]: rhythmTapPuzzle,
  [targetShotPuzzle.id]: targetShotPuzzle,
};

export function getPuzzle(id: string): AnyPuzzle | undefined {
  return puzzles[id];
}

export type { PuzzleState };
