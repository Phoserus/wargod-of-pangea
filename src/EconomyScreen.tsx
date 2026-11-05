import React, { useState } from "react";
import { createEconomy, buy, sell, moveItem } from "./core/economy";

export function EconomyScreen(): React.JSX.Element {
  const [state, setState] = useState(createEconomy());
  const shopItem = { itemId: "ore", price: 5 };
  return (
    <main aria-label="Economy">
      <h1>Economy</h1>
      <p>Currency: {state.currency}</p>
      <button onClick={() => setState((s) => buy(s, shopItem, 1))}>Buy ore (5)</button>
      <button onClick={() => setState((s) => sell(s, "ore", 3, 1))}>Sell ore (3)</button>
      <button onClick={() => setState((s) => moveItem(s, "ore", 1, "inventory", "bank"))}>
        Bank ore
      </button>
      <button onClick={() => setState((s) => moveItem(s, "ore", 1, "bank", "inventory"))}>
        Withdraw ore
      </button>
      <p>
        Inv ore: {state.inventory.ore ?? 0} Bank ore: {state.bank.ore ?? 0}
      </p>
    </main>
  );
}
