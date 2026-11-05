import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { AimShotCanvas } from "./AimShotCanvas";

describe("AimShotCanvas keyboard", () => {
  it("exposes a focusable, labelled button for keyboard users", () => {
    const onResult = vi.fn();
    render(
      <AimShotCanvas
        seed={1}
        config={{ decoyCount: 2, requiredHits: 2, missLimit: 3 }}
        onResult={onResult}
      />,
    );
    const canvas = screen.getByRole("button", {
      name: /aim shot puzzle/i,
    });
    expect(canvas).toHaveAttribute("tabindex", "0");
  });

  it("fires at the focused target; index 0 is always the real target", () => {
    const onResult = vi.fn();
    render(
      <AimShotCanvas
        seed={1}
        config={{ decoyCount: 2, requiredHits: 2, missLimit: 3 }}
        onResult={onResult}
      />,
    );
    const canvas = screen.getByRole("button", {
      name: /aim shot puzzle/i,
    });

    fireEvent.keyDown(canvas, { key: " " });
    expect(screen.getByText("Hit!")).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();

    fireEvent.keyDown(canvas, { key: " " });
    expect(onResult).toHaveBeenLastCalledWith("won");
    expect(screen.getByText("Puzzle solved!")).toBeInTheDocument();
  });

  it("cycles targets with the arrow keys", () => {
    const onResult = vi.fn();
    render(
      <AimShotCanvas
        seed={1}
        config={{ decoyCount: 2, requiredHits: 1, missLimit: 3 }}
        onResult={onResult}
      />,
    );
    const canvas = screen.getByRole("button", {
      name: /aim shot puzzle/i,
    });

    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(screen.getByText("Target 2 of 3")).toBeInTheDocument();
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(screen.getByText("Target 3 of 3")).toBeInTheDocument();
    fireEvent.keyDown(canvas, { key: "ArrowLeft" });
    expect(screen.getByText("Target 2 of 3")).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
  });

  it("firing a decoy counts as a miss and can lose the puzzle", () => {
    const onResult = vi.fn();
    render(
      <AimShotCanvas
        seed={1}
        config={{ decoyCount: 2, requiredHits: 1, missLimit: 1 }}
        onResult={onResult}
      />,
    );
    const canvas = screen.getByRole("button", {
      name: /aim shot puzzle/i,
    });

    // index 0 is the real target; index 1 is a decoy
    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    fireEvent.keyDown(canvas, { key: " " });
    expect(onResult).toHaveBeenLastCalledWith("lost");
    expect(screen.getByText("Decoy! Puzzle failed.")).toBeInTheDocument();
  });
});
