import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ALL_RECOMMENDER_OPTIONS } from "../../data/recommenderOptions";
import { optionsByKind } from "../../data/quickAddOptions";
import { DROP_CONTEXT_BY_ID } from "../../data/dropProbability";
import { compareOptions, type RecommenderOption } from "../../engine/scoring";
import { estimateItemOdds } from "../../engine/dropProbability";
import { compareSynergies, type SynergyResult, type SynergyTier } from "../../engine/synergy";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { RARITY_RING, RARITY_ORDER } from "../../config/rarityColors";
import { BOOST_SIGNAL_TIER_COLOR } from "../../config/tierColors";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ScreenFooter } from "../shared/ScreenFooter";
import { DropContextPicker } from "../shared/DropContextPicker";
import { FilterChip } from "../shared/FilterChip";
import { RarityFilterChips, type RarityFilterKey } from "../shared/RarityFilterChips";
import type { DropContext, ScoreResult } from "../../types/game";

interface RecommenderScreenProps {
  onClose: () => void;
}

type OfferMode = "artifact" | "magic";

/** Fixed 3 base-magic choices per level-up — real in-game offer size, corroborated by
 *  Scholar's own real bonus text ("50% increased chance to have [4] Magic choices"),
 *  implying a baseline of 3. Not a chest/merchant context, so no drop-odds data applies. */
const MAGIC_CHOICE_COUNT = 3;

/** Falls back to when a context's real slot count isn't pinned down (relic chest is
 *  "~2-7", no single confirmed number — see dropProbability.ts) — merchant's 8 is the
 *  highest confirmed count, so it's a safe upper bound rather than an arbitrary guess. */
const DEFAULT_MAX_SELECTED = 8;

function selectionBoundsFor(mode: OfferMode, context: DropContext): { min: number; max: number } {
  if (mode === "magic") return { min: MAGIC_CHOICE_COUNT, max: MAGIC_CHOICE_COUNT };
  const max = DROP_CONTEXT_BY_ID[context].slotsPerEvent ?? DEFAULT_MAX_SELECTED;
  return { min: max <= 1 ? 1 : 2, max };
}

/**
 * Only real artifact drops go in "Artifact Drop" mode — chests/merchants offer
 * artifacts, not passive spells (confirmed directly by the user, who plays the game).
 * This also happens to give 100% sprite coverage (all 182 artifacts have a confirmed
 * real image). Sorted common -> legendary, alphabetical within each rarity, so the grid
 * can be scanned quickly by matching the border color to what the game just showed,
 * during the real in-game pause this screen is meant to be used in.
 */
const ARTIFACT_OPTIONS = ALL_RECOMMENDER_OPTIONS.filter((o) => o.item?.kind === "artifact").sort((a, b) => {
  const rarityDiff = RARITY_ORDER.indexOf(a.item!.rarity) - RARITY_ORDER.indexOf(b.item!.rarity);
  return rarityDiff !== 0 ? rarityDiff : a.item!.name.localeCompare(b.item!.name);
});

/**
 * "Magic Choice" mode offers base magics — this is what actually exercises the
 * synergy engine's strongest signal (fusion-ingredient/talent match, tiers 1-2), since
 * no artifact is ever itself a FUSIONS ingredient.
 */
const MAGIC_OPTIONS = [...optionsByKind("magic")].sort((a, b) => a.label.localeCompare(b.label));

const MAGIC_TILE_COLOR = "#5fe3c4";

function OfferIcon({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="text-[#e8e8e2]/30 text-2xl">?</span>;
  return <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} />;
}

/**
 * Manually-entered "here's what the game just offered me" comparison, since this app
 * cannot read live game state. Primary ranking comes from `synergy.ts`'s real-data
 * signals (fusion ingredients, class/subject signature magics, stacking with equipped
 * artifacts) — the old `STAT_WEIGHT`-driven `compareOptions` score is kept only as a
 * clearly-labeled, demoted tiebreaker for artifact offers (see `scoring.ts`'s doc
 * comment on why it can't honestly be eliminated entirely).
 */
