import React, { useEffect, useRef, useState } from "react";
import { sustainBarPrimitive } from "./core/primitives/sustainBar";
import type { SustainBarState } from "./core/primitives/sustainBar";

export function SustainBarCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SustainBarState>(sustainBarPrimitive.create(props.seed, props.config));
  const [announce, setAnnounce] = useState("");

  const speak = (msg: string): void => {
    setAnnounce(msg);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tickInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.status === "playing") {
        const next = sustainBarPrimitive.apply(s, "tick");
        stateRef.current = next;
        if (next.status === "won") {
          speak("Puzzle solved!");
          props.onResult("won");
        } else if (next.status === "lost") {
          speak("Puzzle failed.");
          props.onResult("lost");
        }
      }
    }, 100);
    let raf = 0;
    const render = (): void => {
      const s = stateRef.current;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // band
      ctx.fillStyle = "#3c3";
      ctx.fillRect(
        (s.bandCenter - s.bandWidth / 2) * (canvas.width / 100),
        20,
        (s.bandWidth / 100) * canvas.width,
        canvas.height - 40,
      );
      // value marker
      ctx.fillStyle = "#fff";
      ctx.fillRect((s.value / 100) * canvas.width - 2, 10, 4, canvas.height - 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(`Progress ${s.progress}/${s.targetProgress}`, 10, 16);
    };
    const loop = (): void => {
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      clearInterval(tickInterval);
      cancelAnimationFrame(raf);
    };
  }, [props.seed]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>): void => {
    const s = stateRef.current;
    if (e.key === "ArrowUp" || e.key === "w") {
      e.preventDefault();
      stateRef.current = sustainBarPrimitive.apply(s, Math.min(100, s.value + 5));
      speak(`Value ${stateRef.current.value}`);
    } else if (e.key === "ArrowDown" || e.key === "s") {
      e.preventDefault();
      stateRef.current = sustainBarPrimitive.apply(s, Math.max(0, s.value - 5));
      speak(`Value ${stateRef.current.value}`);
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
        role="slider"
        aria-label="Sustain bar: keep marker in green band; ArrowUp/ArrowDown to move"
        style={{ border: "1px solid #555" }}
      />
    </div>
  );
}
