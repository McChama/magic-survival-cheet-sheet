import { useState } from "react";
import { useTranslation } from "react-i18next";
import { rem } from "../../config/rem";
import { RESEARCH, RESEARCH_BY_ID } from "../../data/research";
import { STAT_DEFINITIONS } from "../../data/statDefinitions";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import type { TFunction } from "i18next";

interface ResearchScreenProps {
  onClose: () => void;
}

function describeNode(id: string, t: TFunction, gt: (key: string, fallback: string) => string): string {
  const def = RESEARCH_BY_ID[id];
  if (!def.statKey) return t("research.noPauseMenuStat");
  const stat = STAT_DEFINITIONS[def.statKey];
  const statLabel = gt(`stat.${def.statKey}.label`, stat.label);
  const step = def.valuesByLevel[1] - def.valuesByLevel[0];
  return t("research.increaseStat", { stat: statLabel, step, unit: stat.unit === "%" ? "%" : "" });
}

/** `image` is always a truthy URL (never optional), so a missing sprite 404s instead of failing a truthiness check — fall back to "?" on load error. */
function NodeIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={{ color: "rgba(232,232,226,.3)", fontSize: rem(14) }}>?</span>;
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
}

function Pip({ filled, size, tone }: { filled: boolean; size: number; tone: string }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1px solid rgba(232,232,226,.45)",
        background: filled ? tone : "transparent",
      }}
    />
  );
}

export function ResearchScreen({ onClose }: ResearchScreenProps) {
  const { t } = useTranslation();
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const addResearchPoints = useRunStore((s) => s.addResearchPoints);
  const researchUp = useRunStore((s) => s.researchUp);
  const researchDown = useRunStore((s) => s.researchDown);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? RESEARCH_BY_ID[selectedId] : null;
  const selectedLevel = selectedId ? (run.researchLevels[selectedId] ?? 0) : 0;

  const canResearch = !!selected && run.meta.researchPoints > 0 && selectedLevel < selected.maxLevel;
  const canRevert = selectedLevel > 0;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#050506" }}>
      <div style={{ padding: "16px 18px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flex: "none" }}>
        <div style={{ fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(34), color: "#fff", lineHeight: 1 }}>{run.meta.researchPoints}</div>
        <button type="button" onClick={onClose} aria-label={t("research.closeAria")} style={{ width: 44, height: 44, background: "none", border: "none", color: "#fff", fontSize: rem(30), cursor: "pointer", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif" }}>
          ✕
        </button>
      </div>

      {!selected ? (
        <div style={{ flex: "none" }}>
          <div style={{ textAlign: "center", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(40), marginTop: -6, color: "#e8e8e2" }}>{t("research.heading")}</div>
          <div style={{ textAlign: "center", fontSize: rem(19), color: "rgba(232,232,226,.85)", marginTop: 14 }}>{t("research.selectResearch")}</div>
        </div>
      ) : (
        <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(40), marginTop: -6, color: "#e8e8e2" }}>{gt(`research.${selected.id}.name`, selected.name)}</div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {Array.from({ length: selected.maxLevel }, (_, i) => (
              <Pip key={i} filled={i < selectedLevel} size={7} tone="#efe18a" />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", padding: "4px 20px 0" }}>
            <div style={{ fontSize: rem(18), color: "#9be08a", textAlign: "center" }}>{describeNode(selected.id, t, gt)}</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 14px 26px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "26px 6px" }}>
          {RESEARCH.map((node) => {
            const level = run.researchLevels[node.id] ?? 0;
            const isSelected = selectedId === node.id;
            const ring = isSelected ? "#ffffff" : level > 0 ? "#efe18a" : "rgba(232,232,226,.3)";
            const nodeLabel = gt(`research.${node.id}.name`, node.name);
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                title={nodeLabel}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: "inherit" }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: `1px solid ${ring}`,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#0d0d10",
                  }}
                >
                  <NodeIcon src={node.image} alt={nodeLabel} />
                </span>
                <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {Array.from({ length: node.maxLevel }, (_, i) => (
                    <Pip key={i} filled={i < level} size={6} tone={isSelected ? "#fff" : "#efe18a"} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: "none", padding: "6px 18px 26px", textAlign: "center" }}>
        {!selected ? (
          <button
            type="button"
            onClick={() => addResearchPoints(5)}
            style={{ background: "none", border: "none", color: "#4ee06a", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(32), cursor: "pointer" }}
          >
            {t("research.purchasePoints")}
          </button>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            <button
              type="button"
              disabled={!canResearch}
              onClick={() => researchUp(selected.id)}
              style={{ background: "none", border: "none", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(34), cursor: "pointer", color: canResearch ? "#e8e8e2" : "rgba(232,232,226,.3)" }}
            >
              {t("research.researchBtn")}
            </button>
            <button
              type="button"
              disabled={!canRevert}
              onClick={() => researchDown(selected.id)}
              style={{ background: "none", border: "none", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(34), cursor: "pointer", color: canRevert ? "#e8e8e2" : "rgba(232,232,226,.3)" }}
            >
              {t("research.revertBtn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
