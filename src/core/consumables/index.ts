export type ConsumableType = "food" | "potion" | "ammo" | "catalyst" | "pouch";

export interface Consumable {
  id: string;
  type: ConsumableType;
  heal?: number;
  buff?: string;
}

export const CONSUMABLES: Record<string, Consumable> = {
  bread: { id: "bread", type: "food", heal: 10 },
  strength_potion: { id: "strength_potion", type: "potion", buff: "strength" },
  arrow: { id: "arrow", type: "ammo" },
};

export function applyConsumable(
  hp: number,
  consumableId: string,
  inventory: Record<string, number>,
): { hp: number; inventory: Record<string, number>; ok: boolean } {
  const c = CONSUMABLES[consumableId];
  if (!c || (inventory[consumableId] ?? 0) < 1) return { hp, inventory, ok: false };
  const next = { ...inventory, [consumableId]: inventory[consumableId] - 1 };
  if (c.type === "food") return { hp: hp + (c.heal ?? 0), inventory: next, ok: true };
  return { hp, inventory: next, ok: true };
}

export function consumeAmmo(
  inventory: Record<string, number>,
  ammoId: string,
): { ok: boolean; inventory: Record<string, number> } {
  if ((inventory[ammoId] ?? 0) < 1) return { ok: false, inventory };
  return {
    ok: true,
    inventory: { ...inventory, [ammoId]: inventory[ammoId] - 1 },
  };
}
