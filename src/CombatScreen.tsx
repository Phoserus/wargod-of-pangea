import React, { useState } from "react";
import { resolveCombat } from "./core/combat/resolver";
import type { Combatant } from "./core/combat/resolver";
import enemies from "./data/enemies.json";

export function CombatScreen(): React.JSX.Element {
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState("");
  const fight = (): void => {
    const player: Combatant = {
      name: "Player",
      attack: 10,
      defense: 5,
      strength: 6,
      health: 30,
      hp: 30,
    };
    const enemy = enemies[0] as Combatant;
    const r = resolveCombat(1, player, enemy);
    setLog(r.log);
    setWinner(r.winner);
  };
  return (
    <main aria-label="Combat">
      <h1>Combat</h1>
      <button onClick={fight}>Fight Goblin</button>
      {winner && <p>Winner: {winner}</p>}
      <ul>
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </main>
  );
}
