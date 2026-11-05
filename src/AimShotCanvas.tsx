import React, { useEffect, useRef, useState } from "react";
import { aimShotPrimitive } from "./core/primitives/aimShot";
import type { AimShotState } from "./core/primitives/aimShot";

export function AimShotCanvas(props: {
  seed: number;
  config: import("./core/primitive").PrimitiveConfig;
  onResult: (s: "won" | "lost") => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const stateRef = useRef<AimShotState>(aimShotPrimitive.create(props.seed, props.config));
  const focusedRef = useRef(0);
  const [announce, setAnnounce] = useState("");

  const speak = (msg: string): void => {
    setAnnounce(msg);
  };

  const render = (): void => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const s = stateRef.current;
    const fi = focusedRef.current;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    s.targets.forEach((t: { x: number; y: number; decoy: boolean }, i: number) => {
      ctx.beginPath();
      ctx.arc(t.x * (canvas.width / 100), t.y * (canvas.height / 100), 12, 0, Math.PI * 2);
      ctx.fillStyle = t.decoy ? "#c33" : "#3c3";
      ctx.fill();
      if (i === fi) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    ctx.fillStyle = "#fff";
    ctx.fillText(`Hits ${s.hits}/${s.requiredHits} Misses ${s.misses}/${s.missLimit}`, 10, 20);
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

  const fire = (target: { x: number; y: number; decoy: boolean }): void => {
    const s = stateRef.current;
    if (s.status !== "playing") {
      speak("Puzzle finished.");
      return;
    }
    const next = aimShotPrimitive.apply(s, target.decoy ? "hit-decoy" : "hit");
    stateRef.current = next;
    render();
    if (next.status === "won") {
      speak("Puzzle solved!");
      props.onResult("won");
    } else if (next.status === "lost") {
      speak(target.decoy ? "Decoy! Puzzle failed." : "Miss! Puzzle failed.");
      props.onResult("lost");
    } else {
      speak(target.decoy ? "Decoy!" : "Hit!");
    }
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const s = stateRef.current;
    const target = s.targets.find((t: { x: number; y: number; decoy: boolean }) => !t.decoy);
    if (target && Math.hypot(target.x - x, target.y - y) < 12) {
      fire(target);
    } else {
      const next = aimShotPrimitive.apply(s, "miss");
      stateRef.current = next;
      render();
      if (next.status === "lost") {
        speak("Miss! Puzzle failed.");
        props.onResult("lost");
      } else {
        speak("Miss!");
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>): void => {
    const targets = stateRef.current.targets;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusedRef.current = (focusedRef.current - 1 + targets.length) % targets.length;
      speak(`Target ${focusedRef.current + 1} of ${targets.length}`);
      render();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusedRef.current = (focusedRef.current + 1) % targets.length;
      speak(`Target ${focusedRef.current + 1} of ${targets.length}`);
      render();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      fire(targets[focusedRef.current]);
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
        height={240}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Aim shot puzzle: use ArrowLeft/ArrowRight to choose a target, then Space or Enter to fire"
        style={{ border: "1px solid #555", cursor: "crosshair" }}
      />
    </div>
  );
}
