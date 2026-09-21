import { useTranslation } from "react-i18next";
import { FilterChip } from "./FilterChip";
import { DROP_CONTEXTS } from "../../data/dropProbability";
import type { DropContext } from "../../types/game";

const CONTEXT_LABEL_KEY: Record<DropContext, string> = {
  normalChest: "dropContext.normalChest",
  merchant: "dropContext.merchant",
  obelisk: "dropContext.obelisk",
  brokenObelisk: "dropContext.brokenObelisk",
  relicChest: "dropContext.relicChest",
};

interface DropContextPickerProps {
  value: DropContext;
  onChange: (context: DropContext) => void;
}

/** Shared pill context selector for the drop-probability calculator and the recommender
 *  screen — styled after LoadoutSheet's category chips, but with a single accent color
 *  since there's no natural per-context color the way rarity has one. */
export function DropContextPicker({ value, onChange }: DropContextPickerProps) {
  const { t } = useTranslation("translation");
  return (
    <div className="px-4 pb-2.5 flex-none flex gap-2 overflow-x-auto">
      {DROP_CONTEXTS.map((c) => {
        const active = c.id === value;
        return (
          <FilterChip key={c.id} active={active} color="#efc84f" activeText="#0d0d10" onClick={() => onChange(c.id)} className="flex-none py-[7px] px-3.5 text-[0.8rem]">
            {t(CONTEXT_LABEL_KEY[c.id])}
          </FilterChip>
        );
      })}
    </div>
  );
}
