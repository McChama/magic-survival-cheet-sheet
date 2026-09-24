import { getTalentGroupForLevel } from "../data/magicTalents";
import { getMagicMaxLevel } from "../data/magics";
import { getPassiveMaxLevel } from "../data/passiveLevels";
import { getOwnedMagics } from "./ownedMagics";
import { getPassiveLevel } from "./ownedPassives";
import type { CurrentRunState, EquippableItem, MagicTalentDefinition } from "../types/game";

/**
 * What leveling a magic or passive up by one, right now, would do — computed for the "Select Magic" rows (`MagicPickList`).
 * Leveling only ever happens through that screen (there is no free level stepper elsewhere anymore): the player presses the
 * Dashboard's "+1 Current Level" button, which raises `run.currentLevel` and opens it, so a magic can never be leveled past
 * `run.currentLevel` — each press grants at most one level, to at most one magic, exactly like the real level-up event.
 */
export interface LevelPick {
  owned: boolean;
  /** The owned level (0 if not owned yet). */
  level: number;
  /** The level this pick would bring it to — 1 for a fresh pickup, `level + 1` otherwise. */
  targetLevel: number;
  /** The game's own max-level column — once `level` reaches this, the magic/passive is fully done and drops out of Select Magic. */
  realMax: number;
  /** `level >= realMax` — already fully leveled, so it isn't offered at all ("no aparece"). */
  atMax: boolean;
  /** Set when `targetLevel` is one of the magic's talent-level groups — leveling into it means picking a talent, not a plain +1. */
  talentGroup: { level: number; talents: MagicTalentDefinition[] } | undefined;
}

export function getMagicLevelPick(magicId: string, run: CurrentRunState): LevelPick {
  const owned = getOwnedMagics(run).find((m) => m.magicId === magicId);
  const realMax = getMagicMaxLevel(magicId);
  const level = owned?.level ?? 0;
  const targetLevel = owned ? level + 1 : 1;
  return {
    owned: !!owned,
    level,
    targetLevel,
    realMax,
    atMax: level >= realMax,
    talentGroup: owned ? getTalentGroupForLevel(magicId, targetLevel) : undefined,
  };
}

export function getPassiveLevelPick(item: EquippableItem, run: CurrentRunState): LevelPick {
  const owned = run.equipped.some((e) => e.itemId === item.id);
  const realMax = getPassiveMaxLevel(item.id);
  const level = owned ? getPassiveLevel(run, item) : 0;
  return {
    owned,
    level,
    targetLevel: owned ? level + 1 : 1,
    realMax,
    atMax: level >= realMax,
    // No base passive shares a magic's talent-group mechanic — a special passive (realMax 1) never levels past Obtain.
    talentGroup: undefined,
  };
}
