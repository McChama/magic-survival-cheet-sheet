import { useTranslation } from "react-i18next";
import { classImage, uiImage } from "../../config/assets";
import { CLASS_LEVEL_TINT_CLASS, CLASS_SELECTED_TINT_CLASS } from "../../config/classLevelColors";
import { CLASSES, getClassLevel } from "../../data/classes";
import { useRunStore } from "../../store/useRunStore";
import { slug as classSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ScreenFooter } from "../shared/ScreenFooter";
import { ClassBonusDetail, CLASS_LEVEL_COUNT } from "../shared/ClassBonusDetail";
import { MaskedSprite } from "../shared/MaskedSprite";
import { PipDot } from "../shared/PipDot";

interface ClassSelectScreenProps {
  onClose: () => void;
  onContinue: () => void;
}

export function ClassSelectScreen({ onClose, onContinue }: ClassSelectScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const characterClass = useRunStore((s) => s.run.meta.characterClass);
  const classLevels = useRunStore((s) => s.run.meta.classLevels);
  const setCharacterClass = useRunStore((s) => s.setCharacterClass);
  const setClassLevel = useRunStore((s) => s.setClassLevel);
  const characterClassLabel = characterClass ? gt(`class.${classSlug(characterClass)}.name`, characterClass) : null;

  // Each class tracks its own level independently (see `RunMeta.classLevels`'s doc comment) —
  // this reads whichever class is currently being viewed/selected, defaulting to 1.
  const characterClassLevel = characterClass ? getClassLevel(classLevels, characterClass) : 1;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("classSelect.closeAria")} />
      <ScreenTitle>{characterClassLabel ?? t("classSelect.selectClassHeading")}</ScreenTitle>

      <div className="flex-none px-[18px]">
        {characterClass && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={characterClassLevel <= 1}
              onClick={() => setClassLevel(characterClass, characterClassLevel - 1)}
              aria-label={t("classSelect.levelDownAria")}
              className="w-3 h-3 bg-transparent border-none p-0 cursor-pointer disabled:opacity-25 disabled:cursor-default"
            >
              <img src={uiImage("icons/UI_AreaMove_L.png")} alt="" className="w-full h-full object-contain" />
            </button>

            <span className="flex gap-[6px] items-center">
              {Array.from({ length: CLASS_LEVEL_COUNT }, (_, i) => (
                <PipDot key={i} filled={i < characterClassLevel} size="w-[5.25px] h-[5.25px]" fill="bg-[#efe18a]" />
              ))}
            </span>

            <button
              type="button"
              disabled={characterClassLevel >= CLASS_LEVEL_COUNT}
              onClick={() => setClassLevel(characterClass, characterClassLevel + 1)}
              aria-label={t("classSelect.levelUpAria")}
              className="w-3 h-3 bg-transparent border-none p-0 cursor-pointer disabled:opacity-25 disabled:cursor-default"
            >
              <img src={uiImage("icons/UI_AreaMove_R.png")} alt="" className="w-full h-full object-contain" />
            </button>
          </div>
        )}

        {characterClass && <ClassBonusDetail className={characterClass} level={characterClassLevel} showHeader={false} />}
      </div>

      <div className="flex-1 min-h-0 px-6">
        <div className="flex flex-wrap justify-center content-evenly gap-x-4 h-full">
          {CLASSES.map((name) => {
            const isSelected = characterClass === name;
            const label = gt(`class.${classSlug(name)}.name`, name);
            // The picked class is plain white; the others show the color of their own level.
            const tintClass = isSelected ? CLASS_SELECTED_TINT_CLASS : CLASS_LEVEL_TINT_CLASS[getClassLevel(classLevels, name)];
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCharacterClass(name)}
                title={label}
                className={`relative bg-transparent border-none p-0 cursor-pointer flex items-center justify-center w-[calc((100%-4rem)/5)] aspect-square transition-transform duration-150 ${isSelected ? "scale-110" : "scale-100"}`}
              >
                <MaskedSprite src={classImage(`${classSlug(name)}.png`)} label={label} className={`block w-full h-full ${tintClass}`} />
              </button>
            );
          })}
        </div>
      </div>

      <ScreenFooter>
        <button
          type="button"
          disabled={!characterClass}
          onClick={onContinue}
          className={`w-full p-2.5 bg-transparent border-none text-white font-magic text-[1.7rem] cursor-pointer tracking-wide ${characterClass ? "opacity-100" : "opacity-40"}`}
        >
          {t("classSelect.selected")}
        </button>
      </ScreenFooter>
    </div>
  );
}
