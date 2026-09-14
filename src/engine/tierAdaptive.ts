import { ARTIFACTS } from "../data/artifacts";
import { PASSIVES } from "../data/passives";
import type { CurrentRunState, EquippableItem } from "../types/game";

export const ALL_ITEMS: EquippableItem[] = [...ARTIFACTS, ...PASSIVES];
export const ITEM_BY_ID: Record<string, EquippableItem> = Object.fromEntries(
  ALL_ITEMS.map((item) => [item.id, item])
);

export function getEquippedItems(run: CurrentRunState): EquippableItem[] {
  return run.equipped
    .map((stack) => ITEM_BY_ID[stack.itemId])
    .filter((item): item is EquippableItem => Boolean(item));
}

export function hasTag(items: EquippableItem[], tag: string): boolean {
  return items.some((item) => item.tags?.includes(tag));
}

/** How much of each excess-Move-Speed point Accelerator converts into Cooldown. */
export const ACCELERATOR_CONVERSION_RATE = 0.3;

export interface TierAdjustment {
  tag: string;
  multiplier: number;
  reason: string;
}

/**
 * "Dynamic Artifact Tier Scaling": re-prioritizes normally low-tier stat tags
 * when a synergistic legendary is already equipped. Each entry here is a documented,
 * explicit rule rather than a generic formula, matching the brief's own example
 * (Accelerator -> elevate Movement Speed items to Tier S).
 */
export function computeTierAdjustments(run: CurrentRunState): TierAdjustment[] {
  const equipped = getEquippedItems(run);
  const adjustments: TierAdjustment[] = [];

  if (hasTag(equipped, "cooldownConverter")) {
    adjustments.push({
      tag: "moveSpeed",
      multiplier: 1.6,
      reason: "Accelerator converts excess Movement Speed into additional Cooldown.",
    });
  }

  if (hasTag(equipped, "amplify")) {
    adjustments.push({
      tag: "atk",
      multiplier: 1.25,
      reason: "You already have Amplify ATK active: each point of flat ATK yields more final damage.",
    });
  }

  if (hasTag(equipped, "execute")) {
    adjustments.push({
      tag: "critRate",
      multiplier: 1.2,
      reason: "Overmind rewards consistent hits against high-HP targets: raises the value of Crit Rate.",
    });
  }

  return adjustments;
}

export function getTierMultiplier(adjustments: TierAdjustment[], tag: string): number {
  const match = adjustments.find((a) => a.tag === tag);
  return match ? match.multiplier : 1;
}

/** ATK is "high" enough that raw damage is bottlenecked by 0% Amplify, per spec section 4.1. */
export function isAmplifyStarved(run: CurrentRunState): boolean {
  return run.stats.atk >= 120 && run.stats.amplifyAtk < 30;
}
