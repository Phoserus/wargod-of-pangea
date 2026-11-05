import { z } from "zod";
import itemsJson from "../data/items.json";
import recipesJson from "../data/recipes.json";

export const ITEM_CATEGORIES = ["resource", "material", "weapon", "armor", "food", "misc"] as const;
export const SLOTS = ["weapon", "head", "body", "legs", "feet"] as const;
export const STATS = ["attack", "strength", "defense", "health"] as const;
export type Slot = (typeof SLOTS)[number];
export type Stat = (typeof STATS)[number];

const qty = z.number().int().min(1);

export const itemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.enum(ITEM_CATEGORIES),
    value: z.number().int().min(0),
    buyable: z.boolean().optional(),
    slot: z.enum(SLOTS).optional(),
    stats: z.partialRecord(z.enum(STATS), z.number().int()).optional(),
  })
  .refine((i) => (i.category === "weapon" || i.category === "armor") === (i.slot !== undefined), {
    message: "weapons and armor need a slot; nothing else may have one",
  });
export type Item = z.infer<typeof itemSchema>;

export const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skill: z.string().min(1),
  level: qty,
  xp: z.number().min(0),
  inputs: z.record(z.string(), qty),
  output: z.string().min(1),
  outputQty: qty,
});
export type Recipe = z.infer<typeof recipeSchema>;

const outputSchema = z.object({
  item: z.string().min(1),
  qty,
  /** Adds +1 to the quantity for every N skill levels. */
  bonusEveryLevels: qty.optional(),
});
export type ActionOutput = z.infer<typeof outputSchema>;

const actionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().optional(),
    minLevel: qty.optional(),
    xp: z.number().min(0).optional(),
    tier: z.number().optional(),
    recipe: z.string().optional(),
    outputs: z.array(outputSchema).optional(),
  })
  .refine((a) => a.recipe !== undefined || (a.minLevel !== undefined && a.xp !== undefined), {
    message: "an action needs minLevel and xp unless it references a recipe",
  });

export const skillSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  primitive: z.string().min(1),
  levelCap: z.number(),
  tiers: z
    .array(
      z.object({
        tier: z.number(),
        unlockLevel: z.number(),
        config: z.record(z.string(), z.unknown()),
      }),
    )
    .min(3),
  actions: z.array(actionSchema).min(1),
});
type RawSkill = z.infer<typeof skillSchema>;

export interface ResolvedAction {
  id: string;
  name: string;
  minLevel: number;
  xp: number;
  inputs: Record<string, number>;
  outputs: ActionOutput[];
}
export interface GameSkill extends Omit<RawSkill, "actions"> {
  actions: ResolvedAction[];
}

export const ITEMS: Record<string, Item> = Object.fromEntries(
  z
    .array(itemSchema)
    .parse(itemsJson)
    .map((i) => [i.id, i]),
);
export const RECIPES: Recipe[] = z.array(recipeSchema).parse(recipesJson);
const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

function resolve(a: RawSkill["actions"][number]): ResolvedAction {
  const r = a.recipe ? RECIPE_BY_ID[a.recipe] : undefined;
  if (a.recipe && !r) throw new Error(`action ${a.id}: unknown recipe ${a.recipe}`);
  return {
    id: a.id,
    name: a.name ?? r?.name ?? a.id,
    minLevel: a.minLevel ?? r?.level ?? 1,
    xp: a.xp ?? r?.xp ?? 0,
    inputs: r?.inputs ?? {},
    outputs: r ? [{ item: r.output, qty: r.outputQty }] : (a.outputs ?? []),
  };
}

const skillModules = import.meta.glob<{ default: unknown }>("../data/skills/*.json", {
  eager: true,
});
export const SKILLS: GameSkill[] = Object.values(skillModules).map((m) => {
  const raw = skillSchema.parse(m.default);
  return { ...raw, actions: raw.actions.map(resolve) };
});
export const SKILL_BY_ID: Record<string, GameSkill> = Object.fromEntries(
  SKILLS.map((s) => [s.id, s]),
);

/** Cross-reference problems between items, recipes and skills; empty when the data is sound. */
export function contentProblems(): string[] {
  const problems: string[] = [];
  for (const r of RECIPES) {
    if (!SKILL_BY_ID[r.skill]) problems.push(`recipe ${r.id}: unknown skill ${r.skill}`);
    if (!ITEMS[r.output]) problems.push(`recipe ${r.id}: unknown output ${r.output}`);
    for (const id of Object.keys(r.inputs)) {
      if (!ITEMS[id]) problems.push(`recipe ${r.id}: unknown input ${id}`);
    }
  }
  for (const s of SKILLS) {
    for (const a of s.actions) {
      for (const o of a.outputs) {
        if (!ITEMS[o.item]) problems.push(`${s.id}/${a.id}: unknown output item ${o.item}`);
      }
    }
  }
  for (const r of RECIPES) {
    const owner = SKILL_BY_ID[r.skill];
    if (owner && !owner.actions.some((a) => a.id === r.id)) {
      problems.push(`recipe ${r.id}: no ${r.skill} action uses it`);
    }
  }
  return problems;
}

/** Quantity produced for an output at a skill level (yield scales with level). */
export function outputQuantity(o: ActionOutput, level: number): number {
  return o.qty + (o.bonusEveryLevels ? Math.floor(level / o.bonusEveryLevels) : 0);
}

export function sellPrice(item: Item): number {
  return Math.floor(item.value / 2);
}
