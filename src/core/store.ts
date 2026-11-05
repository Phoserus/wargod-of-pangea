import { create } from "zustand";
import { ITEMS, ENEMY_BY_ID, SKILL_BY_ID, outputQuantity, sellPrice } from "./content";
import { equip, isSlot, unequip, type Equipment } from "./equipment";
import { addItem, exchange, hasAll, isQty, removeItem, type Bag } from "./inventory";
import { emptySave, SAVE_VERSION, type SaveData } from "./save";
import type { Slot } from "./content";
import { levelFromXp } from "./xp";
import {
  COMBAT_XP_SKILLS,
  derivePlayerStats,
  enemyFighter,
  foodFromInventory,
  playerFighter,
  rollLoot,
  type Loot,
} from "./combat/player";
import { resolveFight, type FightResult } from "./combat/resolver";

export type FightReport =
  | { ok: false; reason: string }
  | { ok: true; result: FightResult; loot: Loot | null; xp: number; seed: number };

export interface GameData {
  skills: Record<string, number>;
  inventory: Bag;
  bank: Bag;
  currency: number;
  equipment: Equipment;
}

export type ActionOutcome =
  | { ok: false; reason: string }
  | { ok: true; xp: number; leveledUp: boolean; newLevel: number; gained: Bag };

export interface GameStore extends GameData {
  /** Set when a corrupt save was found and backed up on load. */
  recoveryNote: string | null;
  levelOf(skillId: string): number;
  canPerform(skillId: string, actionId: string): { ok: boolean; reason?: string };
  completeAction(skillId: string, actionId: string): ActionOutcome;
  buyItem(itemId: string, qty: number): boolean;
  sellItem(itemId: string, qty: number): boolean;
  moveItem(itemId: string, qty: number, from: "inventory" | "bank", to: "inventory" | "bank"): void;
  equipItem(itemId: string): boolean;
  /** Fights from full HP using held food; a win pays loot and XP, a loss only costs the food eaten. */
  fight(enemyId: string, seed?: number): FightReport;
  unequipSlot(slot: Slot): boolean;
  loadSave(data: SaveData): void;
  resetGame(): void;
  setRecoveryNote(note: string | null): void;
}

const initialData = (): GameData => ({
  skills: {},
  inventory: {},
  bank: {},
  currency: 0,
  equipment: {},
});

export function toSave(s: GameData): SaveData {
  return {
    ...emptySave(),
    version: SAVE_VERSION,
    skills: s.skills,
    inventory: s.inventory,
    bank: s.bank,
    currency: s.currency,
    equipment: s.equipment as Record<string, string>,
  };
}

function sanitiseEquipment(raw: Record<string, string>): Equipment {
  const out: Equipment = {};
  for (const [slot, id] of Object.entries(raw)) {
    if (isSlot(slot) && ITEMS[id]?.slot === slot) out[slot] = id;
  }
  return out;
}

export const useGame = create<GameStore>()((set, get) => ({
  ...initialData(),
  recoveryNote: null,

  levelOf: (skillId) => levelFromXp(get().skills[skillId] ?? 0),

  canPerform(skillId, actionId) {
    const action = SKILL_BY_ID[skillId]?.actions.find((a) => a.id === actionId);
    if (!action) return { ok: false, reason: "Unknown action" };
    if (get().levelOf(skillId) < action.minLevel) {
      return { ok: false, reason: `Needs level ${action.minLevel}` };
    }
    if (!hasAll(get().inventory, action.inputs)) return { ok: false, reason: "Missing materials" };
    return { ok: true };
  },

  completeAction(skillId, actionId) {
    const check = get().canPerform(skillId, actionId);
    if (!check.ok) return { ok: false, reason: check.reason ?? "Cannot do that" };
    const action = SKILL_BY_ID[skillId].actions.find((a) => a.id === actionId)!;
    const level = get().levelOf(skillId);
    const gained: Bag = {};
    for (const o of action.outputs)
      gained[o.item] = (gained[o.item] ?? 0) + outputQuantity(o, level);
    const inventory = exchange(get().inventory, action.inputs, gained);
    if (!inventory) return { ok: false, reason: "Missing materials" };
    const oldXp = get().skills[skillId] ?? 0;
    const newXp = oldXp + action.xp;
    const newLevel = levelFromXp(newXp);
    set({ inventory, skills: { ...get().skills, [skillId]: newXp } });
    return { ok: true, xp: action.xp, leveledUp: newLevel > levelFromXp(oldXp), newLevel, gained };
  },

  buyItem(itemId, qty) {
    const item = ITEMS[itemId];
    if (!item?.buyable || !isQty(qty)) return false;
    const cost = item.value * qty;
    if (get().currency < cost) return false;
    set({ currency: get().currency - cost, inventory: addItem(get().inventory, itemId, qty) });
    return true;
  },

  sellItem(itemId, qty) {
    const item = ITEMS[itemId];
    if (!item || !isQty(qty)) return false;
    const inventory = removeItem(get().inventory, itemId, qty);
    if (!inventory) return false;
    set({ inventory, currency: get().currency + sellPrice(item) * qty });
    return true;
  },

  moveItem(itemId, qty, from, to) {
    if (from === to || !isQty(qty)) return;
    const src = removeItem(get()[from], itemId, qty);
    if (!src) return;
    set({ [from]: src, [to]: addItem(get()[to], itemId, qty) } as Pick<
      GameData,
      typeof from | typeof to
    >);
  },

  fight(enemyId, seed = Date.now() >>> 0) {
    const enemy = ENEMY_BY_ID[enemyId];
    if (!enemy) return { ok: false, reason: "Unknown enemy" };
    const g = get();
    const stats = derivePlayerStats(g.skills, g.equipment);
    const result = resolveFight(
      seed,
      playerFighter(stats),
      enemyFighter(enemy),
      foodFromInventory(g.inventory),
    );
    let inventory = g.inventory;
    for (const [id, n] of Object.entries(result.foodUsed)) {
      inventory = removeItem(inventory, id, n) ?? inventory;
    }
    if (result.outcome !== "win") {
      set({ inventory });
      return { ok: true, result, loot: null, xp: 0, seed };
    }
    const loot = rollLoot(seed, enemyId);
    for (const [id, n] of Object.entries(loot.items)) inventory = addItem(inventory, id, n);
    const skills = { ...g.skills };
    for (const s of COMBAT_XP_SKILLS) skills[s] = (skills[s] ?? 0) + enemy.xp;
    set({ inventory, skills, currency: g.currency + loot.coins });
    return { ok: true, result, loot, xp: enemy.xp, seed };
  },

  equipItem(itemId) {
    const r = equip(get().inventory, get().equipment, itemId);
    if (r.ok) set({ inventory: r.inventory, equipment: r.equipment });
    return r.ok;
  },

  unequipSlot(slot) {
    const r = unequip(get().inventory, get().equipment, slot);
    if (r.ok) set({ inventory: r.inventory, equipment: r.equipment });
    return r.ok;
  },

  loadSave(data) {
    set({
      skills: { ...data.skills },
      inventory: { ...data.inventory },
      bank: { ...data.bank },
      currency: data.currency,
      equipment: sanitiseEquipment(data.equipment),
    });
  },

  resetGame: () => set({ ...initialData() }),
  setRecoveryNote: (note) => set({ recoveryNote: note }),
}));
