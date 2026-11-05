import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PuzzleCanvas } from "./PuzzleCanvas";

const mining = {
  width: 6,
  height: 6,
  ore: 5,
  target: 4,
  hazards: 4,
  swings: 1,
  stability: 2,
};

describe("PuzzleCanvas", () => {
  it("renders the grid and resolves a dig through the fixed-step driver", async () => {
    const onResult = vi.fn();
    render(<PuzzleCanvas puzzleId="GridReveal" seed={3} config={mining} onResult={onResult} />);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(36);
    fireEvent.click(cells[0]);
    await waitFor(() => expect(onResult).toHaveBeenCalledWith("lost", expect.any(Array)));
  });

  it("shows a message for unknown puzzles", () => {
    render(<PuzzleCanvas puzzleId="Nope" seed={1} config={{}} onResult={() => undefined} />);
    expect(screen.getByText(/Unknown puzzle/)).toBeTruthy();
  });
});
