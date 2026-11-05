import React, { useEffect, useRef, useState } from "react";
import { constructionPrimitive } from "./core/primitives/extra";
import type { ConstructionState } from "./core/primitives/extra";

export function ConstructionCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ConstructionState>(
    constructionPrimitive.create(props.seed, props.config),
  );
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
      for (let i = 0; i < s.target; i++) {
        ctx.fillStyle = i < s.pieces ? "#c96" : "#444";
        ctx.fillRect(20 + i * 30, canvas.height / 2 - 10, 20, 20);
      }
      ctx.fillStyle = "#fff";
      ctx.fillText(`Pieces ${s.pieces}/${s.target}`, 10, 20);
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
      const next = constructionPrimitive.apply(s, "place");
      stateRef.current = next;
      if (next.status === "won") {
        speak("Puzzle solved!");
        props.onResult("won");
      } else if (next.status === "lost") {
        speak("Collapsed! Puzzle failed.");
        props.onResult("lost");
      } else {
        speak("Placed!");
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
        aria-label="Construction puzzle: press Space to place"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
