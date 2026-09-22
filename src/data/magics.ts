import { baseMagicImage, magicImage } from "../config/assets";
import type { BaseMagic } from "../types/game";

const LOWERCASE_WORDS = new Set(["of", "the"]);

/** Turns a camelCase id like "ageOfTheSun" into "Age of the Sun". */
export function titleCaseFromId(id: string): string {
  const words = id.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(" ");
  return words
    .map((word, index) =>
      index > 0 && LOWERCASE_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

/**
 * Base ("first tier") combat magics. These are the ingredients that combine in pairs
 * into fusion magics — see src/data/fusions.ts. Ids and sprite mapping are taken from
 * TomkoSK/magic-survival-builder's index.js.
 */
export const BASE_MAGICS: BaseMagic[] = [
  "thunderstorm",
  "meteor",
  "spirit",
  "electricShock",
  "energyBolt",
  "arcaneRay",
  "blizzard",
  "fireball",
  "flashShock",
  "magicBolt",
  "satellite",
  "cyclone",
  "incineration",
  "lavaZone",
  "electricZone",
  "tsunami",
  "frostNova",
  "shield",
  "armageddon",
  "intelligence",
  "magicCircle",
  "cloaking",
].map((id) => ({ id, name: titleCaseFromId(id) }));

export const BASE_MAGIC_BY_ID: Record<string, BaseMagic> = Object.fromEntries(
  BASE_MAGICS.map((m) => [m.id, m])
);

/**
 * Real max level per base magic, from the "최대레벨" (max level) column of
 * `eng_Dictionary_Ability.txt` (ids 1-21 for the active magics, id 31 for Intelligence, which
 * the game files as a passive) — not invented, and not a flat cap: 5 for Shield, Cloaking,
 * Armageddon, Magic Circle and Intelligence, 7 for every other base magic. Drives how many
 * level pips a magic's card shows in Owned Magic.
 */
/**
 * Each base magic's real one-line description — the first description line ("설명줄01") of its
 * row in `eng_Dictionary_Ability.txt` (English, already extracted the same way as the max
 * levels below; keeps the game's own `[]`/`{}`/`〈〉` markup for `GameText`). Intelligence's row
 * is filed by the game as a passive, so its "description" is its stat line.
 */
export const MAGIC_DESCRIPTION: Record<string, string> = {
  magicBolt: "Enhance the default projectile.",
  fireball: "Launch an explosive projectile.",
  spirit: "Summon a Spirit that augments attacks.",
  satellite: "Create a Satellite that rotates around the character.",
  frostNova: "[Freeze] nearby enemies for a moment.",
  shield: "Create a Shield that blocks damage 〈once〉.",
  thunderstorm: "A thunderstorm falls upon nearby enemies.",
  electricZone: "Damage nearby enemies over a certain interval.",
  tsunami: "Create a giant wave that crosses through the field.",
  meteor: "A meteor falls on a random location.",
  cloaking: "[Pass through] all objects for a moment, and increase [Movement Speed].",
  cyclone: "Cause a gust of wind that grows in size and deals damage.",
  electricShock: "Release electricity in a random direction.",
  armageddon: "Remove all enemies.",
  incineration: "Launch flames in front of the character.",
  energyBolt: "Fire a penetrating projectile nearby.",
  blizzard: "Raise a Blizzard that [freezes] enemies.",
  arcaneRay: "Shoot a ray that penetrates all objects.",
  magicCircle: "{Amplify} [ATK] for a certain duration.",
  lavaZone: "Create a Lava Zone that continuously damages enemies for a certain duration.",
  flashShock: "Create a flash that moves in the direction that the character is currently moving towards and damages enemies.",
  intelligence: "Increase ATK by 10%",
};

const MAGIC_MAX_LEVEL_OVERRIDES: Record<string, number> = {
  shield: 5,
  cloaking: 5,
  armageddon: 5,
  magicCircle: 5,
  intelligence: 5,
};
const DEFAULT_MAGIC_MAX_LEVEL = 7;

export function getMagicMaxLevel(magicId: string): number {
  return MAGIC_MAX_LEVEL_OVERRIDES[magicId] ?? DEFAULT_MAGIC_MAX_LEVEL;
}

/**
 * All 63 fusion sprites (including Exidium/Deus Ex Machina/Glacium/Soul Blade/Discharge,
 * which the original wiki-sourced dump was missing) now come from the real APK sprite
 * extraction — see scripts/organize-assets.mjs and research/game-data-sources.md.
 */
export function magicSpriteUrl(fusionId: string): string {
  return magicImage(`${fusionId}.png`);
}

/** The larger copy of a combination's portrait (`magicImages/large/`), for the Magic Combination detail. */
export function magicLargeSpriteUrl(fusionId: string): string {
  return magicImage(`large/${fusionId}.png`);
}

/**
 * Base magic icons, manually matched by eye against the wiki's own icon for each spell
 * (side-by-side comparison — no automated mapping exists for these, unlike fusions/
 * artifacts/passives/classes/subjects which all had a clean 1:1 id convention in the APK
 * dump). 19 of 22 are a confident visual match (e.g. the snowflake shape only fits Frost
 * Nova, the spiral only fits Cyclone). 3 are a best-effort guess, not confirmed against
 * gameplay — verify these in-game before trusting them fully:
 *  - meteor: no icon in the dump visually resembled the wiki's own (abstract/burst-style)
 *    Meteor icon; picked the one candidate that looks like a falling comet with a trail.
 *  - arcaneRay: no wiki reference icon was available to compare against at all (the wiki's
 *    Offensive Magics table lists "Scorching Ray" in this row instead, a discrepancy this
 *    project's fusion work already flagged — see game-data-sources.md); picked the
 *    remaining candidate that looks like a beam/ray effect.
 *  - intelligence: a stat-boost passive, not a projectile, so there was no strong visual
 *    signal to match against; picked the leftover unassigned candidate (a simple sparkle).
 * See research/game-data-sources.md for the full candidate grid this was chosen from.
 */
export function baseMagicSpriteUrl(magicId: string): string {
  return baseMagicImage(`${magicId}.png`);
}
