import { BASE_MAGICS } from "./magics";

/**
 * Real in-game data, originally extracted directly from the game's own Spanish
 * localization files (spa_Dictionary_Class.txt inside data.unity3d) and cross-checked
 * against the game itself — not from a third-party wiki/spreadsheet. Names below are
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
 * the trait line), even though the wiki and `artifacts.ts` (source id 209, "The
 * Freeshooter") agree Wizard should grant one — left as `description: "The Freeshooter"`
 * on that outside evidence, but flagged here since it's the one entry not confirmed by
 * this row's own numeric artifact reference the way all 24 others were.
 */
export interface SubjectDetail {
  description?: string;
  trait?: string;
}

/** The one Subject every player starts with: always unlocked, and it can't be locked. */
export const ALWAYS_UNLOCKED_SUBJECT = SUBJECTS[0];

/** Whether a Subject counts as unlocked given the player's saved list (Wizard always does). */
export function isSubjectUnlocked(name: string, unlockedSubjects: readonly string[]): boolean {
  return name === ALWAYS_UNLOCKED_SUBJECT || unlockedSubjects.includes(name);
}

/** Falls back to `SUBJECTS[0]` ("Wizard") for any unrecognized name, matching the store's own default. */
export function getSubjectDetail(name: string): SubjectDetail | null {
  return SUBJECT_DETAILS[name] ?? SUBJECT_DETAILS[SUBJECTS[0]] ?? null;
}

