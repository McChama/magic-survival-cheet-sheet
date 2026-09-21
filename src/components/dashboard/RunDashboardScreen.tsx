import { useTranslation } from "react-i18next";
import { DASHBOARD_STAT_LAYOUT } from "../../data/statGlyphs";
import { uiImage } from "../../config/assets";
import { useRunStore } from "../../store/useRunStore";
import { slug as gameDataSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { LoadoutFab } from "../layout/LoadoutFab";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { NavIconButton } from "../shared/NavIconButton";
import { CounterField } from "./CounterField";
import { StatGridRow } from "./StatGridRow";

interface RunDashboardScreenProps {
  onChangeClass: () => void;
  onOpenRecommender: () => void;
  onOpenOwnedMagic: () => void;
  onOpenOwnedArtifact: () => void;
  onOpenSynergy: () => void;
}

const NAV_BG = "#1b2a3a";

export function RunDashboardScreen({ onChangeClass, onOpenRecommender, onOpenOwnedMagic, onOpenOwnedArtifact, onOpenSynergy }: RunDashboardScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const setCurrentLevel = useRunStore((s) => s.setCurrentLevel);
  const setEnemiesKilled = useRunStore((s) => s.setEnemiesKilled);

  const subjectLabel = gt(`subject.${gameDataSlug(run.meta.subject)}.name`, run.meta.subject);
  const classLabel = run.meta.characterClass ? gt(`class.${gameDataSlug(run.meta.characterClass)}.name`, run.meta.characterClass) : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onChangeClass} actionAria={t("dashboard.changeClassAria")} />
      <ScreenTitle>{subjectLabel}</ScreenTitle>
      <div className="flex-none text-center text-[0.7rem] text-[#e8e8e2]/50 -mt-1">{classLabel}</div>

      <div className="flex-1 min-h-0 flex flex-col justify-evenly px-5">
        <div className="text-center flex flex-col gap-2 items-center">
          <div data-magic-circle-anchor>
            <CounterField text={t("dashboard.currentLevel", { level: run.currentLevel })} color="#efc84f" value={run.currentLevel} onChange={setCurrentLevel} fontSize={19} />
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

      <div className="flex-none flex items-center justify-center gap-5 pb-6 pt-2">
        <NavIconButton onClick={onOpenOwnedMagic} ariaLabel={t("dashboard.ownedMagicAria")} icon={uiImage("icons/UI_Icon007.png")} background={NAV_BG} />
        <NavIconButton onClick={onOpenOwnedArtifact} ariaLabel={t("dashboard.ownedArtifactAria")} icon={uiImage("icons/UI_Icon009.png")} background={NAV_BG} />
        <NavIconButton onClick={onOpenSynergy} ariaLabel={t("dashboard.synergyAria")} icon={uiImage("icons/UI_Icon010.png")} background={NAV_BG} />
        <LoadoutFab onOpenRecommender={onOpenRecommender} />
      </div>
    </div>
  );
}
