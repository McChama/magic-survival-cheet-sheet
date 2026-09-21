import { DROP_CONTEXT_BY_ID, DROP_EXCEPTIONS_BY_ITEM_ID } from "../data/dropProbability";
import { ALL_ITEMS, ITEM_BY_ID } from "./tierAdaptive";
import type { DropContext, DropException, Rarity, TierOdds } from "../types/game";

const DEFAULT_BASELINE_COPIES = 5;

/** The flat rarity-tier percentages for a context — see `src/data/dropProbability.ts`. */
export function getTierOdds(context: DropContext): TierOdds {
  return DROP_CONTEXT_BY_ID[context].tierOdds;
}

/** Every known adjustment for `itemId` that applies to `context`, or `[]` if none. */
export function getExceptionsFor(itemId: string, context: DropContext): DropException[] {
  const exceptions = DROP_EXCEPTIONS_BY_ITEM_ID[itemId];
  if (!exceptions) return [];
  return exceptions.filter((e) => e.contexts.includes(context));
}

function effectiveCopies(exceptions: DropException[]): number {
  let copies = DEFAULT_BASELINE_COPIES;
  for (const exception of exceptions) {
    if (exception.excluded) return 0;
    if (exception.baselineCopies !== undefined) copies = exception.baselineCopies;
    if (exception.copiesRemoved !== undefined) copies -= exception.copiesRemoved;
  }
  return Math.max(0, copies);
}

/**
 * How many distinct items of `rarity` are eligible to appear in `context` (i.e. not
 * `excluded` there) — the denominator for `estimateItemOdds`'s uniform-within-tier share.
 */
export function getEligiblePoolSize(rarity: Rarity, context: DropContext): number {
  return ALL_ITEMS.filter((item) => {
    if (item.rarity !== rarity) return false;
    return effectiveCopies(getExceptionsFor(item.id, context)) > 0;
  }).length;
}

/**
 * Estimated probability this specific item is the one drawn on a single slot roll in
 * `context`. This is the documented "uniform within tier, adjusted only by this item's
 * own known exceptions" approximation described in `src/data/dropProbability.ts`'s top
 * comment — it does NOT renormalize against every other item's own exceptions. Returns
 * `null` (never a fabricated number) when the item's rarity has 0%/no odds in this
 * context, when the item is fully excluded there, or when the item id isn't found.
 */
export function estimateItemOdds(itemId: string, context: DropContext): number | null {
  const item = ITEM_BY_ID[itemId];
  if (!item) return null;

  const tierOdds = getTierOdds(context);
  const tierP = tierOdds[item.rarity];
  if (!tierP) return null;

  const exceptions = getExceptionsFor(itemId, context);
  const copies = effectiveCopies(exceptions);
  if (copies <= 0) return null;

  const poolSize = getEligiblePoolSize(item.rarity, context);
  if (poolSize <= 0) return null;

  const itemShare = copies / (poolSize * DEFAULT_BASELINE_COPIES);
  return tierP * itemShare;
}
