import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";

interface LevelControlsProps {
  level: number;
  min: number;
  max: number;
  onChange: (level: number) => void;
}

/** "‹ Lv 5 ›": a magic's or passive's level in the gold the game uses, with the same arrows as everywhere else in the app. */
export function LevelControls({ level, min, max, onChange }: LevelControlsProps) {
  const { t } = useTranslation("translation");
  function step(event: MouseEvent, delta: number) {
    event.stopPropagation();
    onChange(level + delta);
  }
  return (
    <span className="flex items-center gap-1 text-[#efc84f] text-[1.05rem]">
      <button
        type="button"
        disabled={level <= min}
        onClick={(e) => step(e, -1)}
        aria-label={t("ownedMagic.levelDownAria")}
        className="w-7 h-7 p-1.5 bg-transparent border-none cursor-pointer disabled:opacity-25 disabled:cursor-default"
      >
        <img src={uiImage("icons/UI_AreaMove_L.png")} alt="" className="w-full h-full object-contain" />
      </button>
      <span className="min-w-[3.4ch] text-center">{t("ownedMagic.levelBadge", { level })}</span>
      <button
        type="button"
        disabled={level >= max}
        onClick={(e) => step(e, 1)}
        aria-label={t("ownedMagic.levelUpAria")}
        className="w-7 h-7 p-1.5 bg-transparent border-none cursor-pointer disabled:opacity-25 disabled:cursor-default"
      >
        <img src={uiImage("icons/UI_AreaMove_R.png")} alt="" className="w-full h-full object-contain" />
      </button>
    </span>
  );
}
