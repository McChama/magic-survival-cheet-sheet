import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ENCHANT_GRID_ROWS, ENCHANT_LINE_COLOR, ENCHANTABLE_MAGIC_IDS } from "../../data/enchant";
import { BASE_MAGIC_BY_ID, baseMagicSpriteUrl } from "../../data/magics";
import { enchantEffectText } from "../../engine/enchant";
import { useLevelUpActions } from "../../hooks/useLevelUpActions";
import { useGameDataText } from "../../i18n/useGameDataText";
import { useRunStore } from "../../store/useRunStore";
import { GameText } from "./GameText";
import { MaskedMagicIcon } from "./GridCard";
import { ScreenFooter } from "./ScreenFooter";
import { ScreenHeader } from "./ScreenHeader";
import { ScreenTitle } from "./ScreenTitle";

/** The attack magics in the game's own rows (4, 4, 4, 3, 2). */
const ROWS: string[][] = [];
{
  let start = 0;
  for (const size of ENCHANT_GRID_ROWS) {
    ROWS.push(ENCHANTABLE_MAGIC_IDS.slice(start, start + size));
    start += size;
  }
}

interface EnchantSelectProps {
  /** Back to the Select Magic list, without committing anything. */
  onBack: () => void;
  /** A magic was enchanted — closes the whole "+" sheet, same as any other Select Magic commit. */
  onEnchanted: () => void;
  /** Passed straight through to `useLevelUpActions` — true only when reached from the Dashboard's level-up flow. */
  isLevelUp: boolean;
}

/**
 * The game's own "Choose the Magic to strengthen" screen, reached from Select Magic's Enchant row: every attack
 * magic — owned or not — as a dark tile on the screen's dark brown (both colors sampled off the real screen), in the
 * game's rows. Tapping one lights its tile and shows its name and what the Enchant gives it (`enchantEffectText`),
 * where the prompt was; the game's "Selected" button then commits it — and, in level-up mode, the level with it
 * (`useLevelUpActions`). Nothing is committed before that, so the X simply goes back.
 */
export function EnchantSelect({ onBack, onEnchanted, isLevelUp }: EnchantSelectProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const { enchantMagic } = useLevelUpActions(isLevelUp);
  const [selected, setSelected] = useState<string | null>(null);

  const nameOf = (magicId: string) => gt(`magic.${magicId}.name`, BASE_MAGIC_BY_ID[magicId]?.name ?? magicId);
  const effect = selected ? enchantEffectText(selected, run) : undefined;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#1d1916]">
      <ScreenHeader onAction={onBack} actionAria={t("enchant.backAria")} />
      <ScreenTitle>{t("enchant.name")}</ScreenTitle>

      {/* A fixed height, so the grid under it is the same size whichever magic is selected. */}
      <div className="flex-none h-[3.9rem] px-4 flex flex-col items-center justify-center gap-0.5 text-center overflow-hidden">
        {selected ? (
          <>
            <div className="font-magic text-[1.1rem] leading-tight text-white">{nameOf(selected)}</div>
            {effect && <GameText text={effect} color={ENCHANT_LINE_COLOR} className="text-descriptive" />}
          </>
        ) : (
          <div className="text-[0.85rem] text-[#e8e8e2]">{t("enchant.prompt")}</div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-evenly px-4 py-2 gap-2">
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex-1 min-h-0 flex justify-center items-center gap-2">
            {row.map((magicId) => {
              const isSelected = magicId === selected;
              const name = nameOf(magicId);
              return (
                <button
                  key={magicId}
                  type="button"
                  title={name}
                  aria-label={name}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(magicId)}
                  className={`h-full aspect-[159/232] max-w-full min-w-0 p-0 border-none cursor-pointer flex items-center justify-center transition-transform duration-150 ${isSelected ? "bg-[#252422] scale-110 z-10" : "bg-[#121110] scale-100"}`}
                >
                  <span className="w-[58%] aspect-square flex items-center justify-center">
                    <MaskedMagicIcon src={baseMagicSpriteUrl(magicId)} alt="" full />
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <ScreenFooter>
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            enchantMagic(selected);
            onEnchanted();
          }}
          className={`bg-transparent border-none font-magic text-[1.6rem] cursor-pointer ${selected ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
        >
          {t("enchant.confirmBtn")}
        </button>
      </ScreenFooter>
    </div>
  );
}
