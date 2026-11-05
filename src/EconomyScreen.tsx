import React from "react";
import { ITEMS, SLOTS, sellPrice } from "./core/content";
import { useGame } from "./core/store";

const name = (id: string): string => ITEMS[id]?.name ?? id;

export function EconomyScreen(): React.JSX.Element {
  const g = useGame();
  const buyable = Object.values(ITEMS).filter((i) => i.buyable);
  return (
    <main aria-label="Inventory and equipment">
      <h1>Inventory &amp; Equipment</h1>
      <p>Gold: {g.currency}</p>

      <h2>Equipment</h2>
      <ul>
        {SLOTS.map((slot) => {
          const id = g.equipment[slot];
          return (
            <li key={slot}>
              {slot}: {id ? name(id) : "—"}{" "}
              {id && <button onClick={() => g.unequipSlot(slot)}>Unequip</button>}
            </li>
          );
        })}
      </ul>

      <h2>Inventory</h2>
      {Object.keys(g.inventory).length === 0 && <p>Empty.</p>}
      <ul>
        {Object.entries(g.inventory).map(([id, n]) => (
          <li key={id}>
            {name(id)} ×{n}{" "}
            <button onClick={() => g.moveItem(id, n, "inventory", "bank")}>Bank all</button>
            <button onClick={() => g.sellItem(id, 1)}>Sell 1 ({sellPrice(ITEMS[id])})</button>
            {ITEMS[id]?.slot && <button onClick={() => g.equipItem(id)}>Equip</button>}
          </li>
        ))}
      </ul>

      <h2>Bank</h2>
      {Object.keys(g.bank).length === 0 && <p>Empty.</p>}
      <ul>
        {Object.entries(g.bank).map(([id, n]) => (
          <li key={id}>
            {name(id)} ×{n}{" "}
            <button onClick={() => g.moveItem(id, n, "bank", "inventory")}>Withdraw all</button>
          </li>
        ))}
      </ul>

      <h2>Shop</h2>
      <ul>
        {buyable.map((i) => (
          <li key={i.id}>
            {i.name}{" "}
            <button disabled={g.currency < i.value} onClick={() => g.buyItem(i.id, 1)}>
              Buy 1 ({i.value})
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
