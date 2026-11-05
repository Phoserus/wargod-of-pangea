import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlayScreen } from "./PlayScreen";
import { useGame } from "./core/store";

describe("PlayScreen", () => {
  beforeEach(() => useGame.getState().resetGame());

  it("selects a mining action and starts the puzzle", () => {
    render(<PlayScreen />);
    fireEvent.click(screen.getByRole("button", { name: /mine copper/i }));
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.queryByRole("button", { name: "Start" })).toBeNull();
  });

  it("blocks smithing without materials and locks high-level actions", () => {
    render(<PlayScreen />);
    fireEvent.click(screen.getByRole("button", { name: /^Smithing/ }));
    fireEvent.click(screen.getByRole("button", { name: /smelt copper/i }));
    expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText("Missing materials")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /smelt iron.*needs level 15/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
