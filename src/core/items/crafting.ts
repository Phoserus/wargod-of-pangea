import { RECIPES, ITEMS, type Recipe } from "../content";
import { exchange, type Bag } from "../inventory";

export { ITEMS, RECIPES };
export type { Recipe };

export function craft(inventory: Bag, recipeId: string): { ok: boolean; inventory: Bag } {
  const r = RECIPES.find((x) => x.id === recipeId);
  if (!r) return { ok: false, inventory };
  const next = exchange(inventory, r.inputs, { [r.output]: r.outputQty });
  return next ? { ok: true, inventory: next } : { ok: false, inventory };
}
