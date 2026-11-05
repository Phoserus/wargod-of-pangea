import { createRng } from "../rng";

export interface Fighter {
  name: string;
  attack: number;
  defense: number;
  strength: number;
  hp: number;
}

export interface Food {
  id: string;
  heal: number;
  count: number;
}

export type CombatEvent =
  | { round: number; actor: "player" | "enemy"; kind: "hit"; amount: number }
  | { round: number; actor: "player" | "enemy"; kind: "miss" }
  | { round: number; actor: "player"; kind: "eat"; amount: number; item: string };

export interface RoundSnapshot {
  round: number;
  playerHp: number;
  enemyHp: number;
}

export interface FightResult {
  outcome: "win" | "lose" | "draw";
  rounds: number;
  events: CombatEvent[];
  /** HP after each round, for playback bars. */
  snapshots: RoundSnapshot[];
  foodUsed: Record<string, number>;
  playerHp: number;
  enemyHp: number;
}

export interface FightOptions {
  /** Eat when HP falls to this fraction of max (or below). */
  eatBelow?: number;
  maxRounds?: number;
}

export function hitChance(attack: number, defense: number): number {
  return Math.min(0.95, Math.max(0.1, 0.5 + (attack - defense) / 40));
}

function roll(rng: () => number, f: Fighter, against: Fighter): number {
  if (rng() >= hitChance(f.attack, against.defense)) return 0;
  return 1 + Math.floor(rng() * Math.max(1, f.strength));
}

/**
 * Both sides act each round at the same time, so both can fall in one round (a draw, which the
 * player treats as a loss). Eating uses the player's action for that round.
 */
export function resolveFight(
  seed: number,
  player: Fighter,
  enemy: Fighter,
  food: Food[] = [],
  opts: FightOptions = {},
): FightResult {
  const rng = createRng(seed);
  const eatBelow = opts.eatBelow ?? 0.4;
  const maxRounds = opts.maxRounds ?? 100;
  const maxHp = player.hp;
  const pantry = food.map((f) => ({ ...f })).sort((a, b) => a.heal - b.heal);
  const foodUsed: Record<string, number> = {};
  const events: CombatEvent[] = [];
  const snapshots: RoundSnapshot[] = [];
  let ph = player.hp;
  let eh = enemy.hp;
  let round = 0;

  while (ph > 0 && eh > 0 && round < maxRounds) {
    round++;
    let pDmg = 0;
    const meal = ph <= maxHp * eatBelow ? pantry.find((f) => f.count > 0) : undefined;
    if (meal) {
      meal.count--;
      foodUsed[meal.id] = (foodUsed[meal.id] ?? 0) + 1;
      const healed = Math.min(meal.heal, maxHp - ph);
      ph += healed;
      events.push({ round, actor: "player", kind: "eat", amount: healed, item: meal.id });
    } else {
      pDmg = roll(rng, player, enemy);
      events.push(
        pDmg > 0
          ? { round, actor: "player", kind: "hit", amount: pDmg }
          : { round, actor: "player", kind: "miss" },
      );
    }
    const eDmg = roll(rng, enemy, player);
    events.push(
      eDmg > 0
        ? { round, actor: "enemy", kind: "hit", amount: eDmg }
        : { round, actor: "enemy", kind: "miss" },
    );
    eh -= pDmg;
    ph -= eDmg;
    snapshots.push({ round, playerHp: Math.max(0, ph), enemyHp: Math.max(0, eh) });
  }

  const outcome = ph > 0 && eh <= 0 ? "win" : ph <= 0 && eh > 0 ? "lose" : "draw";
  return {
    outcome,
    rounds: round,
    events,
    snapshots,
    foodUsed,
    playerHp: Math.max(0, ph),
    enemyHp: Math.max(0, eh),
  };
}
