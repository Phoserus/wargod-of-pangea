import React, { useState } from "react";
import { addXp, createSkillState, levelOf, tierForLevel } from "./core/skills";
import { saveGame, loadGame } from "./core/save";
import { getPuzzle } from "./core/puzzles/registry";
import type { LoggedInput } from "./core/puzzles/driver";
import { PuzzleCanvas } from "./PuzzleCanvas";

interface SkillData {
  id: string;
  displayName: string;
  primitive: string;
  levelCap: number;
  tiers: Array<{ tier: number; unlockLevel: number; config: Record<string, unknown> }>;
  actions: Array<{ id: string; minLevel: number; xp: number; tier: number }>;
}

const SKILLS: SkillData[] = Object.values(
  import.meta.glob<{ default: SkillData }>("./data/skills/*.json", { eager: true }),
).map((m) => m.default);
const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// Skills whose puzzle has been rebuilt on the fixed-step contract; the rest show "coming soon".
const isPlayable = (s: SkillData): boolean => getPuzzle(s.primitive) !== undefined;
const SKILL_IDS = [...SKILLS]
  .sort((a, b) => Number(isPlayable(b)) - Number(isPlayable(a)))
  .map((s) => s.id);

type XpMap = Record<string, number>;

export function PlayScreen(): React.JSX.Element {
  const [selectedSkillId, setSelectedSkillId] = useState<string>("attack");
  const [xp, setXp] = useState<XpMap>(() => ({ ...(loadGame()?.skills ?? {}) }));
  const [seed, setSeed] = useState(() => Date.now() >>> 0);
  const [result, setResult] = useState<{ status: "won" | "lost"; text: string } | null>(null);

  const skill = SKILL_BY_ID[selectedSkillId];
  const stateOf = (id: string) => ({ ...createSkillState(id), xp: xp[id] ?? 0 });
  const level = levelOf(stateOf(selectedSkillId));
  const tier = tierForLevel(level);
  const unlocked = skill.tiers.filter((t) => t.unlockLevel <= level);
  const tierConfig = (unlocked.length > 0 ? unlocked[unlocked.length - 1] : skill.tiers[0]).config;
  const action = skill.actions.find((a) => a.tier === tier && a.minLevel <= level);
  const xpPerSuccess = action ? action.xp : 10;

  const onResult = (status: "won" | "lost", log: readonly LoggedInput<unknown>[]): void => {
    if (import.meta.env.DEV) {
      console.info("puzzle result", { skill: skill.id, seed, tierConfig, status, log });
    }
    if (status === "lost") {
      setResult({ status, text: "Failed. Try again." });
      return;
    }
    const res = addXp(stateOf(skill.id), xpPerSuccess);
    const next = { ...xp, [skill.id]: res.state.xp };
    setXp(next);
    saveGame({ version: 1, skills: next });
    setResult({
      status,
      text: res.leveledUp
        ? `Level up! ${skill.displayName} is now ${res.newLevel}`
        : `Success! +${xpPerSuccess} XP`,
    });
  };

  const next = (): void => {
    setResult(null);
    setSeed((s) => (s + 1) >>> 0);
  };
  const select = (id: string): void => {
    setSelectedSkillId(id);
    setResult(null);
    setSeed((s) => (s + 1) >>> 0);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 16,
        height: "100vh",
        padding: 16,
      }}
    >
      <aside
        aria-label="Skill list"
        style={{ border: "1px solid #555", padding: 8, overflow: "auto" }}
      >
        <h3>Skills</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {SKILL_IDS.map((id) => {
            const data = SKILL_BY_ID[id];
            const isSelected = id === selectedSkillId;
            const playable = isPlayable(data);
            return (
              <li key={id}>
                <button
                  onClick={() => select(id)}
                  aria-current={isSelected}
                  style={{
                    fontWeight: isSelected ? "bold" : "normal",
                    width: "100%",
                    textAlign: "left",
                    background: isSelected ? "#444" : "transparent",
                    color: playable ? "#fff" : "#888",
                    border: "1px solid #777",
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  {data.displayName} — L{levelOf(stateOf(id))}
                  {playable ? "" : " (soon)"}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main
        aria-label="Puzzle area"
        style={{ border: "1px solid #555", padding: 16, overflow: "auto" }}
      >
        <h1>{skill.displayName}</h1>
        <p>
          Tier {tier} · Level {level} · {xpPerSuccess} XP per success
        </p>

        {!isPlayable(skill) ? (
          <p>This skill&apos;s puzzle is being rebuilt. Coming soon.</p>
        ) : (
          <>
            <PuzzleCanvas
              key={`${selectedSkillId}-${seed}`}
              puzzleId={skill.primitive}
              seed={seed}
              config={tierConfig}
              onResult={onResult}
            />
            {result && (
              <div role="status" style={{ marginTop: 16 }}>
                <p>{result.text}</p>
                <button onClick={next} autoFocus>
                  {result.status === "won" ? "Next" : "Retry"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
