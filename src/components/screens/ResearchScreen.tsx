import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RESEARCH, RESEARCH_BY_ID, describeResearchNode } from "../../data/research";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ScreenFooter } from "../shared/ScreenFooter";
import { GameText } from "../shared/GameText";
import type { ResearchDefinition } from "../../types/game";

interface ResearchScreenProps {
  onClose: () => void;
}

/** Chunked to mirror the in-game research tree's own row groupings (5/5/4/4/4 — the last
 *  row's 4 nodes vary in maxLevel from 3 to 6, unlike the other rows) so the grid can be
 *  sized to always fit without scrolling — see Subject Select's SUBJECT_ROWS for the same
 *  row-sizing pattern applied to a uniform row size. */
const RESEARCH_ROW_SIZES = [5, 5, 4, 4, 4];
const RESEARCH_ROW_COLUMNS = 5;
const RESEARCH_ROW_GAP_REM = 0.375; // matches gap-x-1.5 below — kept in sync for the width calc

function chunkResearch(items: ResearchDefinition[], sizes: number[]): ResearchDefinition[][] {
  const rows: ResearchDefinition[][] = [];
  let i = 0;
  for (const size of sizes) {
    rows.push(items.slice(i, i + size));
    i += size;
  }
  return rows;
}

const RESEARCH_ROWS = chunkResearch(RESEARCH, RESEARCH_ROW_SIZES);

/**
 * The node's real in-game description at `level`, localized-template-then-substituted:
 * `gt()` looks up a translated template (falling back to the extracted English one), *then*
 * the `□` placeholder(s) are filled in with the current level's real value(s) — see
 * `describeResearchNode` in `data/research.ts` for where this template/color pair and the
 * substitution logic come from (replaced an app-generated "Increase {stat} by {step}%"
 * sentence that didn't match the game's own wording, and was blank for 9 nodes entirely).
 */
function describeNode(def: ResearchDefinition, level: number, gt: (key: string, fallback: string) => string) {
  const template = gt(`research.${def.id}.description`, def.descriptionTemplate);
  return describeResearchNode({ ...def, descriptionTemplate: template }, level);
}

/**
 * Grey when unresearched, gold when it has points but isn't the one being viewed, white
 * when it is — same 3-state convention Class Select's icon tinting uses (see its
 * `isSelected ? "#efe18a" : ...` mask-color ternary), so "has progress" and "currently
 * viewing" never collide into one ambiguous color.
 */
function nodeTint(level: number, isSelected: boolean): string {
  if (isSelected) return "#ffffff";
  if (level > 0) return "#efe18a";
  return "rgba(232,232,226,.35)";
}

/**
 * Real in-game sprite, shown at full bleed with no circular frame (matches Class Select's
 * icons) and recolored via CSS mask to `tint` instead of shown in its native color — the
 * source PNGs are flat-color silhouettes (e.g. the passive-reused ones are solid green), so
 * masking is how the same asset can read as grey/gold/white for the unresearched/has-
 * progress/selected states without needing 3 separately-colored exports.
 *
 * `image` is always a truthy URL (never optional), so a missing sprite 404s instead of
 * failing a truthiness check — a hidden probe `<img>` (not the visible element, since a
 * CSS `mask-image` never fires `onerror`) falls back to a tinted "?" glyph on load failure.
 * 13 of the 22 nodes still 404 this way — no real research-tree sprite sheet has been
 * extracted for them yet, only the 9 that double as an in-run passive icon are real (see
 * the sourcing note at the top of `data/research.ts`).
 */
function NodeIcon({ src, alt, tint }: { src: string; alt: string; tint: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="text-[0.7rem]" style={{ color: tint }}>
        ?
      </span>
    );
  }
  return (
    <>
      <img src={src} alt="" className="hidden" onError={() => setFailed(true)} />
      <span
        role="img"
        aria-label={alt}
        className="block w-full h-full"
        style={{
          backgroundColor: tint,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </>
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
  const researchUp = useRunStore((s) => s.researchUp);
  const researchDown = useRunStore((s) => s.researchDown);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? RESEARCH_BY_ID[selectedId] : null;
  const selectedLevel = selectedId ? (run.researchLevels[selectedId] ?? 0) : 0;

  const canResearch = !!selected && run.meta.researchPoints > 0 && selectedLevel < selected.maxLevel;
  const canRevert = selectedLevel > 0;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader
        leftSlot={<div className="font-magic text-[1.25rem] text-white leading-none">{run.meta.researchPoints}</div>}
        onAction={onClose}
        actionAria={t("research.closeAria")}
      />
      <ScreenTitle>{selected ? gt(`research.${selected.id}.name`, selected.name) : t("research.heading")}</ScreenTitle>

      {/* Fixed-height regardless of node/description length — see the "Descriptive text"
       *  rule in CLAUDE.md. A description that grows with content here would eat into the
       *  grid below (it's the flex-1 sibling), shrinking icons by a different amount per
       *  node selected; pinning this block's height and clamping the text instead keeps the
       *  grid's size constant no matter which node (or none) is selected. */}
      <div className="flex-none h-[4.75rem] flex flex-col items-center justify-center gap-1.5 px-5">
        {!selected ? (
          <div className="text-center text-[0.95rem] text-[#e8e8e2]/85">{t("research.selectResearch")}</div>
        ) : (
          <>
            <div className="flex gap-[5px] items-center">
              {Array.from({ length: selected.maxLevel }, (_, i) => (
                <Pip key={i} filled={i < selectedLevel} size={7} tone="#efe18a" />
              ))}
            </div>
            <div className="w-full h-9 flex items-center justify-center">
              <div className="text-descriptive text-center line-clamp-2">
                <GameText {...describeNode(selected, selectedLevel, gt)} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-evenly py-2 px-3.5 gap-1">
        {RESEARCH_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex-1 min-h-0 flex justify-center items-center gap-x-1.5">
            {row.map((node) => {
              const level = run.researchLevels[node.id] ?? 0;
              const isSelected = selectedId === node.id;
              const tint = nodeTint(level, isSelected);
              const nodeLabel = gt(`research.${node.id}.name`, node.name);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  title={nodeLabel}
                  className="h-full flex-none bg-transparent border-none p-0 cursor-pointer flex flex-col items-center justify-center gap-1 font-[inherit]"
                  style={{ width: `calc((100% - ${RESEARCH_ROW_GAP_REM * (RESEARCH_ROW_COLUMNS - 1)}rem) / ${RESEARCH_ROW_COLUMNS})` }}
                >
                  <span className="h-[70%] aspect-square max-w-full flex items-center justify-center">
                    <NodeIcon src={node.image} alt={nodeLabel} tint={tint} />
                  </span>
                  <span className="flex-none flex gap-[3px] items-center">
                    {Array.from({ length: node.maxLevel }, (_, i) => (
                      <Pip key={i} filled={i < level} size={6} tone={isSelected ? "#fff" : "#efe18a"} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <ScreenFooter>
        <div className="w-full flex justify-around items-center">
          <button
            type="button"
            disabled={!canResearch}
            onClick={() => selected && researchUp(selected.id)}
            className={`bg-transparent border-none font-magic text-[1.7rem] cursor-pointer ${canResearch ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
          >
            {t("research.researchBtn")}
          </button>
          <button
            type="button"
            disabled={!canRevert}
            onClick={() => selected && researchDown(selected.id)}
            className={`bg-transparent border-none font-magic text-[1.7rem] cursor-pointer ${canRevert ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
          >
            {t("research.revertBtn")}
          </button>
        </div>
      </ScreenFooter>
    </div>
  );
}
