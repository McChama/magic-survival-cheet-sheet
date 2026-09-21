import type { CSSProperties } from "react";

interface MaskedSpriteProps {
  /** URL of a white-on-transparent sprite, used as the mask shape. */
  src: string;
  /** Tint color. Omit it for a static color and pass a `bg-*` class instead. */
  tint?: string;
  /** A CSS background-image (e.g. a conic-gradient) painted through the mask instead of a single tint — for a sprite
   *  whose parts are colored separately, like the Synergy ring's segments. */
  fill?: string;
  /** Stretch the sprite to fill the box (frames, panels) instead of fitting it inside. */
  stretch?: boolean;
  /** Accessible name for a meaningful icon; omit for decoration. */
  label?: string;
  className?: string;
}

/**
 * A game sprite recolored via CSS mask-image — the shared implementation of CLAUDE.md's
 * "Icon tinting: mask, don't frame" rule. The static mask properties live in the
 * `.masked-sprite` class (index.css); only the sprite URL and the tint, the two values that
 * are genuinely dynamic, go through custom properties here.
 */
export function MaskedSprite({ src, tint, fill, stretch, label, className = "" }: MaskedSpriteProps) {
  const vars = { "--mask-src": `url(${src})`, ...(tint ? { "--tint": tint } : {}), ...(fill ? { backgroundImage: fill } : {}) } as CSSProperties;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`masked-sprite ${stretch ? "masked-sprite-stretch" : ""} ${className}`}
      style={vars}
    />
  );
}
