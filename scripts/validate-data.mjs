import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const Tier = z.object({
  tier: z.number(),
  unlockLevel: z.number(),
  config: z.record(z.string(), z.any()),
});
const Skill = z.object({
  id: z.string(),
  displayName: z.string(),
  primitive: z.string(),
  levelCap: z.number(),
  tiers: z.array(Tier).min(3),
  actions: z
    .array(z.object({ id: z.string(), minLevel: z.number(), xp: z.number(), tier: z.number() }))
    .min(1),
});
const Item = z.object({ id: z.string(), name: z.string() });
const Recipe = z.object({
  id: z.string(),
  inputs: z.record(z.string(), z.number()),
  output: z.string(),
  outputQty: z.number(),
});

let errors = 0;
const dir = "src/data/skills";
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const r = Skill.safeParse(data);
  if (!r.success) {
    console.error(f, r.error.issues);
    errors++;
  }
}
const items = JSON.parse(fs.readFileSync("src/data/items.json", "utf8"));
const recipes = JSON.parse(fs.readFileSync("src/data/recipes.json", "utf8"));
const itemsR = z.array(Item).safeParse(items);
if (!itemsR.success) {
  console.error("items.json", itemsR.error.issues);
  errors++;
}
const recipesR = z.array(Recipe).safeParse(recipes);
if (!recipesR.success) {
  console.error("recipes.json", recipesR.error.issues);
  errors++;
}
if (errors) {
  console.error(`validate-data: ${errors} issue(s)`);
  process.exit(1);
}
console.log("validate-data: OK");
