/**
 * Border colors of the game's magic cards, sampled from real in-game screenshots (Owned Magic, Bishop, 2026-09-20; the
 * Select Magic offer, 2026-09-21). They reach `StripFrame` as a tint value.
 */
export const CLASS_FRAME = "#fff"; // always plain white on Owned Magic, whatever the class level
export const ACTIVE_MAGIC_FRAME = "#2d5fae"; // dark blue — the game frames active/base-magic slots in blue
export const SPECIAL_FRAME = "#9a1c38"; // dark red — a special ability (Guardian Angel, Energy Engineering, ...)
export const PASSIVE_FRAME = "#2f8f3a"; // green — a regular passive magic (Vitality, ...)

/** The "+" menu's color per magic kind, for its chips and its rows' borders: Active white, Utility blue, Passive green, Special red. */
export const MAGIC_KIND_COLOR = {
  offensive: "#ffffff",
  utility: ACTIVE_MAGIC_FRAME,
  passive: PASSIVE_FRAME,
  special: SPECIAL_FRAME,
} as const;

/** A Magic Combination card's border: plain white once its requirements are met, dark gray otherwise. Shared by
 *  `MagicCombinationScreen`'s grid and `AttributeSelect`'s "compatible combos" thumbnail row (a talent pick can make
 *  one newly satisfiable, highlighted the same way). */
export const COMBINATION_FRAME_READY = "#fff";
export const COMBINATION_FRAME_IDLE = "#4a4646";

/**
 * A Select Magic row's level marker + border, by what leveling into it would do (sampled off a real level-up
 * screenshot, 2026-09-24): a fresh, not-yet-owned pickup reads in the app's plain base text color; a normal level-up
 * in gold; a level that unlocks a talent in a distinct teal — border, level number and the "You can obtain an
 * attribute." line all share that same teal, exactly like the real screen's one-color treatment for that state.
 */
export const LEVEL_PICK_FRESH_COLOR = "#e8e8e2";
export const LEVEL_PICK_NORMAL_COLOR = "#efc84f";
export const LEVEL_PICK_TALENT_COLOR = "#32ffe1";
