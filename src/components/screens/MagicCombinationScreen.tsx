import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ANY_PASSIVE_ID, FUSIONS, fusionRefId } from "../../data/fusions";
import { MAGIC_COMBINATION_INFO } from "../../data/magicCombinations";
import { BASE_MAGIC_BY_ID, magicLargeSpriteUrl } from "../../data/magics";
import { getAvailableFusions, getFusionRequirements } from "../../engine/magicCombination";
import { ITEM_BY_ID } from "../../engine/tierAdaptive";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { uiImage } from "../../config/assets";
import { COMBINATION_FRAME_IDLE, COMBINATION_FRAME_READY } from "../../config/frameColors";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ScreenFooter } from "../shared/ScreenFooter";
import { GameText } from "../shared/GameText";
import { GridPanel } from "../shared/GridPanel";
import { GridIcon, GridTile } from "../shared/GridCard";
import type { FusionDefinition } from "../../types/game";

interface MagicCombinationScreenProps {
  onClose: () => void;
}

/** The game's pink for this screen's subtitle (handed to `GameText`, which sets its own color). */
const HINT_COLOR = "#e890a8";

/** The grid (every combination in the game), or one combination's detail with a list to page through. */
type View = { kind: "grid" } | { kind: "detail"; ids: string[]; index: number };

/**
 * The game's Magic Combination screen. Opened while some combination's requirements are met (the Dashboard's red button), it
 * starts on the detail of the available one(s) — the arrows page through them when there are several — and its X goes back to
 * the grid of every combination; the grid marks the available ones with a white border. Opened with none available (the
 * gray button), it starts on the grid. A combination's art, name, "<Magic> Unusable" subtitle and colored effect lines are the
 * game's own (`data/magicCombinations.ts`). Leaving a combination's detail restores the grid's scroll position instead
 * of resetting it to the top — the grid unmounts while the detail is showing (a different full-screen view, not an
 * overlay), so its scroll container's own scrollTop can't survive the round trip on its own; it's saved in a ref on
 * the way into the detail and re-applied once the grid remounts (`useLayoutEffect`, so it happens before paint).
 */
