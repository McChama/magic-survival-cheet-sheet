import { ENCHANT, ENCHANT_EFFECTS } from "../data/enchant";
import type { CurrentRunState } from "../types/game";
import { getEquippedItems } from "./tierAdaptive";

/** The artifact whose whole effect is "{Enchant} effect becomes 〈2X〉". */
const FAIRY_ID = "fairy";

/** The magics the run's Enchants went to, in the order taken (a run saved before Enchant was recorded has none). */
export function getEnchantedMagicIds(run: CurrentRunState): string[] {
  return run.enchantedMagicIds ?? [];
}

/** Whether Select Magic can still offer Enchant. */
export function canEnchant(run: CurrentRunState): boolean {
  return getEnchantedMagicIds(run).length < ENCHANT.maxCount;
}

/**
 * What one Enchant gives `magicId` in this run: its two lines ("@"-separated), with every percentage doubled once
 * the run owns the Fairy. Doubling the numbers (a 5% cooldown cut becomes 10%, not two cuts of 5%) is how "2X" is
 * read here; it has not been checked against the game.
 */
export function enchantEffectText(magicId: string, run: CurrentRunState): string | undefined {
  const text = ENCHANT_EFFECTS[magicId];
  if (!text || !getEquippedItems(run).some((item) => item.id === FAIRY_ID)) return text;
  return text.replace(/\d+(?:\.\d+)?(?=%)/g, (value) => String(Number(value) * 2));
}
