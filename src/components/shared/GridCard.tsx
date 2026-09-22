import { useState, type ReactNode } from "react";
import { MaskedSprite } from "./MaskedSprite";
import { StripFrame } from "./StripFrame";

/** Real game spell-slot cards are tall portrait rectangles: measured off a real in-game
 *  Owned Magic screenshot, 108px wide x 205px tall (~1:1.9). Every inner offset (icon
 *  size/position, pip size/position) is likewise a percentage of that measured card, via
 *  container-query units (`cqw`/`cqh` — `GridTile` is `container-type: size`), so the card
 *  looks the same at any screen width. */
export const CARD_ASPECT = "aspect-[108/205]";

interface GridTileProps {
  onClick: () => void;
  /** The border's color — the only thing that varies between cards. */
  frame: string;
  label: string;
  children: ReactNode;
  badge?: ReactNode;
  aspect?: string;
  /** Extra classes on the card's own button (the selection zoom). */
  className?: string;
}

/** Every card shares one black background — only the border color (`frame`) varies. */
export function GridTile({ onClick, frame, label, children, badge, aspect = "aspect-square", className = "" }: GridTileProps) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`relative ${aspect} bg-black cursor-pointer flex items-center justify-center p-0 overflow-hidden [container-type:size] ${className}`}
    >
      {children}
      {badge}
      <StripFrame tint={frame} />
    </button>
  );
}

/** Positions a card's icon where the real game does: its visible art ~54% of the card's
 *  width (the sprites carry transparent margins, so the box is 64%), centered ~41% down the
 *  card's height. A card with no level row under it (the class tile) centers its icon
 *  vertically instead. */
export function CardArt({ children, centered }: { children: ReactNode; centered?: boolean }) {
  const pos = centered ? "top-1/2 -translate-y-1/2" : "top-[24cqh]";
  return <span className={`absolute left-1/2 -translate-x-1/2 ${pos} w-[64cqw] aspect-square flex items-center justify-center`}>{children}</span>;
}

/** A full-color sprite (artifact, combination portrait); a URL with no file behind it shows a "?" instead. */
export function GridIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[#e8e8e2]/30 text-2xl">?</span>;
  return <img src={src} alt={alt} loading="lazy" className="w-full h-full object-contain" onError={() => setFailed(true)} />;
}

/** Active-magic tile art, masked to flat white (per the reference screenshots) instead of the
 *  sprite's own colors. A hidden probe <img> catches a missing sprite, since a mask-image never
 *  fires a load error. */
export function MaskedMagicIcon({ src, alt, full, className = "bg-white" }: { src: string; alt: string; full?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[#e8e8e2]/30 text-2xl">?</span>;
  return (
    <>
      <MaskedSprite src={src} label={alt} className={`block ${className} ${full ? "w-full h-full" : "w-[70%] h-[70%]"}`} />
      <img src={src} alt="" className="hidden" onError={() => setFailed(true)} />
    </>
  );
}
