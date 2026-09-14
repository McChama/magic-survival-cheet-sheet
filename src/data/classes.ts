/**
 * Real in-game data, originally extracted directly from the game's own Spanish
 * localization files (spa_Dictionary_Class.txt inside data.unity3d) and cross-checked
 * against decompiled game code — not from a third-party wiki/spreadsheet. Names below are
 * translated to English per this project's language rule (see CLAUDE.md), sourced from
 * https://magic-survival-rpg.fandom.com/wiki/Classes and .../wiki/Subject, matched 1:1 to
 * the Spanish originals by the base magic/artifact each one grants (e.g. the Spanish
 * "Chamán" grants +1 Thunderstorm level, same as the wiki's "Shaman" — not a literal
 * translation of "Chamán", which the wiki itself doesn't use).
 *
 * Verification note: the game has exactly one selection screen for this axis
 * (V_Select_Class), and its confirm handler (Button_SelectClass) passes a single flat
 * integer id to the manager — confirming Class is genuinely one flat list of 24 options,
 * not a two-axis (Subject × Class) picker as an earlier community spreadsheet implied.
 * That spreadsheet's "Subject" column turned out to be its own organizational grouping,
 * not an in-game mechanic.
 *
 * CLASSES = the 24 starting schools ("학파" in the source dictionary). Each one grants
 * +1 level to one specific base magic at run start, plus a global % bonus to that magic
 * for everyone (visible in the in-game tooltip as "(all classes)").
 *
 * SUBJECTS = the 25 "실험체" (Experimental Subject) entries in the same dictionary — a
 * separate, permanent meta-progression unlock (costs 800 of a meta-currency each) that
 * grants a small global stat bonus plus a starting artifact. Note these mostly share
 * names with CLASSES (e.g. both have a "Wizard") because they're the same archetype at
 * two different power tiers — that's correct, not a bug; disambiguate in the UI by
 * section label if the duplication reads as confusing.
 */
export const CLASSES: string[] = [
  "Wizard",
  "Astronomer",
  "Cryomancer",
  "Shaman",
  "Warlock",
  "Arcanist",
  "Summoner",
  "Bishop",
  "Occultist",
  "Druid",
  "Pyromancer",
  "Sorcerer",
  "Alchemist",
  "Scholar",
  "Witch",
  "Electromancer",
  "Arbiter",
  "Archmage",
  "Archaeologist",
  "Magician",
  "Mage",
  "Battlemage",
  "Warlord",
  "Black Mage",
];

export const SUBJECTS: string[] = [
  "Wizard",
  "Astronomer",
  "Cryomancer",
  "Shaman",
  "Warlock",
  "Arcanist",
  "Summoner",
  "Bishop",
  "Occultist",
  "Druid",
  "Pyromancer",
  "Sorcerer",
  "Alchemist",
  "Scholar",
  "Witch",
  "Electromancer",
  "Arbiter",
  "Archmage",
  "Archaeologist",
  "Magician",
  "Mage",
  "Battlemage",
  "Warlord",
  "Black Mage",
  "Jack o' Lantern",
];

/**
 * Per-Subject detail copy shown on the Test Subject select screen (description +
 * highlighted trait line below the name). Sourced from
 * https://magic-survival-rpg.fandom.com/wiki/Subject (2026-09-14) — `description` is the
 * starting Artifact this Subject grants plus that artifact's own effect text; `trait` is
 * the permanent stat bonus unlocked just from buying the Subject for 800 gems (kept even
 * if the Subject isn't the one selected for the run). Both fields are the wiki's own
 * English text, unedited beyond joining its multi-line effect text into one sentence.
 */
export interface SubjectDetail {
  description?: string;
  trait?: string;
}

