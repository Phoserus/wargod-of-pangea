import { STEP_MS, type Puzzle, type PuzzleState } from "./puzzle";

export interface LoggedInput<I> {
  tick: number;
  input: I;
}

export interface Driver<S extends PuzzleState, I> {
  readonly state: S;
  readonly tick: number;
  readonly log: readonly LoggedInput<I>[];
  /** Queue an input; it is applied on the next simulation tick. */
  send(input: I): void;
  /** Feed real elapsed time; runs as many fixed steps as fit. */
  advance(realDtMs: number): S;
}

export function createDriver<S extends PuzzleState, I, C>(
  puzzle: Puzzle<S, I, C>,
  seed: number,
  config: C,
): Driver<S, I> {
  let state = puzzle.create(seed, config);
  let tick = 0;
  let acc = 0;
  const queue: I[] = [];
  const log: LoggedInput<I>[] = [];
  return {
    get state() {
      return state;
    },
    get tick() {
      return tick;
    },
    get log() {
      return log;
    },
    send(input) {
      if (state.status === "playing") queue.push(input);
    },
    advance(realDtMs) {
      acc += realDtMs;
      while (acc >= STEP_MS && state.status === "playing") {
        acc -= STEP_MS;
        const input = queue.shift() ?? null;
        if (input !== null) log.push({ tick, input });
        state = puzzle.step(state, input, STEP_MS);
        tick++;
      }
      if (state.status !== "playing") queue.length = 0;
      return state;
    },
  };
}

/** Re-run a recorded input log; used by tests now and by server-side verification later. */
export function replay<S extends PuzzleState, I, C>(
  puzzle: Puzzle<S, I, C>,
  seed: number,
  config: C,
  log: readonly LoggedInput<I>[],
  maxTicks: number,
): S {
  let state = puzzle.create(seed, config);
  let i = 0;
  for (let tick = 0; tick < maxTicks && state.status === "playing"; tick++) {
    let input: I | null = null;
    if (i < log.length && log[i].tick === tick) input = log[i++].input;
    state = puzzle.step(state, input, STEP_MS);
  }
  return state;
}
