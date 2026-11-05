import React, { useState } from "react";
import { DEMO_QUEST, canStartQuest } from "./core/quests";

export function QuestsScreen(): React.JSX.Element {
  const [nodeId, setNodeId] = useState(DEMO_QUEST.startNode);
  const node = DEMO_QUEST.nodes.find((n) => n.id === nodeId)!;
  const ok = canStartQuest(DEMO_QUEST, 1);
  return (
    <main aria-label="Quests">
      <h1>{DEMO_QUEST.name}</h1>
      <p>{node.text}</p>
      {!ok && <p>Requires Attack level {DEMO_QUEST.requiredLevel}.</p>}
      {node.choices?.map((c) => (
        <button key={c.label} onClick={() => setNodeId(c.next)}>
          {c.label}
        </button>
      ))}
      {!node.choices && <p>Reward: {DEMO_QUEST.rewardXp} XP</p>}
    </main>
  );
}
