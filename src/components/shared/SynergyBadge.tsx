import { useState } from "react";
import { uiImage } from "../../config/assets";
import { SYNERGY_RING_COMPLETE, SYNERGY_RING_DIM } from "../../config/tierColors";
import { MaskedSprite } from "./MaskedSprite";

/** A Synergy's real portrait icon has no masked/silhouette treatment — it's full-color
 *  medallion art (like an artifact's own icon), not a flat-tint sprite, so CLAUDE.md's
 *  "Icon tinting: mask, don't frame" rule doesn't apply here (that rule is for flat-color/
 *  silhouette sprites, e.g. Class/Research/base-magic icons). */
function SynergyIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[#e8e8e2]/30 text-2xl">?</span>;
  return <img src={src} alt={alt} loading="lazy" className="w-[70%] h-[70%] object-contain" onError={() => setFailed(true)} />;
}

/** The ring's gaps sit at multiples of 360 / n from the top (measured off the sprites), so segment i spans
 *  [i x 360/n, (i + 1) x 360/n] clockwise. Each one is painted gold if its item is owned, dim if not. */
function segmentFill(owned: boolean[]): string {
  const step = 360 / owned.length;
  const stops = owned.map((has, i) => `${has ? SYNERGY_RING_COMPLETE : SYNERGY_RING_DIM} ${i * step}deg ${(i + 1) * step}deg`);
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

/**
 * The completion-ring frame: `SynergyNum{n}.png`/`SynergyNumS{n}.png` (n = how many items
 * this Synergy requires — the dictionary's own "count" column — NOT how many the player
 * currently owns; pixel analysis confirmed `SynergyNum{n}` has exactly n gaps,
 * a *structural* ring shape, not a per-owned-item progress ring). Both variants are pure
 * white-on-transparent masks (confirmed via pixel sampling — not pre-colored), tinted here
 * via the same mask-image + backgroundColor technique CLAUDE.md's Icon tinting rule already
 * uses for Class/Research icons: dim while nothing is owned, **one gold segment per owned item**
 * while in progress (each required item has its own segment), and the whole thin-stroke
 * `SynergyNumS{n}` in gold once every required item is owned.
 */
export function CompletionRing({ owned }: { owned: boolean[] }) {
  const complete = owned.every(Boolean);
  const file = complete ? `SynergyNumS${owned.length}` : `SynergyNum${owned.length}`;
  const hasProgress = !complete && owned.some(Boolean);
  return (
    <MaskedSprite
      src={uiImage(`synergyRings/${file}.png`)}
      tint={complete ? SYNERGY_RING_COMPLETE : SYNERGY_RING_DIM}
      fill={hasProgress ? segmentFill(owned) : undefined}
      className="absolute inset-0 pointer-events-none"
    />
  );
}

interface SynergyBadgeProps {
  /** The Synergy's portrait URL (`SynergyDefinition.image`). */
  image: string;
  alt: string;
  /** For each required item, in order, whether the run owns it (`getOwnedFlags`) — lights the ring's segments. */
  owned: boolean[];
  /** Size of the round badge, e.g. "w-16" (it is square). */
  size?: string;
}

/** The round Synergy medallion with its progress ring — shared by the Synergy grid, an artifact's detail and the artifact offer. */
export function SynergyBadge({ image, alt, owned, size = "w-full" }: SynergyBadgeProps) {
  return (
    <div className={`relative ${size} aspect-square rounded-full overflow-hidden bg-[#0d0d10] flex items-center justify-center`}>
      <SynergyIcon src={image} alt={alt} />
      <CompletionRing owned={owned} />
    </div>
  );
}
