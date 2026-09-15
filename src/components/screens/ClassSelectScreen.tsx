import { useTranslation } from "react-i18next";
import { classImage, uiImage } from "../../config/assets";
import { CLASSES, getAllClassLevelBonuses, getClassLevel, getClassTooltip } from "../../data/classes";
import { useRunStore } from "../../store/useRunStore";
import { slug as classSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ScreenFooter } from "../shared/ScreenFooter";
import { GameText } from "../shared/GameText";

// 5 selectable Class Levels (1-5), confirmed via https://magic-survival-rpg.fandom.com/wiki/Classes
// (2026-09-15): "Each class requires 45 Research Material to unlock (3 for Lv2, 6 for Lv3,
// 12 for Lv4, 24 for Lv5)... Once acquired, the Lv5 bonus is permanent". Level 1 is a free
// baseline (just "selected", 0 of the class's 4 bonuses active) — CLASS_BONUSES only has 4
// entries (its Lv2-Lv5 bonuses) for exactly this reason. See RunMeta.classLevels's doc
// comment (each class levels independently) and reference/game-data-sources.md's "Class
// level progression" section.
const CLASS_LEVEL_COUNT = 5;
const LOCKED_COLOR = "rgba(232,232,226,.3)";

/**
 * Each class's own icon tint tracks its own Class Level (1-5, via `getClassLevel`) — not
 * whether it's the one currently highlighted in the grid (that's conveyed by `opacity`
 * instead, kept as a separate dimension so leveling a class doesn't erase the "which one am
 * I looking at" cue). Levels 2-4 reuse the exact in-game hex colors `CLASS_BONUSES`' own
 * lines already carry (green/celeste/pink — see `classes.ts`), so this palette isn't
 * invented; Level 5 is deliberately a more saturated gold than the pale `#efe18a` used
 * elsewhere for "has progress"/pip-fill, since Level 5 needs to read as a distinct, stronger
 * tier rather than reusing that same lighter yellow.
 */
const CLASS_LEVEL_TINTS: Record<number, string> = {
  1: "#ffffff",
  2: "#64FF32",
  3: "#6EDCFF",
  4: "#FF76DE",
  5: "rgb(238, 204, 24)",
};

function Pip({ filled }: { filled: boolean }) {
  return (
    <span
      className="w-[5.25px] h-[5.25px] rounded-full border border-[#e8e8e2]/45"
      style={{ background: filled ? "#efe18a" : "transparent" }}
    />
  );
}

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

  const classSlugForSelected = characterClass ? classSlug(characterClass) : null;
  const allBonuses = characterClass ? getAllClassLevelBonuses(characterClass) : [];
  const tooltip = characterClass ? getClassTooltip(characterClass) : null;

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
                <Pip key={i} filled={i < characterClassLevel} />
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

        {characterClass && classSlugForSelected && (
          <div className="flex flex-col items-center text-center leading-tight gap-1.5">
            {tooltip && (
              <div className="font-magic text-[0.65rem] opacity-80">
                <GameText text={gt(`class.${classSlugForSelected}.tooltip`, tooltip.text)} color={tooltip.color} />
              </div>
            )}
            {allBonuses.length > 0 ? (
              <div className="flex flex-col items-center">
                {allBonuses.map((bonus, i) => {
                  // Class Level 1 is free/baseline with 0 bonuses active — bonus[i] (the
                  // class's Lv{i+2} bonus) unlocks once characterClassLevel reaches i+2.
                  // See CLASS_LEVEL_COUNT's comment above for the source.
                  const locked = i >= characterClassLevel - 1;
                  return (
                    <div key={i} className="font-magic text-[0.7rem]">
                      <GameText
                        text={gt(`class.${classSlugForSelected}.level${i + 1}`, bonus.text)}
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
        )}
      </div>

      <div className="flex-1 min-h-0 px-6">
        <div className="flex flex-wrap justify-center content-evenly gap-x-4 h-full">
          {CLASSES.map((name) => {
            const isSelected = characterClass === name;
            const label = gt(`class.${classSlug(name)}.name`, name);
            const tint = CLASS_LEVEL_TINTS[getClassLevel(classLevels, name)];
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCharacterClass(name)}
                title={label}
                className={`relative bg-transparent border-none p-0 cursor-pointer flex items-center justify-center w-[calc((100%-4rem)/5)] aspect-square transition-transform duration-150 ${isSelected ? "scale-110" : "scale-100"}`}
              >
                <span
                  role="img"
                  aria-label={label}
                  className="block w-full h-full"
                  style={{
                    backgroundColor: tint,
                    WebkitMaskImage: `url(${classImage(`${classSlug(name)}.png`)})`,
                    maskImage: `url(${classImage(`${classSlug(name)}.png`)})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    opacity: isSelected ? 1 : 0.75,
                  }}
                />
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
          className="w-full p-2.5 bg-transparent border-none text-white font-magic text-[1.7rem] cursor-pointer tracking-wide"
          style={{ opacity: characterClass ? 1 : 0.4 }}
        >
          {t("classSelect.selected")}
        </button>
      </ScreenFooter>
    </div>
  );
}
