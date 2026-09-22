import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BASE_MAGIC_BY_ID, MAGIC_DESCRIPTION, baseMagicSpriteUrl } from "../../data/magics";
import { magicKindOf } from "../../data/magicCategories";
import { passiveLinesAtLevel } from "../../data/passiveLevels";
import type { RecommenderOption } from "../../engine/scoring";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { MAGIC_KIND_COLOR } from "../../config/frameColors";
import { GameText } from "./GameText";
import { GridIcon, MaskedMagicIcon } from "./GridCard";
import { StarIcon } from "./LevelMarks";
import { StripFrame } from "./StripFrame";

interface PickRowProps {
  /** The rough border's color: white for an active magic, blue utility, green passive, red special. */
  frame: string;
  icon: ReactNode;
  title: string;
  /** Top-right corner: the star of a special. */
  marker?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  obtainLabel: string;
  onObtain: () => void;
  children?: ReactNode;
}

/**
 * One row of the game's "Select Magic" list: a wide black card with the game's rough border, the icon on the left, the
 * title and the description lines on the right and a marker in the top-right corner. Tapping the row selects it, and only the
 * selected row shows its Obtain button (the same thin button as Test Subject's) — the button's line is always reserved, so a row
 * is never taller or shorter because of it.
 */
function PickRow({ frame, icon, title, marker, selected, onSelect, obtainLabel, onObtain, children }: PickRowProps) {
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={handleKey}
      className={`relative flex-none bg-black cursor-pointer transition-transform duration-150 ${selected ? "scale-[1.02] z-10" : "scale-100"}`}
    >
      <div className="relative flex gap-3.5 px-4 py-3">
        <div className="flex-none w-[52px] h-[52px] mt-1 flex items-center justify-center">{icon}</div>
        <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
          <div className="text-[1.1rem] leading-tight text-white pr-8">{title}</div>
          {children}
          <div className="pt-1.5 flex justify-center">
            <button
              type="button"
              tabIndex={selected ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                onObtain();
              }}
              className={`w-[70%] max-w-[220px] h-[1.2rem] flex items-center justify-center border-none rounded leading-none cursor-pointer text-[0.9rem] bg-[#2d2d31] text-white ${selected ? "" : "invisible"}`}
            >
              {obtainLabel}
            </button>
          </div>
        </div>
        {marker && <div className="absolute top-3 right-4 flex items-center">{marker}</div>}
      </div>
      <StripFrame tint={frame} size="row" />
    </div>
  );
}

/**
 * The magics and passives the run doesn't have yet, as the game's own "Select Magic" rows in a scrolling list: a wide card with a
 * rough border colored by kind (white active, blue utility, green passive, red special), its icon (white for a magic, pale
 * green for a passive, the sprite's own colors for a special), name and real description lines. Tap a row to select it and its Obtain
 * button appears; obtaining adds the magic or passive at level 1 and takes it out of the list — its level and talent are
 * managed on the Owned Magic screen. Give it a `key` per category so the selection starts over when the category changes.
 */
export function MagicPickList({ options }: { options: RecommenderOption[] }) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const equipItem = useRunStore((s) => s.equipItem);
  const toggleAcquiredMagic = useRunStore((s) => s.toggleAcquiredMagic);
  const obtainLabel = t("loadoutSheet.obtainBtn");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function obtain(action: () => void) {
    action();
    setSelectedId(null);
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-1 pb-6">
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const kind = magicKindOf(option);
          if (!kind) return null;
          const frame = MAGIC_KIND_COLOR[kind];
          const selected = selectedId === option.id;

          if (option.magicId) {
            const magicId = option.magicId;
            const title = gt(`magic.${magicId}.name`, BASE_MAGIC_BY_ID[magicId]?.name ?? option.label);
            const description = MAGIC_DESCRIPTION[magicId];
            return (
              <PickRow
                key={option.id}
                frame={frame}
                icon={<MaskedMagicIcon src={baseMagicSpriteUrl(magicId)} alt={title} full />}
                title={title}
                selected={selected}
                onSelect={() => setSelectedId(option.id)}
                obtainLabel={obtainLabel}
                onObtain={() => obtain(() => toggleAcquiredMagic(magicId))}
              >
                {description && <GameText text={description} color="#EBEBEB" className="text-[0.8rem]" />}
              </PickRow>
            );
          }

          const item = option.item;
          if (!item) return null;
          const title = gt(`item.${item.id}.name`, item.name);
          const special = kind === "special";
          return (
            <PickRow
              key={option.id}
              frame={frame}
              icon={special ? <GridIcon src={item.image} alt={title} /> : <MaskedMagicIcon src={item.image} alt={title} full className="bg-[#a6e8a6]" />}
              title={title}
              marker={special ? <StarIcon size="w-[18px] h-[18px]" /> : undefined}
              selected={selected}
              onSelect={() => setSelectedId(option.id)}
              obtainLabel={obtainLabel}
              onObtain={() => obtain(() => equipItem(item.id))}
            >
              {passiveLinesAtLevel(item.id, 1).map((line, i) => (
                <GameText key={i} text={line.text} color={line.color} className="text-[0.8rem]" />
              ))}
            </PickRow>
          );
        })}
        {options.length === 0 && <div className="py-[30px] text-center text-[0.8rem] text-[#e8e8e2]/35">{t("loadoutSheet.noResults")}</div>}
      </div>
    </div>
  );
}
