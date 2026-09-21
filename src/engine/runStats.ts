import { CLASSES, CLASS_BONUSES, SUBJECTS, SUBJECT_DETAILS, getClassLevel, getClassMagicProgression, isSubjectUnlocked } from "../data/classes";
import { PASSIVES } from "../data/passives";
import { RESEARCH } from "../data/research";
import { emptyStatBlock } from "../data/statDefinitions";
import type { CurrentRunState, StatBlock, StatKey } from "../types/game";
import { getMagicCircleLevel, magicCircleEffect } from "./magicCircle";
import { getEquippedItems } from "./tierAdaptive";

/**
 * What a stat reads before any bonus, as on the game's own pause screen (a fresh run, nothing
 * bought): ATK 100, HP 200, Critical Strike Rate 3 and
 * Crit. Multiplier 200,
 * Movement Speed 100, Life Orb 30 (15% of the base 200 HP, see `LIFE_ORB_HP_FRACTION`).
 * Every stat not listed is a bonus that starts at 0.
 */
export const STAT_BASE: Partial<Record<StatKey, number>> = { atk: 100, hp: 200, critRate: 3, critMultiplier: 200, moveSpeed: 100, lifeOrbRecovery: 30 };

/** Stats whose "Increase X by N%" lines *scale* the base (ATK 100 -> 125); the other based stats just add points (Crit Rate 3 + 4 = 7). */
const SCALED_STATS: ReadonlySet<StatKey> = new Set(["atk", "hp"]);

/** A Life Orb heals this share of max HP, times (1 + the Life Orb bonus): Vitality Lv6 -> HP 340, Life Orb 340 x 0.15 x 1.35 = 69 (checked in game). */
const LIFE_ORB_HP_FRACTION = 0.15;

/** The bonus lines the game words as "<verb> <label> by N%", and the pause-screen stat each one feeds. */
const STAT_LINES: [RegExp, StatKey][] = [
  [/Increase ATK by (\d+(?:\.\d+)?)%/g, "atk"],
  [/Amplify ATK by (\d+(?:\.\d+)?)%/g, "amplifyAtk"],
  [/Increase All Magic Damage by (\d+(?:\.\d+)?)%/g, "magicDamage"],
  [/Increase All Magic Size by (\d+(?:\.\d+)?)%/g, "magicSize"],
  [/Increase All Magic Duration by (\d+(?:\.\d+)?)%/g, "magicDuration"],
  [/Decrease All Magic Cooldown by (\d+(?:\.\d+)?)%/g, "cooldown"],
  [/Increase Max HP by (\d+(?:\.\d+)?)%/g, "hp"],
  [/Increase HP Regen per sec\. by (\d+(?:\.\d+)?)%/g, "hpRegen"],
  [/Increase Life Orb HP Recovery by (\d+(?:\.\d+)?)%/g, "lifeOrbRecovery"],
  [/Decrease Damage Taken by (\d+(?:\.\d+)?)%/g, "damageTaken"],
  [/Increase Evasion by (\d+(?:\.\d+)?)%/g, "evasion"],
  [/Increase Movement Speed by (\d+(?:\.\d+)?)%/g, "moveSpeed"],
  [/Increase Mana Acquisition by (\d+(?:\.\d+)?)%/g, "manaAcquisition"],
  [/Increase Item Pickup Range by (\d+(?:\.\d+)?)%/g, "itemPickupRange"],
  [/Increase Critical Strike Rate by (\d+(?:\.\d+)?)%/g, "critRate"],
];

const PASSIVE_BY_NAME = Object.fromEntries(PASSIVES.map((p) => [p.name, p]));

/** Shields the character has at the start (set in the game's starting values). */
const BASE_SHIELDS = 2;

/** Removes the game's bracket markup so a line can be matched as plain text. */
export const stripMarkup = (text: string): string => text.replace(/[〔〕〈〉『』【】《》[\]{}]/g, "");

/** Records one source's bonus to a stat (see `computeStartingStats` for how they combine). */
type AddBonus = (key: StatKey, value: number) => void;

/** Adds the stat bonuses named in one line of game text. */
function addTextBonuses(add: AddBonus, text: string | undefined): void {
  if (!text) return;
  for (const [pattern, key] of STAT_LINES) {
    for (const match of text.matchAll(pattern)) add(key, Number(match[1]));
  }
}

