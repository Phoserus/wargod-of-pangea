import type { Primitive, PrimitiveState } from "../primitive";
export interface CookingState extends PrimitiveState {
  heat: number;
  progress: number;
  target: number;
}
export const cookingPrimitive: Primitive<CookingState> = {
  id: "Cooking",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", heat: 50, progress: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "cook") {
      const p = s.progress + 1;
      return { ...s, progress: p, status: p >= s.target ? "won" : "playing" };
    }
    if (a === "burn") return { ...s, status: "lost" };
    return s;
  },
};
export interface FiremakingState extends PrimitiveState {
  sparks: number;
  target: number;
}
export const firemakingPrimitive: Primitive<FiremakingState> = {
  id: "Firemaking",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", sparks: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "strike") {
      const sp = s.sparks + 1;
      return { ...s, sparks: sp, status: sp >= s.target ? "won" : "playing" };
    }
    if (a === "fizzle") return { ...s, status: "lost" };
    return s;
  },
};
export interface FarmingState extends PrimitiveState {
  growth: number;
  target: number;
}
export const farmingPrimitive: Primitive<FarmingState> = {
  id: "Farming",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 5;
    return { status: "playing", growth: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "water") {
      const g = s.growth + 1;
      return { ...s, growth: g, status: g >= s.target ? "won" : "playing" };
    }
    if (a === "wither") return { ...s, status: "lost" };
    return s;
  },
};
export interface HerbloreState extends PrimitiveState {
  mix: number;
  target: number;
}
export const herblorePrimitive: Primitive<HerbloreState> = {
  id: "Herblore",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", mix: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "pour") {
      const m = s.mix + 1;
      return { ...s, mix: m, status: m >= s.target ? "won" : "playing" };
    }
    if (a === "spill") return { ...s, status: "lost" };
    return s;
  },
};
export interface PrayerState extends PrimitiveState {
  charges: number;
  target: number;
}
export const prayerPrimitive: Primitive<PrayerState> = {
  id: "Prayer",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", charges: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "pray") {
      const ch = s.charges + 1;
      return { ...s, charges: ch, status: ch >= s.target ? "won" : "playing" };
    }
    if (a === "drain") return { ...s, status: "lost" };
    return s;
  },
};
export interface MagicState extends PrimitiveState {
  runes: number;
  target: number;
}
export const magicPrimitive: Primitive<MagicState> = {
  id: "Magic",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", runes: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "cast") {
      const r = s.runes + 1;
      return { ...s, runes: r, status: r >= s.target ? "won" : "playing" };
    }
    if (a === "fizzle") return { ...s, status: "lost" };
    return s;
  },
};
export interface RangedState extends PrimitiveState {
  shots: number;
  target: number;
}
export const rangedPrimitive: Primitive<RangedState> = {
  id: "Ranged",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", shots: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "shoot") {
      const sh = s.shots + 1;
      return { ...s, shots: sh, status: sh >= s.target ? "won" : "playing" };
    }
    if (a === "miss") return { ...s, status: "lost" };
    return s;
  },
};
export interface ConstructionState extends PrimitiveState {
  pieces: number;
  target: number;
}
export const constructionPrimitive: Primitive<ConstructionState> = {
  id: "Construction",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", pieces: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "place") {
      const p = s.pieces + 1;
      return { ...s, pieces: p, status: p >= s.target ? "won" : "playing" };
    }
    if (a === "collapse") return { ...s, status: "lost" };
    return s;
  },
};
export interface SummoningState extends PrimitiveState {
  points: number;
  target: number;
}
export const summoningPrimitive: Primitive<SummoningState> = {
  id: "Summoning",
  configSchema: { target: "number" },
  create(_s, c) {
    const t = (c.target as number) ?? 3;
    return { status: "playing", points: 0, target: t };
  },
  apply(s, a) {
    if (s.status !== "playing") return s;
    if (a === "summon") {
      const p = s.points + 1;
      return { ...s, points: p, status: p >= s.target ? "won" : "playing" };
    }
    if (a === "dismiss") return { ...s, status: "lost" };
    return s;
  },
};
