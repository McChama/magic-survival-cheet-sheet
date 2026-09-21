import type { SynergyTier } from "../engine/synergy";

/**
 * Shared tier -> color mapping for `engine/synergy.ts`'s "boost signal" tiers (fusion-
 * ingredient match, class/subject signature magic, shared-with-equipped, already-acquired
 * magic) — tier 1-2 gold, 3-4 teal, 5-6 a dim neutral. Previously copy-pasted verbatim in
 * `OwnedGridScreen.tsx`, `RecommenderScreen.tsx`, and the old `SynergyScreen.tsx` (3
 * independent declarations of the same literal object) — consolidated here so a future
 * change to one of these colors can't silently drift between screens.
 *
 * Named `BOOST_SIGNAL_TIER_COLOR`, not `SYNERGY_TIER_COLOR` — "Synergy" now means the real
 * in-game artifact-combo mechanic (`data/synergies.ts`, its own screen), and this is the
 * unrelated older concept (still real, still used for the Recommender's ranking and the
 * Owned Artifact detail modal) that needed a name that doesn't collide with it.
 */
export const BOOST_SIGNAL_TIER_COLOR: Record<SynergyTier, string> = {
  1: "#efc84f",
  2: "#efc84f",
  3: "#5fe3c4",
  4: "#5fe3c4",
  5: "rgba(232,232,226,.7)",
  6: "rgba(232,232,226,.7)",
};

/** The real Synergy screen's completion-ring tint: dim while incomplete, gold once every
 *  required item is equipped. Reuses the same gold as `BOOST_SIGNAL_TIER_COLOR`'s tier 1-2
 *  (both mean "fully confirmed, strongest signal") rather than inventing a second gold. */
export const SYNERGY_RING_DIM = "rgba(232,232,226,.35)";
export const SYNERGY_RING_COMPLETE = "#efc84f";

