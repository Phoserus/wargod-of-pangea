import React, { useEffect, useState } from "react";
import { applySettings } from "./core/audio";
import { getPrimitive } from "./core/registry";
import { validateConfig } from "./core/config";
import type { PrimitiveState } from "./core/primitive";

import { PlayScreen } from "./PlayScreen";
import { CombatScreen } from "./CombatScreen";
import { CraftingScreen } from "./CraftingScreen";
import { EconomyScreen } from "./EconomyScreen";
import { ConsumablesScreen } from "./ConsumablesScreen";
import { QuestsScreen } from "./QuestsScreen";
import { PvPHotseat } from "./PvPHotseat";
import { SaveTools } from "./SaveTools";
import { useGame } from "./core/store";

type Screen =
  | "menu"
  | "settings"
  | "debug"
  | "play"
  | "combat"
  | "crafting"
  | "economy"
  | "consumables"
  | "quests"
  | "pvp";

const STORAGE_KEY = "skillbound.settings";

interface Settings {
  reducedMotion: boolean;
  colorblindSafe: boolean;
  textSize: number;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muteMusic: boolean;
  muteSfx: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  reducedMotion: false,
  colorblindSafe: false,
  textSize: 1,
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  muteMusic: false,
  muteSfx: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>("menu");
  const recoveryNote = useGame((s) => s.recoveryNote);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [debugSeed, setDebugSeed] = useState("1");
  const [debugId, setDebugId] = useState("stub");
  const [debugState, setDebugState] = useState<PrimitiveState | null>(null);
  const [debugConfig, setDebugConfig] = useState('{"threshold":50}');

  useEffect(() => {
    document.documentElement.style.setProperty("--text-scale", String(settings.textSize));
    document.body.classList.toggle("colorblind", settings.colorblindSafe);
  }, [settings.textSize, settings.colorblindSafe]);

  useEffect(() => {
    applySettings({
      master: settings.masterVolume,
      music: settings.musicVolume,
      sfx: settings.sfxVolume,
      muteMusic: settings.muteMusic,
      muteSfx: settings.muteSfx,
    });
  }, [
    settings.masterVolume,
    settings.musicVolume,
    settings.sfxVolume,
    settings.muteMusic,
    settings.muteSfx,
  ]);

  const update = (patch: Partial<Settings>): void => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const launch = (): void => {
    const p = getPrimitive(debugId);
    if (!p) return;
    let cfg: Record<string, unknown> = {};
    try {
      cfg = JSON.parse(debugConfig) as Record<string, unknown>;
    } catch {
      setDebugState(null);
      return;
    }
    if (p.configSchema) {
      const v = validateConfig(cfg, p.configSchema);
      if (!v.ok) {
        setDebugState(null);
        return;
      }
    }
    const s = p.create(Number(debugSeed), cfg as never);
    setDebugState(s);
  };

  if (screen === "settings") {
    return (
      <main aria-label="Settings">
        <h1>Settings</h1>
        <label>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => update({ reducedMotion: e.target.checked })}
          />
          Reduced motion
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.colorblindSafe}
            onChange={(e) => update({ colorblindSafe: e.target.checked })}
          />
          Colorblind-safe palette
        </label>
        <label>
          Text size
          <input
            type="range"
            min={0.8}
            max={1.6}
            step={0.1}
            value={settings.textSize}
            onChange={(e) => update({ textSize: Number(e.target.value) })}
          />
        </label>
        <label>
          Mute music
          <input
            type="checkbox"
            checked={settings.muteMusic}
            onChange={(e) => update({ muteMusic: e.target.checked })}
          />
        </label>
        <label>
          Mute SFX
          <input
            type="checkbox"
            checked={settings.muteSfx}
            onChange={(e) => update({ muteSfx: e.target.checked })}
          />
        </label>
        <label>
          Master volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.masterVolume}
            onChange={(e) => update({ masterVolume: Number(e.target.value) })}
          />
        </label>
        <label>
          Music volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.musicVolume}
            onChange={(e) => update({ musicVolume: Number(e.target.value) })}
          />
        </label>
        <label>
          SFX volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.sfxVolume}
            onChange={(e) => update({ sfxVolume: Number(e.target.value) })}
          />
        </label>
        <SaveTools />
        <button onClick={() => setScreen("menu")}>Back</button>
      </main>
    );
  }

  if (screen === "debug" && import.meta.env.DEV) {
    return (
      <main aria-label="Debug">
        <h1>Debug</h1>
        <label>
          Primitive id
          <input value={debugId} onChange={(e) => setDebugId(e.target.value)} />
        </label>
        <label>
          Seed
          <input value={debugSeed} onChange={(e) => setDebugSeed(e.target.value)} />
        </label>
        <label>
          Config (JSON)
          <input value={debugConfig} onChange={(e) => setDebugConfig(e.target.value)} />
        </label>
        <button onClick={launch}>Launch</button>
        {debugState && <p>Status: {debugState.status}</p>}
        <button onClick={() => setScreen("menu")}>Back</button>
      </main>
    );
  }

  if (screen === "play") {
    return (
      <div>
        <PlayScreen />
        <button onClick={() => setScreen("menu")}>Back</button>
      </div>
    );
  }

  if (screen === "crafting") {
    return (
      <div>
        <CraftingScreen />
        <button onClick={() => setScreen("menu")}>Back</button>
      </div>
    );
  }

  if (screen === "combat") {
    return (
      <div>
        <CombatScreen />
        <button onClick={() => setScreen("menu")}>Back</button>
      </div>
    );
  }

  if (screen === "economy") {
    return (
      <div>
        <EconomyScreen />
        <button onClick={() => setScreen("menu")}>Back</button>
      </div>
    );
  }

  if (screen === "consumables") {
    return (
      <div>
        <ConsumablesScreen />
        <button onClick={() => setScreen("menu")}>Back</button>
      </div>
    );
  }

  if (screen === "quests") {
    return (
      <div>
        <QuestsScreen />
        <button onClick={() => setScreen("menu")}>Back</button>
      </div>
    );
  }

  if (screen === "pvp") {
    return (
      <div>
        <PvPHotseat />
        <button onClick={() => setScreen("menu")}>Back</button>
      </div>
    );
  }

  return (
    <main aria-label="Main menu">
      {recoveryNote && (
        <div role="alert">
          <p>{recoveryNote}</p>
          <button onClick={() => useGame.getState().setRecoveryNote(null)}>Dismiss</button>
        </div>
      )}
      <h1>The Wargod of Pangea</h1>
      <p>A brutal war-god RPG — train skills via silly pretty-and-bubbly mobile minigames.</p>
      <button onClick={() => setScreen("settings")}>Settings</button>
      {import.meta.env.DEV && <button onClick={() => setScreen("debug")}>Debug</button>}
      <button onClick={() => setScreen("play")}>Play</button>
      <button onClick={() => setScreen("combat")}>Combat</button>
      <button onClick={() => setScreen("crafting")}>Crafting</button>
      <button onClick={() => setScreen("economy")}>Economy</button>
      <button onClick={() => setScreen("consumables")}>Consumables</button>
      <button onClick={() => setScreen("quests")}>Quests</button>
      <button onClick={() => setScreen("pvp")}>PvP</button>
    </main>
  );
}
