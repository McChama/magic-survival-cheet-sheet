import { getClassLevel, getClassMagicProgression } from "../data/classes";
import { getPassiveMaxLevel, isLeveledPassive } from "../data/passiveLevels";
import { PASSIVES } from "../data/passives";
import type { CurrentRunState, EquippableItem } from "../types/game";
import { ITEM_BY_ID } from "./tierAdaptive";

/** A passive magic the run has, with the level it is at (the same recorded-level system as the base magics — `run.magicLevels`). */
export interface OwnedPassive {
  item: EquippableItem;
  level: number;
  max: number;
  /** A special passive: no levels, shown with a star. */
  special: boolean;
}

/** A passive's level: the one recorded for it (1 until then), never above its max. */
export function getPassiveLevel(run: CurrentRunState, item: EquippableItem): number {
  if (!isLeveledPassive(item)) return 1;
  return Math.max(1, Math.min(run.magicLevels[item.id] ?? 1, getPassiveMaxLevel(item.id)));
}

/** The passives the player added with the "+" button, in the order added (the class's own specials aren't here — see `getObtainedPassiveIds`). */
export function getOwnedPassives(run: CurrentRunState): OwnedPassive[] {
  return run.equipped.flatMap((stack) => {
    const item = ITEM_BY_ID[stack.itemId];
    if (!item || item.kind !== "passive") return [];
    return [{ item, level: getPassiveLevel(run, item), max: getPassiveMaxLevel(item.id), special: !isLeveledPassive(item) }];
  });
}

const PASSIVE_BY_NAME: Record<string, EquippableItem> = Object.fromEntries(PASSIVES.map((p) => [p.name, p]));

/** Every passive the run already has: the added ones plus the special abilities its Class grants (Guardian Angel, ...). */
export function getObtainedPassiveIds(run: CurrentRunState): Set<string> {
  const ids = new Set(getOwnedPassives(run).map((p) => p.item.id));
  const { characterClass, classLevels } = run.meta;
  if (characterClass) {
    for (const special of getClassMagicProgression(characterClass, getClassLevel(classLevels, characterClass)).specials) {
      const passive = PASSIVE_BY_NAME[special.name];
      if (passive) ids.add(passive.id);
    }
  }
  return ids;
}
