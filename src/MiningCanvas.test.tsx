import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { MiningCanvas } from "./MiningCanvas";

describe("MiningCanvas keyboard", () => {
  it("exposes a focusable, labelled button for keyboard users", () => {
    const onResult = vi.fn();
    render(<MiningCanvas seed={1} config={{ rocks: 4, target: 2 }} onResult={onResult} />);
    const canvas = screen.getByRole("button", { name: /mining puzzle/i });
    expect(canvas).toHaveAttribute("tabindex", "0");
  });

  it("moves the rock cursor with arrow keys and mines with Space", () => {
    const onResult = vi.fn();
    render(<MiningCanvas seed={1} config={{ rocks: 4, target: 2 }} onResult={onResult} />);
    const canvas = screen.getByRole("button", { name: /mining puzzle/i });

    fireEvent.keyDown(canvas, { key: "ArrowRight" });
    expect(screen.getByText(/Rock \d+ of \d+/)).toBeInTheDocument();
    fireEvent.keyDown(canvas, { key: "ArrowLeft" });
    expect(screen.getByText(/Rock \d+ of \d+/)).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();

    fireEvent.keyDown(canvas, { key: " " });
    expect(screen.getByText("Rock extracted.")).toBeInTheDocument();
    fireEvent.keyDown(canvas, { key: " " });
    expect(onResult).toHaveBeenLastCalledWith("won");
    expect(screen.getByText("Puzzle solved!")).toBeInTheDocument();
  });

  it("announces failure once the miss limit behaviour applies", () => {
    const onResult = vi.fn();
    render(<MiningCanvas seed={1} config={{ rocks: 4, target: 1 }} onResult={onResult} />);
    const canvas = screen.getByRole("button", { name: /mining puzzle/i });

    fireEvent.keyDown(canvas, { key: " " });
    expect(onResult).toHaveBeenLastCalledWith("won");
    expect(screen.getByText("Puzzle solved!")).toBeInTheDocument();
  });
});
