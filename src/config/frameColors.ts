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
