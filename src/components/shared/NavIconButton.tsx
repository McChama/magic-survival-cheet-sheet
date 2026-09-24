import { MaskedSprite } from "./MaskedSprite";

interface NavIconButtonProps {
  onClick: () => void;
  ariaLabel: string;
  icon: string;
  /** Circular chip background (Dashboard's colored nav row) — omitted for Home's bare,
   *  background-less icon buttons. Either way the button's own footprint is the same
   *  50×50 standard; a background just shrinks the icon inside it (a fixed 24px glyph box, so every
   *  chip's icon reads the same size) to leave visible chip. */
  background?: string;
  /** Recolor the icon flat via CSS mask instead of showing its own baked-in colors — for a sprite that needs one
   *  state tinted and another left as its native color (the Magic Combination glyph: plain white while no
   *  combination is available, its own red once one is — only the white state passes this). */
  tint?: string;
}

/**
 * The one shared size/footprint for every bottom-row icon button in the app — Home's row
 * and the Dashboard's nav row used to each hand-roll their own button markup with
 * different sizes, which is exactly the kind of per-screen drift CLAUDE.md's "Screen
 * layout structure" section already calls out for headers/titles/footers. Same rule here:
 * reach for this component instead of a new one-off `<button><img/></button>`.
 */
export function NavIconButton({ onClick, ariaLabel, icon, background, tint }: NavIconButtonProps) {
  const size = background ? "w-6 h-6" : "w-[50px] h-[50px]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-[50px] h-[50px] bg-transparent border-none p-0 cursor-pointer flex items-center justify-center rounded-full"
      style={background ? { background } : undefined}
    >
      {tint ? <MaskedSprite src={icon} tint={tint} className={`block ${size}`} /> : <img src={icon} alt="" className={`${size} object-contain`} />}
    </button>
  );
}
