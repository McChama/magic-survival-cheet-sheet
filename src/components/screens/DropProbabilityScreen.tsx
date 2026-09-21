import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DROP_CONTEXT_BY_ID, DROP_EXCEPTIONS } from "../../data/dropProbability";
import { ITEM_BY_ID } from "../../engine/tierAdaptive";
import { useGameDataText } from "../../i18n/useGameDataText";
import { RARITY_RING, RARITY_ORDER } from "../../config/rarityColors";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ScreenFooter } from "../shared/ScreenFooter";
import { DropContextPicker } from "../shared/DropContextPicker";
import type { DropContext, Rarity } from "../../types/game";

interface DropProbabilityScreenProps {
  onClose: () => void;
}

const RARITY_LABEL_KEY: Record<Rarity, string> = {
  common: "loadoutSheet.categories.normal",
  rare: "loadoutSheet.categories.rare",
  epic: "loadoutSheet.categories.epic",
  special: "loadoutSheet.categories.special",
  legendary: "loadoutSheet.categories.legendary",
};

const SLOTS_NOTE_KEY: Record<DropContext, string> = {
  normalChest: "dropProbability.slotsNote.normalChest",
  merchant: "dropProbability.slotsNote.merchant",
  obelisk: "dropProbability.slotsNote.obelisk",
  brokenObelisk: "dropProbability.slotsNote.brokenObelisk",
  relicChest: "dropProbability.slotsNote.relicChest",
};

function ExceptionIcon({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="text-[#e8e8e2]/30 text-lg">?</span>;
  return <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} />;
}

export function DropProbabilityScreen({ onClose }: DropProbabilityScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const [context, setContext] = useState<DropContext>("normalChest");

  const contextDef = DROP_CONTEXT_BY_ID[context];
  const knownTiers = RARITY_ORDER.filter((r) => contextDef.tierOdds[r] !== undefined);
  const exceptions = useMemo(
    () => DROP_EXCEPTIONS.filter((e) => e.contexts.includes(context)),
    [context]
  );

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("dropProbability.closeAria")} />
      <ScreenTitle>{t("dropProbability.heading")}</ScreenTitle>

      <DropContextPicker value={context} onChange={setContext} />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 flex flex-col gap-4">
        <div className="flex-none flex flex-col gap-1.5">
          {knownTiers.length === 0 ? (
            <div className="text-[0.8rem] text-[#e8e8e2]/35 text-center py-2">{t("dropProbability.noTierData")}</div>
          ) : (
            knownTiers.map((rarity) => (
              <div key={rarity} className="flex items-center gap-2.5 py-1.5 px-3 rounded-[7px] bg-[#111115]">
                <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: RARITY_RING[rarity] }} />
                <span className="flex-1 text-[0.9rem] text-[#e8e8e2]">{t(RARITY_LABEL_KEY[rarity])}</span>
                <span className="text-[0.9rem] font-magic text-[#efc84f]">
                  {((contextDef.tierOdds[rarity] ?? 0) * 100).toFixed(1)}%
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex-none text-[0.8rem] text-[#e8e8e2]/55 text-center">{t(SLOTS_NOTE_KEY[context])}</div>

        <div className="flex-none flex flex-col gap-2">
          <div className="text-[0.8rem] text-[#e8e8e2]/70 uppercase tracking-wide">
            {t("dropProbability.exceptionsHeading")}
          </div>
          {exceptions.length === 0 && (
            <div className="text-[0.8rem] text-[#e8e8e2]/35 py-2">{t("dropProbability.noExceptions")}</div>
          )}
          {exceptions.map((exception, i) => {
            const item = ITEM_BY_ID[exception.itemId];
            const label = item ? gt(`item.${item.id}.name`, item.name) : exception.itemId;
            return (
              <div key={`${exception.itemId}-${i}`} className="flex gap-2.5 items-start py-1.5">
                <span className="flex-none w-8 h-8 rounded-[6px] bg-[#0d0d10] overflow-hidden flex items-center justify-center">
                  <ExceptionIcon src={item?.image} alt={label} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.85rem] text-[#e8e8e2]">{label}</div>
                  <div className="text-[0.75rem] text-[#e8e8e2]/55">{exception.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ScreenFooter>
        <div className="text-[0.72rem] text-[#e8e8e2]/40 text-center">{t("dropProbability.footerNote")}</div>
      </ScreenFooter>
    </div>
  );
}
