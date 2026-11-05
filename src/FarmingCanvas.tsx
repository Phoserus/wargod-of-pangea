import React, { useEffect, useRef, useState } from "react";
import { farmingPrimitive } from "./core/primitives/extra";
import type { FarmingState } from "./core/primitives/extra";

export function FarmingCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FarmingState>(farmingPrimitive.create(props.seed, props.config));
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
      ctx.fillStyle = "#1a2a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // plots
      for (let i = 0; i < s.target; i++) {
        ctx.fillStyle = i < s.growth ? "#3a8a3a" : "#5a3a1a";
        ctx.fillRect(20 + i * 30, canvas.height / 2 - 10, 20, 20);
      }
      ctx.fillStyle = "#fff";
      ctx.fillText(`Growth ${s.growth}/${s.target}`, 10, 20);
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
      const next = farmingPrimitive.apply(s, "water");
      stateRef.current = next;
      if (next.status === "won") {
        speak("Puzzle solved!");
        props.onResult("won");
      } else {
        speak("Watered!");
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
        aria-label="Farming puzzle: press Space to water"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
