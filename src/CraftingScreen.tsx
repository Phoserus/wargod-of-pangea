import React, { useState } from "react";
import { craft, ITEMS } from "./core/items/crafting";

export function CraftingScreen(): React.JSX.Element {
  const [inv, setInv] = useState<Record<string, number>>({
    ore: 5,
    bar: 0,
    sword: 0,
  });
  const doCraft = (id: string): void => {
    const r = craft(inv, id);
    if (r.ok) setInv(r.inventory);
  };
  return (
    <main aria-label="Crafting">
      <h1>Crafting</h1>
      {Object.entries(inv).map(([k, v]) => (
        <p key={k}>
          {ITEMS[k]?.name ?? k}: {v}
        </p>
      ))}
      <button onClick={() => doCraft("smelt")}>Smelt (2 ore to 1 bar)</button>
      <button onClick={() => doCraft("forge")}>Forge (3 bar to 1 sword)</button>
    </main>
  );
}
