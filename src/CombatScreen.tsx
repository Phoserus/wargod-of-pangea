import React, { useEffect, useState } from "react";
import { ENEMIES, ITEMS } from "./core/content";
import { derivePlayerStats } from "./core/combat/player";
import type { CombatEvent } from "./core/combat/resolver";
import { useGame, type FightReport } from "./core/store";

type Report = Extract<FightReport, { ok: true }>;
const STEP_MS = 350;

function describeEvent(e: CombatEvent, enemyName: string): string {
  const who = e.actor === "player" ? "You" : enemyName;
  if (e.kind === "eat") return `You eat ${ITEMS[e.item]?.name ?? e.item} (+${e.amount} HP)`;
  if (e.kind === "miss") return `${who} miss${e.actor === "player" ? "" : "es"}`;
  return `${who} hit${e.actor === "player" ? "" : "s"} for ${e.amount}`;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <span>
        {label}: {value}/{max}
      </span>
      <progress aria-label={`${label} HP`} value={value} max={max} />
    </div>
  );
}

export function CombatScreen(): React.JSX.Element {
  const skills = useGame((s) => s.skills);
  const equipment = useGame((s) => s.equipment);
  const inventory = useGame((s) => s.inventory);
  const fight = useGame((s) => s.fight);
  const [report, setReport] = useState<{ enemyId: string; data: Report } | null>(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState(0);

  const stats = derivePlayerStats(skills, equipment);
  const food = Object.entries(inventory).filter(([id]) => ITEMS[id]?.heal !== undefined);
  const rounds = report?.data.result.rounds ?? 0;

  useEffect(() => {
    if (!report || shown >= rounds) return;
    const t = setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [report, shown, rounds]);

  const start = (enemyId: string): void => {
    const r = fight(enemyId);
    if (!r.ok) {
      setError(r.reason);
      return;
    }
    setError("");
    setReport({ enemyId, data: r });
    setShown(0);
  };

  const enemy = report ? ENEMIES.find((e) => e.id === report.enemyId) : undefined;
  const snap = report && shown > 0 ? report.data.result.snapshots[shown - 1] : undefined;
  const finished = report !== null && shown >= rounds;
  const visibleEvents = report ? report.data.result.events.filter((e) => e.round <= shown) : [];

  return (
    <main aria-label="Combat">
      <h1>Goblin Hollow</h1>
      <p>
        Your stats — Attack {stats.attack}, Strength {stats.strength}, Defense {stats.defense}, HP{" "}
        {stats.hp}. Food:{" "}
        {food.length ? food.map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(", ") : "none"}. You
        eat automatically when low.
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {ENEMIES.map((e) => (
          <li key={e.id}>
            <button onClick={() => start(e.id)} disabled={report !== null && !finished}>
              Fight {e.name}
            </button>{" "}
            L{e.level} · ATK {e.attack} · DEF {e.defense} · STR {e.strength} · HP {e.health}
          </li>
        ))}
      </ul>
      {error && <p role="alert">{error}</p>}

      {report && enemy && (
        <section aria-label="Fight">
          <Bar label="You" value={snap?.playerHp ?? stats.hp} max={stats.hp} />
          <Bar label={enemy.name} value={snap?.enemyHp ?? enemy.health} max={enemy.health} />
          <button onClick={() => setShown(rounds)} disabled={finished}>
            Skip
          </button>
          {finished && (
            <div role="status">
              {report.data.result.outcome === "win" ? (
                <p>
                  Victory! +{report.data.xp} XP to each combat skill, +{report.data.loot?.coins}{" "}
                  gold
                  {Object.entries(report.data.loot?.items ?? {}).map(
                    ([id, n]) => `, +${n} ${ITEMS[id]?.name ?? id}`,
                  )}
                </p>
              ) : (
                <p>
                  {report.data.result.outcome === "draw" ? "A draw — you retreat." : "Defeated."}
                </p>
              )}
            </div>
          )}
          <ul aria-label="Combat log">
            {visibleEvents.map((e, i) => (
              <li key={i}>{describeEvent(e, enemy.name)}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
