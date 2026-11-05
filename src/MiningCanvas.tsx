import React, { useEffect, useRef, useState } from "react";
import { miningPrimitive } from "./core/primitives/mining";
import type { MiningState } from "./core/primitives/mining";

export function MiningCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const stateRef = useRef<MiningState>(miningPrimitive.create(props.seed, props.config));
  const cursorRef = useRef(0);
  const [announce, setAnnounce] = useState("");

  const speak = (msg: string): void => {
    setAnnounce(msg);
  };

  const render = (): void => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const s = stateRef.current;
    const ci = cursorRef.current;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < s.rocks; i++) {
      ctx.fillStyle = i < s.extracted ? "#555" : "#8b5a2b";
      ctx.beginPath();
      ctx.arc(40 + i * 40, canvas.height / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      if (i === ci && i >= s.extracted) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#fff";
    ctx.fillText(`Extracted ${s.extracted}/${s.target} (rocks ${s.rocks})`, 10, 20);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = canvas.getContext("2d");
    } catch {
      ctxRef.current = null;
    }
    if (!ctxRef.current) return;
    render();
  }, []);

  const mine = (): void => {
    const s = stateRef.current;
    if (s.status !== "playing") {
      speak("Puzzle finished.");
      return;
    }
    const next = miningPrimitive.apply(s, "mine");
    stateRef.current = next;
    render();
    if (next.status === "won") {
      speak("Puzzle solved!");
      props.onResult("won");
    } else if (next.status === "lost") {
      speak("Collapse! Puzzle failed.");
      props.onResult("lost");
    } else {
      speak("Rock extracted.");
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>): void => {
    const s = stateRef.current;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      cursorRef.current = (cursorRef.current - 1 + s.rocks) % s.rocks;
      speak(`Rock ${cursorRef.current + 1} of ${s.rocks}`);
      render();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      cursorRef.current = (cursorRef.current + 1) % s.rocks;
      speak(`Rock ${cursorRef.current + 1} of ${s.rocks}`);
      render();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      mine();
    }
  };

  const onClick = (): void => {
    mine();
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
        onClick={onClick}
        role="button"
        aria-label="Mining puzzle: use ArrowLeft/ArrowRight to choose a rock, then Space to mine"
        style={{ border: "1px solid #555", cursor: "pointer" }}
      />
    </div>
  );
}
