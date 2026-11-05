import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { App } from "./App";
import { parseHash, SCREENS } from "./route";
import { t, skillName } from "./core/i18n";
import { SFX, SCENES } from "./core/audio";
import { SKILLS } from "./core/content";
import en from "./locales/en.json";
import { useGame } from "./core/store";

describe("route", () => {
  it("parses known screens and falls back to the menu", () => {
    expect(parseHash("#/play")).toBe("play");
    expect(parseHash("#combat")).toBe("combat");
    expect(parseHash("#/nope")).toBe("menu");
    expect(parseHash("")).toBe("menu");
    for (const s of SCREENS) expect(parseHash(`#/${s}`)).toBe(s);
  });
});

describe("i18n", () => {
  it("resolves keys, falls back to the key, and themes skill names", () => {
    expect(t("game.title")).toBe("The Wargod of Pangea");
    expect(t("ui.missing")).toBe("ui.missing");
    expect(skillName("attack", "Attack")).toBe("Skullcleaving");
    expect(skillName("zzz", "Fallback")).toBe("Fallback");
  });
  it("has a themed name for every skill", () => {
    for (const s of SKILLS) expect(en.skills).toHaveProperty(s.id);
  });
});

describe("audio data", () => {
  it("every effect and scene is well-formed", () => {
    for (const tones of Object.values(SFX)) {
      expect(tones.length).toBeGreaterThan(0);
      for (const tone of tones) {
        expect(tone.freq).toBeGreaterThan(0);
        expect(tone.dur).toBeGreaterThan(0);
        if (tone.to) expect(tone.to).toBeGreaterThan(0);
      }
    }
    for (const sc of Object.values(SCENES)) {
      expect(sc.notes.length).toBeGreaterThan(0);
      expect(sc.stepMs).toBeGreaterThan(100);
    }
  });
});

describe("shell", () => {
  beforeEach(() => {
    window.location.hash = "";
    useGame.getState().resetGame();
  });

  it("navigates via the nav bar and shows the HUD", async () => {
    render(<App />);
    expect(screen.getByRole("status", { name: "Player summary" }).textContent).toMatch(/0 gold/);
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("button", { name: t("ui.combat") }));
    expect(window.location.hash).toBe("#/combat");
    expect(await screen.findByRole("heading", { name: "Goblin Hollow" })).toBeTruthy();
    expect(
      within(nav)
        .getByRole("button", { name: t("ui.combat") })
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("HUD tracks the store", () => {
    render(<App />);
    act(() => useGame.setState({ currency: 42 }));
    expect(screen.getByRole("status", { name: "Player summary" }).textContent).toMatch(/42 gold/);
  });

  it("shows the themed skill name in Train", () => {
    window.location.hash = "/play";
    render(<App />);
    expect(screen.getByRole("heading", { name: "Orecracking" })).toBeTruthy();
  });
});
