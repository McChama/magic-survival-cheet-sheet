import { uiImage } from "../../config/assets";
import { MaskedSprite } from "./MaskedSprite";

const EDGE = "absolute pointer-events-none";

/** Thickness variants, as static class strings (Tailwind only sees literal class names).
 *  `card` matches the real game's thin card border (~2% of a card's width); `modal` is
 *  heavier so the rough edge of a large panel reads at that size. A side strip is turned 90deg
 *  about its top-left corner, which swings it out by its own thickness, hence the translate. */
const THICKNESS = {
  card: { top: "h-[2px]", side: "h-[3px]", left: "translate-x-[3px]", right: "-translate-x-[3px]" },
  modal: { top: "h-[5px]", side: "h-[7px]", left: "translate-x-[7px]", right: "-translate-x-[7px]" },
} as const;

/**
 * The game's rough hand-painted border, built from two real strip sprites:
 * `AreaProgressBarA` (top + bottom edges) and `AreaProgressBarB` (left + right edges, turned
 * 90deg). Both are white-on-transparent masks, so they take any `tint`. The side strips are
 * as long as the parent is tall (`100cqh`), so the parent must be a size container
 * (`[container-type:size]`, with an explicit height).
 */
export function StripFrame({ tint, size = "card" }: { tint: string; size?: keyof typeof THICKNESS }) {
  const a = uiImage("frames/AreaProgressBarA.png");
  const b = uiImage("frames/AreaProgressBarB.png");
  const t = THICKNESS[size];
  return (
    <>
      <MaskedSprite src={a} tint={tint} stretch className={`${EDGE} inset-x-0 top-0 ${t.top}`} />
      <MaskedSprite src={a} tint={tint} stretch className={`${EDGE} inset-x-0 bottom-0 ${t.top} scale-y-[-1]`} />
      <MaskedSprite src={b} tint={tint} stretch className={`${EDGE} left-0 top-0 ${t.side} w-[100cqh] origin-top-left ${t.left} rotate-90`} />
      <MaskedSprite src={b} tint={tint} stretch className={`${EDGE} left-full top-0 ${t.side} w-[100cqh] origin-top-left ${t.right} rotate-90 scale-y-[-1]`} />
    </>
  );
}
