import items from "../../data/items.json";
import recipes from "../../data/recipes.json";

export interface Item {
  id: string;
  name: string;
}
export interface Recipe {
  id: string;
  inputs: Record<string, number>;
  output: string;
  outputQty: number;
}

export const ITEMS: Record<string, Item> = Object.fromEntries(items.map((i: Item) => [i.id, i]));
export const RECIPES: Recipe[] = recipes as unknown as Recipe[];

export function craft(
  inventory: Record<string, number>,
  recipeId: string,
): { ok: boolean; inventory: Record<string, number> } {
  const r = RECIPES.find((x) => x.id === recipeId);
  if (!r) return { ok: false, inventory };
  for (const [k, v] of Object.entries(r.inputs)) {
    if ((inventory[k] ?? 0) < v) return { ok: false, inventory };
  }
  const next = { ...inventory };
  for (const [k, v] of Object.entries(r.inputs)) next[k] -= v;
  next[r.output] = (next[r.output] ?? 0) + r.outputQty;
  return { ok: true, inventory: next };
}
