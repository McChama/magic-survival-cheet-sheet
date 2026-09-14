import { useState } from "react";
import { useTranslation } from "react-i18next";
import { rem } from "../../config/rem";
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
  if (failed) return <span style={{ color: "rgba(232,232,226,.4)", fontSize: rem(20) }}>?</span>;
  return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setFailed(true)} />;
}

export function RunDashboardScreen({ onChangeClass }: RunDashboardScreenProps) {
  const { t } = useTranslation();
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
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#050506" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 130px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(42), fontWeight: 700, lineHeight: 1, color: "#e8e8e2" }}>
              {subjectLabel}
            </div>
            <div style={{ fontSize: rem(14), color: "rgba(232,232,226,.5)", marginTop: -2 }}>{classLabel}</div>
          </div>
          <button
            type="button"
            onClick={onChangeClass}
            aria-label={t("dashboard.changeClassAria")}
            style={{ width: 44, height: 44, background: "none", border: "none", color: "#fff", fontSize: rem(26), cursor: "pointer", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif" }}
          >
            ⚙
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <CounterField text={t("dashboard.currentLevel", { level: run.currentLevel })} color="#efc84f" value={run.currentLevel} onChange={setCurrentLevel} fontSize={19} />
          <CounterField text={t("dashboard.enemiesKilled", { count: run.enemiesKilled })} color="#f0975a" value={run.enemiesKilled} onChange={setEnemiesKilled} fontSize={17} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginTop: 24, fontSize: rem(18) }}>
          {DASHBOARD_STAT_LAYOUT.map((key, index) => {
            if (key) return <StatGridRow key={key} statKey={key} run={run} />;
            const rowPartnerIndex = index % 2 === 0 ? index + 1 : index - 1;
            const isSpacerRow = DASHBOARD_STAT_LAYOUT[rowPartnerIndex] === null;
            return <div key={`gap-${index}`} style={isSpacerRow ? { height: 16 } : undefined} />;
          })}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: rem(17), color: "rgba(232,232,226,.55)", letterSpacing: 1.5, textTransform: "uppercase" }}>{t("dashboard.loadout")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12, minHeight: 54 }}>
            {equippedItems.map((item, index) => {
              const label = gt(`item.${item.id}.name`, item.name);
              return (
                <div
                  key={item.id + index}
                  className="animate-ms-pop"
                  title={label}
                  style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#2a1b1b" }}
                >
                  {item.image ? (
                    <img src={item.image} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "rgba(232,232,226,.4)", fontSize: rem(20) }}>?</span>
                  )}
                </div>
              );
            })}
            {acquiredMagics.map((magic) => {
              const label = gt(`magic.${magic.id}.name`, magic.name);
              return (
                <div
                  key={magic.id}
                  className="animate-ms-pop"
                  title={label}
                  style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b2a3a" }}
                >
                  <MagicIcon src={baseMagicSpriteUrl(magic.id)} alt={label} />
                </div>
              );
            })}
            {!hasLoadout && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", fontSize: rem(15), color: "rgba(232,232,226,.3)" }}>
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
