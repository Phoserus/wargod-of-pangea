import React from "react";
import { getPrimitive } from "./core/registry";
import type { PrimitiveState } from "./core/primitive";
import { validateConfig } from "./core/config";

export function PuzzleHost(props: {
  id: string;
  seed: number;
  config: Record<string, unknown>;
  onState?: (s: PrimitiveState) => void;
}): React.JSX.Element {
  const p = getPrimitive(props.id);
  if (!p) return <p>Unknown primitive: {props.id}</p>;
  const v = p.configSchema
    ? validateConfig(props.config, p.configSchema)
    : { ok: true, errors: [] };
  if (!v.ok) return <p>Config errors: {v.errors.join(", ")}</p>;
  const s = p.create(props.seed, props.config as never);
  props.onState?.(s);
  return (
    <div aria-label="Puzzle host">
      <p>Primitive: {p.id}</p>
      <p>Seed: {props.seed}</p>
      <p>Status: {s.status}</p>
    </div>
  );
}
