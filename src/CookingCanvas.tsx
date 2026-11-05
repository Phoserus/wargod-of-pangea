import React, { useEffect, useRef, useState } from "react";
import { cookingPrimitive } from "./core/primitives/extra";
import type { CookingState } from "./core/primitives/extra";

export function CookingCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CookingState>(cookingPrimitive.create(props.seed, props.config));
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
      ctx.fillStyle = "#2a1a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // pot
      ctx.fillStyle = "#555";
      ctx.fillRect(canvas.width / 2 - 30, canvas.height / 2 - 10, 60, 30);
      // heat indicator
      ctx.fillStyle = s.heat > 70 ? "#f33" : "#fa0";
      ctx.fillRect(20, canvas.height - 24, (canvas.width - 40) * (s.heat / 100), 12);
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
      const next = cookingPrimitive.apply(s, "cook");
      stateRef.current = next;
      if (next.status === "won") {
        speak("Puzzle solved!");
        props.onResult("won");
      } else {
        speak("Cooked!");
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
        aria-label="Cooking puzzle: press Space to cook"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