export const SUBJECT_DETAILS: Record<string, SubjectDetail> = {
  Wizard: { description: "Starts with The Freeshooter: Increase Magic Bolt Damage by 100%.", trait: "Magic Bolt Damage +5%" },
  Astronomer: { description: "Starts with Core Energy: Satellites explode whenever they deal damage to enemies. Increase the number of Satellites by 2.", trait: "Satellite Damage +5%" },
  Cryomancer: { description: "Starts with Moon Crystal: Permanently decreases the Movement Speed of an enemy who was first frozen by 10%. Increase Frost Nova Damage by 50%.", trait: "Frost Nova Damage +5%" },
  Shaman: { description: "Starts with Mjolnir: Increase the number of Thunderstorms by 50%.", trait: "Thunderstorm Damage +5%" },
  Warlock: { description: "Starts with Dimensional Gate: 20% chance to cast Meteor 1 more time when cast. Decrease Meteor Cooldown by 25%.", trait: "Meteor Damage +5%" },
  Arcanist: { description: "Starts with Mana Ore: Increase ATK by 25%.", trait: "ATK +2%" },
  Summoner: { description: "Starts with Magic Wand: Increase Damage by 10% per Spirit. Increase the number of Spirits by 2.", trait: "Spirit Damage +5%" },
  Bishop: { description: "Starts with Aegis: Amplify ATK by 3% for every 10% of Damage Taken. Decrease Damage Taken by 10%.", trait: "Damage Taken -2%" },
  Occultist: { description: "Starts with Otherworldly Tentacles: Increase Damage by 8% per Arcane Ray. Reduce Arcane Ray Cooldown by 10%.", trait: "Arcane Ray Damage +5%" },
  Druid: { description: "Starts with Palm Leaf Fan: Every 5 casts of Cyclone increases the next Cyclone's Damage and Size by 2X. Increase Cyclone Damage by 50%.", trait: "Cyclone Damage +5%" },
  Pyromancer: { description: "Starts with Phoenix's Bow: Deal 50% Additional Damage to an enemy directly hit by a Fireball. Increase Fireball Penetration by 1.", trait: "Fireball Damage +5%" },
  Sorcerer: { description: "Starts with Electric Cable: Increase Electric Shock Damage by 50%. Increase the number of Electric Shocks by 2.", trait: "Electric Shock Damage +5%" },
  Alchemist: { description: "Starts with Machine Arm: Increase Energy Bolt Damage by 35%. Increase the number of Energy Bolts by 35%.", trait: "Energy Bolt Damage +5%" },
  Scholar: { description: "Starts with Philosopher's Stone: Generate a large number of Mana Orbs. Amplify ATK by 10%.", trait: "Mana Acquisition +2%" },
  Witch: { description: "Starts with Sulfur: Lava Zone increases in size by 2% every second. Increase Lava Zone Damage by 80%.", trait: "Lava Zone Damage +5%" },
  Electromancer: { description: "Starts with Robot: Electric Zone deals 0.5% Additional Damage per character level.", trait: "Electric Zone Damage +5%" },
  Arbiter: { description: "Starts with Wave-calming Flute: Each cast of Tsunami increases Damage by 12% and decreases Cooldown by 12%. This effect resets after stacking 4 times.", trait: "Tsunami Damage +5%" },
  Archmage: { description: "Starts with Black Cat: Decrease All Magic Cooldown by 9%.", trait: "All Magic Cooldown -1%" },
  Archaeologist: { description: "Starts with Mimic: Cause an Explosion when obtaining a Treasure Chest, and create 10 random items nearby.", trait: "Item Pickup Range +5%" },
  Magician: { description: "Starts with Ether Arrow: Decrease Magic Bolt Cooldown by 20%. Decrease Spirit Cooldown by 20%.", trait: "Critical Strike Rate +1%" },
  Mage: { description: "Starts with Snowflake Crown: Each Blizzard increases Damage by 1%. Increase the number of Blizzards by 30%.", trait: "Blizzard Damage +5%" },
  Battlemage: { description: "Starts with Gàe Bolg: Increase Flash Shock Damage by 100%.", trait: "Flash Shock Damage +5%" },
  Warlord: { description: "Starts with Dragon's Breath: Each time an enemy is damaged by Incineration, the enemy receives 1% additional damage. Increase Incineration Damage by 50%.", trait: "Incineration Damage +5%" },
  "Black Mage": { description: "Starts with Exorcism: Decrease the Max HP of all enemies by 3%. Increase Mana Acquisition from killing enemies by 20%.", trait: "All Magic Size +2%" },
  "Jack o' Lantern": { description: "Starts with Lantern: Increase Mana Orb Acquisition by 10%. Increase Item Pickup Range by 20%.", trait: "Evasion +1%" },
};

/**
 * Per-Class level-up bonuses (Research Material spent on a class grants these as it hits
 * Lv2/3/4/5), shown on the Class select screen once someone wires it in — not implemented
 * yet, just extracted. Sourced from
 * https://magic-survival-rpg.fandom.com/wiki/Classes (2026-09-14), which already uses this
 * project's exact class names (unlike the older community spreadsheet at
 * reference/Magic Survival Information Spreadsheet [0.935] - Classes.csv, which uses
 * different names for some classes — e.g. "Arcane Scholar" for Arcanist, "Mystic" for
 * Occultist — see reference/game-data-sources.md for the full name-mapping note and a
 * flagged wiki transcription artifact affecting 3 classes).
 *
 * `note` is the passive scaling text shown as a tooltip alongside the Lv1 bonus (e.g. "every
 * N levels, damage +X%"). `bonuses` is every other bullet, in order — Lv1 (sometimes folded
 * into `note`'s bullet instead, for classes whose Lv1 grants something other than a plain
 * "<Magic> Lv +1") through the permanent bonus unlocked at max level. Most classes have
 * exactly 4 entries in `bonuses`; a few (Bishop, Scholar, Archmage) have 5 because their Lv1
 * bonus wasn't folded into the summary bullet the way the others were — kept as scraped
 * rather than forced into a uniform shape.
 */
