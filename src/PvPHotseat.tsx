import React, { useState } from "react";
import { MinigameRunner } from "./MinigameRunner";
import { getPrimitive } from "./core/registry";
import {
  NUMBER_ACTION_PRIMITIVES,
  getStringActionsForPrimitive,
  getNumberActionCount,
} from "./core/skillActions";

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

export function PvPHotseat(): React.JSX.Element {
  const [skillId, setSkillId] = useState<string>("attack");
  const [seed, setSeed] = useState(1);
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const skillData = SKILL_DATA[skillId];
  const primitive = getPrimitive(skillData.primitive);
  const tierConfig = skillData.tiers[0].config;
  const isNumberAction = primitive ? NUMBER_ACTION_PRIMITIVES.has(primitive.id) : false;
  const stringActions = primitive ? getStringActionsForPrimitive(primitive.id) : [];
  const numberActionCount = primitive ? getNumberActionCount(primitive.id) : 0;

  const matchOver = p1Wins >= 3 || p2Wins >= 3;

  const handleResult = (player: 1 | 2): void => {
    if (roundOver || matchOver) return;
    setRoundOver(true);
    if (player === 1) {
      setP1Wins((w) => w + 1);
      setWinner("Player 1");
    } else {
      setP2Wins((w) => w + 1);
      setWinner("Player 2");
    }
  };

  const nextRound = (): void => {
    setSeed((s) => s + 1);
    setRoundOver(false);
    setWinner(null);
  };

  const newMatch = (): void => {
    setP1Wins(0);
    setP2Wins(0);
    setSeed(1);
    setRoundOver(false);
    setWinner(null);
  };

  const onSkillChange = (id: string): void => {
    setSkillId(id);
    setSeed((s) => s + 1);
    if (!matchOver) {
      setRoundOver(false);
      setWinner(null);
    }
  };

  return (
    <main aria-label="PvP hotseat">
      <h1>PvP Hotseat (best of 5)</h1>
      <p>
        P1 wins: {p1Wins} | P2 wins: {p2Wins}
      </p>
      <label style={{ marginRight: 12 }}>
        Skill:
        <select value={skillId} onChange={(e) => onSkillChange(e.target.value)}>
          {SKILL_IDS.map((id) => (
            <option key={id} value={id}>
              {SKILL_DATA[id].displayName}
            </option>
          ))}
        </select>
      </label>
      {primitive && (
        <p>
          Primitive: {primitive.id} | Tier: 1 | Seed: {seed} (same puzzle for both players)
        </p>
      )}

      {matchOver ? (
        <>
          <p>Match winner: {p1Wins >= 3 ? "Player 1" : "Player 2"}</p>
          <button onClick={newMatch}>New match</button>
        </>
      ) : primitive ? (
        <>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid #555", padding: 12 }}>
              <h2>Player 1</h2>
              <MinigameRunner
                key={`p1-${seed}`}
                primitiveId={primitive.id}
                seed={seed}
                config={tierConfig as Record<string, unknown>}
                actions={stringActions}
                numberActionCount={isNumberAction ? numberActionCount : undefined}
                onResult={() => handleResult(1)}
              />
            </div>
            <div style={{ border: "1px solid #555", padding: 12 }}>
              <h2>Player 2</h2>
              <MinigameRunner
                key={`p2-${seed}`}
                primitiveId={primitive.id}
                seed={seed}
                config={tierConfig as Record<string, unknown>}
                actions={stringActions}
                numberActionCount={isNumberAction ? numberActionCount : undefined}
                onResult={() => handleResult(2)}
              />
            </div>
          </div>
          {winner && <p>Round winner: {winner}</p>}
          {roundOver && <button onClick={nextRound}>Next round</button>}
        </>
      ) : (
        <p>Unknown primitive: {skillData.primitive}</p>
      )}
    </main>
  );
}
