import { BASE_MAGICS } from "../data/magics";
import { CLASS_BONUSES, SUBJECTS, SUBJECT_DETAILS, getClassLevel, isSubjectUnlocked } from "../data/classes";
import type { CurrentRunState } from "../types/game";
import { collectMagicEffects } from "./magicEffects";
import { getRunStats, stripMarkup } from "./runStats";

const MAGIC_ID_BY_NAME: Record<string, string> = Object.fromEntries(BASE_MAGICS.map((m) => [m.name, m.id]));
const PERMANENT_DAMAGE_BONUS = /^Increase (.+) Damage by (\d+(?:\.\d+)?)% \(All Classes\)$/;

/** N when `text` is "Increase <this magic> Damage by N% (All Classes)", else 0. */
function permanentBonusFor(magicId: string, text?: string): number {
  const match = text?.match(PERMANENT_DAMAGE_BONUS);
  return match && MAGIC_ID_BY_NAME[match[1]] === magicId ? Number(match[2]) : 0;
}

/**
 * The "(All Classes)" damage % the game grants one specific magic permanently, from two real
 * sources: the trait of every **unlocked Subject** (Wizard always is — e.g. its
 * "Increase Magic Bolt Damage by 5% (All Classes)"; the Subject in use has no special status) and the Lv5 bonus of every Class leveled to 5
 * (Wizard's "Increase Magic Bolt Damage by 20% (All Classes)"). In the game these feed one
 * per-magic ratio that adds up with "All Magic Damage" (`AllyUnitVar_MagicBulletDamageRatioU`
 * += the general ratio — see research/game-data-sources.md). Not included yet: a magic's own
 * level-ups, completed "Mastery" Synergies, artifacts, and a Class's character-level bonuses.
 */
export function permanentMagicDamageBonus(magicId: string, run: CurrentRunState): number {
  let total = 0;
  for (const name of SUBJECTS) {
    if (isSubjectUnlocked(name, run.meta.unlockedSubjects)) total += permanentBonusFor(magicId, SUBJECT_DETAILS[name]?.trait);
  }
  for (const [className, bonus] of Object.entries(CLASS_BONUSES)) {
    if (getClassLevel(run.meta.classLevels, className) >= 5) total += permanentBonusFor(magicId, bonus.levels[3]?.text);
  }
  return total;
}

const LEVEL_DAMAGE_TOOLTIP = /Every time the character gains (\d+) levels?, (.+?) Damage (\d+(?:\.\d+)?)% is/;

/**
 * The equipped class's tooltip bonus that grows with the character's level: "Every time the character
 * gains [5] levels, Magic Bolt Damage 〈3%〉 is added" (Wizard) or "... [1] levels, All Magic Damage 〈1%〉 ..."
 * (Scholar, Arcanist). The game multiplies the magic's base Damage by it (it is *not* added to the other
 * percentages): Wizard at character level 5 shows 1,025 x 1.03 = 1,056 (checked in game).
 */
export function characterLevelDamageMultiplier(magicId: string, run: CurrentRunState): number {
  const className = run.meta.characterClass;
  const tooltip = className ? CLASS_BONUSES[className]?.tooltip.text : undefined;
  const match = tooltip ? stripMarkup(tooltip).match(LEVEL_DAMAGE_TOOLTIP) : null;
  if (!match) return 1;
  const [, every, name, percent] = match;
  if (name !== "All Magic" && MAGIC_ID_BY_NAME[name] !== magicId) return 1;
  // The game builds this factor in 32-bit floats (1 + 6 x 0.01 = 1.0599999), which is why Wizard at level 10 shows
  // 1,086 and not 1,087 (1,025 x 1.06 = 1,086.5).
  return Math.fround(Math.fround(Math.floor(run.currentLevel / Number(every)) * Number(percent) * 0.01) + 1);
}

/**
 * What a magic's base Damage constant is multiplied by to get the number the game shows:
 * ATK x (1 + Amplify ATK) x (100 + All Magic Damage + the magic's permanent bonus + its level-up,
 * class and artifact damage lines (`collectMagicEffects`)) / 100.
 * Checked against two real screenshots: Bishop, ATK 100, Amplify +20%, Wizard Subject unlocked ->
 * Magic Bolt Lv1 5 x 100 x 1.2 x 1.05 = 630; Wizard/Wizard Lv3, ATK 100, Amplify 0% -> Magic Bolt
 * Lv2 5 x 100 x (100 + 5 + 100 from The Freeshooter)% = 1025.
 * `null` while ATK is 0 (nothing entered on the dashboard yet).
 */
export function magicDamageMultiplier(magicId: string, level: number, run: CurrentRunState): number | null {
  const { atk, amplifyAtk, magicDamage } = getRunStats(run);
  if (atk <= 0) return null;
  const bonus = permanentMagicDamageBonus(magicId, run) + collectMagicEffects(magicId, level, run).damagePct;
  return (atk * (1 + amplifyAtk / 100) * (100 + magicDamage + bonus) * characterLevelDamageMultiplier(magicId, run)) / 100;
}
