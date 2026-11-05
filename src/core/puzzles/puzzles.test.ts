import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { createDriver, replay } from "./driver";
import { STEP_MS } from "./puzzle";
import { getPuzzle, puzzles } from "./registry";
import { gridRevealPuzzle, type GridRevealInput, type GridRevealState } from "./gridReveal";
import { rhythmTapPuzzle } from "./rhythmTap";
import { targetShotPuzzle } from "./targetShot";
import { gridRevealOneShort, perfectFor, play, rhythmTapPerfect } from "./solvers";

interface SkillFile {
  id: string;
  primitive: string;
  tiers: { tier: number; config: unknown }[];
}

const skillFiles = Object.values(
  import.meta.glob<{ default: SkillFile }>("../../data/skills/*.json", { eager: true }),
).map((m) => m.default);
const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);

describe("skill data vs puzzle registry", () => {
  const migrated = skillFiles.filter((s) => getPuzzle(s.primitive));
  it("migrates the vertical-slice skills", () => {
    expect(migrated.map((s) => s.id).sort()).toEqual(["attack", "mining", "smithing"]);
  });
  for (const skill of migrated) {
    for (const t of skill.tiers) {
      it(`${skill.id} tier ${t.tier} config is valid and the perfect player wins`, () => {
        const puzzle = getPuzzle(skill.primitive)!;
        const cfg = puzzle.configSchema.parse(t.config);
        for (const seed of SEEDS) {
          const d = play(puzzle, seed, cfg, perfectFor(skill.primitive));
          expect(d.state.status, `seed ${seed}`).toBe("won");
        }
      });
    }
  }
  it("rejects unknown or invalid config", () => {
    expect(() => gridRevealPuzzle.configSchema.parse({ width: 6 })).toThrow();
    expect(Object.keys(puzzles).length).toBe(3);
  });
});

describe("determinism and replay", () => {
  const cfg = targetShotPuzzle.configSchema.parse({
    requiredHits: 3,
    missLimit: 3,
    spawnMs: 900,
    lifetimeMs: 2500,
    maxActive: 3,
    decoyChance: 0.25,
    radius: 9,
  });
  it("replaying the input log reproduces the final state", () => {
    const d = play(targetShotPuzzle, 7, cfg, perfectFor("TargetShot"));
    const again = replay(targetShotPuzzle, 7, cfg, d.log, d.tick + 5);
    expect(again).toEqual(d.state);
  });
  it("different seeds give different layouts", () => {
    const a = createDriver(targetShotPuzzle, 1, cfg);
    const b = createDriver(targetShotPuzzle, 2, cfg);
    a.advance(2000);
    b.advance(2000);
    expect(a.state.targets).not.toEqual(b.state.targets);
  });
});

describe("GridReveal", () => {
  const cfg = gridRevealPuzzle.configSchema.parse({
    width: 6,
    height: 6,
    ore: 5,
    target: 4,
    hazards: 4,
    swings: 9,
    stability: 2,
  });
  it("places the requested ore and hazards", () => {
    const s = gridRevealPuzzle.create(3, cfg);
    expect(s.cells.filter((c) => c === "ore")).toHaveLength(5);
    expect(s.cells.filter((c) => c === "hazard")).toHaveLength(4);
  });
  it("stopping one ore short does not win", () => {
    const d = play(gridRevealPuzzle, 3, cfg, gridRevealOneShort, 200);
    expect(d.state.status).toBe("playing");
  });
  it("loses when stability runs out", () => {
    const hazards = (s: GridRevealState): GridRevealInput | null => {
      const i = s.cells.findIndex((c, idx) => c === "hazard" && !s.revealed[idx]);
      return i >= 0 ? { type: "dig", index: i } : null;
    };
    expect(play(gridRevealPuzzle, 3, cfg, hazards, 200).state.status).toBe("lost");
  });
  it("loses when swings run out", () => {
    const empties = (s: GridRevealState): GridRevealInput | null => {
      const i = s.cells.findIndex((c, idx) => c === "empty" && !s.revealed[idx]);
      return { type: "dig", index: i };
    };
    expect(play(gridRevealPuzzle, 3, cfg, empties, 200).state.status).toBe("lost");
  });
});

describe("random input rarely wins", () => {
  function winRate(
    puzzleId: string,
    config: unknown,
    random: (rng: () => number, state: never) => unknown,
  ): number {
    const puzzle = getPuzzle(puzzleId)!;
    const cfg = puzzle.configSchema.parse(config);
    let wins = 0;
    const runs = 200;
    for (let seed = 1; seed <= runs; seed++) {
      const rng = createRng(seed * 977);
      const d = play(puzzle, seed, cfg, (s) => random(rng, s as never), 3000);
      if (d.state.status === "won") wins++;
    }
    return wins / runs;
  }
  const byId = (id: string, tier: number): unknown =>
    skillFiles.find((s) => s.primitive === id)!.tiers[tier - 1].config;

  it("GridReveal", () => {
    const rate = winRate("GridReveal", byId("GridReveal", 1), (rng, s: GridRevealState) => ({
      type: "dig",
      index: Math.floor(rng() * s.cells.length),
    }));
    expect(rate).toBeLessThan(0.1);
  });
  it("RhythmTap", () => {
    const rate = winRate("RhythmTap", byId("RhythmTap", 1), (rng) =>
      rng() < 0.05 ? { type: "strike" } : null,
    );
    expect(rate).toBeLessThan(0.15);
  });
  it("TargetShot", () => {
    const rate = winRate("TargetShot", byId("TargetShot", 1), (rng) =>
      rng() < 0.1 ? { type: "shoot", x: rng() * 100, y: rng() * 100 } : null,
    );
    expect(rate).toBeLessThan(0.05);
  });
});

describe("RhythmTap", () => {
  const cfg = rhythmTapPuzzle.configSchema.parse({
    strikes: 3,
    missLimit: 2,
    zoneWidth: 20,
    speed: 60,
    shrink: 3,
  });
  it("loses after too many misses and shrinks the zone on hits", () => {
    const s0 = rhythmTapPuzzle.create(5, cfg);
    let s = s0;
    for (let i = 0; i < 400 && s.status === "playing"; i++) {
      const inZone = rhythmTapPerfect(rhythmTapPuzzle)(s);
      // strike only when it would miss
      const probe = rhythmTapPuzzle.step(s, { type: "strike" }, STEP_MS);
      s = rhythmTapPuzzle.step(s, inZone ? null : { type: "strike" }, STEP_MS);
      if (probe.hits > s.hits) break;
    }
    expect(s.status).toBe("lost");
    const hit = play(rhythmTapPuzzle, 5, cfg, rhythmTapPerfect(rhythmTapPuzzle));
    expect(hit.state.zoneWidth).toBeLessThan(20);
  });
});
