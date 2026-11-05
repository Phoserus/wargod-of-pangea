import { createDriver } from "./driver";
import { STEP_MS, type Puzzle, type PuzzleState } from "./puzzle";
import type { GridRevealInput, GridRevealState } from "./gridReveal";
import type { RhythmTapConfig, RhythmTapInput, RhythmTapState } from "./rhythmTap";
import type { TargetShotInput, TargetShotState } from "./targetShot";
import { rhythmTapPuzzle } from "./rhythmTap";

// Reference players used by tests: a perfect one that wins, and helpers to build mistakes.
// Not shipped to the client (only imported from *.test.ts).

const MAX_TICKS = 20000;

export function play<S extends PuzzleState, I, C>(
  puzzle: Puzzle<S, I, C>,
  seed: number,
  config: C,
  pick: (state: S) => I | null,
  maxTicks = MAX_TICKS,
) {
  const driver = createDriver(puzzle, seed, config);
  for (let i = 0; i < maxTicks && driver.state.status === "playing"; i++) {
    const input = pick(driver.state);
    if (input) driver.send(input);
    driver.advance(STEP_MS);
  }
  return driver;
}

/** Strikes exactly when the next tick would land in the zone. */
export function rhythmTapPerfect(
  puzzle: Puzzle<RhythmTapState, RhythmTapInput, RhythmTapConfig>,
): (s: RhythmTapState) => RhythmTapInput | null {
  return (s) => {
    const probe = puzzle.step(s, { type: "strike" }, STEP_MS);
    return probe.hits > s.hits ? { type: "strike" } : null;
  };
}

/** Shoots the centre of the oldest real target. */
export function targetShotPerfect(s: TargetShotState): TargetShotInput | null {
  const t = s.targets.find((x) => !x.decoy);
  return t ? { type: "shoot", x: t.x, y: t.y } : null;
}

/** Digs known ore cells in order. */
export function gridRevealPerfect(s: GridRevealState): GridRevealInput | null {
  const i = s.cells.findIndex((c, idx) => c === "ore" && !s.revealed[idx]);
  return i >= 0 ? { type: "dig", index: i } : null;
}

/** Perfect player for any registered puzzle id. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function perfectFor(puzzleId: string): (state: any) => any {
  if (puzzleId === "RhythmTap") return rhythmTapPerfect(rhythmTapPuzzle);
  if (puzzleId === "TargetShot") return targetShotPerfect;
  if (puzzleId === "GridReveal") return gridRevealPerfect;
  throw new Error(`no solver for ${puzzleId}`);
}

/** Digs known ore cells, but stops one short of winning. */
export function gridRevealOneShort(s: GridRevealState): GridRevealInput | null {
  return s.collected >= s.cfg.target - 1 ? null : gridRevealPerfect(s);
}