export const SUBJECT_DETAILS: Record<string, SubjectDetail> = {
  Wizard: { description: "The Freeshooter", trait: "Increase Magic Bolt Damage by 5% (All Classes)" },
  Astronomer: { description: "Core Energy", trait: "Increase Satellite Damage by 5% (All Classes)" },
  Cryomancer: { description: "Moon Crystal", trait: "Increase Frost Nova Damage by 5% (All Classes)" },
  Shaman: { description: "Mjolnir", trait: "Increase Thunderstorm Damage by 5% (All Classes)" },
  Warlock: { description: "Dimensional Gate", trait: "Increase Meteor Damage by 5% (All Classes)" },
  Arcanist: { description: "Mana Ore", trait: "Increase ATK by 2% (All Classes)" },
  Summoner: { description: "Magic Wand", trait: "Increase Spirit Damage by 5% (All Classes)" },
  Bishop: { description: "Aegis", trait: "Decrease Damage Taken by 2% (All Classes)" },
  Occultist: { description: "Otherworldly Tentacle", trait: "Increase Arcane Ray Damage by 5% (All Classes)" },
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
 * Per-Class level-up bonuses — specifically the **Lv2 through Lv5** bonuses (4 entries).
 * Class Level 1 is a free baseline with none of these active yet; see
 * `RunMeta.classLevels`'s doc comment in `types/game.ts` for the confirmed 1-5 level range
 * (source: https://magic-survival-rpg.fandom.com/wiki/Classes, per-class progression, not a
 * single run-wide number) and `ClassSelectScreen.tsx` for how a class's own level (via
 * `getClassLevel`) maps to how many of these 4 `levels` entries are unlocked (level - 1).
 * Sourced directly from the game's own English dictionary (`eng_Dictionary_Class.txt`
 * inside `data.unity3d`, ids 1-24), the same file `SUBJECT_DETAILS` above comes from.
 *
 * **Corrected 2026-09-15**: the first pass of this data (a) dropped the `tooltip` line
 * entirely from the rendered UI (it was extracted into this file but no component ever
 * read it — the user caught this by comparing against an actual in-game screenshot), (b)
 * invented a shared 4-slot color pattern (`DEFAULT_LEVEL_CLASSNAMES`: celeste/white/
 * celeste/blue for every class) that doesn't match the real per-line colors the dictionary
 * encodes — e.g. Arcanist's own Lv3 line is green (`#64FF32`) and Lv4 is pink (`#FF76DE`),
 * not the "standard" blue — and (c) treated Lv1 as already granting `levels[0]` for free,
 * which the wiki's own text disproved ("Each class requires 45 Research Material to unlock
 * (3 for Lv2, 6 for Lv3, 12 for Lv4, 24 for Lv5)... Once acquired, the Lv5 bonus is
 * permanent" — Lv1 costs nothing and grants nothing on its own; `levels[3]`, the
 * "(All Classes)" one, is that permanent Lv5 bonus). Every line now carries its *own* real
 * hex `color` straight from the dictionary's `<color=#RRGGBB>` tag for that line, instead
 * of a guessed shared progression — there is no "standard" pattern, it genuinely varies per
 * class per line.
 *
 * `tooltip` is the Lv1 flavor/scaling line (dictionary column L1) — shown regardless of the
 * class's own level since it's not itself one of the 4 gated bonuses. For most classes
 * this names the ability once in 〔brackets〕 plus a per-level scaling note (e.g. "every 5
 * levels, damage +3%"); a few classes (Arcanist, Archaeologist, Black Mage) have a
 * `tooltip` that names "Magic Bolt" even though their own `levels[0]` (Lv2) bonus is
 * something else (Intelligence/Explorer/Arcane Effuse) — confirmed real dictionary text,
 * not a data error, most likely leftover design-doc flavor text never updated.
 * `levels` is columns L2-L5 — the Lv2 through Lv5 bonuses (Lv5, `levels[3]`, always the
 * permanent "(All Classes)" one). All text keeps the game's own `@`(line break)/
 * 〔〕〈〉《》[]{}『』【】 marker formatting verbatim (same convention `artifacts.ts` uses) —
 * render through `<GameText>` (`src/components/shared/GameText.tsx`), which strips the
 * bracket characters and colors 4 of the 7 bracket types per a worked example the user
 * provided from the real game (〔〕 cyan, `[]` pale yellow, `〈〉` green, `『』` pink);
 * `{}`/`【】`/`《》` have no confirmed color yet and just inherit the line's own color — see
 * that component's header comment before "fixing" one of those to a guessed color.
 */
export interface ClassBonusLine {
  text: string;
  /** Hex color straight from the dictionary's `<color=#RRGGBB>` tag for this line. */
  color: string;
}

export interface ClassBonus {
  tooltip: ClassBonusLine;
  levels: [ClassBonusLine, ClassBonusLine, ClassBonusLine, ClassBonusLine];
}

export const CLASS_BONUSES: Record<string, ClassBonus> = {
  Wizard: { tooltip: { text: "〔Magic Bolt Lv +1〕 @ Every time the character gains [5] levels, Magic Bolt Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Magic Bolt Lv +1", color: "#32FFE1" }, { text: "Decrease Magic Bolt Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Magic Bolts by 1", color: "#6EDCFF" }, { text: "Increase Magic Bolt Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Astronomer: { tooltip: { text: "〔Satellite Lv +1〕 @ Every time the character gains [5] levels, Satellite Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Satellite Lv +1", color: "#32FFE1" }, { text: "Increase Satellite Rotation Speed by 50%", color: "#6EDCFF" }, { text: "Increase the number of Satellites by 35%", color: "#6EDCFF" }, { text: "Increase Satellite Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Cryomancer: { tooltip: { text: "〔Frost Nova Lv +1〕 @ Every time the character gains [5] levels, Frost Nova Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Frost Nova Lv +1", color: "#32FFE1" }, { text: "Decrease Frost Nova Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase Frost Nova Size by 25%", color: "#6EDCFF" }, { text: "Increase Frost Nova Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Shaman: { tooltip: { text: "〔Thunderstorm Lv +1〕 @ Every time the character gains [5] levels, Thunderstorm Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Thunderstorm Lv +1", color: "#32FFE1" }, { text: "Decrease Thunderstorm Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Thunderstorms by 35%", color: "#6EDCFF" }, { text: "Increase Thunderstorm Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Warlock: { tooltip: { text: "〔Meteor Lv +1〕 @ Every time the character gains [5] levels, Meteor Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Meteor Lv +1", color: "#32FFE1" }, { text: "Decrease Meteor Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Meteors by 1", color: "#6EDCFF" }, { text: "Increase Meteor Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Arcanist: { tooltip: { text: "〔Magic Bolt Lv +1〕 @ Every time the character gains [1] levels, All Magic Damage 〈1%〉 is {added} @ Reduce Magic Choices by 【1】 and disable [Mana Recovery]", color: "#EBEBEB" }, levels: [{ text: "Intelligence Lv +1", color: "#32FFE1" }, { text: "Increase Mana Acquisition by 10%", color: "#64FF32" }, { text: "Amplify ATK by 10%", color: "#FF76DE" }, { text: "Increase ATK by 5% (All Classes)", color: "#FF76DE" }] },
  Summoner: { tooltip: { text: "〔Spirit Lv +1〕 @ Every time the character gains [5] levels, Spirit Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Spirit Lv +1", color: "#32FFE1" }, { text: "Decrease Spirit Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Spirits by 35%", color: "#6EDCFF" }, { text: "Increase Spirit Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Bishop: { tooltip: { text: "〔Magic Bolt [&] Shield Lv +1〕 @ For each active Shield, ATK is {Amplified} by 〈10%〉 @ 『Shield remains active even when used in Combination Magic.』", color: "#EBEBEB" }, levels: [{ text: "Guardian Angel Lv +1", color: "#EB96FF" }, { text: "Decrease Shield Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the maximum number of Shields by 1", color: "#6EDCFF" }, { text: "Decrease Damage Taken by 5% (All Classes)", color: "#FF76DE" }] },
  Occultist: { tooltip: { text: "〔Arcane Ray Lv +1〕 @ Every time the character gains [5] levels, Arcane Ray Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Arcane Ray Lv +1", color: "#32FFE1" }, { text: "Decrease Arcane Ray Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Arcane Rays by 35%", color: "#6EDCFF" }, { text: "Increase Arcane Ray Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Druid: { tooltip: { text: "〔Cyclone Lv +1〕 @ Every time the character gains [5] levels, Cyclone Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Cyclone Lv +1", color: "#32FFE1" }, { text: "Decrease Cyclone Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Cyclones by 1", color: "#6EDCFF" }, { text: "Increase Cyclone Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Pyromancer: { tooltip: { text: "〔Fireball Lv +1〕 @ Every time the character gains [5] levels, Fireball Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Fireball Lv +1", color: "#32FFE1" }, { text: "Decrease Fireball Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Fireballs by 1", color: "#6EDCFF" }, { text: "Increase Fireball Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Sorcerer: { tooltip: { text: "〔Electric Shock Lv +1〕 @ Every time the character gains [5] levels, Electric Shock Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Electric Shock Lv +1", color: "#32FFE1" }, { text: "Decrease Electric Shock Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Electric Shocks by 35%", color: "#6EDCFF" }, { text: "Increase Electric Shock Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Alchemist: { tooltip: { text: "〔Energy Bolt Lv +1〕 @ Every time the character gains [5] levels, Energy Bolt Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Energy Bolt Lv +1", color: "#32FFE1" }, { text: "Decrease Energy Bolt Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Energy Bolts by 35%", color: "#6EDCFF" }, { text: "Increase Energy Bolt Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Scholar: { tooltip: { text: "〔Start Level +3〕 @ Every time the character gains [1] level, All Magic Damage increases by 〈1%〉", color: "#EBEBEB" }, levels: [{ text: "Doctor Lv +1", color: "#EB96FF" }, { text: "Retrieve 〈30%〉 more Mana when retrieving Mana.", color: "#EBEBEB" }, { text: "〈50%〉 increased chance to have [4] Magic choices.", color: "#EBEBEB" }, { text: "Increase Mana Acquisition by 5% (All Classes)", color: "#FF76DE" }] },
  Witch: { tooltip: { text: "〔Lava Zone Lv +1〕 @ Every time the character gains [5] levels, Lava Zone Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Lava Zone Lv +1", color: "#32FFE1" }, { text: "Decrease Lava Zone Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Lava Zones by 1", color: "#6EDCFF" }, { text: "Increase Lava Zone Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Electromancer: { tooltip: { text: "〔Electric Zone Lv +1〕 @ Every time the character gains [5] levels, Electric Zone Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Electric Zone Lv +1", color: "#32FFE1" }, { text: "Decrease Electric Zone Damage Interval by 20%", color: "#6EDCFF" }, { text: "Increase Electric Zone Size by 25%", color: "#6EDCFF" }, { text: "Increase Electric Zone Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Arbiter: { tooltip: { text: "〔Tsunami Lv +1〕 @ Every time the character gains [5] levels, Tsunami Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Tsunami Lv +1", color: "#32FFE1" }, { text: "Decrease Tsunami Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Tsunamis by 35%", color: "#6EDCFF" }, { text: "Increase Tsunami Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Archmage: { tooltip: { text: "〔Start Level +3〕 @ [Combination Magic] Damage increases by 〈50%〉", color: "#EBEBEB" }, levels: [{ text: "Magic Circle Lv +1", color: "#32FFE1" }, { text: "Silent Casting Lv +1", color: "#EB96FF" }, { text: "Increase [Combination Magic] Damage by 〈50%〉.", color: "#EBEBEB" }, { text: "Decrease All Magic Cooldown by 3% (All Classes)", color: "#FF76DE" }] },
  Archaeologist: { tooltip: { text: "〔Magic Bolt Lv +1〕 @ A [Treasure Chest] is created for every [20] Character levels.", color: "#EBEBEB" }, levels: [{ text: "Explorer Lv +1", color: "#32FFE1" }, { text: "Increase Mana Acquisition by 10%", color: "#6EDCFF" }, { text: "[Treasure Chests] are created 〈10%〉 more frequently.", color: "#EBEBEB" }, { text: "Increase Item Pickup Range by 20% (All Classes)", color: "#FF76DE" }] },
  Magician: { tooltip: { text: "〔Magic Bolt Lv +1〕 @ 〈20%〉 increased chance for a Magic Bolt to turn into a [random projectile].", color: "#EBEBEB" }, levels: [{ text: "Magic Bolt Lv +1", color: "#32FFE1" }, { text: "〈5%〉 increased chance for a Magic Bolt to be transformed into a [random projectile].", color: "#EBEBEB" }, { text: "〈5%〉 increased chance for a Magic Bolt to be transformed into a [random projectile].", color: "#EBEBEB" }, { text: "Increase Critical Strike Rate by 3% (All Classes)", color: "#FF76DE" }] },
  Mage: { tooltip: { text: "〔Blizzard Lv +1〕 @ Every time the character gains [5] levels, Blizzard Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Blizzard Lv +1", color: "#32FFE1" }, { text: "Decrease Blizzard Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase the number of Blizzards by 35%", color: "#6EDCFF" }, { text: "Increase Blizzard Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Battlemage: { tooltip: { text: "〔Flash Shock Lv +1〕 @ Every time the character gains [5] levels, Flash Shock Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Flash Shock Lv +1", color: "#32FFE1" }, { text: "Decrease Flash Shock Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase Flash Shock Size by 25%", color: "#6EDCFF" }, { text: "Increase Flash Shock Damage by 20% (All Classes)", color: "#FF76DE" }] },
  Warlord: { tooltip: { text: "〔Incineration Lv +1〕 @ Every time the character gains [5] levels, Incineration Damage 〈3%〉 is 『added』", color: "#EBEBEB" }, levels: [{ text: "Incineration Lv +1", color: "#32FFE1" }, { text: "Decrease Incineration Cooldown by 20%", color: "#6EDCFF" }, { text: "Increase Incineration Size by 25%", color: "#6EDCFF" }, { text: "Increase Incineration Damage by 20% (All Classes)", color: "#FF76DE" }] },
  "Black Mage": { tooltip: { text: "〔Magic Bolt Lv +1〕 @ 〈10%〉 chance to cause an [Explosion] when killing an enemy. @ 『(Explosion Damage is 75% of the enemy's Max HP)』", color: "#EBEBEB" }, levels: [{ text: "Arcane Effuse Lv +1", color: "#32FFE1" }, { text: "〈5%〉 increased chance for enemies to [explode] when killed", color: "#6EDCFF" }, { text: "〈5%〉 increased chance for enemies to [explode] when killed", color: "#6EDCFF" }, { text: "Increase All Magic Size by 3% (All Classes)", color: "#FF76DE" }] },
};

/**
 * Reads a class's own progression level out of `RunMeta.classLevels`, defaulting to 1 (the
 * free baseline) for a class that isn't in the record yet — use this instead of indexing
 * `classLevels[className]` directly so every caller applies the same default.
 */
export function getClassLevel(classLevels: Record<string, number>, className: string): number {
  return classLevels[className] ?? 1;
}

/**
 * `bonusTier` is 1-4, indexing into `levels` (i.e. Class Level `bonusTier + 1` — tier 1 is
 * Lv2, tier 4 is Lv5) — **not** the same range as a class's own level from `getClassLevel`
 * (1-5). Returns null for an out-of-range tier or a class with no extracted bonus data.
 */
export function getClassLevelBonus(className: string, bonusTier: number): ClassBonusLine | null {
  const bonus = CLASS_BONUSES[className];
  if (!bonus || bonusTier < 1 || bonusTier > 4) return null;
  return bonus.levels[(bonusTier - 1) as 0 | 1 | 2 | 3];
}

/**
 * The Lv1 flavor/scaling tooltip line for a class — see `ClassBonus.tooltip`'s doc comment.
 * Was extracted but never rendered anywhere until this lookup was added; render it above
 * the level list in `ClassSelectScreen.tsx`.
 */
export function getClassTooltip(className: string): ClassBonusLine | null {
  return CLASS_BONUSES[className]?.tooltip ?? null;
}

/**
 * All 4 of a class's bonuses (its Lv2-Lv5), always in order, regardless of which are
 * unlocked — for a display that keeps every attribute visible and greys out the ones above
 * that class's own currently selected level rather than hiding them (see
 * `ClassSelectScreen.tsx`, which unlocks index `i` once `getClassLevel(classLevels,
 * className) >= i + 2`, since Level 1 is free/empty). Also the intended entry point for a
 * future stats engine — see `RunMeta.classLevels`'s doc comment in `types/game.ts` for why
 * that lookup needs both the equipped class's active bonuses *and* every other leveled
 * class's permanent Lv5 ("All Classes") bonus (no stat aggregation from this exists yet —
 * stats are still manually mirrored from the player's own in-game screen, see `StatBlock` in
 * `types/game.ts`).
 */
export function getAllClassLevelBonuses(className: string): ClassBonusLine[] {
  const result: ClassBonusLine[] = [];
  for (let tier = 1; tier <= 4; tier++) {
    const bonus = getClassLevelBonus(className, tier);
    if (bonus) result.push(bonus);
  }
  return result;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Every real BASE_MAGICS name found as a whole word in `text`, in reading order (first
 *  occurrence), deduped — unlike `engine/synergy.ts`'s `namedMagicIdsInText` (sorted by
 *  name length, for tier-detection where order doesn't matter), this one preserves order
 *  because Bishop's tooltip genuinely names two magics in a specific sequence ("Magic Bolt
 *  [&] Shield") that the Owned Magic screen must render in that same sequence. */
function orderedMagicIdsInText(text: string): string[] {
  const hits: { id: string; index: number }[] = [];
  for (const magic of BASE_MAGICS) {
    const match = new RegExp(`\\b${escapeRegExp(magic.name)}\\b`).exec(text);
    if (match) hits.push({ id: magic.id, index: match.index });
  }
  return hits.sort((a, b) => a.index - b.index).map((h) => h.id);
}

export interface ClassMagicSlot {
  magicId: string;
  /** 1+ — a magic named in the class's own Lv1 tooltip is granted at a baseline of Lv1
   *  even before any of the 4 gated bonuses unlock; see this function's header comment. */
  level: number;
}

export interface ClassSpecialSlot {
  /** The named ability text itself (e.g. "Guardian Angel"), not a `BASE_MAGICS` id — these
   *  are real named class abilities the dictionary text doesn't tie to any base magic. */
  name: string;
  color: string;
}

/**
 * Derives the "what does this class actually grant" slots shown in `OwnedMagicScreen`,
 * from real `CLASS_BONUSES` text only — no invented per-magic max level exists anywhere in
 * this app's data (unlike Fusions/Research, base magics were never datamined with a max
 * level), so this returns a current *level number* to display as a badge, never a pip row.
 *
 * The rule, reverse-engineered from two worked examples (Wizard: tooltip names "Magic
 * Bolt", and that same name reappears in `levels[0]` as "Magic Bolt Lv +1" — so its level
 * grows with class level; Bishop: tooltip names both "Magic Bolt" and "Shield", but
 * `levels[0]` is "Guardian Angel Lv +1" — an unrelated *named ability*, not a base magic,
 * so Magic Bolt/Shield stay at a flat Lv1 baseline forever and Guardian Angel becomes its
 * own special slot instead):
 *
 * 1. Every base magic named in the class's own `tooltip.text` becomes a slot, in the order
 *    each name first appears, starting at Lv1 (the tooltip alone is what grants it).
 * 2. Each of the class's 4 gated bonus lines, once unlocked at the current `classLevel`,
 *    is checked against the exact pattern `"<Name> Lv +1"`:
 *    - if `<Name>` matches a `BASE_MAGICS` name, that magic's level goes up by 1 (creating
 *      a new slot at Lv1 if the tooltip didn't already name it — see Archmage's "Magic
 *      Circle Lv +1", never named in its own tooltip).
 *    - otherwise `<Name>` is a real named special ability (Guardian Angel, Doctor, Silent
 *      Casting, Arcane Effuse, ...) and becomes its own `ClassSpecialSlot`.
 *    Bonus lines that don't match `"<Name> Lv +1"` at all (cooldown/size/count/stat lines,
 *    and the Lv5 "(All Classes)" line) grant no slot — they're real, but not a *named
 *    ability or magic* the way this screen's tiles represent.
 */
export function getClassMagicProgression(className: string, classLevel: number): { magics: ClassMagicSlot[]; specials: ClassSpecialSlot[] } {
  const bonus = CLASS_BONUSES[className];
  if (!bonus) return { magics: [], specials: [] };

  const magicLevels = new Map<string, number>();
  for (const id of orderedMagicIdsInText(bonus.tooltip.text)) magicLevels.set(id, 1);

  const specials: ClassSpecialSlot[] = [];
  const unlockedTiers = classLevel - 1; // classLevel 1..5 -> 0..4 of the 4 gated bonuses unlocked
  for (let tier = 1; tier <= 4 && tier <= unlockedTiers; tier++) {
    const line = bonus.levels[tier - 1];
    const match = /^(.+) Lv \+1$/.exec(line.text);
    if (!match) continue;
    const name = match[1];
    const magic = BASE_MAGICS.find((m) => m.name === name);
    if (magic) {
      magicLevels.set(magic.id, (magicLevels.get(magic.id) ?? 0) + 1);
    } else {
      specials.push({ name, color: line.color });
    }
  }

  const magics: ClassMagicSlot[] = Array.from(magicLevels, ([magicId, level]) => ({ magicId, level }));
  return { magics, specials };
}
