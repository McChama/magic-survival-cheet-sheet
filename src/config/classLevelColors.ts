/**
 * Class icon tints in Class Select (and the class detail card), as literal Tailwind `bg-*`
 * classes so Tailwind sees them and no inline style is needed (`MaskedSprite` takes them via
 * `className`). Icons use soft pastel tones, not the saturated colors of the bonus *text* lines.
 *
 * Measured off a real in-game Class Select screenshot: a class at level 3 is #C8E8FF, and the
 * picked class is #F0F0D8 (both sampled from the sprite pixels). Levels 2, 4 and 5 are the same
 * kind of pastel derived from their bonus-line hue (green / pink / the Research "has progress"
 * gold) — not yet measured, and level 1 is plain white.
 */
export const CLASS_LEVEL_TINT_CLASS: Record<number, string> = {
  1: "bg-[#ffffff]",
  2: "bg-[#c8f5b4]",
  3: "bg-[#c8e8ff]",
  4: "bg-[#f5c8ea]",
  5: "bg-[#fce88a]",
};

/** The picked class in Class Select. */
export const CLASS_SELECTED_TINT_CLASS = "bg-[#f0f0d8]";
