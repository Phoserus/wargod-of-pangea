import React, { useState } from "react";
import { addXp, createSkillState, levelOf, tierForLevel } from "./core/skills";
import { saveGame, loadGame } from "./core/save";
import { getPrimitive } from "./core/registry";
import { validateConfig } from "./core/config";
import {
  NUMBER_ACTION_PRIMITIVES,
  getStringActionsForPrimitive,
  getNumberActionCount,
} from "./core/skillActions";
import { MinigameRunner } from "./MinigameRunner";
import type { PrimitiveState } from "./core/primitive";

import attackData from "./data/skills/attack.json";
import defenseData from "./data/skills/defense.json";
import strengthData from "./data/skills/strength.json";
import healthData from "./data/skills/health.json";
import dungeoneeringData from "./data/skills/dungeoneering.json";
import miningData from "./data/skills/mining.json";
import smithingData from "./data/skills/smithing.json";
import woodcuttingData from "./data/skills/woodcutting.json";
import fishingData from "./data/skills/fishing.json";
import cookingData from "./data/skills/cooking.json";
import farmingData from "./data/skills/farming.json";
import constructionData from "./data/skills/construction.json";
import summoningData from "./data/skills/summoning.json";
import foragingData from "./data/skills/foraging.json";
import trappingData from "./data/skills/trapping.json";
import huntingData from "./data/skills/hunting.json";
import travelingData from "./data/skills/traveling.json";
import leatherworkingData from "./data/skills/leatherworking.json";
import fletchingData from "./data/skills/fletching.json";
import meditationData from "./data/skills/meditation.json";
import alchemyData from "./data/skills/alchemy.json";
import prayerData from "./data/skills/prayer.json";
import transmutationData from "./data/skills/transmutation.json";

interface SkillData {
  id: string;
  displayName: string;
  primitive: string;
  levelCap: number;
  tiers: Array<{ tier: number; unlockLevel: number; config: Record<string, unknown> }>;
  actions: Array<{ id: string; minLevel: number; xp: number; tier: number }>;
}

const SKILL_DATA: Record<string, SkillData> = {
  attack: attackData as SkillData,
  defense: defenseData as SkillData,
  strength: strengthData as SkillData,
  health: healthData as SkillData,
  dungeoneering: dungeoneeringData as SkillData,
  mining: miningData as SkillData,
  smithing: smithingData as SkillData,
  woodcutting: woodcuttingData as SkillData,
  fishing: fishingData as SkillData,
  cooking: cookingData as SkillData,
  farming: farmingData as SkillData,
  construction: constructionData as SkillData,
  summoning: summoningData as SkillData,
  foraging: foragingData as SkillData,
  trapping: trappingData as SkillData,
  hunting: huntingData as SkillData,
  traveling: travelingData as SkillData,
  leatherworking: leatherworkingData as SkillData,
  fletching: fletchingData as SkillData,
  meditation: meditationData as SkillData,
  alchemy: alchemyData as SkillData,
  prayer: prayerData as SkillData,
  transmutation: transmutationData as SkillData,
};

const SKILL_IDS = Object.keys(SKILL_DATA);

