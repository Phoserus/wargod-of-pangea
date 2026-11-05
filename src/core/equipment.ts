import { ITEMS, SLOTS, STATS, type Slot, type Stat } from "./content";
import { addItem, removeItem, type Bag } from "./inventory";

export type Equipment = Partial<Record<Slot, string>>;

export function isSlot(s: string): s is Slot {
  return (SLOTS as readonly string[]).includes(s);
}

/** Moves an item from the inventory into its slot; any item already there returns to the inventory. */
export function equip(
  inventory: Bag,
  equipment: Equipment,
  itemId: string,
): { ok: boolean; inventory: Bag; equipment: Equipment } {
  const slot = ITEMS[itemId]?.slot;
  const fail = { ok: false, inventory, equipment };
  if (!slot) return fail;
  let next = removeItem(inventory, itemId, 1);
  if (!next) return fail;
  const previous = equipment[slot];
  if (previous) next = addItem(next, previous, 1);
  return { ok: true, inventory: next, equipment: { ...equipment, [slot]: itemId } };
}

export function unequip(
  inventory: Bag,
  equipment: Equipment,
  slot: Slot,
): { ok: boolean; inventory: Bag; equipment: Equipment } {
  const itemId = equipment[slot];
  if (!itemId) return { ok: false, inventory, equipment };
  const rest = { ...equipment };
  delete rest[slot];
  return { ok: true, inventory: addItem(inventory, itemId, 1), equipment: rest };
}

export function equipmentStats(equipment: Equipment): Record<Stat, number> {
  const total: Record<Stat, number> = { attack: 0, strength: 0, defense: 0, health: 0 };
  for (const id of Object.values(equipment)) {
    const stats = id ? ITEMS[id]?.stats : undefined;
    for (const s of STATS) total[s] += stats?.[s] ?? 0;
  }
  return total;
}
