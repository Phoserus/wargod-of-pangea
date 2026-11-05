// Seeded RNG. Never use Math.random() in game logic.
// Pure variant: the RNG state is a plain number so it can live inside serialisable puzzle state.
export function nextRandom(rngState: number): { value: number; rng: number } {
  const a = (rngState + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: a };
}

export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function rng(): number {
    const r = nextRandom(a);
    a = r.rng;
    return r.value;
  };
}

export function rngInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
