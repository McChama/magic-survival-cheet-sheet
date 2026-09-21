import { CLASS_BONUSES, getClassLevel } from "../data/classes";
import { MAGIC_LEVEL_UPS } from "../data/magicLevelUps";
import { BASE_MAGICS, getMagicMaxLevel } from "../data/magics";
import { MAGIC_BASE_STATS, type MagicStatBase, type MagicStatKind } from "../data/magicStats";
import type { CurrentRunState, StatBlock } from "../types/game";
import { getEquippedItems } from "./tierAdaptive";

/** Stat changes a magic gets from its own level-ups, its class, and the artifacts the run owns. */
export interface MagicEffects {
  /** Sum of "Increase <magic> Damage by N%" (additive with the permanent bonuses). */
  damagePct: number;
  /** Sum of "+N <magic>s". */
  numberAdd: number;
  /** Sum of "Increase <magic> Size by N%" (adds to the global All Magic Size before scaling). */
  sizePct: number;
  /** Sum of "Increase <magic> Duration by N%" (adds to the global All Magic Duration). */
  durationPct: number;
  /** Product of every "Decrease <magic> Cooldown by N%" as (1 - N/100); 1 = none. */
  cooldownMult: number;
  /** Sum of "Increase <magic> Rotation Speed by N%". */
  rotationPct: number;
  /** Product of every "Decrease <magic> Damage Interval by N%" as (1 - N/100); 1 = none. */
  intervalMult: number;
  /** Sum of "Increase <magic> Effect by N%" (Magic Circle's Amplification Effect, in points). */
  effectPct: number;
}

function sumMatches(text: string, pattern: RegExp): number {
  let total = 0;
  for (const match of text.matchAll(pattern)) total += Number(match[1]);
  return total;
}

/** The product of (1 - N/100) over every match: reductions multiply, they don't add. */
function keepProduct(text: string, pattern: RegExp): number {
  let keep = 1;
  for (const match of text.matchAll(pattern)) keep *= 1 - Number(match[1]) / 100;
  return keep;
}

/** Reads the stat effects that name `magicName` out of free-form effect text. */
function parseEffects(text: string, magicName: string): MagicEffects {
  const plural = `${magicName}s`;
  return {
    damagePct: sumMatches(text, new RegExp(`Increases? ${magicName} Damage by (\\d+(?:\\.\\d+)?)%`, "g")),
    numberAdd:
      sumMatches(text, new RegExp(`the number of ${plural} by (\\d+)(?![\\d%.])`, "g")) +
      sumMatches(text, new RegExp(`Increases? ${magicName} Number by (\\d+)(?![\\d%.])`, "g")) +
      sumMatches(text, new RegExp(`(\\d+) Additional ${plural}`, "g")),
    sizePct: sumMatches(text, new RegExp(`Increases? ${magicName} Size by (\\d+(?:\\.\\d+)?)%`, "g")),
    durationPct: sumMatches(text, new RegExp(`Increases? ${magicName} Duration by (\\d+(?:\\.\\d+)?)%`, "g")),
    cooldownMult: keepProduct(text, new RegExp(`(?:Decrease|Reduces?) ${magicName} Cooldown by (\\d+(?:\\.\\d+)?)%`, "g")),
    rotationPct: sumMatches(text, new RegExp(`Increases? ${magicName} Rotation Speed by (\\d+(?:\\.\\d+)?)%`, "g")),
    intervalMult: keepProduct(text, new RegExp(`(?:Decrease|Reduces?) ${magicName} Damage Interval by (\\d+(?:\\.\\d+)?)%`, "g")),
    effectPct: sumMatches(text, new RegExp(`Increases? ${magicName} Effect by (\\d+(?:\\.\\d+)?)%`, "g")),
  };
}

function add(a: MagicEffects, b: MagicEffects): MagicEffects {
  return {
    damagePct: a.damagePct + b.damagePct,
    numberAdd: a.numberAdd + b.numberAdd,
    sizePct: a.sizePct + b.sizePct,
    durationPct: a.durationPct + b.durationPct,
    cooldownMult: a.cooldownMult * b.cooldownMult,
    rotationPct: a.rotationPct + b.rotationPct,
    intervalMult: a.intervalMult * b.intervalMult,
    effectPct: a.effectPct + b.effectPct,
  };
}

const NONE: MagicEffects = { damagePct: 0, numberAdd: 0, sizePct: 0, durationPct: 0, cooldownMult: 1, rotationPct: 0, intervalMult: 1, effectPct: 0 };

/**
 * Summon-type magics whose Number is not a stored field (it starts at 0 and counts up): their one repeated
 * level-up effect ("Damage +20% @ +1") applies at every level **from level 1**, so Satellite Lv1 already has
 * 1 satellite and +20% Damage (Lv1 540, Lv2 630 with ATK 100 — checked in game). Every other magic's
 * level-ups start at level 2.
 */
const LEVEL_EFFECTS_FROM_LEVEL_ONE: ReadonlySet<string> = new Set(["spirit", "satellite"]);

