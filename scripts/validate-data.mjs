import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

// Keep in sync with src/core/content.ts (the app's source of truth; its tests also check cross-references).
const qty = z.number().int().min(1);
const Tier = z.object({
  tier: z.number(),
  unlockLevel: z.number(),
  config: z.record(z.string(), z.any()),
});
const Action = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    minLevel: qty.optional(),
    xp: z.number().min(0).optional(),
    tier: z.number().optional(),
    recipe: z.string().optional(),
    outputs: z
      .array(z.object({ item: z.string(), qty, bonusEveryLevels: qty.optional() }))
      .optional(),
  })
  .refine((a) => a.recipe !== undefined || (a.minLevel !== undefined && a.xp !== undefined), {
    message: "needs minLevel and xp unless it references a recipe",
  });
const Skill = z.object({
  id: z.string(),
  displayName: z.string(),
  primitive: z.string(),
  levelCap: z.number(),
  tiers: z.array(Tier).min(3),
  actions: z.array(Action).min(1),
});
const Item = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["resource", "material", "weapon", "armor", "food", "misc"]),
  value: z.number().int().min(0),
  buyable: z.boolean().optional(),
  heal: qty.optional(),
  slot: z.enum(["weapon", "head", "body", "legs", "feet"]).optional(),
  stats: z.record(z.string(), z.number().int()).optional(),
});
const Recipe = z.object({
  id: z.string(),
  name: z.string(),
  skill: z.string(),
  level: qty,
  xp: z.number().min(0),
  inputs: z.record(z.string(), qty),
  output: z.string(),
  outputQty: qty,
});

const Enemy = z.object({
  id: z.string(),
  name: z.string(),
  zone: z.string(),
  level: qty,
  attack: qty,
  defense: qty,
  strength: qty,
  health: qty,
  xp: z.number().int().min(0),
  coins: z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }),
  drops: z.array(z.object({ item: z.string(), chance: z.number().min(0).max(1), qty })),
});

let errors = 0;
const fail = (...args) => {
  console.error(...args);
  errors++;
};
const dir = "src/data/skills";
const skills = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const r = Skill.safeParse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  if (r.success) skills.push(r.data);
  else fail(f, r.error.issues);
}
const itemsR = z.array(Item).safeParse(JSON.parse(fs.readFileSync("src/data/items.json", "utf8")));
if (!itemsR.success) fail("items.json", itemsR.error.issues);
const recipesR = z
  .array(Recipe)
  .safeParse(JSON.parse(fs.readFileSync("src/data/recipes.json", "utf8")));
if (!recipesR.success) fail("recipes.json", recipesR.error.issues);

const enemiesR = z
  .array(Enemy)
  .safeParse(JSON.parse(fs.readFileSync("src/data/enemies.json", "utf8")));
if (!enemiesR.success) fail("enemies.json", enemiesR.error.issues);

if (itemsR.success && recipesR.success) {
  for (const e of enemiesR.success ? enemiesR.data : []) {
    for (const d of e.drops) {
      if (!itemsR.data.some((i) => i.id === d.item)) fail(`enemy ${e.id}: unknown drop ${d.item}`);
    }
  }
  const itemIds = new Set(itemsR.data.map((i) => i.id));
  const recipeIds = new Set(recipesR.data.map((r) => r.id));
  const skillIds = new Set(skills.map((s) => s.id));
  for (const r of recipesR.data) {
    for (const id of [...Object.keys(r.inputs), r.output]) {
      if (!itemIds.has(id)) fail(`recipe ${r.id}: unknown item ${id}`);
    }
    if (!skillIds.has(r.skill)) fail(`recipe ${r.id}: unknown skill ${r.skill}`);
  }
  for (const s of skills) {
    for (const a of s.actions) {
      if (a.recipe && !recipeIds.has(a.recipe)) fail(`${s.id}.${a.id}: unknown recipe ${a.recipe}`);
      for (const o of a.outputs ?? []) {
        if (!itemIds.has(o.item)) fail(`${s.id}.${a.id}: unknown item ${o.item}`);
      }
    }
  }
}
if (errors) {
  console.error(`validate-data: ${errors} issue(s)`);
  process.exit(1);
}
console.log("validate-data: OK");
