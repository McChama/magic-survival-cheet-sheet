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
 * highlighted trait line below the name). Sourced directly from the game's own English
 * dictionary (`eng_Dictionary_Class.txt` inside `data.unity3d`, ids 41-65 — Subjects are
 * "실험체"/"Experimental Subject" rows in the same file that also holds Classes, ids 1-24)
 * rather than the wiki, since the in-game text is much terser than the wiki's rewritten
 * sentences: `description` is just the bare name of the starting Artifact this Subject
 * grants (already in `artifacts.ts` — cross-checked by matching each row's numeric artifact
 * reference against that file's `// source id N` comments, all 24 matched exactly); `trait`
 * is the game's own one-line permanent stat bonus text, unpicked from the wiki's shorter
 * paraphrase (e.g. "Increase Satellite Damage by 5% (All Classes)", not "Satellite Damage
 * +5%"). This corrected two wrong artifact names the wiki's Subject page had: Scholar grants
 * **Starlight**, not "Philosopher's Stone"; Archaeologist grants **Pyramid**, not "Mimic"
 * (both "Philosopher's Stone" and "Mimic" are real, different artifacts already in
 * `artifacts.ts` — just not the ones these two Subjects actually give).
 *
 * Wizard is the one exception: its dictionary row has no artifact-name line at all (only
 * the trait line), even though the wiki and `artifacts.ts` (source id 209, "Freeshooter")
 * agree Wizard should grant one — left as `description: "Freeshooter"` on that outside
 * evidence, but flagged here since it's the one entry not confirmed by this row's own
 * numeric artifact reference the way all 24 others were.
 */
export interface SubjectDetail {
  description?: string;
  trait?: string;
}

export const SUBJECT_DETAILS: Record<string, SubjectDetail> = {
  Wizard: { description: "Freeshooter", trait: "Increase Magic Bolt Damage by 5% (All Classes)" },
  Astronomer: { description: "Core Energy", trait: "Increase Satellite Damage by 5% (All Classes)" },
  Cryomancer: { description: "Moon Crystal", trait: "Increase Frost Nova Damage by 5% (All Classes)" },
  Shaman: { description: "Mjolnir", trait: "Increase Thunderstorm Damage by 5% (All Classes)" },
  Warlock: { description: "Dimensional Gate", trait: "Increase Meteor Damage by 5% (All Classes)" },
  Arcanist: { description: "Mana Ore", trait: "Increase ATK by 2% (All Classes)" },
  Summoner: { description: "Magic Wand", trait: "Increase Spirit Damage by 5% (All Classes)" },
  Bishop: { description: "Aegis", trait: "Decrease Damage Taken by 2% (All Classes)" },
  Occultist: { description: "Otherworldly Tentacles", trait: "Increase Arcane Ray Damage by 5% (All Classes)" },
  Druid: { description: "Palm Leaf Fan", trait: "Increase Cyclone Damage by 5% (All Classes)" },
  Pyromancer: { description: "Phoenix's Bow", trait: "Increase Fireball Damage by 5% (All Classes)" },
  Sorcerer: { description: "Electric Cable", trait: "Increase Electric Shock Damage by 5% (All Classes)" },
  Alchemist: { description: "Machine Arm", trait: "Increase Energy Bolt Damage by 5% (All Classes)" },
  Scholar: { description: "Starlight", trait: "Increase Mana Acquisition by 2% (All Classes)" },
  Witch: { description: "Sulfur", trait: "Increase Lava Zone Damage by 5% (All Classes)" },
  Electromancer: { description: "Robot", trait: "Increase Electric Zone Damage by 5% (All Classes)" },
  Arbiter: { description: "Wave-calming Flute", trait: "Increase Tsunami Damage by 5% (All Classes)" },
  Archmage: { description: "Black Cat", trait: "Decrease All Magic Cooldown by 1% (All Classes)" },
  Archaeologist: { description: "Pyramid", trait: "Increase Item Pickup Range by 5% (All Classes)" },
  Magician: { description: "Ether Arrow", trait: "Increase Critical Strike Rate by 1% (All Classes)" },
  Mage: { description: "Snowflake Crown", trait: "Increase Blizzard Damage by 5% (All Classes)" },
  Battlemage: { description: "Gàe Bolg", trait: "Increase Flash Shock Damage by 5% (All Classes)" },
  Warlord: { description: "Dragon's Breath", trait: "Increase Incineration Damage by 5% (All Classes)" },
  "Black Mage": { description: "Exorcism", trait: "Increase All Magic Size by 2% (All Classes)" },
  "Jack o' Lantern": { description: "Lantern", trait: "Increase Evasion by 1% (All Classes)" },
};

/**
 * Per-Class level-up bonuses (Research Material spent on a class grants these as it hits
 * Lv2/3/4/5), shown on the Class select screen once someone wires it in — not implemented
 * yet, just extracted. Sourced directly from the game's own English dictionary
 * (`eng_Dictionary_Class.txt` inside `data.unity3d`, ids 1-24), the same file
 * `SUBJECT_DETAILS` above comes from — this replaced an earlier wiki-sourced version of
 * this data (https://magic-survival-rpg.fandom.com/wiki/Classes) once the real dictionary
 * turned up, since the wiki rewrites the text into full sentences the game never actually
 * shows (see `SUBJECT_DETAILS`'s doc comment for the same issue on the Subject side). All
 * text below is the game's own English, verbatim, including its own
 * 【】〈〉《》[]{}『』〔〕@ marker formatting (same convention `artifacts.ts`/`passives.ts` use —
 * see CLAUDE.md's language rule) — `@` marks a line break within a single displayed field.
 *
 * `tooltip` is the line shown for the Lv1 bonus, which for most classes names the ability
 * in 〔brackets〕 plus a passive per-level scaling note (e.g. "every 5 levels, damage +3%").
 * `levels` is the 4 bonuses granted at Lv1 through Lv4 (Lv4 is always the permanent
 * "(All Classes)" one), in order. A few classes (Arcanist, Archaeologist, Black Mage) have a
 * `tooltip` that names "Magic Bolt" even though their own Lv1 bonus in `levels[0]` is
 * something else (Intelligence/Explorer/Arcane Effuse) — confirmed real, not a data error:
 * the dictionary genuinely shows that flavor line for all three, most likely leftover
 * design-doc text never updated.
 */
export interface ClassBonus {
  tooltip: string;
  levels: [string, string, string, string];
}

export const CLASS_BONUSES: Record<string, ClassBonus> = {
  Wizard: { tooltip: "〔Magic Bolt Lv +1〕 @ Every time the character gains [5] levels, Magic Bolt Damage 〈3%〉 is 『added』", levels: ["Magic Bolt Lv +1", "Decrease Magic Bolt Cooldown by 20%", "Increase the number of Magic Bolts by 1", "Increase Magic Bolt Damage by 20% (All Classes)"] },
  Astronomer: { tooltip: "〔Satellite Lv +1〕 @ Every time the character gains [5] levels, Satellite Damage 〈3%〉 is 『added』", levels: ["Satellite Lv +1", "Increase Satellite Rotation Speed by 50%", "Increase the number of Satellites by 35%", "Increase Satellite Damage by 20% (All Classes)"] },
  Cryomancer: { tooltip: "〔Frost Nova Lv +1〕 @ Every time the character gains [5] levels, Frost Nova Damage 〈3%〉 is 『added』", levels: ["Frost Nova Lv +1", "Decrease Frost Nova Cooldown by 20%", "Increase Frost Nova Size by 25%", "Increase Frost Nova Damage by 20% (All Classes)"] },
  Shaman: { tooltip: "〔Thunderstorm Lv +1〕 @ Every time the character gains [5] levels, Thunderstorm Damage 〈3%〉 is 『added』", levels: ["Thunderstorm Lv +1", "Decrease Thunderstorm Cooldown by 20%", "Increase the number of Thunderstorms by 35%", "Increase Thunderstorm Damage by 20% (All Classes)"] },
  Warlock: { tooltip: "〔Meteor Lv +1〕 @ Every time the character gains [5] levels, Meteor Damage 〈3%〉 is 『added』", levels: ["Meteor Lv +1", "Decrease Meteor Cooldown by 20%", "Increase the number of Meteors by 1", "Increase Meteor Damage by 20% (All Classes)"] },
  Arcanist: { tooltip: "〔Magic Bolt Lv +1〕 @ Every time the character gains [1] levels, All Magic Damage 〈1%〉 is {added} @ Reduce Magic Choices by 【1】 and disable [Mana Recovery]", levels: ["Intelligence Lv +1", "Increase Mana Acquisition by 10%", "Amplify ATK by 10%", "Increase ATK by 5% (All Classes)"] },
  Summoner: { tooltip: "〔Spirit Lv +1〕 @ Every time the character gains [5] levels, Spirit Damage 〈3%〉 is 『added』", levels: ["Spirit Lv +1", "Decrease Spirit Cooldown by 20%", "Increase the number of Spirits by 35%", "Increase Spirit Damage by 20% (All Classes)"] },
  Bishop: { tooltip: "〔Magic Bolt [&] Shield Lv +1〕 @ For each active Shield, ATK is {Amplified} by 〈10%〉 @ 『Shield remains active even when used in Combination Magic.』", levels: ["Guardian Angel Lv +1", "Decrease Shield Cooldown by 20%", "Increase the maximum number of Shields by 1", "Decrease Damage Taken by 5% (All Classes)"] },
  Occultist: { tooltip: "〔Arcane Ray Lv +1〕 @ Every time the character gains [5] levels, Arcane Ray Damage 〈3%〉 is 『added』", levels: ["Arcane Ray Lv +1", "Decrease Arcane Ray Cooldown by 20%", "Increase the number of Arcane Rays by 35%", "Increase Arcane Ray Damage by 20% (All Classes)"] },
  Druid: { tooltip: "〔Cyclone Lv +1〕 @ Every time the character gains [5] levels, Cyclone Damage 〈3%〉 is 『added』", levels: ["Cyclone Lv +1", "Decrease Cyclone Cooldown by 20%", "Increase the number of Cyclones by 1", "Increase Cyclone Damage by 20% (All Classes)"] },
  Pyromancer: { tooltip: "〔Fireball Lv +1〕 @ Every time the character gains [5] levels, Fireball Damage 〈3%〉 is 『added』", levels: ["Fireball Lv +1", "Decrease Fireball Cooldown by 20%", "Increase the number of Fireballs by 1", "Increase Fireball Damage by 20% (All Classes)"] },
  Sorcerer: { tooltip: "〔Electric Shock Lv +1〕 @ Every time the character gains [5] levels, Electric Shock Damage 〈3%〉 is 『added』", levels: ["Electric Shock Lv +1", "Decrease Electric Shock Cooldown by 20%", "Increase the number of Electric Shocks by 35%", "Increase Electric Shock Damage by 20% (All Classes)"] },
  Alchemist: { tooltip: "〔Energy Bolt Lv +1〕 @ Every time the character gains [5] levels, Energy Bolt Damage 〈3%〉 is 『added』", levels: ["Energy Bolt Lv +1", "Decrease Energy Bolt Cooldown by 20%", "Increase the number of Energy Bolts by 35%", "Increase Energy Bolt Damage by 20% (All Classes)"] },
  Scholar: { tooltip: "〔Start Level +3〕 @ Every time the character gains [1] level, All Magic Damage increases by 〈1%〉", levels: ["Doctor Lv +1", "Retrieve 〈30%〉 more Mana when retrieving Mana.", "〈50%〉 increased chance to have [4] Magic choices.", "Increase Mana Acquisition by 5% (All Classes)"] },
  Witch: { tooltip: "〔Lava Zone Lv +1〕 @ Every time the character gains [5] levels, Lava Zone Damage 〈3%〉 is 『added』", levels: ["Lava Zone Lv +1", "Decrease Lava Zone Cooldown by 20%", "Increase the number of Lava Zones by 1", "Increase Lava Zone Damage by 20% (All Classes)"] },
  Electromancer: { tooltip: "〔Electric Zone Lv +1〕 @ Every time the character gains [5] levels, Electric Zone Damage 〈3%〉 is 『added』", levels: ["Electric Zone Lv +1", "Decrease Electric Zone Damage Interval by 20%", "Increase Electric Zone Size by 25%", "Increase Electric Zone Damage by 20% (All Classes)"] },
  Arbiter: { tooltip: "〔Tsunami Lv +1〕 @ Every time the character gains [5] levels, Tsunami Damage 〈3%〉 is 『added』", levels: ["Tsunami Lv +1", "Decrease Tsunami Cooldown by 20%", "Increase the number of Tsunamis by 35%", "Increase Tsunami Damage by 20% (All Classes)"] },
  Archmage: { tooltip: "〔Start Level +3〕 @ [Combination Magic] Damage increases by 〈50%〉", levels: ["Magic Circle Lv +1", "Silent Casting Lv +1", "Increase [Combination Magic] Damage by 〈50%〉.", "Decrease All Magic Cooldown by 3% (All Classes)"] },
  Archaeologist: { tooltip: "〔Magic Bolt Lv +1〕 @ A [Treasure Chest] is created for every [20] Character levels.", levels: ["Explorer Lv +1", "Increase Mana Acquisition by 10%", "[Treasure Chests] are created 〈10%〉 more frequently.", "Increase Item Pickup Range by 20% (All Classes)"] },
  Magician: { tooltip: "〔Magic Bolt Lv +1〕 @ 〈20%〉 increased chance for a Magic Bolt to turn into a [random projectile].", levels: ["Magic Bolt Lv +1", "〈5%〉 increased chance for a Magic Bolt to be transformed into a [random projectile].", "〈5%〉 increased chance for a Magic Bolt to be transformed into a [random projectile].", "Increase Critical Strike Rate by 3% (All Classes)"] },
  Mage: { tooltip: "〔Blizzard Lv +1〕 @ Every time the character gains [5] levels, Blizzard Damage 〈3%〉 is 『added』", levels: ["Blizzard Lv +1", "Decrease Blizzard Cooldown by 20%", "Increase the number of Blizzards by 35%", "Increase Blizzard Damage by 20% (All Classes)"] },
  Battlemage: { tooltip: "〔Flash Shock Lv +1〕 @ Every time the character gains [5] levels, Flash Shock Damage 〈3%〉 is 『added』", levels: ["Flash Shock Lv +1", "Decrease Flash Shock Cooldown by 20%", "Increase Flash Shock Size by 25%", "Increase Flash Shock Damage by 20% (All Classes)"] },
  Warlord: { tooltip: "〔Incineration Lv +1〕 @ Every time the character gains [5] levels, Incineration Damage 〈3%〉 is 『added』", levels: ["Incineration Lv +1", "Decrease Incineration Cooldown by 20%", "Increase Incineration Size by 25%", "Increase Incineration Damage by 20% (All Classes)"] },
  "Black Mage": { tooltip: "〔Magic Bolt Lv +1〕 @ 〈10%〉 chance to cause an [Explosion] when killing an enemy. @ 『(Explosion Damage is 75% of the enemy's Max HP)』", levels: ["Arcane Effuse Lv +1", "〈5%〉 increased chance for enemies to [explode] when killed", "〈5%〉 increased chance for enemies to [explode] when killed", "Increase All Magic Size by 3% (All Classes)"] },
};
