import React from "react";
import { RECIPES, ITEMS } from "./core/content";
import { useGame } from "./core/store";
import { levelFromXp } from "./core/xp";

export function CraftingScreen(): React.JSX.Element {
  const inventory = useGame((s) => s.inventory);
  const skills = useGame((s) => s.skills);
  return (
    <main aria-label="Crafting">
      <h1>Recipes</h1>
      <p>Items are made by playing the skill&apos;s minigame on the Play screen.</p>
      <ul>
        {RECIPES.map((r) => (
          <li key={r.id}>
            <strong>{r.name}</strong> ({r.skill} L{r.level}, you: L
            {levelFromXp(skills[r.skill] ?? 0)}):{" "}
            {Object.entries(r.inputs)
              .map(([id, n]) => `${ITEMS[id]?.name ?? id} ${inventory[id] ?? 0}/${n}`)
              .join(", ")}{" "}
            → {r.outputQty} {ITEMS[r.output]?.name ?? r.output}
          </li>
        ))}
      </ul>
    </main>
  );
}
