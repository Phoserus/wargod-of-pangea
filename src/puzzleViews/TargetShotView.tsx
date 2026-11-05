import React from "react";
import type { TargetShotState } from "../core/puzzles/targetShot";
import type { PuzzleRun } from "../usePuzzleRun";

export function TargetShotView({ state, send }: PuzzleRun): React.JSX.Element {
  const s = state as TargetShotState;
  const over = s.status !== "playing";
  const size = s.cfg.radius * 2;

  const onArenaClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    send({
      type: "shoot",
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div>
      <p aria-live="polite">
        Hits {s.hits}/{s.cfg.requiredHits} · Misses {s.misses}/{s.cfg.missLimit}
        {s.lastEvent === "decoy" ? " · That was a decoy!" : ""}
        {s.lastEvent === "expired" ? " · One got away" : ""}
      </p>
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Hit the gold circles (◎). Avoid the red squares (✕). Don&apos;t let gold ones expire.
      </p>
      <div
        onClick={over ? undefined : onArenaClick}
        style={{
          position: "relative",
          width: "min(100%, 420px)",
          aspectRatio: "1",
          background: "#1f2a33",
          border: "1px solid #777",
          cursor: over ? "default" : "crosshair",
        }}
      >
        {s.targets.map((t) => (
          <button
            key={t.id}
            aria-label={t.decoy ? "Decoy, do not shoot" : "Target"}
            disabled={over}
            onClick={(e) => {
              e.stopPropagation();
              send({ type: "shoot", x: t.x, y: t.y });
            }}
            style={{
              position: "absolute",
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${size}%`,
              height: `${size}%`,
              transform: "translate(-50%, -50%)",
              borderRadius: t.decoy ? 4 : "50%",
              border: "2px solid #fff",
              background: t.decoy ? "#c0392b" : "#f1c40f",
              color: "#111",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {t.decoy ? "✕" : "◎"}
          </button>
        ))}
      </div>
    </div>
  );
}
