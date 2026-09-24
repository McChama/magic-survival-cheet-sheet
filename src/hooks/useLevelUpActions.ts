import { useRunStore } from "../store/useRunStore";
import type { EquippableItem } from "../types/game";

/**
 * The handful of store actions "Select Magic" rows commit through, bundled so every call site (the plain "+1 Level"
 * button and the Select Attribute screen's "Learn") applies the same "acquire it first if this is the class's own
 * magic that was never explicitly added" rule as the old free-form stepper did, instead of duplicating it.
 *
 * `isLevelUp` is true only when Select Magic was opened from the Dashboard's level-up star, never from the "+" menu's
 * plain "Magic" catalog entry. It's select-then-commit: the star doesn't touch `run.currentLevel` by itself — every
 * action here also bumps it by one, but only when `isLevelUp` is set, so `run.currentLevel` only ever changes at the
 * moment a row is actually picked (Obtain / +1 Level / Learn), never just from opening the screen. A refresh in
 * between (star pressed, nothing picked yet) leaves it untouched.
 */
export function useLevelUpActions(isLevelUp: boolean) {
  const acquiredMagicIds = useRunStore((s) => s.run.acquiredMagicIds);
  const equipped = useRunStore((s) => s.run.equipped);
  const currentLevel = useRunStore((s) => s.run.currentLevel);
  const toggleAcquiredMagic = useRunStore((s) => s.toggleAcquiredMagic);
  const setMagicLevel = useRunStore((s) => s.setMagicLevel);
  const setMagicTalent = useRunStore((s) => s.setMagicTalent);
  const equipItem = useRunStore((s) => s.equipItem);
  const setCurrentLevel = useRunStore((s) => s.setCurrentLevel);

  function ensureAcquired(magicId: string) {
    if (!acquiredMagicIds.includes(magicId)) toggleAcquiredMagic(magicId);
  }

  function commitLevelUp() {
    if (isLevelUp) setCurrentLevel(currentLevel + 1);
  }

  return {
    /** A not-yet-owned magic: adds it at level 1. */
    obtainMagic: (magicId: string) => {
      ensureAcquired(magicId);
      commitLevelUp();
    },
    /** An owned magic's plain (non-talent) level-up. */
    levelUpMagic: (magicId: string, targetLevel: number) => {
      ensureAcquired(magicId);
      setMagicLevel(magicId, targetLevel);
      commitLevelUp();
    },
    /** A talent-tier level-up: raises the level and records the chosen talent for that group in one commit. */
    learnTalent: (magicId: string, groupLevel: number, targetLevel: number, talentName: string) => {
      ensureAcquired(magicId);
      setMagicLevel(magicId, targetLevel);
      setMagicTalent(magicId, groupLevel, talentName);
      commitLevelUp();
    },
    /** A not-yet-owned passive: equips it (starts at level 1). */
    obtainPassive: (item: EquippableItem) => {
      if (!equipped.some((e) => e.itemId === item.id)) equipItem(item.id);
      commitLevelUp();
    },
    /** An owned passive's level-up (base passives only — a special passive never levels past Obtain). */
    levelUpPassive: (item: EquippableItem, targetLevel: number) => {
      setMagicLevel(item.id, targetLevel);
      commitLevelUp();
    },
  };
}
