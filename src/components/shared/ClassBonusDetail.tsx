import { useTranslation } from "react-i18next";
import { classImage } from "../../config/assets";
import { CLASS_LEVEL_TINT_CLASS } from "../../config/classLevelColors";
import { getAllClassLevelBonuses, getClassTooltip } from "../../data/classes";
import { slug as classSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { GameText } from "./GameText";
import { MaskedSprite } from "./MaskedSprite";
import { PipDot } from "./PipDot";

/** 5 selectable Class Levels — see `ClassSelectScreen`'s original comment on this constant
 *  (kept here now that both it and `OwnedMagicScreen`'s class-detail modal need it). */
export const CLASS_LEVEL_COUNT = 5;
const LOCKED_COLOR = "rgba(232,232,226,.3)";

interface ClassBonusDetailProps {
  className: string;
  level: number;
  /** ClassSelectScreen already shows the class's own name (ScreenTitle) and an
   *  interactive level stepper next to this block, so it opts out of the header to avoid
   *  showing the icon/name/pips twice — OwnedMagicScreen's read-only modal wants them. */
  showHeader?: boolean;
}

/**
 * The class's real tooltip + 4 gated bonus lines, shared by `ClassSelectScreen` (inline,
 * next to its own interactive level stepper) and `OwnedMagicScreen`'s tap-to-view modal
 * (the full self-contained card, icon/name/pips included) — see CLAUDE.md's Screen layout
 * structure section for why shared display components beat re-deriving this per screen.
 */
export function ClassBonusDetail({ className, level, showHeader = true }: ClassBonusDetailProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const slug = classSlug(className);
  const label = gt(`class.${slug}.name`, className);
  const tooltip = getClassTooltip(className);
  const allBonuses = getAllClassLevelBonuses(className);

  return (
    <div className="flex flex-col items-center text-center leading-tight gap-1.5">
      {showHeader && (
        <>
          <MaskedSprite src={classImage(`${slug}.png`)} label={label} className={`block w-16 h-16 ${CLASS_LEVEL_TINT_CLASS[level]}`} />
          <div className="font-magic text-[1.2rem] text-[#e8e8e2]">{label}</div>
          <span className="flex gap-[6px] items-center">
            {Array.from({ length: CLASS_LEVEL_COUNT }, (_, i) => (
              <PipDot key={i} filled={i < level} size="w-[5.25px] h-[5.25px]" fill="bg-[#efe18a]" />
            ))}
          </span>
        </>
      )}

      {tooltip && (
        <div className="font-magic text-[0.65rem] opacity-80">
          <GameText text={gt(`class.${slug}.tooltip`, tooltip.text)} color={tooltip.color} />
        </div>
      )}
      {allBonuses.length > 0 ? (
        <div className="flex flex-col items-center">
          {allBonuses.map((bonus, i) => {
            // Class Level 1 is free/baseline with 0 bonuses active — bonus[i] (the class's
            // Lv{i+2} bonus) unlocks once `level` reaches i+2. See CLASS_LEVEL_COUNT's
            // comment above for the source.
            const locked = i >= level - 1;
            return (
              <div key={i} className="font-magic text-[0.7rem]">
                <GameText
                  text={gt(`class.${slug}.level${i + 1}`, bonus.text)}
                  color={locked ? LOCKED_COLOR : bonus.color}
                  monochrome={locked}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="font-magic text-[0.7rem] text-[#7a7a75]">{t("classSelect.noBonusData")}</div>
      )}
    </div>
  );
}
