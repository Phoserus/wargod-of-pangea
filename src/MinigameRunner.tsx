import React, { useState } from "react";
import { getPrimitive } from "./core/registry";
import type { PrimitiveState } from "./core/primitive";

export function MinigameRunner(props: {
  primitiveId: string;
  seed: number;
  config: Record<string, unknown>;
  actions: string[];
  numberActionCount?: number;
  onResult: (r: "won" | "lost") => void;
}): React.JSX.Element {
  const p = getPrimitive(props.primitiveId);
  const [state, setState] = useState<PrimitiveState | null>(() =>
    p ? p.create(props.seed, props.config as Record<string, number | string | boolean>) : null,
  );
  const [msg, setMsg] = useState("");
  if (!p || !state) return <p>Unknown primitive</p>;
  const act = (a: string | number): void => {
    const next = p.apply(state, a);
    setState(next);
    if (next.status === "won") {
      props.onResult("won");
      setMsg("Won");
    } else if (next.status === "lost") {
      props.onResult("lost");
      setMsg("Lost");
    } else setMsg(JSON.stringify(next));
  };
  return (
    <div>
      <p>Status: {state.status}</p>
      <p>{msg}</p>
      {props.actions.map((a) => (
        <button key={a} onClick={() => act(a)}>
          {a}
        </button>
      ))}
      {props.numberActionCount &&
        Array.from({ length: props.numberActionCount }, (_, i) => (
          <button key={i} onClick={() => act(i)}>
            {i}
          </button>
        ))}
    </div>
  );
}
