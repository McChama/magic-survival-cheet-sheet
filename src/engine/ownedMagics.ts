import { getClassLevel, getClassMagicProgression } from "../data/classes";
import type { CurrentRunState } from "../types/game";

/** One base magic the run has, with the level it is at. */
export interface OwnedMagic {
  magicId: string;
  level: number;
}

/**
 * Every base magic the run owns, in the order the Owned Magic screen lists them: first the ones the equipped Class
 * grants (at their class-derived level), then the ones the player added with the "+" button (in the order added).
 * A magic that is both takes the level the player recorded, since that is the level the game itself shows (it
 * already includes the class's +1); one that is only added is Lv1 until a level is recorded.
 */
export function getOwnedMagics(run: CurrentRunState): OwnedMagic[] {
  const { characterClass, classLevels } = run.meta;
  const fromClass = characterClass ? getClassMagicProgression(characterClass, getClassLevel(classLevels, characterClass)).magics : [];
  const owned: OwnedMagic[] = fromClass.map(({ magicId, level }) => ({
    magicId,
    level: run.acquiredMagicIds.includes(magicId) ? (run.magicLevels[magicId] ?? level) : level,
  }));
  for (const magicId of run.acquiredMagicIds) {
    if (!owned.some((m) => m.magicId === magicId)) owned.push({ magicId, level: run.magicLevels[magicId] ?? 1 });
  }
  return owned;
}
