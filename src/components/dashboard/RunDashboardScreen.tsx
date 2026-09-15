import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DASHBOARD_STAT_LAYOUT } from "../../data/statGlyphs";
import { BASE_MAGIC_BY_ID, baseMagicSpriteUrl } from "../../data/magics";
import { getEquippedItems } from "../../engine/tierAdaptive";
import { useRunStore } from "../../store/useRunStore";
import { slug as gameDataSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { LoadoutFab } from "../layout/LoadoutFab";
import { CounterField } from "./CounterField";
import { StatGridRow } from "./StatGridRow";

interface RunDashboardScreenProps {
  onChangeClass: () => void;
}

/** Base magics have no real sprite yet (see reference/game-data-sources.md); fall back to "?" on load error instead of a broken image. */
function MagicIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[#e8e8e2]/40 text-[1rem]">?</span>;
  return <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} />;
}

export function RunDashboardScreen({ onChangeClass }: RunDashboardScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const setCurrentLevel = useRunStore((s) => s.setCurrentLevel);
  const setEnemiesKilled = useRunStore((s) => s.setEnemiesKilled);

  const equippedItems = getEquippedItems(run);
  const acquiredMagics = run.acquiredMagicIds.map((id) => BASE_MAGIC_BY_ID[id]).filter(Boolean);
  const hasLoadout = equippedItems.length > 0 || acquiredMagics.length > 0;
  const subjectLabel = run.meta.subject ? gt(`subject.${gameDataSlug(run.meta.subject)}.name`, run.meta.subject) : null;
  const classLabel = run.meta.characterClass ? gt(`class.${gameDataSlug(run.meta.characterClass)}.name`, run.meta.characterClass) : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <div className="flex-1 overflow-y-auto pt-[18px] px-5 pb-[130px]">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-magic text-[2.1rem] font-bold leading-none text-[#e8e8e2]">
              {subjectLabel}
            </div>
            <div className="text-[0.7rem] text-[#e8e8e2]/50 -mt-0.5">{classLabel}</div>
          </div>
          <button
            type="button"
            onClick={onChangeClass}
            aria-label={t("dashboard.changeClassAria")}
            className="w-11 h-11 bg-transparent border-none text-white text-[1.3rem] cursor-pointer font-magic"
          >
            ⚙
          </button>
        </div>

        <div className="text-center mt-[18px] flex flex-col gap-2 items-center">
          <CounterField text={t("dashboard.currentLevel", { level: run.currentLevel })} color="#efc84f" value={run.currentLevel} onChange={setCurrentLevel} fontSize={19} />
          <CounterField text={t("dashboard.enemiesKilled", { count: run.enemiesKilled })} color="#f0975a" value={run.enemiesKilled} onChange={setEnemiesKilled} fontSize={17} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-6 text-[0.9rem]">
          {DASHBOARD_STAT_LAYOUT.map((key, index) => {
            if (key) return <StatGridRow key={key} statKey={key} run={run} />;
            const rowPartnerIndex = index % 2 === 0 ? index + 1 : index - 1;
            const isSpacerRow = DASHBOARD_STAT_LAYOUT[rowPartnerIndex] === null;
            return <div key={`gap-${index}`} className={isSpacerRow ? "h-4" : undefined} />;
          })}
        </div>

        <div className="mt-7">
          <div className="text-[0.85rem] text-[#e8e8e2]/55 tracking-[1.5px] uppercase">{t("dashboard.loadout")}</div>
          <div className="flex flex-wrap gap-2.5 mt-3 min-h-[54px]">
            {equippedItems.map((item, index) => {
              const label = gt(`item.${item.id}.name`, item.name);
              return (
                <div
                  key={item.id + index}
                  className="animate-ms-pop w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center bg-[#2a1b1b]"
                  title={label}
                >
                  {item.image ? (
                    <img src={item.image} alt={label} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#e8e8e2]/40 text-[1rem]">?</span>
                  )}
                </div>
              );
            })}
            {acquiredMagics.map((magic) => {
              const label = gt(`magic.${magic.id}.name`, magic.name);
              return (
                <div
                  key={magic.id}
                  className="animate-ms-pop w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center bg-[#1b2a3a]"
                  title={label}
                >
                  <MagicIcon src={baseMagicSpriteUrl(magic.id)} alt={label} />
                </div>
              );
            })}
            {!hasLoadout && (
              <div className="flex-1 flex items-center text-[0.75rem] text-[#e8e8e2]/30">
                {t("dashboard.emptyLoadout")}
              </div>
            )}
          </div>
        </div>
      </div>

      <LoadoutFab />
    </div>
  );
}
