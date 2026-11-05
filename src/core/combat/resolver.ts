import { createRng } from "../rng";
import { CONSUMABLES } from "../consumables";

function applyConsumables(c: Combatant): { hp: number; strength: number; attack: number } {
  let hp = c.hp;
  let strength = c.strength;
  let attack = c.attack;
  for (const id of c.consumables ?? []) {
    const cons = CONSUMABLES[id];
    if (!cons) continue;
    if (cons.type === "food") hp += cons.heal ?? 0;
    if (cons.type === "potion" && cons.buff === "strength") strength += 2;
    if (cons.type === "potion" && cons.buff === "attack") attack += 2;
  }
  return { hp, strength, attack };
}

export interface Combatant {
  name: string;
  attack: number;
  defense: number;
  strength: number;
  health: number;
  hp: number;
  consumables?: string[];
}

export interface CombatResult {
  winner: string;
  log: string[];
}

export function resolveCombat(seed: number, a: Combatant, b: Combatant): CombatResult {
  const rng = createRng(seed);
  const log: string[] = [];
  const a2 = applyConsumables(a);
  const b2 = applyConsumables(b);
  let ha = a2.hp;
  let hb = b2.hp;
  const sa = a2.strength;
  const sb = b2.strength;
  const aa = a2.attack;
  const ab = b2.attack;
  let round = 0;
  while (ha > 0 && hb > 0 && round < 100) {
    round++;
    const hitA = rng() < 0.5 + (aa - b.defense) / 100;
    const hitB = rng() < 0.5 + (ab - a.defense) / 100;
    if (hitA) {
      const dmg = Math.max(1, sa);
      hb -= dmg;
      log.push(`${a.name} hits ${b.name} for ${dmg}`);
    } else {
      log.push(`${a.name} misses`);
    }
    if (hb <= 0) break;
    if (hitB) {
      const dmg = Math.max(1, sb);
      ha -= dmg;
      log.push(`${b.name} hits ${a.name} for ${dmg}`);
    } else {
      log.push(`${b.name} misses`);
    }
  }
  return { winner: ha > 0 ? a.name : b.name, log };
}
