import { useTranslation } from "react-i18next";
import { FilterChip } from "./FilterChip";
import { RARITY_RING, RARITY_ORDER } from "../../config/rarityColors";
import type { Rarity } from "../../types/game";

export type RarityFilterKey = "all" | Rarity;

const CATEGORY_LABEL_KEY: Record<RarityFilterKey, string> = {
  all: "loadoutSheet.categories.all",
  common: "loadoutSheet.categories.normal",
  rare: "loadoutSheet.categories.rare",
  epic: "loadoutSheet.categories.epic",
  special: "loadoutSheet.categories.special",
  legendary: "loadoutSheet.categories.legendary",
};

const ALL_CHIP_COLOR = "rgba(232,232,226,.6)";

interface RarityFilterChipsProps {
  value: RarityFilterKey;
  onChange: (key: RarityFilterKey) => void;
}

/**
 * "All + one chip per rarity" filter — the same pattern LoadoutSheet's category chips
 * use (reusing its exact `loadoutSheet.categories.*` labels), extracted here so the
 * Recommender's offer picker (a second, much larger ~180-item grid with no kind split
 * to narrow it down) can filter the same way instead of only ever scrolling.
 */
export function RarityFilterChips({ value, onChange }: RarityFilterChipsProps) {
  const { t } = useTranslation("translation");
  const keys: RarityFilterKey[] = ["all", ...RARITY_ORDER];
  return (
    <div className="px-4 pb-2.5 flex-none flex flex-wrap justify-center gap-1.5">
      {keys.map((key) => {
        const active = key === value;
        const color = key === "all" ? ALL_CHIP_COLOR : RARITY_RING[key];
        return (
          <FilterChip key={key} active={active} color={color} activeText="#fff" onClick={() => onChange(key)} className="flex-none py-[5px] px-2.5 text-[0.72rem]">
            {t(CATEGORY_LABEL_KEY[key])}
          </FilterChip>
        );
      })}
    </div>
  );
}