/**
 * Everything (besides the permanent "(All Classes)" damage bonuses of `magicDamage.ts`) that
 * changes a magic's Damage / Number / Cooldown:
 * - its own level-ups up to `level` (`MAGIC_LEVEL_UPS`: entry i is the bonus for level i + 2);
 * - the equipped class's gated bonus lines up to its level (the lines marked "(All Classes)" are
 *   permanent bonuses and are counted elsewhere);
 * - the artifacts the run owns, plus the Subject's starting artifact (the game equips it at start).
 * Verified: Wizard Subject + Wizard Class Lv3, Magic Bolt Lv2, ATK 100 -> Damage 1025 (5 x 100 x
 * (100 + 5 Subject + 100 The Freeshooter)%), Number 2 (Lv2 level-up), Cooldown 0.6 s (0.75 x 0.8,
 * the class's Lv3 line). Reductions multiply (see `applyMagicEffects`); that is read from the game's code, not yet checked with two sources.
 */
export function collectMagicEffects(magicId: string, level: number, run: CurrentRunState): MagicEffects {
  const magicName = BASE_MAGICS.find((m) => m.id === magicId)?.name;
  if (!magicName) return NONE;

  let total = NONE;
  const levelUps = MAGIC_LEVEL_UPS[magicName] ?? [];
  if (LEVEL_EFFECTS_FROM_LEVEL_ONE.has(magicId)) {
    for (let reached = 1; reached <= level; reached++) total = add(total, parseEffects(levelUps[0] ?? "", magicName));
  } else {
    // The 5-level magics (Shield, Cloaking, Armageddon, Magic Circle) list only 3 identical entries for their 4
    // level-ups: the last one repeats for the levels the list doesn't reach (Magic Circle Lv5 = 45% Effect, 10 s).
    const repeatsLast = getMagicMaxLevel(magicId) === 5;
    for (let reached = 2; reached <= level; reached++) {
      const index = repeatsLast ? Math.min(reached - 2, levelUps.length - 1) : reached - 2;
      total = add(total, parseEffects(levelUps[index] ?? "", magicName));
    }
  }

  const className = run.meta.characterClass;
  const bonus = className ? CLASS_BONUSES[className] : undefined;
  if (className && bonus) {
    const unlocked = getClassLevel(run.meta.classLevels, className) - 1;
    for (const line of bonus.levels.slice(0, Math.max(0, unlocked))) {
      if (!line.text.includes("(All Classes)")) total = add(total, parseEffects(line.text, magicName));
    }
  }

  for (const item of getEquippedItems(run)) total = add(total, parseEffects(item.specialEffect ?? "", magicName));

  return total;
}

/**
 * Spirit's base Cooldown at `number` spirits: `0.9 x (number + 14) / (number + 17)`, i.e. 0.9 / (1 + 3 / (number + 14)) —
 * 0.75 s with 1 spirit, 0.758 with 2, 0.765 with 3. Checked in game with Cooldown -12%: 0.66 s, 0.67 s and 0.67 s at spirit
 * levels 1, 2 and 3. The `number + 14` is in the game's starting values; the rest is fitted to those three screens.
 */
function spiritBaseCooldown(constant: number, number: number): number {
  return (constant * (number + 14)) / (number + 17);
}

/**
 * A stat's level-1 base with everything applied, following the game's own formulas
 * (the starting values; the global values are the dashboard's `stats`):
 * - Size / Explosion Range = base x (100 + All Magic Size + the magic's own Size bonus) / 100
 * - Duration = base x (100 + All Magic Duration + the magic's own Duration bonus) / 100
 * - Cooldown = base x (1 - All Magic Cooldown) x the magic's own reductions (all multiply)
 * - Number = base + the magic's own gains
 * - Rotation Speed = base x (1 + the magic's own bonus); Damage Interval = base x the magic's own reductions;
 *   Amplification Effect = base + the magic's own points
 * Damage is scaled separately (`magicDamageMultiplier`); the other stats pass through unchanged.
 */
export function applyMagicEffects(base: MagicStatBase | undefined, stat: MagicStatKind, effects: MagicEffects, stats: StatBlock, magicId?: string): MagicStatBase | undefined {
  if (!base) return base;
  if (magicId === "spirit" && stat === "cooldown") {
    const number = (MAGIC_BASE_STATS.spirit.number?.value ?? 0) + effects.numberAdd;
    base = { ...base, value: spiritBaseCooldown(base.value, number) };
  }
  switch (stat) {
    case "number":
      return { ...base, value: base.value + effects.numberAdd };
    case "explosionRange":
    case "size":
      return { ...base, value: (base.value * (100 + stats.magicSize + effects.sizePct)) / 100 };
    case "duration":
      return { ...base, value: (base.value * (100 + stats.magicDuration + effects.durationPct)) / 100 };
    case "cooldown":
      return { ...base, value: base.value * (1 - stats.cooldown / 100) * effects.cooldownMult };
    case "rotationSpeed":
      return { ...base, value: base.value * (1 + effects.rotationPct / 100) };
    case "damageInterval":
      return { ...base, value: base.value * effects.intervalMult };
    case "amplificationEffect":
      // Points added to the effect: Magic Circle Lv2 "+5%" takes 25% to 30% (checked in game), not x1.05.
      return { ...base, value: base.value + effects.effectPct };
    default:
      return base;
  }
}
