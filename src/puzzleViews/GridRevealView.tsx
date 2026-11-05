import React from "react";
import { adjacent, type GridRevealState } from "../core/puzzles/gridReveal";
import type { PuzzleRun } from "../usePuzzleRun";

const SYMBOL = { ore: "◆", hazard: "▲", empty: "" } as const;

export function GridRevealView({ state, send }: PuzzleRun): React.JSX.Element {
  const s = state as GridRevealState;
  const { width } = s.cfg;
  const over = s.status !== "playing";
  return (
    <div>
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
                background: !shown ? "#555" : cell === "empty" ? "#2c2c2c" : "#3a3a3a",
                color: cell === "ore" ? "#ffd166" : cell === "hazard" ? "#ff6b6b" : "#ddd",
                border: "1px solid #777",
              }}
            >
              {shown ? SYMBOL[cell] : ""}
              {adj ? (
                <span>
                  {adj.ore > 0 ? adj.ore : ""}
                  {adj.hazard > 0 ? <sub style={{ color: "#ff6b6b" }}>{adj.hazard}</sub> : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
