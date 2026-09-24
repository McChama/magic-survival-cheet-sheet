import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DASHBOARD_STAT_LAYOUT } from "../../data/statGlyphs";
import { uiImage } from "../../config/assets";
import { getAvailableFusions } from "../../engine/magicCombination";
import { useRunStore } from "../../store/useRunStore";
import { slug as gameDataSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { LoadoutFab } from "../layout/LoadoutFab";
import { LoadoutSheet } from "../shared/LoadoutSheet";
import { MaskedSprite } from "../shared/MaskedSprite";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { NavIconButton } from "../shared/NavIconButton";
import { CounterField } from "./CounterField";
import { StatGridRow } from "./StatGridRow";
import type { QuickAddKind } from "../../data/quickAddOptions";

interface RunDashboardScreenProps {
  onChangeClass: () => void;
  onOpenRecommender: () => void;
  onOpenOwnedMagic: () => void;
  onOpenOwnedArtifact: () => void;
  onOpenSynergy: () => void;
  onOpenMagicCombination: () => void;
}

const NAV_BG = "#1b2a3a";

export function RunDashboardScreen({ onChangeClass, onOpenRecommender, onOpenOwnedMagic, onOpenOwnedArtifact, onOpenSynergy, onOpenMagicCombination }: RunDashboardScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const setCurrentLevel = useRunStore((s) => s.setCurrentLevel);
  const setEnemiesKilled = useRunStore((s) => s.setEnemiesKilled);
  // Owned by the Dashboard rather than `LoadoutFab` so the level-up star and the "+" menu's own "Magic" item open the
  // exact same Select Magic instance.
  const [activeSheet, setActiveSheet] = useState<Exclude<QuickAddKind, "passive"> | null>(null);
  // Which of the two ways Select Magic was opened: the star's level-up flow (isLevelUp), or the "+" menu's plain
  // catalog (not a level-up). Only meaningful while activeSheet === "magic".
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  const subjectLabel = gt(`subject.${gameDataSlug(run.meta.subject)}.name`, run.meta.subject);
  const classLabel = run.meta.characterClass ? gt(`class.${gameDataSlug(run.meta.characterClass)}.name`, run.meta.characterClass) : null;
  const combinationAvailable = getAvailableFusions(run).length > 0;

  /** The real level-up event is select-then-commit: this just opens Select Magic in level-up mode — Current Level
   *  itself only goes up once a row is actually picked there (`useLevelUpActions`), so pressing the star and
   *  reloading before picking anything leaves Current Level untouched. A level can never be spent on a magic/passive
   *  from anywhere else (`MagicPickList`'s rows are Select Magic's only levers), so a magic can never be leveled
   *  past `run.currentLevel`. */
  function levelUp() {
    setIsLevelingUp(true);
    setActiveSheet("magic");
  }

  function openMagicCatalog() {
    setIsLevelingUp(false);
    setActiveSheet("magic");
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onChangeClass} actionAria={t("dashboard.changeClassAria")} />
      <ScreenTitle>{subjectLabel}</ScreenTitle>
      <div className="flex-none text-center text-[0.7rem] text-[#e8e8e2]/50 -mt-1">{classLabel}</div>

      <div className="flex-1 min-h-0 flex flex-col justify-evenly px-5">
        <div className="text-center flex flex-col gap-2 items-center">
          <div data-magic-circle-anchor className="flex items-center gap-2">
            <CounterField text={t("dashboard.currentLevel", { level: run.currentLevel })} color="#efc84f" value={run.currentLevel} onChange={setCurrentLevel} fontSize={19} />
            <button
              type="button"
              onClick={levelUp}
              aria-label={t("dashboard.levelUpAria")}
              className="w-[0.8rem] h-[0.8rem] flex-none p-0 bg-transparent border-none cursor-pointer"
            >
              {/* The game's own X sprite turned 45° so it reads "+" (the same technique LoadoutFab's own "+" glyph
                  uses) — not the star `UI_Star01` a prior pass used here. Sized a bit under "Current Level"'s own
                  fontSize (19 design-px / 0.95rem, `rem()`'s own conversion — see `CounterField`) instead of a
                  generic icon-button size, since it sits right beside that text, not on its own row. Idle, it
                  throbs like a heartbeat, its tint sweeping from resting gold to the max-level green
                  (`animate-pulse-green`, index.css). */}
              <MaskedSprite src={uiImage("icons/UI_Exit.png")} tint="#efc84f" className="block w-full h-full rotate-45 motion-safe:animate-pulse-green" />
            </button>
          </div>
          <CounterField text={t("dashboard.enemiesKilled", { count: run.enemiesKilled })} color="#f0975a" value={run.enemiesKilled} onChange={setEnemiesKilled} fontSize={17} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-0 text-[0.9rem]">
          {DASHBOARD_STAT_LAYOUT.map((key, index) => {
            if (key) return <StatGridRow key={key} statKey={key} run={run} />;
            const rowPartnerIndex = index % 2 === 0 ? index + 1 : index - 1;
            const isSpacerRow = DASHBOARD_STAT_LAYOUT[rowPartnerIndex] === null;
            return <div key={`gap-${index}`} className={isSpacerRow ? "h-4" : undefined} />;
          })}
        </div>
      </div>

      <div className="flex-none flex flex-col items-center gap-3 pb-6 pt-2">
        <div className="flex items-center justify-center gap-5">
          <NavIconButton onClick={onOpenOwnedMagic} ariaLabel={t("dashboard.ownedMagicAria")} icon={uiImage("icons/UI_Icon007.png")} background={NAV_BG} />
          <NavIconButton onClick={onOpenOwnedArtifact} ariaLabel={t("dashboard.ownedArtifactAria")} icon={uiImage("icons/UI_Icon009.png")} background={NAV_BG} />
          <NavIconButton onClick={onOpenSynergy} ariaLabel={t("dashboard.synergyAria")} icon={uiImage("icons/UI_Icon010.png")} background={NAV_BG} />
          {/* The game's own Magic Combination heptagram (its icon with the black disc cut out, so it sits on the same chip as
              the others): plain white — masked, since the sprite's own baked-in colors are an olive/gray, not white —
              while no combination is available, its own red once one is (GlyphB's native color, left untinted). */}
          <NavIconButton
            onClick={onOpenMagicCombination}
            ariaLabel={t("dashboard.magicCombinationAria")}
            icon={uiImage(combinationAvailable ? "icons/UI_MagicCom_GlyphB.png" : "icons/UI_MagicCom_GlyphA.png")}
            background={NAV_BG}
            tint={combinationAvailable ? undefined : "#fff"}
          />
        </div>
        <LoadoutFab onOpenRecommender={onOpenRecommender} onOpenArtifact={() => setActiveSheet("artifact")} onOpenMagic={openMagicCatalog} />
      </div>

      {activeSheet && <LoadoutSheet kind={activeSheet} isLevelUp={activeSheet === "magic" && isLevelingUp} onClose={() => setActiveSheet(null)} />}
    </div>
  );
}
