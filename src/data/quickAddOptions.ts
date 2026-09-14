import { ALL_RECOMMENDER_OPTIONS } from "./recommenderOptions";
import type { RecommenderOption } from "../engine/scoring";

export type QuickAddKind = "artifact" | "passive" | "magic";

/**
 * Subset of ALL_RECOMMENDER_OPTIONS for the "log pickup" FAB. Unlike the Recommender
 * (which compares any mixed types), here the player already knows what kind of thing
 * they picked up (the game tells them on screen), so we filter by category to cut
 * search noise.
 */
export function optionsByKind(kind: QuickAddKind): RecommenderOption[] {
  if (kind === "magic") return ALL_RECOMMENDER_OPTIONS.filter((o) => o.magicId);
  return ALL_RECOMMENDER_OPTIONS.filter((o) => o.item?.kind === kind);
}
