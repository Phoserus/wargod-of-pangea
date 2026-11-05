// Shared mapping from primitive id -> the actions a player can take in that puzzle.
// Used by PlayScreen and PvPHotseat so both modes expose identical action sets for a skill.

export const NUMBER_ACTION_PRIMITIVES = new Set(["MergeCombine", "PathTrace", "MemorySequence"]);

export function getStringActionsForPrimitive(primitiveId: string): string[] {
  switch (primitiveId) {
    case "AimShot":
      return ["hit", "miss", "hit-decoy"];
    case "TelegraphBlock":
      return ["N", "E", "S", "W"];
    case "TimingBar":
      return ["hit"];
    case "SustainBar":
      return ["tick", "fail"];
    case "Mining":
      return ["mine", "collapse"];
    case "Woodcutting":
      return ["chop", "break"];
    case "Crafting":
      return ["combine", "ruin"];
    case "Smithing":
      return ["hammer", "shatter"];
    case "Fishing":
      return ["hook", "snap"];
    case "Cooking":
      return ["cook", "burn"];
    case "Firemaking":
      return ["strike", "fizzle"];
    case "Farming":
      return ["water", "wither"];
    case "Herblore":
      return ["pour", "spill"];
    case "Prayer":
      return ["pray", "drain"];
    case "Magic":
      return ["cast", "fizzle"];
    case "Ranged":
      return ["shoot", "miss"];
    case "Construction":
      return ["place", "collapse"];
    case "Summoning":
      return ["summon", "dismiss"];
    case "LaneDodge":
      return ["chop-left", "chop-right"];
    default:
      return ["tick", "fail"];
  }
}

export function getNumberActionCount(primitiveId: string): number {
  switch (primitiveId) {
    case "MergeCombine":
      return 5;
    case "PathTrace":
      return 8;
    case "MemorySequence":
      return 4;
    default:
      return 0;
  }
}
