import { STAT_DEFINITIONS } from "../data/statDefinitions";
import { getAlertLevel } from "./diminishingReturns";
import { getRunStats } from "./runStats";
import {
  ACCELERATOR_CONVERSION_RATE,
  computeTierAdjustments,
  getEquippedItems,
  getTierMultiplier,
  isAmplifyStarved,
} from "./tierAdaptive";
import type { CurrentRunState, EquippableItem, ScoreBreakdownLine, ScoreResult, StatKey } from "../types/game";

/**
 * A choice the player is offered in-run: either a stat-granting item (artifact/passive)
 * or a base magic pickup (which matters for the fusion dependency tree, not for stats).
 */
export interface RecommenderOption {
  id: string;
  label: string;
  image?: string;
  item?: EquippableItem;
  /** Base magic id (see src/data/magics.ts) when this option is a spell pickup/level-up. */
  magicId?: string;
}

/**
 * Relative "power per unit" for each stat, calibrated so a solid rare item lands
 * ~4-6/10 and a strong legendary lands ~8-10/10. These are an explicit design
 * heuristic (the brief does not specify exact in-game damage formulas), not a
 * datamined constant — tune freely as you validate against real runs.
 *
 * **Demoted 2026-09-16**: this score is no longer the Recommender's primary ranking
 * signal — `src/engine/synergy.ts` (real fusion/class/subject/stacking data, no
 * invented numbers) is. This score is kept only as a last-resort, honestly-labeled
 * tiebreaker for artifact offers when no real synergy signal differentiates them
 * (unavoidable: two items of different stat types still need *some* comparison basis,
 * and there's no real-data way to answer "is +30 ATK or +5% Evasion better" — hiding
 * that limitation would be its own kind of dishonesty). Never shown for magic pickups.
 */
const STAT_WEIGHT: Record<StatKey, number> = {
  atk: 0.03,
  amplifyAtk: 0.12,
  critRate: 0.05,
  critMultiplier: 0.03,
  magicDamage: 0.08,
  magicSize: 0.03,
  magicDuration: 0.03,
  cooldown: 0.15,
  hp: 0.05,
  hpRegen: 0.5,
  lifeOrbRecovery: 0.05,
  damageTaken: 0.08,
  evasion: 0.08,
  moveSpeed: 0.05,
  manaAcquisition: 0.04,
  itemPickupRange: 0.02,
  enemyMaxHp: 0.06,
};

/** Flat credit for a real-but-unquantified special effect (e.g. Domain of Power's damage buff). */
const SPECIAL_EFFECT_BONUS = 1.5;
/** How much a stat's marginal value is discounted once it's already past its soft cap. */
const DIMINISHING_RETURNS_DISCOUNT = 0.6;

function scoreItemOption(item: EquippableItem, run: CurrentRunState): ScoreBreakdownLine[] {
  const breakdown: ScoreBreakdownLine[] = [];
  const tierAdjustments = computeTierAdjustments(run);
  const amplifyStarved = isAmplifyStarved(run);
  const stats = getRunStats(run);

  for (const [key, rawValue] of Object.entries(item.stats) as [StatKey, number][]) {
    if (!rawValue) continue;
    let delta = rawValue * STAT_WEIGHT[key];

    const alert = getAlertLevel(key, stats[key] ?? 0);
    if (alert === "warning" || alert === "critical") {
      delta *= DIMINISHING_RETURNS_DISCOUNT;
      breakdown.push({ label: `${STAT_DEFINITIONS[key].label}: diminishing returns`, delta: delta - rawValue * STAT_WEIGHT[key] });
    }

    if (item.tags?.includes("moveSpeed") && key === "moveSpeed") {
      const multiplier = getTierMultiplier(tierAdjustments, "moveSpeed");
      if (multiplier > 1) {
        const bonus = delta * (multiplier - 1);
        delta *= multiplier;
        breakdown.push({ label: "Tier boosted by equipped Accelerator", delta: bonus });
      }
    }
    if (key === "atk") {
      const multiplier = getTierMultiplier(tierAdjustments, "atk");
      if (multiplier > 1) {
        const bonus = delta * (multiplier - 1);
        delta *= multiplier;
        breakdown.push({ label: "ATK is worth more with Amplify already active", delta: bonus });
      }
    }
    if (key === "critRate") {
      const multiplier = getTierMultiplier(tierAdjustments, "critRate");
      if (multiplier > 1) {
        const bonus = delta * (multiplier - 1);
        delta *= multiplier;
        breakdown.push({ label: "Synergy with Overmind", delta: bonus });
      }
    }

    breakdown.push({ label: STAT_DEFINITIONS[key].label, delta });
  }

  if (item.tags?.includes("cooldownConverter")) {
    const estimatedCooldownFromMoveSpeed = Math.max(0, stats.moveSpeed - 100) * ACCELERATOR_CONVERSION_RATE;
    const delta = estimatedCooldownFromMoveSpeed * STAT_WEIGHT.cooldown;
    if (delta > 0) {
      breakdown.push({ label: "Indirect Cooldown via excess Movement Speed", delta });
    }
  }

  if ((amplifyStarved && (item.tags?.includes("amplify") || item.stats.amplifyAtk)) ) {
    breakdown.push({ label: "High ATK without Amplify: Amplify priority", delta: 3 });
  }

  if (item.specialEffect && !Object.keys(item.stats).length) {
    breakdown.push({ label: "Unquantifiable special effect", delta: SPECIAL_EFFECT_BONUS });
  }

  return breakdown;
}

/**
 * Magic pickups have no stats to weight, and fusion relevance is now owned honestly
 * (tiered, talent-aware, real-data-cited) by `src/engine/synergy.ts` instead of the
 * flat invented bonuses this used to apply — see that module and the Recommender
 * screen, which ranks magic offers by synergy tier and doesn't show this score at all
 * for magic options (a flat, identical `BASE_SCORE` for every magic would be noise, not
 * signal). Kept as a function (rather than removed) only so `scoreOption` below has a
 * single, uniform code path for both option kinds.
 */
function scoreMagicOption(): ScoreBreakdownLine[] {
  return [];
}

const BASE_SCORE = 3;

export function scoreOption(option: RecommenderOption, run: CurrentRunState): ScoreResult {
  const breakdown = option.item ? scoreItemOption(option.item, run) : scoreMagicOption();
  const rawTotal = breakdown.reduce((sum, line) => sum + line.delta, 0);
  const score = Math.min(10, Math.max(1, Math.round((BASE_SCORE + rawTotal) * 10) / 10));

  return {
    itemId: option.id,
    score,
    percent: Math.round(score * 10),
    breakdown,
    isBest: false,
  };
}

/** Scores every offered option and flags the highest-scoring one(s) as the recommended pick. */
export function compareOptions(options: RecommenderOption[], run: CurrentRunState): ScoreResult[] {
  const results = options.map((option) => scoreOption(option, run));
  const best = Math.max(...results.map((r) => r.score));
  return results.map((r) => ({ ...r, isBest: r.score === best }));
}

export { getEquippedItems };