export interface ClassBonus {
  note: string;
  bonuses: string[];
}

export const CLASS_BONUSES: Record<string, ClassBonus> = {
  Wizard: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Magic Bolt Lv +1", "Cooldown -20%", "Number +1", "Damage +20% (permanent)"] },
  Astronomer: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Satellite Lv +1", "Rotation Speed +50%", "Number +35%", "Damage +20% (permanent)"] },
  Cryomancer: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Frost Nova Lv +1", "Cooldown -20%", "Size +25%", "Damage +20% (permanent)"] },
  Shaman: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Thunderstorm Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  Warlock: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Meteor Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  // Wiki's entry opens with a stray "Magic Bolt Lv +1" bullet that doesn't match Arcanist's
  // own granted ability (Intelligence) or the community spreadsheet's version — dropped as
  // an apparent copy/paste artifact from the Wizard row. See reference/game-data-sources.md.
  Arcanist: { note: "Every 1 level, All Magic Damage 1% is added. Reduce Magic Choices by 1 and disable Mana Recovery.", bonuses: ["Intelligence Lv +1", "Mana Acquisition +10%", "Amplify ATK +10%", "ATK +5% (permanent)"] },
  Summoner: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Spirit Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  Bishop: { note: "For each active Shield, ATK is Amplified by 10%", bonuses: ["Magic Bolt & Shield Lv +1", "Guardian Angel (Revive 1 more time. Increase Max HP by 30%)", "Cooldown -20%", "Number +1", "Damage Taken -5% (permanent)"] },
  Occultist: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Arcane Ray Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  Druid: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Cyclone Lv +1", "Cooldown -20%", "Number +1", "Damage +20% (permanent)"] },
  Pyromancer: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Fireball Lv +1", "Cooldown -20%", "Number +1", "Damage +20% (permanent)"] },
  Sorcerer: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Electric Shock Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  Alchemist: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Energy Bolt Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  Scholar: { note: "Every 1 level, All Magic Damage +1%", bonuses: ["Start Level +3", "Doctor (Increase Max Level by 3)", "Mana Recovery +30%", "Chance to have 4 Magic choices +50%", "Mana Acquisition +5% (permanent)"] },
  Witch: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Lava Zone Lv +1", "Cooldown -20%", "Number +1", "Damage +20% (permanent)"] },
  Electromancer: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Electric Zone Lv +1", "Damage Interval -20%", "Size +25%", "Damage +20% (permanent)"] },
  Arbiter: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Tsunami Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  Archmage: { note: "Combination Magic Damage +50%", bonuses: ["Start Level +3", "Magic Circle Lv +1", "Silent Casting (Decrease All Magic Cooldown by 7%)", "Combination Magic Damage +50%", "All Magic Cooldown -3% (permanent)"] },
  // Same stray-bullet issue as Arcanist: dropped a leading "Magic Bolt Lv +1" that doesn't
  // match Archaeologist's own granted ability (Explorer).
  Archaeologist: { note: "Every 15 levels, Treasure Chest is created", bonuses: ["Explorer Lv +1", "Mana Acquisition +10%", "Treasure Chest Frequency +10%", "Item Pickup Range +20% (permanent)"] },
  Magician: { note: "Chance for a Magic Bolt to turn into a random projectile +20% (Electric Shock, Fireball, Spirit, or Energy Bolt)", bonuses: ["Magic Bolt Lv +1", "Chance for a Magic Bolt to turn into a random projectile +5%", "Chance for a Magic Bolt to turn into a random projectile +5%", "Critical Strike Rate +3% (permanent)"] },
  Mage: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Blizzard Lv +1", "Cooldown -20%", "Number +35%", "Damage +20% (permanent)"] },
  Battlemage: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Flash Shock Lv +1", "Cooldown -20%", "Size +25%", "Damage +20% (permanent)"] },
  Warlord: { note: "Every 5 levels, Damage 3% is added", bonuses: ["Incineration Lv +1", "Cooldown -20%", "Size +25%", "Damage +20% (permanent)"] },
  // Same stray-bullet issue as Arcanist/Archaeologist: dropped a leading "Magic Bolt Lv +1"
  // that doesn't match Black Mage's own granted ability (Arcane Effuse).
  "Black Mage": { note: "Enemy Explosion chance when killed +10% (Explosion Damage is 75% of the enemy's Max HP)", bonuses: ["Arcane Effuse Lv +1", "Enemy Explosion chance when killed +5%", "Enemy Explosion chance when killed +5%", "All Magic Size +3% (permanent)"] },
};
