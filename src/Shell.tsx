import React, { useEffect } from "react";
import { derivePlayerStats } from "./core/combat/player";
import { setScene, sfx, unlockAudio, type Scene } from "./core/audio";
import { t } from "./core/i18n";
import { SKILLS } from "./core/content";
import { useGame } from "./core/store";
import { levelFromXp } from "./core/xp";
import { navigate, useRoute, type Screen } from "./route";

const NAV: { id: Screen; label: string }[] = [
  { id: "menu", label: t("ui.mainMenu") },
  { id: "play", label: t("ui.play") },
  { id: "combat", label: t("ui.combat") },
  { id: "crafting", label: t("ui.crafting") },
  { id: "economy", label: t("ui.inventory") },
  { id: "quests", label: t("ui.quests") },
  { id: "pvp", label: t("ui.pvp") },
  { id: "settings", label: t("ui.settings") },
];

const SCENE_FOR: Record<Screen, Scene> = {
  menu: "menu",
  play: "work",
  combat: "combat",
  crafting: "menu",
  economy: "menu",
  quests: "menu",
  pvp: "work",
  settings: "menu",
  debug: "none",
};

function Hud(): React.JSX.Element {
  const currency = useGame((s) => s.currency);
  const skills = useGame((s) => s.skills);
  const equipment = useGame((s) => s.equipment);
  const stats = derivePlayerStats(skills, equipment);
  const total = SKILLS.reduce((n, s) => n + levelFromXp(skills[s.id] ?? 0), 0);
  return (
    <div className="hud" role="status" aria-label="Player summary">
      <span>
        <span aria-hidden="true">⛁</span> {currency} gold
      </span>
      <span>
        <span aria-hidden="true">♥</span> {stats.hp} HP
      </span>
      <span>⚔ ATK {stats.attack}</span>
      <span>Total level {total}</span>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const screen = useRoute();

  useEffect(() => {
    const unlock = (): void => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    setScene(SCENE_FOR[screen]);
  }, [screen]);

  const items = import.meta.env.DEV ? [...NAV, { id: "debug" as Screen, label: "Debug" }] : NAV;
  return (
    <div className="shell">
      <header className="shell-bar">
        <span className="brand">{t("game.title")}</span>
        <nav aria-label="Main">
          {items.map((n) => (
            <button
              key={n.id}
              className="nav-btn"
              aria-current={screen === n.id ? "page" : undefined}
              onClick={() => {
                sfx("click");
                navigate(n.id);
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <Hud />
      </header>
      <div className="shell-body">{children}</div>
    </div>
  );
}
