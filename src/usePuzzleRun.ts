import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createDriver, type Driver, type LoggedInput } from "./core/puzzles/driver";
import type { PuzzleState } from "./core/puzzles/puzzle";
import type { AnyPuzzle } from "./core/puzzles/registry";

const MAX_FRAME_MS = 100;

export interface PuzzleRun {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send: (input: any) => void;
}

/** Runs a puzzle on a fixed-step driver, re-rendering each animation frame while it is playing. */
export function usePuzzleRun(
  puzzle: AnyPuzzle,
  seed: number,
  config: unknown,
  onFinish: (status: "won" | "lost", log: readonly LoggedInput<unknown>[]) => void,
): PuzzleRun {
  const [driver] = useState<Driver<PuzzleState, unknown>>(() =>
    createDriver(puzzle, seed, puzzle.configSchema.parse(config)),
  );
  const [, render] = useReducer((n: number) => n + 1, 0);
  const finish = useRef(onFinish);
  useEffect(() => {
    finish.current = onFinish;
  });
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (): void => {
      const now = performance.now();
      driver.advance(Math.min(now - last, MAX_FRAME_MS));
      last = now;
      render();
      if (driver.state.status === "playing") raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [driver]);

  const status = driver.state.status;
  useEffect(() => {
    if (status !== "playing" && !done.current) {
      done.current = true;
      finish.current(status, driver.log);
    }
  }, [status, driver]);

  const send = useCallback((input: unknown) => driver.send(input), [driver]);
  return { state: driver.state, send };
}
