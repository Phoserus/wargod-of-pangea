import React, { useEffect, useRef, useState } from "react";
import { fishingPrimitive } from "./core/primitives/fishing";
import type { FishingState } from "./core/primitives/fishing";

export function FishingCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FishingState>(fishingPrimitive.create(props.seed, props.config));
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
      ctx.fillStyle = "#0a2a4a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // water line
      ctx.fillStyle = "#1a4a7a";
      ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
      // fish
      ctx.fillStyle = "#f90";
      for (let i = 0; i < s.bites; i++) {
        ctx.beginPath();
        ctx.arc(40 + i * 30, canvas.height / 3, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#fff";
      ctx.fillText(`Caught ${s.caught}/${s.target} (bites ${s.bites})`, 10, 20);
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
      const next = fishingPrimitive.apply(s, "hook");
      stateRef.current = next;
      if (next.status === "won") {
        speak("Puzzle solved!");
        props.onResult("won");
      } else {
        speak("Hooked!");
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
        aria-label="Fishing puzzle: press Space to hook"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
