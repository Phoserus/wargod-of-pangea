export interface DialogueNode {
  id: string;
  text: string;
  choices?: { label: string; next: string }[];
}

export interface Quest {
  id: string;
  name: string;
  requiredSkill: string;
  requiredLevel: number;
  rewardXp: number;
  nodes: DialogueNode[];
  startNode: string;
}

export const DEMO_QUEST: Quest = {
  id: "q1",
  name: "First Strike",
  requiredSkill: "attack",
  requiredLevel: 2,
  rewardXp: 50,
  startNode: "intro",
  nodes: [
    {
      id: "intro",
      text: "Welcome, adventurer.",
      choices: [
        { label: "Accept quest", next: "accept" },
        { label: "Decline", next: "decline" },
      ],
    },
    { id: "accept", text: "Go train Attack to level 2, then return." },
    { id: "decline", text: "Maybe later." },
  ],
};

export function canStartQuest(quest: Quest, skillLevel: number): boolean {
  return skillLevel >= quest.requiredLevel;
}
