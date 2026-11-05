import React, { useEffect, useRef, useState } from "react";
import { smithingPrimitive } from "./core/primitives/smithing";
import type { SmithingState } from "./core/primitives/smithing";

export function SmithingCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SmithingState>(smithingPrimitive.create(props.seed, props.config));
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
    const render = (): void => {
      const s = stateRef.current;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // anvil
      ctx.fillStyle = "#666";
      ctx.fillRect(canvas.width / 2 - 30, canvas.height / 2, 60, 20);
      // ingot
      ctx.fillStyle = `rgb(${180 + Math.floor(s.heat)}, 80, 40)`;
      ctx.fillRect(canvas.width / 2 - 20, canvas.height / 2 - 16, 40, 16);
      // progress
      ctx.fillStyle = "#444";
      ctx.fillRect(20, canvas.height - 24, canvas.width - 40, 12);
      ctx.fillStyle = "#c73";
      ctx.fillRect(20, canvas.height - 24, ((canvas.width - 40) * s.progress) / s.target, 12);
      ctx.fillStyle = "#fff";
      ctx.fillText(`Progress ${s.progress}/${s.target} Heat ${s.heat}`, 10, 20);
    };
    const loop = (): void => {
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
      const next = smithingPrimitive.apply(s, "hammer");
      stateRef.current = next;
      if (next.status === "won") {
        speak("Puzzle solved!");
        props.onResult("won");
      } else if (next.status === "lost") {
        speak("Shattered! Puzzle failed.");
        props.onResult("lost");
      } else {
        speak("Hammered!");
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
        aria-label="Smithing puzzle: press Space to hammer"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
