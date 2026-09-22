import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SYNERGIES, getOwnedFlags } from "../../data/synergies";
import { ITEM_BY_ID } from "../../engine/tierAdaptive";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { RARITY_RING } from "../../config/rarityColors";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { DetailModal } from "../shared/DetailModal";
import { GameText } from "../shared/GameText";
import { SynergyBadge } from "../shared/SynergyBadge";
import type { SynergyDefinition } from "../../types/game";

interface SynergyScreenProps {
  onClose: () => void;
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
              <button key={synergy.id} type="button" title={label} onClick={() => setSelected(synergy)} className="bg-transparent border-none p-0 cursor-pointer">
                <SynergyBadge image={synergy.image} alt={label} owned={getOwnedFlags(synergy, run)} />
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <DetailModal onClose={() => setSelected(null)} closeAria={t("synergy.closeAria")}>
          <div className="flex flex-col items-center text-center gap-2">
            <SynergyBadge image={selected.image} alt={gt(`synergy.${selected.id}.name`, selected.name)} owned={selectedOwned} size="w-16" />
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
