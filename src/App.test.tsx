import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders main menu", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /wargod of pangea/i })).toBeInTheDocument();
  });
});
