import type { ConfigSchema } from "./config";

export type PrimitiveStatus = "playing" | "won" | "lost";

export interface PrimitiveState {
  status: PrimitiveStatus;
}

export interface PrimitiveConfig {
  [key: string]: number | string | boolean;
}

export interface Primitive<TState extends PrimitiveState = PrimitiveState> {
  id: string;
  configSchema?: ConfigSchema;
  create(seed: number, config: PrimitiveConfig): TState;
  apply(state: TState, action: unknown): TState;
}
