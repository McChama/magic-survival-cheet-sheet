import { STAT_DEFINITIONS } from "../data/statDefinitions";
import type { StatKey } from "../types/game";

export type AlertLevel = "none" | "watch" | "warning" | "critical";

/**
 * Classifies a live stat value against its diminishing-returns thresholds.
 * - "critical": past the hard cap — further investment here is close to wasted.
 * - "warning": past the soft cap — still gaining, but at a worsening rate (orange, per spec).
 * - "watch": within 15% of the soft cap — heads-up before it becomes a warning.
 * - "none": comfortably under threshold, or the stat has no known diminishing curve.
 */
export function getAlertLevel(key: StatKey, value: number): AlertLevel {
  const def = STAT_DEFINITIONS[key];
  if (!def.hasDiminishingReturns) return "none";
  if (def.hardCap !== undefined && value >= def.hardCap) return "critical";
  if (def.softCap !== undefined && value >= def.softCap) return "warning";
  if (def.softCap !== undefined && value >= def.softCap * 0.85) return "watch";
  return "none";
}

export function isPastSoftCap(key: StatKey, value: number): boolean {
  const def = STAT_DEFINITIONS[key];
  return def.softCap !== undefined && value >= def.softCap;
}