export function PlayScreen(): React.JSX.Element {
  const [selectedSkillId, setSelectedSkillId] = useState<string>("attack");
  const [skillStates, setSkillStates] = useState<Record<string, { skillId: string; xp: number }>>(
    () => {
      const saved = loadGame();
      if (!saved) return {};
      const initial: Record<string, { skillId: string; xp: number }> = {};
      for (const id of SKILL_IDS) {
        initial[id] = createSkillState(id);
        if (saved.skills[id] !== undefined) {
          initial[id] = { ...initial[id], xp: saved.skills[id] };
        }
      }
      return initial;
    },
  );
  const [seed, setSeed] = useState(1);
  const [msg, setMsg] = useState("");

  const skillData = SKILL_DATA[selectedSkillId];
  const skillState = skillStates[selectedSkillId] || createSkillState(selectedSkillId);
  const level = levelOf(skillState);
  const tier = tierForLevel(level);

  const unlockedTiers = skillData.tiers.filter((t) => t.unlockLevel <= level);
  const tierConfig =
    unlockedTiers.length > 0
      ? unlockedTiers[unlockedTiers.length - 1].config
      : skillData.tiers[0].config;

  const primitive = getPrimitive(skillData.primitive);
  const isNumberAction = primitive && NUMBER_ACTION_PRIMITIVES.has(primitive.id);
  const stringActions = primitive ? getStringActionsForPrimitive(primitive.id) : [];
  const numberActionCount = primitive ? getNumberActionCount(primitive.id) : 0;

  const saveAllSkills = (updated: Record<string, { skillId: string; xp: number }>): void => {
    const allSkills: Record<string, number> = {};
    for (const [id, state] of Object.entries(updated)) {
      allSkills[id] = state.xp;
    }
    saveGame({ version: 1, skills: allSkills });
  };

  const onResult = (r: "won" | "lost"): void => {
    if (r === "won") {
      const action = skillData.actions.find((a) => a.tier === tier && a.minLevel <= level);
      const xp = action ? action.xp : 10;
      const res = addXp(skillState, xp);
      setSkillStates((prev) => {
        const next = { ...prev, [selectedSkillId]: res.state };
        saveAllSkills(next);
        return next;
      });
      setMsg(
        res.leveledUp
          ? `Level up! ${skillData.displayName} is now ${res.newLevel}`
          : `Success! +${xp} XP`,
      );
    } else {
      setMsg("Failed. Retry.");
    }
    setSeed((x) => x + 1);
  };

  const handleNumberAction = (index: number): void => {
    if (!primitive) return;
    const s = skillState as unknown as PrimitiveState;
    const next = primitive.apply(s, index);
    setSkillStates((prev) => {
      const updated = {
        ...prev,
        [selectedSkillId]: { skillId: selectedSkillId, xp: prev[selectedSkillId]?.xp ?? 0 },
      };
      if (next.status === "won") {
        const action = skillData.actions.find((a) => a.tier === tier && a.minLevel <= level);
        const xp = action ? action.xp : 10;
        const baseXp = prev[selectedSkillId]?.xp ?? 0;
        const res = addXp({ skillId: selectedSkillId, xp: baseXp }, xp);
        const final = { ...updated, [selectedSkillId]: res.state };
        saveAllSkills(final);
        setMsg(
          res.leveledUp
            ? `Level up! ${skillData.displayName} is now ${res.newLevel}`
            : `Success! +${xp} XP`,
        );
      } else if (next.status === "lost") {
        setMsg("Failed. Retry.");
        saveAllSkills(updated);
      }
      setSeed((x) => x + 1);
      return updated;
    });
  };

  if (!primitive) {
    return (
      <main aria-label="Play">
        <h1>Puzzle Training</h1>
        <p>No primitive registered for {selectedSkillId}</p>
      </main>
    );
  }

  const v = primitive.configSchema
    ? validateConfig(tierConfig, primitive.configSchema)
    : { ok: true, errors: [] };
  if (!v.ok) {
    return (
      <main aria-label="Play">
        <h1>Puzzle Training</h1>
        <p>Config errors: {v.errors.join(", ")}</p>
      </main>
    );
  }

  const action = skillData.actions.find((a) => a.tier === tier && a.minLevel <= level);
  const xpPerSuccess = action ? action.xp : 10;

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
      {/* Sidebar */}
      <aside
        aria-label="Skill list"
        style={{ border: "1px solid #555", padding: 8, overflow: "auto" }}
      >
        <h3>Skills</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {SKILL_IDS.map((id) => {
            const data = SKILL_DATA[id];
            const state = skillStates[id] || createSkillState(id);
            const lvl = levelOf(state);
            const isSelected = id === selectedSkillId;
            return (
              <li key={id}>
                <button
                  onClick={() => setSelectedSkillId(id)}
                  style={{
                    fontWeight: isSelected ? "bold" : "normal",
                    width: "100%",
                    textAlign: "left",
                    background: isSelected ? "#444" : "transparent",
                    color: "#fff",
                    border: "1px solid #777",
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  {data.displayName} — L{lvl}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main puzzle area */}
      <main
        aria-label="Puzzle area"
        style={{ border: "1px solid #555", padding: 16, overflow: "auto" }}
      >
        <h1>{skillData.displayName}</h1>
        <p>
          Primitive: {skillData.primitive} | Tier: {tier} | Level: {level} | XP per success:{" "}
          {xpPerSuccess}
        </p>
        <p style={{ marginBottom: 12 }}>{msg}</p>

        {isNumberAction ? (
          <>
            <p>Tap a node/slot to act:</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Array.from({ length: numberActionCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleNumberAction(i)}
                  style={{ padding: "8px 12px", cursor: "pointer" }}
                >
                  {i}
                </button>
              ))}
            </div>
          </>
        ) : (
          <MinigameRunner
            primitiveId={skillData.primitive}
            seed={seed}
            config={tierConfig as Record<string, unknown>}
            actions={stringActions}
            onResult={onResult}
          />
        )}

        <div style={{ marginTop: 16, fontSize: 0.9, color: "#aaa" }}>
          <p>Config: {JSON.stringify(tierConfig)}</p>
          <p>Actions: {isNumberAction ? `0–${numberActionCount - 1}` : stringActions.join(", ")}</p>
        </div>
      </main>
    </div>
  );
}