export function RecommenderScreen({ onClose }: RecommenderScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);

  const [mode, setMode] = useState<OfferMode>("artifact");
  const [context, setContext] = useState<DropContext>("normalChest");
  const [rarityFilter, setRarityFilter] = useState<RarityFilterKey>("all");
  const [selected, setSelected] = useState<RecommenderOption[]>([]);
  const [results, setResults] = useState<{ score: ScoreResult; synergy: SynergyResult }[] | null>(null);

  const pool = mode === "artifact" ? ARTIFACT_OPTIONS : MAGIC_OPTIONS;
  const visibleOptions = useMemo(
    () => (mode === "artifact" && rarityFilter !== "all" ? pool.filter((o) => o.item!.rarity === rarityFilter) : pool),
    [pool, mode, rarityFilter]
  );

  const { min: minSelected, max: maxSelected } = selectionBoundsFor(mode, context);

  function handleModeChange(next: OfferMode) {
    setMode(next);
    setSelected([]);
    setResults(null);
  }

  function handleContextChange(next: DropContext) {
    setContext(next);
    // Trim rather than reset — switching from e.g. merchant (8) to normal chest (3)
    // shouldn't silently allow a stale over-cap selection through to Compare.
    const { max } = selectionBoundsFor(mode, next);
    setSelected((prev) => prev.slice(0, max));
  }

  function toggleSelect(option: RecommenderOption) {
    setSelected((prev) => {
      if (prev.some((o) => o.id === option.id)) return prev.filter((o) => o.id !== option.id);
      if (prev.length >= maxSelected) return prev;
      return [...prev, option];
    });
  }

  function handleCompare() {
    const scores = compareOptions(selected, run);
    const synergies = compareSynergies(selected, run);
    setResults(
      selected.map((option, i) => ({
        score: scores.find((s) => s.itemId === option.id) ?? scores[i],
        synergy: synergies.find((s) => s.optionId === option.id) ?? synergies[i],
      }))
    );
  }

  function handleChangeOffer() {
    setResults(null);
    setSelected([]);
  }

  const resultRows = useMemo(() => {
    if (!results) return [];
    const rows = results.map((r) => ({ ...r, option: selected.find((o) => o.id === r.score.itemId)! })).filter((r) => r.option);
    const bestTier = rows.reduce<SynergyTier | null>((best, r) => {
      if (r.synergy.bestTier === null) return best;
      return best === null || r.synergy.bestTier < best ? r.synergy.bestTier : best;
    }, null);
    const hasAnySynergy = bestTier !== null;
    const bestScore = mode === "artifact" ? Math.max(...rows.map((r) => r.score.score)) : null;
    return rows
      .map((r) => ({
        ...r,
        isRecommended: hasAnySynergy ? r.synergy.bestTier === bestTier : bestScore !== null && r.score.score === bestScore,
      }))
      .sort((a, b) => {
        const tierDiff = (a.synergy.bestTier ?? Infinity) - (b.synergy.bestTier ?? Infinity);
        if (tierDiff !== 0) return tierDiff;
        if (mode === "artifact" && a.score.score !== b.score.score) return b.score.score - a.score.score;
        return a.option.label.localeCompare(b.option.label);
      });
  }, [results, selected, mode]);

  const anyRecommendedHasSynergy = resultRows.some((r) => r.isRecommended && r.synergy.bestTier !== null);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("recommender.closeAria")} />
      <ScreenTitle>{t("recommender.heading")}</ScreenTitle>

      {!results ? (
        <>
          <div className="px-4 pb-2.5 flex-none flex gap-2">
            {(["artifact", "magic"] as const).map((m) => {
              const active = m === mode;
              return (
                <FilterChip key={m} active={active} color="#efc84f" activeText="#0d0d10" onClick={() => handleModeChange(m)} className="flex-1 py-[7px] text-[0.8rem]">
                  {t(m === "artifact" ? "recommender.modeArtifact" : "recommender.modeMagic")}
                </FilterChip>
              );
            })}
          </div>

          {mode === "artifact" && <DropContextPicker value={context} onChange={handleContextChange} />}
          {mode === "artifact" && <RarityFilterChips value={rarityFilter} onChange={setRarityFilter} />}

          <div className="flex-none px-4 pb-2 text-[0.8rem] text-[#e8e8e2]/60 text-center">
            {minSelected === maxSelected
              ? t("recommender.offerPickerHintExact", { count: maxSelected })
              : t("recommender.offerPickerHint", { min: minSelected, max: maxSelected })}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
            <div className="grid grid-cols-5 gap-2.5">
              {visibleOptions.map((option) => {
                const isSelected = selected.some((o) => o.id === option.id);
                const ring = option.item ? RARITY_RING[option.item.rarity] : MAGIC_TILE_COLOR;
                const label = option.item ? gt(`item.${option.item.id}.name`, option.label) : gt(`magic.${option.magicId}.name`, option.label);
                return (
                  <button
                    key={option.id}
                    type="button"
                    title={label}
                    onClick={() => toggleSelect(option)}
                    className={`relative aspect-square rounded-[7px] bg-[#0d0d10] cursor-pointer flex items-center justify-center p-0 overflow-hidden transition-transform duration-150 ${isSelected ? "scale-110 border-2 border-white" : "scale-100 border"}`}
                    style={isSelected ? undefined : { borderColor: ring }}
                  >
                    <OfferIcon src={option.image} alt={label} />
                    {isSelected && <span className="absolute top-[3px] right-1 w-[7px] h-[7px] rounded-full bg-[#63d16b]" />}
                  </button>
                );
              })}
            </div>
            {visibleOptions.length === 0 && (
              <div className="py-[30px] text-center text-[0.8rem] text-[#e8e8e2]/35">{t("loadoutSheet.noResults")}</div>
            )}
          </div>
          <ScreenFooter>
            <button
              type="button"
              disabled={selected.length < minSelected}
              onClick={handleCompare}
              className={`bg-transparent border-none font-magic text-[1.5rem] cursor-pointer ${selected.length >= minSelected ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
            >
              {t("recommender.compareBtn", { count: selected.length })}
            </button>
          </ScreenFooter>
        </>
      ) : (
        <>
          {!anyRecommendedHasSynergy && (
            <div className="flex-none px-4 pb-2 text-[0.75rem] text-[#e8e8e2]/50 text-center">
              {t("recommender.noSynergyNote")}
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 flex flex-col gap-2.5">
            {resultRows.map(({ score, synergy, option, isRecommended }) => {
              const item = option.item;
              const label = item ? gt(`item.${item.id}.name`, item.name) : gt(`magic.${option.magicId}.name`, option.label);
              const odds = mode === "artifact" && item ? estimateItemOdds(item.id, context) : null;
              return (
                <div
                  key={option.id}
                  className={`flex gap-3 items-center p-2.5 rounded-[9px] bg-[#111115] ${isRecommended ? "border-2 border-[#efc84f]" : "border border-white/[.08]"}`}
                >
                  <span
                    className="flex-none w-11 h-11 rounded-[7px] overflow-hidden flex items-center justify-center bg-[#0d0d10]"
                    style={{ boxShadow: `inset 0 0 0 1px ${item ? RARITY_RING[item.rarity] : MAGIC_TILE_COLOR}` }}
                  >
                    <OfferIcon src={option.image} alt={label} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[0.9rem] text-[#e8e8e2] truncate">{label}</span>
                      {isRecommended && (
                        <span className="flex-none text-[0.65rem] uppercase tracking-wide text-[#0d0d10] bg-[#efc84f] px-1.5 py-[1px] rounded-full">
                          {t("recommender.recommendedBadge")}
                        </span>
                      )}
                    </div>
                    {synergy.signals.length > 0 ? (
                      <div className="flex flex-col gap-[3px] mt-1">
                        {synergy.signals.map((signal, i) => (
                          <div key={i} className="text-[0.72rem]" style={{ color: BOOST_SIGNAL_TIER_COLOR[signal.tier] }}>
                            {signal.label}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[0.72rem] text-[#e8e8e2]/35 mt-1">{t("recommender.noSynergySignal")}</div>
                    )}
                    {mode === "artifact" && (
                      <div className="text-[0.7rem] text-[#e8e8e2]/45 mt-1">
                        {odds !== null
                          ? t("recommender.dropOddsLabel", { percent: (odds * 100).toFixed(1) })
                          : t("recommender.dropOddsUnavailable")}
                      </div>
                    )}
                  </div>
                  {item && (
                    <div className="flex-none text-right">
                      <div className="text-[0.65rem] text-[#e8e8e2]/40">{t("recommender.estimatedPowerLabel")}</div>
                      <div className="font-magic text-[0.95rem] text-[#e8e8e2]/70">{score.score}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <ScreenFooter>
            <button
              type="button"
              onClick={handleChangeOffer}
              className="bg-transparent border-none font-magic text-[1.4rem] text-[#e8e8e2] cursor-pointer"
            >
              {t("recommender.changeOfferBtn")}
            </button>
          </ScreenFooter>
        </>
      )}
    </div>
  );
}
