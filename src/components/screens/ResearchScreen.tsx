import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  if (failed) return <span className="text-[#e8e8e2]/30 text-[0.7rem]">?</span>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function Pip({ filled, size, tone }: { filled: boolean; size: number; tone: string }) {
  return (
    <span
      className="rounded-full border border-[#e8e8e2]/45"
      style={{ width: size, height: size, background: filled ? tone : "transparent" }}
    />
  );
}

export function ResearchScreen({ onClose }: ResearchScreenProps) {
  const { t } = useTranslation("translation");
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
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <div className="pt-4 px-[18px] flex items-start justify-between flex-none">
        <div className="font-magic text-[1.7rem] text-white leading-none">{run.meta.researchPoints}</div>
        <button type="button" onClick={onClose} aria-label={t("research.closeAria")} className="w-11 h-11 bg-transparent border-none text-white text-[1.5rem] cursor-pointer font-magic">
          ✕
        </button>
      </div>

      {!selected ? (
        <div className="flex-none">
          <div className="text-center font-magic text-[2rem] -mt-1.5 text-[#e8e8e2]">{t("research.heading")}</div>
          <div className="text-center text-[0.95rem] text-[#e8e8e2]/85 mt-3.5">{t("research.selectResearch")}</div>
        </div>
      ) : (
        <div className="flex-none flex flex-col items-center gap-2.5">
          <div className="font-magic text-[2rem] -mt-1.5 text-[#e8e8e2]">{gt(`research.${selected.id}.name`, selected.name)}</div>
          <div className="flex gap-[5px] items-center">
            {Array.from({ length: selected.maxLevel }, (_, i) => (
              <Pip key={i} filled={i < selectedLevel} size={7} tone="#efe18a" />
            ))}
          </div>
          <div className="flex flex-col gap-1.5 items-center pt-1 px-5">
            <div className="text-[0.9rem] text-[#9be08a] text-center">{describeNode(selected.id, t, gt)}</div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-6 px-3.5 pb-[26px]">
        <div className="grid grid-cols-5 gap-x-1.5 gap-y-[26px]">
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
                className="bg-transparent border-none p-0 cursor-pointer flex flex-col items-center gap-2 font-[inherit]"
              >
                <span
                  className="w-[34px] h-[34px] rounded-full overflow-hidden flex items-center justify-center bg-[#0d0d10]"
                  style={{ border: `1px solid ${ring}` }}
                >
                  <NodeIcon src={node.image} alt={nodeLabel} />
                </span>
                <span className="flex gap-[3px] items-center">
                  {Array.from({ length: node.maxLevel }, (_, i) => (
                    <Pip key={i} filled={i < level} size={6} tone={isSelected ? "#fff" : "#efe18a"} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-none py-1.5 px-[18px] pb-[26px] text-center">
        {!selected ? (
          <button
            type="button"
            onClick={() => addResearchPoints(5)}
            className="bg-transparent border-none text-[#4ee06a] font-magic text-[1.6rem] cursor-pointer"
          >
            {t("research.purchasePoints")}
          </button>
        ) : (
          <div className="flex justify-around items-center">
            <button
              type="button"
              disabled={!canResearch}
              onClick={() => researchUp(selected.id)}
              className={`bg-transparent border-none font-magic text-[1.7rem] cursor-pointer ${canResearch ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
            >
              {t("research.researchBtn")}
            </button>
            <button
              type="button"
              disabled={!canRevert}
              onClick={() => researchDown(selected.id)}
              className={`bg-transparent border-none font-magic text-[1.7rem] cursor-pointer ${canRevert ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
            >
              {t("research.revertBtn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
