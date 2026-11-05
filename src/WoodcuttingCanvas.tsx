import React, { useEffect, useRef, useState } from "react";
import { woodcuttingPrimitive } from "./core/primitives/woodcutting";
import type { WoodcuttingState } from "./core/primitives/woodcutting";

export function WoodcuttingCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<WoodcuttingState>(woodcuttingPrimitive.create(props.seed, props.config));
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
      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // tree trunk
      ctx.fillStyle = "#5a3a1a";
      ctx.fillRect(canvas.width / 2 - 12, 30, 24, canvas.height - 50);
      // foliage
      ctx.fillStyle = "#2a6a2a";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 24, 36, 0, Math.PI * 2);
      ctx.fill();
      // progress bar
      ctx.fillStyle = "#444";
      ctx.fillRect(20, canvas.height - 24, canvas.width - 40, 12);
      ctx.fillStyle = "#7c3";
      ctx.fillRect(20, canvas.height - 24, ((canvas.width - 40) * s.chops) / s.required, 12);
      ctx.fillStyle = "#fff";
      ctx.fillText(`Chops ${s.chops}/${s.required}`, 10, 16);
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
      const next = woodcuttingPrimitive.apply(s, "chop");
      stateRef.current = next;
      if (next.status === "won") {
        speak("Puzzle solved!");
        props.onResult("won");
      } else if (next.status === "lost") {
        speak("Puzzle failed.");
        props.onResult("lost");
      } else {
        speak("Chop!");
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
        aria-label="Woodcutting puzzle: press Space to chop"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
