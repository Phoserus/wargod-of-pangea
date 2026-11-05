import React, { useState } from "react";
import { ITEMS, SKILLS, SKILL_BY_ID, outputQuantity, type ResolvedAction } from "./core/content";
import { getPuzzle } from "./core/puzzles/registry";
import type { LoggedInput } from "./core/puzzles/driver";
import { useGame } from "./core/store";
import { levelFromXp } from "./core/xp";
import { PuzzleCanvas } from "./PuzzleCanvas";
import { sfx } from "./core/audio";
import { skillName, t } from "./core/i18n";

// Skills whose puzzle has been rebuilt on the fixed-step contract; the rest show "coming soon".
const isPlayable = (primitive: string): boolean => getPuzzle(primitive) !== undefined;
const SKILL_IDS = [...SKILLS]
  .sort((a, b) => Number(isPlayable(b.primitive)) - Number(isPlayable(a.primitive)))
  .map((s) => s.id);

const itemName = (id: string): string => ITEMS[id]?.name ?? id;
const describeBag = (bag: Record<string, number>): string =>
  Object.entries(bag)
    .map(([id, n]) => `${n} ${itemName(id)}`)
    .join(", ");

export function PlayScreen(): React.JSX.Element {
  const [skillId, setSkillId] = useState("mining");
  const [actionId, setActionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState(() => Date.now() >>> 0);
  const [result, setResult] = useState<{
    status: "won" | "lost";
    text: string;
    levelUp?: string;
  } | null>(null);

  const skills = useGame((s) => s.skills);
  const inventory = useGame((s) => s.inventory);
  const completeAction = useGame((s) => s.completeAction);

  const skill = SKILL_BY_ID[skillId];
  const level = levelFromXp(skills[skillId] ?? 0);
  const playable = isPlayable(skill.primitive);
  const action: ResolvedAction | undefined = skill.actions.find((a) => a.id === actionId);
  const unlocked = skill.tiers.filter((t) => t.unlockLevel <= level);
  const tierConfig = (unlocked.length > 0 ? unlocked[unlocked.length - 1] : skill.tiers[0]).config;
  const canStart = useGame.getState().canPerform(skillId, actionId ?? "");
  void inventory;

  const reset = (): void => {
    setRunning(false);
    setResult(null);
    setSeed((s) => (s + 1) >>> 0);
  };

  const onResult = (status: "won" | "lost", log: readonly LoggedInput<unknown>[]): void => {
    if (import.meta.env.DEV) {
      console.info("puzzle result", { skill: skillId, action: actionId, seed, status, log });
    }
    if (status === "lost" || !action) {
      sfx("lose");
      setResult({ status: "lost", text: "Failed. Nothing was used." });
      return;
    }
    const r = completeAction(skillId, action.id);
    if (!r.ok) {
      setResult({ status: "lost", text: r.reason });
      return;
    }
    const gained = describeBag(r.gained);
    sfx(r.leveledUp ? "levelup" : "win");
    setResult({
      status: "won",
      text: `+${r.xp} XP${gained ? `, +${gained}` : ""}`,
      levelUp: r.leveledUp
        ? `${t("ui.levelUp")}: ${skillName(skillId, skill.displayName)} ${r.newLevel}`
        : undefined,
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 16,
      }}
    >
      <aside
        aria-label="Skill list"
        style={{ border: "2px solid var(--frame-edge)", padding: 8, overflow: "auto" }}
      >
        <h3>Skills</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {SKILL_IDS.map((id) => {
            const data = SKILL_BY_ID[id];
            const ok = isPlayable(data.primitive);
            return (
              <li key={id}>
                <button
                  onClick={() => {
                    setSkillId(id);
                    setActionId(null);
                    reset();
                  }}
                  aria-current={id === skillId}
                  style={{
                    fontWeight: id === skillId ? "bold" : "normal",
                    width: "100%",
                    textAlign: "left",
                    background: id === skillId ? "#444" : "transparent",
                    color: ok ? "#fff" : "#888",
                    border: "1px solid #777",
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  {skillName(id, data.displayName)} — L{levelFromXp(skills[id] ?? 0)}
                  {ok ? "" : " (soon)"}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main
        aria-label="Puzzle area"
        style={{ border: "2px solid var(--frame-edge)", padding: 16, overflow: "auto" }}
      >
        <h1>{skillName(skillId, skill.displayName)}</h1>
        <p>
          Level {level} · {skills[skillId] ?? 0} XP
        </p>

        {!playable ? (
          <p>This skill&apos;s puzzle is being rebuilt. Coming soon.</p>
        ) : running && action ? (
          <>
            <PuzzleCanvas
              key={`${skillId}-${action.id}-${seed}`}
              puzzleId={skill.primitive}
              seed={seed}
              config={tierConfig}
              onResult={onResult}
            />
            {result && (
              <div role="status" style={{ marginTop: 16 }}>
                {result.levelUp && <p className="level-up">{result.levelUp}</p>}
                <p className={result.status === "won" ? "result-win" : "result-lose"}>
                  {result.text}
                </p>
                <button onClick={reset} autoFocus>
                  Back to actions
                </button>
                {useGame.getState().canPerform(skillId, action.id).ok && (
                  <button
                    onClick={() => {
                      setResult(null);
                      setSeed((s) => (s + 1) >>> 0);
                    }}
                  >
                    Again
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <ul aria-label="Actions" style={{ listStyle: "none", padding: 0 }}>
              {skill.actions.map((a) => {
                const locked = level < a.minLevel;
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => setActionId(a.id)}
                      disabled={locked}
                      aria-pressed={a.id === actionId}
                      style={{ fontWeight: a.id === actionId ? "bold" : "normal" }}
                    >
                      {a.name}
                      {locked ? ` (needs level ${a.minLevel})` : ""}
                    </button>
                  </li>
                );
              })}
            </ul>
            {action && (
              <section aria-label="Action details">
                <p>
                  {Object.keys(action.inputs).length > 0 && `Uses ${describeBag(action.inputs)}. `}
                  Gives{" "}
                  {action.outputs
                    .map((o) => `${outputQuantity(o, level)} ${itemName(o.item)}`)
                    .join(", ") || "nothing"}{" "}
                  and {action.xp} XP.
                </p>
                <button disabled={!canStart.ok} onClick={() => setRunning(true)}>
                  Start
                </button>
                {!canStart.ok && <p>{canStart.reason}</p>}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
