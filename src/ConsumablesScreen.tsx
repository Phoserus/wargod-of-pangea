import React, { useState } from "react";
import { applyConsumable } from "./core/consumables";

export function ConsumablesScreen(): React.JSX.Element {
  const [hp, setHp] = useState(20);
  const [inv, setInv] = useState<Record<string, number>>({ bread: 2 });
  const eat = (): void => {
    const r = applyConsumable(hp, "bread", inv);
    if (r.ok) {
      setHp(r.hp);
      setInv(r.inventory);
    }
  };
  return (
    <main aria-label="Consumables">
      <h1>Consumables</h1>
      <p>HP: {hp}</p>
      <p>Bread: {inv.bread ?? 0}</p>
      <button onClick={eat}>Eat bread</button>
    </main>
  );
}