/**
 * The stats the run starts with, before anything the player types in, from the four real sources:
 * - **Research** the player has bought (`researchLevels`);
 * - the equipped **Class**: its Lv2-Lv4 lines up to its level (the Lv5 line is "(All Classes)" and
 *   counted below), the stats of the special abilities it grants (Bishop's Guardian Angel: +30% Max HP),
 *   and Bishop's Amplify ATK per active Shield (2 Shields at the start);
 * - **All Classes** bonuses: the Lv5 line of every Class leveled to 5, and the trait of every
 *   unlocked **Subject** (Wizard always is);
 * - every artifact/passive the run owns (`getEquippedItems`: the Subject in use's starting artifact plus
 *   the ones the player added), through its curated `stats`.
 * Not modelled yet: item effects that aren't a plain stat number, and effects that scale with the run itself
 * (Aegis's Amplify per Damage Taken, Pyramid's per Synergy, "per character level" lines).
 * How they combine: bonuses to the same stat add up, except **All Magic Cooldown, whose sources multiply**
 * (the game keeps one cooldown ratio, a product of every "Decrease All Magic Cooldown" — read out of
 * the starting values — and shows `100 - ratio x 100`). ATK = 100 x (1 + N%)
 * (`SCALED_STATS`) is not yet confirmed for ATK; HP and Life Orb are.
 */
export function computeStartingStats(run: CurrentRunState): StatBlock {
  const bonuses = emptyStatBlock();
  let cooldownKept = 1;
  const add: AddBonus = (key, value) => {
    if (key === "cooldown") cooldownKept *= 1 - value / 100;
    else bonuses[key] += value;
  };

  for (const node of RESEARCH) {
    const level = run.researchLevels[node.id] ?? 0;
    if (node.statKey) add(node.statKey, node.valuesByLevel[level] ?? 0);
    // Vitality's second line ("Increase Life Orb HP Recovery by N%").
    if (node.secondaryValuesByLevel) add("lifeOrbRecovery", node.secondaryValuesByLevel[level] ?? 0);
  }

  const { characterClass, classLevels, unlockedSubjects } = run.meta;
  const classBonus = characterClass ? CLASS_BONUSES[characterClass] : undefined;
  if (characterClass && classBonus) {
    const gated = getClassLevel(classLevels, characterClass) - 1;
    const unlockedLines = classBonus.levels.slice(0, Math.max(0, Math.min(gated, 3)));
    for (const line of unlockedLines) addTextBonuses(add, line.text);

    // The class's named special abilities (Guardian Angel, Doctor, ...) are passives with their own stats.
    for (const special of getClassMagicProgression(characterClass, getClassLevel(classLevels, characterClass)).specials) {
      for (const [key, value] of Object.entries(PASSIVE_BY_NAME[special.name]?.stats ?? {}) as [StatKey, number][]) add(key, value);
    }

    // Bishop: "For each active Shield, ATK is Amplified by N%" — it starts with 2 Shields, plus N from its own lines.
    const perShield = stripMarkup(classBonus.tooltip.text).match(/For each active Shield, ATK is Amplified by (\d+(?:\.\d+)?)%/);
    if (perShield) {
      let shields = BASE_SHIELDS;
      for (const line of unlockedLines) shields += Number(line.text.match(/maximum number of Shields by (\d+)/)?.[1] ?? 0);
      add("amplifyAtk", Number(perShield[1]) * shields);
    }
  }
  for (const className of CLASSES) {
    if (getClassLevel(classLevels, className) >= 5) addTextBonuses(add, CLASS_BONUSES[className]?.levels[3]?.text);
  }
  for (const name of SUBJECTS) {
    if (isSubjectUnlocked(name, unlockedSubjects)) addTextBonuses(add, SUBJECT_DETAILS[name]?.trait);
  }

  // Every artifact/passive the run owns: the Subject's starting artifact plus the ones the player added
  // (each counts once — an artifact can't be owned twice, and a leveled passive's later levels aren't modelled).
  for (const item of getEquippedItems(run)) {
    for (const [key, value] of Object.entries(item.stats) as [StatKey, number][]) add(key, value);
  }

  // The Magic Circle's buff, while it is on: its Amplification Effect counts as Amplify ATK (added, checked with 0% Amplify).
  const circleLevel = run.magicCircleActive ? getMagicCircleLevel(run) : null;
  if (circleLevel !== null) add("amplifyAtk", magicCircleEffect(circleLevel));

  bonuses.cooldown = (1 - cooldownKept) * 100;

  const stats = emptyStatBlock();
  for (const key of Object.keys(stats) as StatKey[]) {
    const base = STAT_BASE[key];
    stats[key] = round2(base === undefined ? bonuses[key] : SCALED_STATS.has(key) ? base * (1 + bonuses[key] / 100) : base + bonuses[key]);
  }
  stats.lifeOrbRecovery = Math.round(stats.hp * LIFE_ORB_HP_FRACTION * (1 + bonuses.lifeOrbRecovery / 100));
  return stats;
}

/** What the dashboard shows: the computed starting stats plus the player's own adjustments. */
export function getRunStats(run: CurrentRunState): StatBlock {
  const starting = computeStartingStats(run);
  for (const key of Object.keys(starting) as StatKey[]) {
    starting[key] = Math.max(0, round2(starting[key] + run.statAdjustments[key]));
  }
  return starting;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
