import { MAGIC_LEVEL_UPS } from "../data/magicLevelUps";
import { FUSION_BY_ID } from "../data/fusions";
import { getMagicMaxLevel } from "../data/magics";
import { MAGIC_BASE_STATS } from "../data/magicStats";
import type { CurrentRunState } from "../types/game";
import { getOwnedMagics } from "./ownedMagics";

const MAGIC_ID = "magicCircle";
const MAGIC_NAME = "Magic Circle";

/** The Magic Circle's level if the run has it (from the class or added with "+", see `getOwnedMagics`), else `null`. */
export function getMagicCircleLevel(run: CurrentRunState): number | null {
  return getOwnedMagics(run).find((m) => m.magicId === MAGIC_ID)?.level ?? null;
}

/** True when the run took the talent the Overmind fusion needs from Magic Circle ("Great Magic Circle"). */
export function isOvermindChosen(run: CurrentRunState): boolean {
  const required = FUSION_BY_ID["overmind"]?.requiredTalents?.[1]?.talentName;
  return !!required && (run.magicTalents[MAGIC_ID] ?? []).includes(required);
}

/**
 * The Amplification Effect (%) at `level`: the base 25 plus 5 per level-up (checked in game: 25 / 30 / 35 at Lv1-3).
 * While the circle is active this acts as a temporary Amplify ATK: Spirit Lv4 showed 1,170 x 1.30 = 1,521 at Lv2 and
 * 1,170 x 1.35 = 1,580 at Lv3. The level-up list has only 3 entries for a 5-level magic, so the last one repeats.
 */
export function magicCircleEffect(level: number): number {
  const entries = MAGIC_LEVEL_UPS[MAGIC_NAME] ?? [];
  let effect = MAGIC_BASE_STATS[MAGIC_ID]?.amplificationEffect?.value ?? 0;
  const repeatsLast = getMagicMaxLevel(MAGIC_ID) === 5;
  for (let reached = 2; reached <= level; reached++) {
    const entry = entries[repeatsLast ? Math.min(reached - 2, entries.length - 1) : reached - 2] ?? "";
    effect += Number(entry.match(/Effect by (\d+(?:\.\d+)?)%/)?.[1] ?? 0);
  }
  return effect;
}
