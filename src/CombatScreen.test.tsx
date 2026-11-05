import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CombatScreen } from "./CombatScreen";
import { useGame } from "./core/store";

describe("CombatScreen", () => {
  beforeEach(() => useGame.getState().resetGame());

  it("shows derived stats and plays a fight to a result", () => {
    useGame.setState({ equipment: { weapon: "iron_sword" } });
    render(<CombatScreen />);
    expect(screen.getByText(/Attack 9, Strength 7/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Fight Goblin$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByLabelText("Combat log").children.length).toBeGreaterThan(0);
  });
});
