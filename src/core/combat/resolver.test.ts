import { describe, it, expect } from "vitest";
import { resolveFight, hitChance, type Fighter } from "./resolver";
import { derivePlayerStats, enemyFighter, playerFighter, rollLoot } from "./player";
import { ENEMIES, ENEMY_BY_ID } from "../content";

const dummy = (o: Partial<Fighter> = {}): Fighter => ({
  name: "X",
  attack: 5,
  defense: 5,
  strength: 4,
  hp: 20,
  ...o,
});

function winRate(skills: Record<string, number>, equipment: Record<string, string>, id: string) {
  const stats = derivePlayerStats(skills, equipment);
  let wins = 0;
  const n = 300;
  for (let s = 1; s <= n; s++) {
    const r = resolveFight(s, playerFighter(stats), enemyFighter(ENEMY_BY_ID[id]));
    if (r.outcome === "win") wins++;
  }
  return wins / n;
}

describe("resolveFight", () => {
  it("is deterministic for a seed", () => {
    expect(resolveFight(42, dummy(), dummy())).toEqual(resolveFight(42, dummy(), dummy()));
  });

  it("clamps hit chance", () => {
    expect(hitChance(1000, 0)).toBe(0.95);
    expect(hitChance(0, 1000)).toBe(0.1);
  });

  it("treats a stalemate as a draw, not an A win", () => {
    const wall = dummy({ attack: 0, defense: 1000, strength: 1 });
    const r = resolveFight(1, wall, { ...wall, name: "Y" }, [], { maxRounds: 10 });
    expect(r.outcome).toBe("draw");
    expect(r.rounds).toBe(10);
  });

  it("acts simultaneously: both can fall in the same round", () => {
    const glass = dummy({ hp: 1, attack: 1000, defense: 0, strength: 1 });
    const draws = Array.from(
      { length: 50 },
      (_, s) => resolveFight(s, glass, { ...glass, name: "Y" }).outcome,
    );
    expect(draws).toContain("draw");
  });

  it("eats mid-fight and reports food used", () => {
    const strong = dummy({ attack: 0, strength: 1, hp: 20 });
    const hard = dummy({ attack: 1000, strength: 5 });
    const r = resolveFight(3, strong, hard, [{ id: "bread", heal: 8, count: 3 }]);
    expect(r.foodUsed.bread).toBeGreaterThan(0);
    expect(r.events.some((e) => e.kind === "eat")).toBe(true);
    expect(r.foodUsed.bread).toBeLessThanOrEqual(3);
  });

  it("snapshots HP each round", () => {
    const r = resolveFight(5, dummy(), dummy());
    expect(r.snapshots).toHaveLength(r.rounds);
  });
});

describe("balance", () => {
  const goblin = "goblin";
  it("a better blade measurably raises the win rate", () => {
    const none = winRate({}, {}, goblin);
    const copper = winRate({}, { weapon: "copper_sword" }, goblin);
    const iron = winRate({}, { weapon: "iron_sword" }, goblin);
    expect(copper).toBeGreaterThan(none);
    expect(iron).toBeGreaterThan(copper);
    expect(iron).toBeGreaterThan(0.8);
  });

  it("higher skill levels help", () => {
    const low = winRate({}, { weapon: "copper_sword" }, "hobgoblin");
    const high = winRate(
      { attack: 1154, strength: 1154, defense: 1154, health: 1154 },
      { weapon: "copper_sword" },
      "hobgoblin",
    );
    expect(high).toBeGreaterThan(low);
  });

  it("the chief is out of reach at the start", () => {
    expect(winRate({}, { weapon: "iron_sword" }, "goblin_chief")).toBeLessThan(0.1);
  });
});

describe("loot", () => {
  it("is deterministic and within data bounds", () => {
    for (const e of ENEMIES) {
      const a = rollLoot(7, e.id);
      expect(a).toEqual(rollLoot(7, e.id));
      expect(a.coins).toBeGreaterThanOrEqual(e.coins.min);
      expect(a.coins).toBeLessThanOrEqual(e.coins.max);
    }
  });
});

describe("derivePlayerStats", () => {
  it("adds gear to skill levels", () => {
    const s = derivePlayerStats({}, { weapon: "iron_sword" });
    expect(s).toEqual({ attack: 9, strength: 7, defense: 1, hp: 22 });
  });
});
