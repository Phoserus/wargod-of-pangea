import React from "react";
import { getPuzzle } from "./core/puzzles/registry";
import type { LoggedInput } from "./core/puzzles/driver";
import { usePuzzleRun, type PuzzleRun } from "./usePuzzleRun";
import { GridRevealView } from "./puzzleViews/GridRevealView";
import { RhythmTapView } from "./puzzleViews/RhythmTapView";
import { TargetShotView } from "./puzzleViews/TargetShotView";

const VIEWS: Record<string, (props: PuzzleRun) => React.JSX.Element> = {
  GridReveal: GridRevealView,
  RhythmTap: RhythmTapView,
  TargetShot: TargetShotView,
};

export interface PuzzleCanvasProps {
  puzzleId: string;
  seed: number;
  config: unknown;
  onResult: (status: "won" | "lost", log: readonly LoggedInput<unknown>[]) => void;
}

/** Mount with a fresh `key` per attempt; one instance runs exactly one puzzle. */
export function PuzzleCanvas(props: PuzzleCanvasProps): React.JSX.Element {
  const puzzle = getPuzzle(props.puzzleId);
  const View = VIEWS[props.puzzleId];
  if (!puzzle || !View) return <p>Unknown puzzle: {props.puzzleId}</p>;
  return <Runner {...props} puzzleId={props.puzzleId} />;
}

function Runner(props: PuzzleCanvasProps): React.JSX.Element {
  const puzzle = getPuzzle(props.puzzleId)!;
  const View = VIEWS[props.puzzleId];
  const run = usePuzzleRun(puzzle, props.seed, props.config, props.onResult);
  return (
    <div aria-label={`${props.puzzleId} puzzle`}>
      <View {...run} />
    </div>
  );
}
