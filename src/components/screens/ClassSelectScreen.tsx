import { useTranslation } from "react-i18next";
import { classImage } from "../../config/assets";
import { CLASSES } from "../../data/classes";
import { useRunStore } from "../../store/useRunStore";
import { slug as classSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";

interface ClassSelectScreenProps {
  onClose: () => void;
  onContinue: () => void;
}

export function ClassSelectScreen({ onClose, onContinue }: ClassSelectScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const characterClass = useRunStore((s) => s.run.meta.characterClass);
  const setCharacterClass = useRunStore((s) => s.setCharacterClass);
  const characterClassLabel = characterClass ? gt(`class.${classSlug(characterClass)}.name`, characterClass) : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <div className="p-3.5 pb-1 flex items-start justify-end flex-none">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("classSelect.closeAria")}
          className="w-11 h-11 bg-transparent border-none text-white text-[1.4rem] font-magic cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-[150px]">
        <div className="text-center font-magic text-[2rem] text-[#e8e8e2]">
          {characterClassLabel ?? t("classSelect.selectClassHeading")}
        </div>
        <div className="h-3.5" />

        <div className="grid grid-cols-5 gap-x-2 gap-y-[22px] mt-[26px]">
          {CLASSES.map((name) => {
            const isSelected = characterClass === name;
            const label = gt(`class.${classSlug(name)}.name`, name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCharacterClass(name)}
                title={label}
                className="relative bg-transparent border-none p-0 cursor-pointer flex items-center justify-center h-[62px]"
              >
                <div
                  className="w-[46px] h-[46px] flex items-center justify-center rounded-full overflow-hidden bg-white/[.06]"
                  style={{ boxShadow: isSelected ? "0 0 0 2px #efc84f" : "none" }}
                >
                  <img
                    src={classImage(`${classSlug(name)}.png`)}
                    alt={label}
                    className="w-full h-full object-contain"
                    style={{ opacity: isSelected ? 1 : 0.75 }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-0 py-4 px-[18px] pb-[26px] bg-[linear-gradient(180deg,rgba(5,5,6,0),#050506_30%)]">
        <button
          type="button"
          disabled={!characterClass}
          onClick={onContinue}
          className="w-full p-2.5 bg-transparent border-none text-white font-magic text-[1.7rem] cursor-pointer tracking-wide"
          style={{ opacity: characterClass ? 1 : 0.4 }}
        >
          {t("classSelect.selected")}
        </button>
      </div>
    </div>
  );
}
