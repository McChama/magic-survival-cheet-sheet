import { uiImage } from "../../config/assets";
import { MaskedSprite } from "./MaskedSprite";

const EDGE = "absolute pointer-events-none";

/**
 * Strip thickness per frame size, as static class strings (Tailwind only sees literal class names). The sprites are
 * `AreaProgressBarA` (202x7: the stroke is rows 2-4, row 3 fully opaque) and `AreaProgressBarB_V` (10x202: the stroke is
 * columns 1-3), so a strip is drawn at 0.6-0.9x of their own thickness — squashed harder than that the stroke thins to a
 * dashed hairline, which is what made the borders look cut — and pulled outward by the transparent margin in front
 * of the stroke (the negative offsets), so the stroke itself sits right on the box's edge and the four sides meet at the corners.
 *   `card`  the thin border of the owned-grid cards (~2% of a card's width in the real game),
 *   `row`   the heavier one of a wide list row (the Select Magic rows),
 *   `modal` the border of a big panel (`DetailModal`).
 */
const THICKNESS = {
  card: { top: "h-[3.2px] -top-[0.9px]", bottom: "h-[3.2px] -bottom-[0.9px]", left: "w-[5px] -left-[0.5px]", right: "w-[5px] -right-[0.5px]" },
  row: { top: "h-[5px] -top-[1.4px]", bottom: "h-[5px] -bottom-[1.4px]", left: "w-[7.5px] -left-[0.75px]", right: "w-[7.5px] -right-[0.75px]" },
  modal: { top: "h-[5px] -top-[1.4px]", bottom: "h-[5px] -bottom-[1.4px]", left: "w-[7px] -left-[0.7px]", right: "w-[7px] -right-[0.7px]" },
} as const;

/**
 * The game's rough hand-painted border, built from two real strip sprites: `AreaProgressBarA` (top + bottom edges) and
 * `AreaProgressBarB_V` (left + right edges — the game's `AreaProgressBarB` already turned 90deg, so it needs no
 * rotation and no measuring of the parent). Both are white-on-transparent masks, so they take any `tint`. The parent
 * only has to be `position: relative` and clip nothing it wants shown; its size can follow its content.
 */
export function StripFrame({ tint, size = "card" }: { tint: string; size?: keyof typeof THICKNESS }) {
  const horizontal = uiImage("frames/AreaProgressBarA.png");
  const vertical = uiImage("frames/AreaProgressBarB_V.png");
  const t = THICKNESS[size];
  return (
    <>
      <MaskedSprite src={horizontal} tint={tint} stretch className={`${EDGE} inset-x-0 ${t.top}`} />
      <MaskedSprite src={horizontal} tint={tint} stretch className={`${EDGE} inset-x-0 ${t.bottom} scale-y-[-1]`} />
      <MaskedSprite src={vertical} tint={tint} stretch className={`${EDGE} inset-y-0 ${t.left}`} />
      <MaskedSprite src={vertical} tint={tint} stretch className={`${EDGE} inset-y-0 ${t.right} scale-x-[-1]`} />
    </>
  );
}