export function MagicCombinationScreen({ onClose }: MagicCombinationScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTop = useRef(0);

  const availableIds = useMemo(() => getAvailableFusions(run).map((f) => f.id), [run]);
  const [view, setView] = useState<View>(() => (availableIds.length > 0 ? { kind: "detail", ids: availableIds, index: 0 } : { kind: "grid" }));

  function openDetail(ids: string[], index: number) {
    savedScrollTop.current = gridScrollRef.current?.scrollTop ?? 0;
    setView({ kind: "detail", ids, index });
  }

  useLayoutEffect(() => {
    if (view.kind === "grid" && gridScrollRef.current) gridScrollRef.current.scrollTop = savedScrollTop.current;
  }, [view.kind]);

  const magicName = (id: string) => gt(`magic.${id}.name`, BASE_MAGIC_BY_ID[id]?.name ?? id);
  const combinationName = (fusion: FusionDefinition) => MAGIC_COMBINATION_INFO[fusion.id]?.name ?? fusion.name;
  const ingredientName = (id: string): string => {
    const refId = fusionRefId(id);
    if (refId) return FUSIONS.find((f) => f.id === refId)?.name ?? refId;
    if (id === ANY_PASSIVE_ID) return t("magicCombination.anyPassive");
    if (BASE_MAGIC_BY_ID[id]) return magicName(id);
    const item = ITEM_BY_ID[id];
    return item ? gt(`item.${item.id}.name`, item.name) : id;
  };

  if (view.kind === "detail") {
    const fusion = FUSIONS.find((f) => f.id === view.ids[view.index]);
    if (fusion) {
      const info = MAGIC_COMBINATION_INFO[fusion.id];
      const unusable = info?.unusable ?? null;
      const requirements = getFusionRequirements(fusion, run);
      const go = (step: number) => setView({ ...view, index: (view.index + step + view.ids.length) % view.ids.length });
      return (
        <div className="absolute inset-0 flex flex-col bg-black">
          <ScreenHeader onAction={() => setView({ kind: "grid" })} actionAria={t("magicCombination.closeAria")} />
          <ScreenTitle tone="pink">{t("magicCombination.title")}</ScreenTitle>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center px-5 pb-5">
            <div className="flex-1 min-h-[80px] w-full flex items-center justify-center">
              <img
                src={magicLargeSpriteUrl(fusion.id)}
                alt={combinationName(fusion)}
                className="h-full w-[78%] object-contain"
                onError={(e) => {
                  // Fall back to the small grid copy if the large one isn't there.
                  if (fusion.image && e.currentTarget.src !== fusion.image) e.currentTarget.src = fusion.image;
                }}
              />
            </div>

            <div className="flex-none w-full flex items-center justify-between gap-2">
              <ArrowButton direction="left" ariaLabel={t("magicCombination.prevAria")} onClick={() => go(-1)} hidden={view.ids.length < 2} />
              <div className="min-w-0 text-center">
                <div className="font-magic text-[1.5rem] leading-tight text-[#f8f8e8]">{combinationName(fusion)}</div>
                {unusable && <div className="text-[0.8rem] text-[#888080]">{t("magicCombination.unusable", { magic: magicName(unusable) })}</div>}
              </div>
              <ArrowButton direction="right" ariaLabel={t("magicCombination.nextAria")} onClick={() => go(1)} hidden={view.ids.length < 2} />
            </div>

            <div className="flex-none w-full mt-3 flex flex-col items-center gap-1.5 text-center text-[0.8rem]">
              {(info?.lines ?? []).map((line, i) => (
                <GameText key={i} text={line.text} color={line.color} />
              ))}
              <div className="mt-2 text-[0.72rem] text-[#e8e8e2]/45">{t("magicCombination.requirements")}</div>
              {requirements.map((requirement, i) => (
                <div key={i} className={`text-[0.75rem] ${requirement.met ? "text-[#63d16b]" : "text-[#e8e8e2]/45"}`}>
                  {ingredientName(requirement.id)}
                  {requirement.talentName ? ` · ${requirement.talentName}` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      <ScreenHeader onAction={onClose} actionAria={t("magicCombination.closeAria")} />
      <ScreenTitle tone="pink">{t("magicCombination.title")}</ScreenTitle>
      <div className="flex-none px-4 text-center text-[0.8rem] leading-snug">
        <GameText text={t("magicCombination.hint")} color={HINT_COLOR} />
      </div>

      <GridPanel scrollRef={gridScrollRef}>
        <div className="grid grid-cols-3 gap-x-[2%] gap-y-2">
          {FUSIONS.map((fusion, index) => {
            const name = combinationName(fusion);
            return (
              <GridTile
                key={fusion.id}
                onClick={() => openDetail(FUSIONS.map((f) => f.id), index)}
                frame={availableIds.includes(fusion.id) ? COMBINATION_FRAME_READY : COMBINATION_FRAME_IDLE}
                label={name}
                aspect="aspect-[205/377]"
              >
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78cqw] aspect-square flex items-center justify-center">
                  {fusion.image && <GridIcon src={fusion.image} alt={name} />}
                </span>
              </GridTile>
            );
          })}
        </div>
      </GridPanel>

      <ScreenFooter>
        <button type="button" onClick={onClose} className="bg-transparent border-none font-magic text-[1.75rem] text-white cursor-pointer">
          {t("magicCombination.returnBtn")}
        </button>
      </ScreenFooter>
    </div>
  );
}

/** The gray triangle beside a combination's name — the same sprites as the level up/down arrows. */
function ArrowButton({ direction, ariaLabel, onClick, hidden }: { direction: "left" | "right"; ariaLabel: string; onClick: () => void; hidden: boolean }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`flex-none w-9 h-9 p-0 bg-transparent border-none cursor-pointer flex items-center justify-center ${hidden ? "invisible" : ""}`}
    >
      <img src={uiImage(direction === "left" ? "icons/UI_AreaMove_L.png" : "icons/UI_AreaMove_R.png")} alt="" className="w-6 h-6 object-contain opacity-60" />
    </button>
  );
}
