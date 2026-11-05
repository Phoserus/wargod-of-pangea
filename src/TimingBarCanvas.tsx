import React, { useEffect, useRef, useState } from "react";
import { timingBarPrimitive } from "./core/primitives/timingBar";
import type { TimingBarState } from "./core/primitives/timingBar";

export function TimingBarCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TimingBarState>(timingBarPrimitive.create(props.seed, props.config));
  const [announce, setAnnounce] = useState("");

  const speak = (msg: string): void => {
    setAnnounce(msg);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    const render = (): void => {
      const s = stateRef.current;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // track
      ctx.fillStyle = "#444";
      ctx.fillRect(20, canvas.height / 2 - 10, canvas.width - 40, 20);
      // zone
      ctx.fillStyle = "#3c3";
      ctx.fillRect(
        20 + (s.zoneStart / 100) * (canvas.width - 40),
        canvas.height / 2 - 10,
        (s.zoneWidth / 100) * (canvas.width - 40),
        20,
      );
      // marker
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        20 + (s.position / 100) * (canvas.width - 40) - 2,
        canvas.height / 2 - 14,
        4,
        28,
      );
      ctx.fillStyle = "#fff";
      ctx.fillText(`Hits ${s.hits}/${s.requiredHits} Misses ${s.misses}/${s.missLimit}`, 10, 20);
    };
    const loop = (now: number): void => {
      const s = stateRef.current;
      if (s.status === "playing") {
        const dt = (now - last) / 1000;
        const speed = 60; // units per second
        const nextPos = (s.position + speed * dt) % 100;
        stateRef.current = timingBarPrimitive.apply(s, nextPos);
      }
      last = now;
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [props.seed]);

  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>): void => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const s = stateRef.current;
      const next = timingBarPrimitive.apply(s, "hit");
      stateRef.current = next;
      if (next.status === "won") {
        speak("Puzzle solved!");
        props.onResult("won");
      } else if (next.status === "lost") {
        speak("Miss! Puzzle failed.");
        props.onResult("lost");
      } else {
        speak("Hit in zone!");
      }
    }
  };

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <span aria-live="polite" className="sr-only">
        {announce}
      </span>
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        tabIndex={0}
        onKeyDown={onKey}
        role="button"
        aria-label="Timing bar puzzle: press Space when marker is in green zone"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
