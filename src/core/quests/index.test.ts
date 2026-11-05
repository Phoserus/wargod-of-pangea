import { describe, it, expect } from "vitest";
import { canStartQuest, DEMO_QUEST } from "./index";

describe("quests", () => {
  it("gates by level", () => {
    expect(canStartQuest(DEMO_QUEST, 1)).toBe(false);
    expect(canStartQuest(DEMO_QUEST, 2)).toBe(true);
  });
});
