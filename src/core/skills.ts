import { xpForLevel, levelFromXp } from "./xp";

export interface SkillState {
  skillId: string;
  xp: number;
}

export function createSkillState(skillId: string): SkillState {
  return { skillId, xp: 0 };
}

export function addXp(
  state: SkillState,
  amount: number,
): { state: SkillState; leveledUp: boolean; newLevel: number } {
  const oldLevel = levelFromXp(state.xp);
  const xp = state.xp + amount;
  const newLevel = levelFromXp(xp);
  return { state: { ...state, xp }, leveledUp: newLevel > oldLevel, newLevel };
}

export function levelOf(state: SkillState): number {
  return levelFromXp(state.xp);
}

export function tierForLevel(level: number): 1 | 2 | 3 {
  if (level >= 75) return 3;
  if (level >= 40) return 2;
  return 1;
}

export { xpForLevel };
