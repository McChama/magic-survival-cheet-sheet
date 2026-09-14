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
 * All 63 fusion sprites (including Exidium/Deus Ex Machina/Glacium/Soul Blade/Discharge,
 * which the original wiki-sourced dump was missing) now come from the real APK sprite
 * extraction — see scripts/organize-assets.mjs and reference/game-data-sources.md.
 */
export function magicSpriteUrl(fusionId: string): string {
  return magicImage(`${fusionId}.png`);
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
 * See reference/game-data-sources.md for the full candidate grid this was chosen from.
 */
export function baseMagicSpriteUrl(magicId: string): string {
  return baseMagicImage(`${magicId}.png`);
}
