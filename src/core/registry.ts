import { stubPrimitive } from "./primitives/stub";
import { aimShotPrimitive } from "./primitives/aimShot";
import { telegraphBlockPrimitive } from "./primitives/telegraphBlock";
import { timingBarPrimitive } from "./primitives/timingBar";
import { sustainBarPrimitive } from "./primitives/sustainBar";
import { miningPrimitive } from "./primitives/mining";
import { woodcuttingPrimitive } from "./primitives/woodcutting";
import { craftingPrimitive } from "./primitives/crafting";
import { smithingPrimitive } from "./primitives/smithing";
import { fishingPrimitive } from "./primitives/fishing";
import { mergeCombinePrimitive } from "./primitives/mergeCombine";
import { laneDodgePrimitive } from "./primitives/laneDodge";
import { pathTracePrimitive } from "./primitives/pathTrace";
import { memorySequencePrimitive } from "./primitives/memorySequence";
import * as extra from "./primitives/extra";
import type { Primitive } from "./primitive";

export const primitives: Primitive[] = [
  ...(import.meta.env.DEV ? [stubPrimitive as Primitive] : []),
  aimShotPrimitive,
  telegraphBlockPrimitive,
  timingBarPrimitive,
  sustainBarPrimitive,
  miningPrimitive,
  woodcuttingPrimitive,
  craftingPrimitive,
  smithingPrimitive,
  fishingPrimitive,
  mergeCombinePrimitive,
  laneDodgePrimitive,
  pathTracePrimitive,
  memorySequencePrimitive,
  extra.cookingPrimitive,
  extra.firemakingPrimitive,
  extra.farmingPrimitive,
  extra.herblorePrimitive,
  extra.prayerPrimitive,
  extra.magicPrimitive,
  extra.rangedPrimitive,
  extra.constructionPrimitive,
  extra.summoningPrimitive,
];

export function getPrimitive(id: string): Primitive | undefined {
  return primitives.find((p) => p.id === id);
}
