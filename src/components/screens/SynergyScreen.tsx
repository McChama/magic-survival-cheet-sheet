import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SYNERGIES, getOwnedFlags } from "../../data/synergies";
import { ITEM_BY_ID } from "../../engine/tierAdaptive";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { uiImage } from "../../config/assets";
import { RARITY_RING } from "../../config/rarityColors";
import { SYNERGY_RING_COMPLETE, SYNERGY_RING_DIM } from "../../config/tierColors";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { DetailModal } from "../shared/DetailModal";
import { GameText } from "../shared/GameText";
import { MaskedSprite } from "../shared/MaskedSprite";
import type { SynergyDefinition } from "../../types/game";

interface SynergyScreenProps {
  onClose: () => void;
}

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
 * currently owns; pixel analysis this session confirmed `SynergyNum{n}` has exactly n gaps,
 * a *structural* ring shape, not a per-owned-item progress ring). Both variants are pure
 * white-on-transparent masks (confirmed via pixel sampling — not pre-colored), tinted here
 * via the same mask-image + backgroundColor technique CLAUDE.md's Icon tinting rule already
 * uses for Class/Research icons: dim while nothing is owned, **one gold segment per owned item**
 * while in progress (each required item has its own segment), and the whole thin-stroke
 * `SynergyNumS{n}` in gold once every required item is owned.
 */
function CompletionRing({ owned }: { owned: boolean[] }) {
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

function RequiredItemChip({ itemId, owned, gt }: { itemId: string; owned: boolean; gt: (key: string, fallback: string) => string }) {
  const item = ITEM_BY_ID[itemId];
  if (!item) return null;
  const label = gt(`item.${item.id}.name`, item.name);
  return (
    <div
      title={label}
      className={`w-10 h-10 rounded-[6px] overflow-hidden flex-none border ${owned ? "opacity-100" : "opacity-[.35]"}`}
      style={{ borderColor: RARITY_RING[item.rarity] }}
    >
      <img src={item.image} alt={label} className="w-full h-full object-cover" />
    </div>
  );
}

export function SynergyScreen({ onClose }: SynergyScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const [selected, setSelected] = useState<SynergyDefinition | null>(null);

  const selectedOwned = selected ? getOwnedFlags(selected, run) : [];
  const selectedOwnedCount = selectedOwned.filter(Boolean).length;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("synergy.closeAria")} />
      <ScreenTitle tone="gold">{t("synergy.title")}</ScreenTitle>

      <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-4">
        <div className="grid grid-cols-5 gap-2.5">
          {SYNERGIES.map((synergy) => {
            const label = gt(`synergy.${synergy.id}.name`, synergy.name);
            return (
              <button
                key={synergy.id}
                type="button"
                title={label}
                onClick={() => setSelected(synergy)}
                className="relative aspect-square rounded-full bg-[#0d0d10] cursor-pointer flex items-center justify-center p-0 overflow-hidden"
              >
                <SynergyIcon src={synergy.image} alt={label} />
                <CompletionRing owned={getOwnedFlags(synergy, run)} />
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <DetailModal onClose={() => setSelected(null)} closeAria={t("synergy.closeAria")}>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#0d0d10] flex items-center justify-center">
              <SynergyIcon src={selected.image} alt={gt(`synergy.${selected.id}.name`, selected.name)} />
              <CompletionRing owned={selectedOwned} />
            </div>
            <div className="font-magic text-[1.2rem] text-[#e8e8e2]">{gt(`synergy.${selected.id}.name`, selected.name)}</div>
            <div className="text-[0.7rem] text-[#e8e8e2]/50">
              {t("synergy.ownedOf", { owned: selectedOwnedCount, required: selected.requiredItemIds.length })}
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap mt-1">
              {selected.requiredItemIds.map((itemId, i) => (
                <RequiredItemChip key={itemId} itemId={itemId} owned={selectedOwned[i]} gt={gt} />
              ))}
            </div>

            <div className="flex flex-col gap-1 mt-2">
              {selected.descriptionLines.map((line, i) => (
                <GameText key={i} text={gt(`synergy.${selected.id}.description${i + 1}`, line.text)} color={line.color} />
              ))}
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
