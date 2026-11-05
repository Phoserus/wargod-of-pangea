import { ITEMS, ENEMY_BY_ID, type Enemy } from "../content";
import { levelFromXp } from "../xp";
import { equipmentStats, type Equipment } from "../equipment";
import { createRng } from "../rng";
import type { Bag } from "../inventory";
import type { Food, Fighter } from "./resolver";

export interface PlayerStats {
  attack: number;
  defense: number;
  strength: number;
  hp: number;
}

/** Combat level of a skill plus gear bonuses. Health: 20 HP + 2 per Health level + gear. */
export function derivePlayerStats(
  skills: Record<string, number>,
  equipment: Equipment,
): PlayerStats {
  const lvl = (id: string): number => levelFromXp(skills[id] ?? 0);
  const gear = equipmentStats(equipment);
  return {
    attack: lvl("attack") + gear.attack,
    defense: lvl("defense") + gear.defense,
    strength: lvl("strength") + gear.strength,
    hp: 20 + 2 * lvl("health") + gear.health,
  };
}

export function playerFighter(stats: PlayerStats): Fighter {
  return { name: "You", ...stats };
}

export function enemyFighter(e: Enemy): Fighter {
  return {
    name: e.name,
    attack: e.attack,
    defense: e.defense,
    strength: e.strength,
    hp: e.health,
  };
}

export function foodFromInventory(inventory: Bag): Food[] {
  return Object.entries(inventory)
    .filter(([id]) => ITEMS[id]?.heal !== undefined)
    .map(([id, count]) => ({ id, heal: ITEMS[id].heal as number, count }));
}

export interface Loot {
  coins: number;
  items: Bag;
}

/** Seeded loot roll, independent of the fight RNG stream. */
export function rollLoot(seed: number, enemyId: string): Loot {
  const e = ENEMY_BY_ID[enemyId];
  const rng = createRng((seed ^ 0x9e3779b9) >>> 0);
  const coins = e.coins.min + Math.floor(rng() * (e.coins.max - e.coins.min + 1));
  const items: Bag = {};
  for (const d of e.drops) {
    if (rng() < d.chance) items[d.item] = (items[d.item] ?? 0) + d.qty;
  }
  return { coins, items };
}

/** XP awarded to each combat skill on a win. */
export const COMBAT_XP_SKILLS = ["attack", "strength", "defense", "health"] as const;
