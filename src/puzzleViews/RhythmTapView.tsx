import React, { useEffect } from "react";
import type { RhythmTapState } from "../core/puzzles/rhythmTap";
import type { PuzzleRun } from "../usePuzzleRun";
import { sfx } from "../core/audio";
import { useOnChange } from "../useOnChange";

export function RhythmTapView({ state, send }: PuzzleRun): React.JSX.Element {
  const s = state as RhythmTapState;
  const over = s.status !== "playing";
  useOnChange(s.hits, () => sfx("hit"));
  useOnChange(s.misses, () => sfx("miss"));

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === "Space") {
        e.preventDefault();
        send({ type: "strike" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [send]);

  const left = s.zoneCenter - s.zoneWidth / 2;
  return (
    <div className="puzzle-surface">
      <p aria-live="polite">
        Strikes {s.hits}/{s.cfg.strikes} · Misses {s.misses}/{s.cfg.missLimit}
        {s.lastResult ? ` · ${s.lastResult === "hit" ? "Clean strike!" : "Missed the glow"}` : ""}
      </p>
      <div
        role="img"
        aria-label={`Hot metal bar: marker at ${Math.round(s.position)} percent, glowing zone from ${Math.round(left)} to ${Math.round(left + s.zoneWidth)} percent`}
        style={{
          position: "relative",
          height: 48,
          maxWidth: 480,
          background: "var(--puzzle-tile-alt)",
          border: "3px solid var(--puzzle-ink)",
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${left}%`,
            width: `${s.zoneWidth}%`,
            background: "#ff9f1c",
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -4,
            bottom: -4,
            left: `calc(${s.position}% - 2px)`,
            width: 4,
            background: "var(--puzzle-ink)",
          }}
        />
      </div>
      <button
        disabled={over}
        onClick={() => send({ type: "strike" })}
        style={{ marginTop: 12, padding: "10px 24px", fontSize: 16 }}
      >
        Strike (Space)
      </button>
    </div>
  );
}
