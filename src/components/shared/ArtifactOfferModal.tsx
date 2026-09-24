import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RARITY_TEXT } from "../../config/rarityColors";
import { useGameDataText } from "../../i18n/useGameDataText";
import { CARD_ASPECT, CardArt, GridIcon, GridTile } from "./GridCard";
import { DetailModal } from "./DetailModal";
import { GameText } from "./GameText";
import { ItemSynergies } from "./ItemSynergies";
import { RARITY_LABEL_KEY, describeItem } from "./itemText";
import type { EquippableItem } from "../../types/game";

/** The game's card borders in this modal: plain white on the one under the finger, dark gray on the others. */
const CARD_FRAME_SELECTED = "#fff";
const CARD_FRAME_IDLE = "#787878";

interface ArtifactOfferModalProps {
  /** The artifacts the game just offered (a chest shows 3). */
  items: EquippableItem[];
  /** The player took this one. */
  onObtain: (item: EquippableItem) => void;
  onClose: () => void;
}

/**
 * The game's Treasure Chest window, for logging which of the offered artifacts was taken: the offered artifacts as
 * Owned Artifact cards (tap one to look at it), then the selected one's name, rarity, real description and the Synergies it
 * belongs to (each with its progress ring), and the Obtain button that adds it to the run.
 */
export function ArtifactOfferModal({ items, onObtain, onClose }: ArtifactOfferModalProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  if (!selected) return null;

  return (
    <DetailModal onClose={onClose} closeAria={t("offer.closeAria")} align="top">
      <div className="relative flex flex-col items-center text-center gap-1 min-h-full">
        <div className="font-magic text-[1.5rem] text-[#fcd89c]">{t("offer.title")}</div>

        <div className="grid grid-cols-3 gap-[3%] w-[74%] mt-1">
          {items.map((item) => {
            const label = gt(`item.${item.id}.name`, item.name);
            return (
              <GridTile key={item.id} onClick={() => setSelectedId(item.id)} frame={item.id === selected.id ? CARD_FRAME_SELECTED : CARD_FRAME_IDLE} label={label} aspect={CARD_ASPECT}>
                <CardArt centered>
                  <GridIcon src={item.image} alt={label} />
                </CardArt>
              </GridTile>
            );
          })}
        </div>

        <div className="font-magic text-[1.3rem] text-[#e8e8e2] mt-2">{gt(`item.${selected.id}.name`, selected.name)}</div>
        <div className="text-[0.8rem]" style={{ color: RARITY_TEXT[selected.rarity] }}>
          {t("ownedArtifact.rarityArtifact", { rarity: t(`loadoutSheet.categories.${RARITY_LABEL_KEY[selected.rarity]}`) })}
        </div>
        <GameText text={describeItem(selected, t, gt)} color="#EBEBEB" className="text-[0.8rem]" />
        <ItemSynergies itemId={selected.id} />

        <button
          type="button"
          onClick={() => onObtain(selected)}
          className="mt-auto pt-3 pb-1 w-full bg-transparent border-none font-magic text-[1.5rem] text-white cursor-pointer"
        >
          {t("offer.obtainBtn")}
        </button>
      </div>
    </DetailModal>
  );
}
