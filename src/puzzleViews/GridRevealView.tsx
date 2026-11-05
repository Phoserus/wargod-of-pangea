import React from "react";
import { adjacent, type GridRevealState } from "../core/puzzles/gridReveal";
import type { PuzzleRun } from "../usePuzzleRun";
import { sfx } from "../core/audio";
import { useOnChange } from "../useOnChange";

const SYMBOL = { ore: "◆", hazard: "▲", empty: "" } as const;

export function GridRevealView({ state, send }: PuzzleRun): React.JSX.Element {
  const s = state as GridRevealState;
  const { width } = s.cfg;
  const over = s.status !== "playing";
  useOnChange(s.swingsLeft, () => {
    sfx("dig");
  });
  useOnChange(s.collected, () => sfx("coin"));
  useOnChange(s.stabilityLeft, () => sfx("hurt"));
  return (
    <div className="puzzle-surface">
      <p aria-live="polite">
        Ore {s.collected}/{s.cfg.target} · Swings {s.swingsLeft} · Stability {s.stabilityLeft}
      </p>
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Numbers show neighbouring ore (◆) and hazards (▲). The vein is connected.
      </p>
      <div
        role="grid"
        aria-label="Rock face"
        style={{ display: "grid", gridTemplateColumns: `repeat(${width}, 44px)`, gap: 4 }}
      >
        {s.cells.map((cell, i) => {
          const shown = s.revealed[i] || over;
          const adj = shown && cell === "empty" ? adjacent(s, i) : null;
          const x = (i % width) + 1;
          const y = Math.floor(i / width) + 1;
          const label = !s.revealed[i]
            ? `Row ${y} column ${x}, unexplored`
            : `Row ${y} column ${x}, ${cell === "empty" ? "clear" : cell}`;
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={label}
              disabled={over || s.revealed[i]}
              onClick={() => send({ type: "dig", index: i })}
              style={{
                width: 44,
                height: 44,
                fontSize: 14,
                cursor: over ? "default" : "pointer",
                background: !shown
                  ? "var(--puzzle-tile)"
                  : cell === "empty"
                    ? "var(--puzzle-bg)"
                    : cell === "ore"
                      ? "#ffe08a"
                      : "#ffb3b3",
                color: "var(--puzzle-ink)",
                border: "2px solid var(--puzzle-ink)",
                borderRadius: 10,
              }}
            >
              {shown ? SYMBOL[cell] : ""}
              {adj ? (
                <span>
                  {adj.ore > 0 ? adj.ore : ""}
                  {adj.hazard > 0 ? <sub style={{ color: "#b3261e" }}>{adj.hazard}</sub> : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
