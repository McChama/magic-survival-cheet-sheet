import type { Rarity } from "../types/game";

/** Rarity ring colors, shared by every screen that renders an item tile (LoadoutSheet,
 *  the drop-probability calculator, the recommender). Extracted from LoadoutSheet.tsx,
 *  which was the sole owner until a second real consumer needed the same values. */
export const RARITY_RING: Record<Rarity, string> = {
  common: "rgb(121,119,120)",
  rare: "rgb(47,77,97)",
  epic: "rgb(82,40,90)",
  special: "rgb(107,25,34)",
  legendary: "rgb(161,163,51)",
};

/**
 * The color of a rarity's name as text ("Rare Artifact") on a black card — much brighter than the frame color above, which is
 * too dark to read. Rare (#3494bc) was sampled from a real screenshot; the others are brightened versions of their frame color
 * (unmeasured).
 */
export const RARITY_TEXT: Record<Rarity, string> = {
  common: "#b8b4b4",
  rare: "#3494bc",
  epic: "#a862c0",
  special: "#d84a60",
  legendary: "#e0dc46",
};

/**
 * Display order, common to rarest. Uses the *real* in-game grade order confirmed in the game
 * (special is grade 4, legendary is grade 5 — the true rarest), not the `Rarity` TS type's own
 * declaration order (which lists legendary before special and isn't ordinal).
 */
export const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "special", "legendary"];
