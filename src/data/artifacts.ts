import { artifactImage } from "../config/assets";
import type { EquippableItem } from "../types/game";

/**
 * Real artifact names, grades and effects, extracted directly from the game's own
 * localization data (spa_Dictionary_Ability.txt inside data.unity3d, type "아티팩트")
 * — all 182, not the previous 52-item curated subset sourced from
 * TomkoSK/magic-survival-builder.
 *
 * Rarity is the real in-game grade (1-5), mapped onto this app's existing 5-value
 * `Rarity` type in ordinal order (grade 1 -> common ... grade 5 -> special). This
 * ordinal mapping is inferred from the type's own declared order, not independently
 * confirmed against the game's internal grade lettering (letter grades:
 * C/B/A/P/S) — flag if you find it's off.
 *
 * **3 corrected 2026-09-15**: `hydra` (102), `fairy` (179), `ocultismo`/Occult (216)
 * were tagged `legendary`, disagreeing with real drop data — a community chart of
 * 600 real relic-chest pulls (300 games) buckets all three under the game's own
 * "special artifact" pool, and this project's own cross-check of a real playthrough's
 * chest log (`run_for_discord.json`, see `research/game-data-sources.md`) found zero
 * appearances of any of the three across 53 real legendary-chest pulls, but several
 * appearances in normal-chest/merchant pulls (which never draw from the legendary
 * pool) — two independent sources agreeing the dictionary's extracted grade was wrong
 * for just these 3. Re-check against the same evidence before trusting `legendary` vs
 * `special` for any item this note doesn't cover; the ordinal mapping itself is still
 * unconfirmed in general, per the paragraph above.
 *
 * `stats` were extracted by matching each artifact's real Spanish effect line
 * against the ~16 known stat-line phrasings (see gen_artifacts.mjs's PATTERNS if you
 * need to reproduce this). Effect lines that didn't match a known phrasing (conditional
 * effects, stacking mechanics, on-hit triggers, etc.) are kept verbatim in
 * `specialEffect` instead of being fabricated into a stat number — many artifacts
 * legitimately have both a parsed stat AND a specialEffect line.
 *
 * `image` was originally only set where a real sprite filename was confirmed against
 * public/assets/artifactImages/ (153 of 182 at the time) — since then all 182 have been
 * confirmed real (checked again 2026-09-16, 0 missing), so every entry below has a
 * working sprite. Passives are not as complete — see `passives.ts`.
 */
export const ARTIFACTS: EquippableItem[] = [
  { id: "asi", name: "ASI", rarity: "special", kind: "artifact", image: artifactImage("asi.png"), stats: { atk: 30 } }, // source id 41
  { id: "diamante", name: "Diamond", rarity: "epic", kind: "artifact", image: artifactImage("diamante.png"), stats: { atk: 10, hp: 20, cooldown: 3 }, tags: ["cooldown"] }, // source id 42
  { id: "virus", name: "Virus", rarity: "rare", kind: "artifact", image: artifactImage("virus.png"), stats: {}, specialEffect: "Reduces the [Max HP] of elite monsters by 〈10%〉." }, // source id 43
  { id: "guillotina", name: "Guillotine", rarity: "epic", kind: "artifact", image: artifactImage("guillotina.png"), stats: {}, specialEffect: "Deals 〈15%〉 [Additional Damage] to enemies whose [HP] is 〈75%〉 or higher." }, // source id 44
  { id: "nomuerto", name: "Undead", rarity: "special", kind: "artifact", image: artifactImage("nomuerto.png"), stats: {}, specialEffect: "[Revive] 〈2〉 more times. Decreases Max HP by 25%" }, // source id 45
  { id: "electromagneto", name: "Electromagnet", rarity: "epic", kind: "artifact", image: artifactImage("electromagneto.png"), stats: {}, specialEffect: "Increases Electric Zone Damage by 50% Increases Satellite Damage by 50%" }, // source id 46
  { id: "carne", name: "Meat", rarity: "rare", kind: "artifact", image: artifactImage("carne.png"), stats: {}, specialEffect: "Generates [Life Orbs] near the character (Cooldown: 30s)" }, // source id 47
  { id: "oculus", name: "Oculus", rarity: "epic", kind: "artifact", image: artifactImage("oculus.png"), stats: { itemPickupRange: 30 }, specialEffect: "Increases [Critical Rate] by 〈1%〉 for every 〈30%〉 of Item Pickup Range" }, // source id 48
  { id: "carnaval", name: "Carnival", rarity: "epic", kind: "artifact", image: artifactImage("carnaval.png"), stats: { evasion: 5 }, tags: ["evasion"], specialEffect: "Increases [Critical Rate] by 〈1%〉 for every 〈3%〉 of Evasion" }, // source id 49
  { id: "desperado", name: "Desperado", rarity: "legendary", kind: "artifact", image: artifactImage("desperado.png"), stats: {}, specialEffect: "All damage dealt to enemies increases by 〈50%〉 for [8 seconds]. (Cooldown: 8s)" }, // source id 50
  { id: "bloodpack", name: "Blood Pack", rarity: "common", kind: "artifact", image: artifactImage("bloodpack.png"), stats: { hp: 30, hpRegen: 0.3 } }, // source id 51
  { id: "cogwheel", name: "Cogwheel", rarity: "rare", kind: "artifact", image: artifactImage("cogwheel.png"), stats: {}, specialEffect: "Reduces the cooldown of [all Artifacts] by 〈20%〉." }, // source id 52
  { id: "hourglass", name: "Hourglass", rarity: "rare", kind: "artifact", image: artifactImage("hourglass.png"), stats: { cooldown: 6 }, tags: ["cooldown"] }, // source id 53
  { id: "forcefield", name: "Force Field", rarity: "rare", kind: "artifact", image: artifactImage("forcefield.png"), stats: {}, specialEffect: "When taking damage, blocks it and becomes [Invincible] for 〈3 seconds〉 (Cooldown: 60s)" }, // source id 54
  { id: "shadowcape", name: "Shadow Cape", rarity: "common", kind: "artifact", image: artifactImage("shadowcape.png"), stats: { evasion: 10 }, tags: ["evasion"] }, // source id 55
  { id: "manaore", name: "Mana Ore", rarity: "epic", kind: "artifact", image: artifactImage("manaore.png"), stats: { atk: 25 } }, // source id 56
  { id: "creation", name: "Creation", rarity: "legendary", kind: "artifact", image: artifactImage("creation.png"), stats: { magicDamage: 50 }, specialEffect: "Every [5th] cast of a spell reduces its [Cooldown] by 〈half〉." }, // source id 57
  { id: "totem", name: "Totem", rarity: "rare", kind: "artifact", image: artifactImage("totem.png"), stats: {}, specialEffect: "Increases Cyclone Damage by 30% Reduces Cyclone Cooldown by 10%" }, // source id 58
  { id: "gunpowder", name: "Gunpowder", rarity: "common", kind: "artifact", image: artifactImage("gunpowder.png"), stats: { magicSize: 10 } }, // source id 59
  { id: "assassination", name: "Assassination", rarity: "special", kind: "artifact", image: artifactImage("assassination.png"), stats: { critMultiplier: 40 }, specialEffect: "If an enemy has never taken damage, deals a [Critical Strike]." }, // source id 60
  { id: "spellbag", name: "Spell Bag", rarity: "common", kind: "artifact", image: artifactImage("spellbag.png"), stats: { itemPickupRange: 50 } }, // source id 61
  { id: "sample", name: "Sample", rarity: "common", kind: "artifact", image: artifactImage("sample.png"), stats: {}, specialEffect: "Reduces the [Max HP] of all enemies by 〈3%〉." }, // source id 62
  { id: "ruby", name: "Ruby", rarity: "common", kind: "artifact", image: artifactImage("ruby.png"), stats: { atk: 12 } }, // source id 63
  { id: "target", name: "Target", rarity: "common", kind: "artifact", image: artifactImage("target.png"), stats: { critRate: 6 } }, // source id 64
  { id: "hppotion", name: "HP Potion", rarity: "common", kind: "artifact", image: artifactImage("hppotion.png"), stats: {}, specialEffect: "Recovers 〈50%〉 [HP] over 3 seconds if HP is at [25%] or lower. (Cooldown: 50s)" }, // source id 65
  { id: "philosopherstone", name: "Philosopher's Stone", rarity: "special", kind: "artifact", image: artifactImage("philosopherstone.png"), stats: {}, specialEffect: "Generates a large amount of [Mana Orbs]" }, // source id 66
  { id: "broom", name: "Broom", rarity: "common", kind: "artifact", image: artifactImage("broom.png"), stats: { moveSpeed: 10 }, tags: ["moveSpeed"] }, // source id 67
  { id: "uranium", name: "Uranium", rarity: "legendary", kind: "artifact", image: artifactImage("uranium.png"), stats: { atk: 100, magicSize: 25 }, specialEffect: "Reduces HP Regen per second by 0.25%" }, // source id 68
  { id: "tarotcard", name: "Tarot Card", rarity: "epic", kind: "artifact", image: artifactImage("tarotcard.png"), stats: {}, specialEffect: "Learns 〈3〉 random [Magics]." }, // source id 69
  { id: "fourleafclover", name: "Four-Leaf Clover", rarity: "rare", kind: "artifact", image: artifactImage("fourleafclover.png"), stats: {}, specialEffect: "Performs a [Critical Strike] every time an enemy is damaged 〈5〉 times." }, // source id 70
  { id: "mandrake", name: "Mandrake", rarity: "common", kind: "artifact", image: artifactImage("mandrake.png"), stats: { lifeOrbRecovery: 50 } }, // source id 71
  { id: "gravityorb", name: "Gravity Orb", rarity: "epic", kind: "artifact", image: artifactImage("gravityorb.png"), stats: {}, specialEffect: "Generates a [Wave] that briefly slows enemy movement speed (Cooldown: 20s)" }, // source id 72
  { id: "worldtreeleaf", name: "World Tree Leaf", rarity: "epic", kind: "artifact", image: artifactImage("worldtreeleaf.png"), stats: {}, specialEffect: "Generates [World Tree Fruit] near the character (Cooldown: 100s)" }, // source id 73
  { id: "magicsword", name: "Magic Sword", rarity: "legendary", kind: "artifact", image: artifactImage("magicsword.png"), stats: {}, specialEffect: "[Instakills] an enemy whose HP is below 〈20%〉." }, // source id 74
  { id: "opulence", name: "Opulence", rarity: "legendary", kind: "artifact", image: artifactImage("opulence.png"), stats: {}, specialEffect: "Generates 〈3〉 [Treasure Chests] and 〈1〉 [Relic Box] nearby" }, // source id 75
  { id: "amplifier", name: "Amplifier", rarity: "special", kind: "artifact", image: artifactImage("amplifier.png"), stats: {}, specialEffect: "All Magic Size increases x1.28" }, // source id 76
  { id: "aumento", name: "Rose", rarity: "rare", kind: "artifact", image: artifactImage("aumento.png"), stats: {}, specialEffect: "Deals 〈10%〉 [Additional Damage] to enemies whose [HP] is 〈75%〉 or higher." }, // source id 77
  { id: "accelerator", name: "Accelerator", rarity: "legendary", kind: "artifact", image: artifactImage("accelerator.png"), stats: {}, specialEffect: "Reduces [All Magic Cooldown] by 〈1%〉 for every 〈3%〉 increase in Movement Speed." }, // source id 78
  { id: "supermente", name: "Transcendence", rarity: "legendary", kind: "artifact", image: artifactImage("supermente.png"), stats: {}, specialEffect: "Increases 〔All Magic Damage〕 by 〈15%〉 for each [Active Magic] that has reached [Max Level]" }, // source id 79
  { id: "mooncrystal", name: "Moon Crystal", rarity: "epic", kind: "artifact", image: artifactImage("mooncrystal.png"), stats: {}, specialEffect: "Permanently reduces the [Movement Speed] of an enemy that has been [frozen] by 〈10%〉. Increases Frost Nova Damage by 50%" }, // source id 80
  { id: "pocketwatch", name: "Pocket Watch", rarity: "epic", kind: "artifact", image: artifactImage("pocketwatch.png"), stats: { magicDuration: 24 } }, // source id 81
  { id: "mortarboard", name: "Mortarboard", rarity: "rare", kind: "artifact", image: artifactImage("mortarboard.png"), stats: {}, specialEffect: "〈33%〉 increased chance to have [4] Magic choices." }, // source id 82
  { id: "pandorabox", name: "Pandora's Box", rarity: "epic", kind: "artifact", image: artifactImage("pandorabox.png"), stats: {}, specialEffect: "Casts one of the following Magics randomly: 《Cyclone, Meteor, Tsunami》. (Cooldown: 5s)" }, // source id 83
  { id: "ether", name: "Ether", rarity: "special", kind: "artifact", image: artifactImage("ether.png"), stats: {}, specialEffect: "Gain 〈1%〉 [mana] per second." }, // source id 84
  { id: "clockwork", name: "Clockwork", rarity: "epic", kind: "artifact", image: artifactImage("clockwork.png"), stats: {}, specialEffect: "[Stops] all enemies near the character for 〈2 seconds〉. (Cooldown: 18s)" }, // source id 85
  { id: "genomemap", name: "Genome Map", rarity: "legendary", kind: "artifact", image: artifactImage("genomemap.png"), stats: {}, specialEffect: "Reduces the [Max HP] of all enemies by 〈20%〉." }, // source id 86
  { id: "deathbell", name: "Death's Bell", rarity: "special", kind: "artifact", image: artifactImage("deathbell.png"), stats: {}, specialEffect: "If {444} [Mana Orbs] are obtained, all nearby enemies disappear" }, // source id 87
  { id: "mutagen", name: "Mutagen", rarity: "rare", kind: "artifact", image: artifactImage("mutagen.png"), stats: {}, specialEffect: "[Max HP] of [Large Monsters] is reduced by 〈15%〉." }, // source id 88
  { id: "spiderweb", name: "Spiderweb", rarity: "epic", kind: "artifact", image: artifactImage("spiderweb.png"), stats: {}, specialEffect: "Reduces the [Movement Speed] of all enemies by 〈10%〉." }, // source id 89
  { id: "crucifix", name: "Crucifix", rarity: "rare", kind: "artifact", image: artifactImage("crucifix.png"), stats: { damageTaken: 12, hpRegen: 0.3 } }, // source id 90
  { id: "secondheart", name: "Second Heart", rarity: "epic", kind: "artifact", image: artifactImage("secondheart.png"), stats: { hp: 50 }, specialEffect: "[Revive] 〈1〉 more time." }, // source id 91
  { id: "lantern", name: "Lantern", rarity: "rare", kind: "artifact", image: artifactImage("lantern.png"), stats: { itemPickupRange: 20 }, specialEffect: "Increases [Mana Orb] Acquisition by 〈10%〉." }, // source id 92
  { id: "magicwand", name: "Magic Wand", rarity: "epic", kind: "artifact", image: artifactImage("magicwand.png"), stats: {}, specialEffect: "Increases [Damage] by 〈10%〉 per 《Spirit》. Increases Spirit Number by 2" }, // source id 93
  { id: "sellomagico", name: "Magic Seal", rarity: "special", kind: "artifact", image: artifactImage("sellomagico.png"), stats: {}, specialEffect: "[Limits] Damage taken from a single hit to 〈30%〉 of the character's [Max HP]." }, // source id 94
  { id: "spacetimecircuit", name: "Space-time Circuit", rarity: "special", kind: "artifact", image: artifactImage("spacetimecircuit.png"), stats: {}, specialEffect: "Time flows 〈24%〉 faster. After obtaining it, increases [Gold Acquisition] by 〈24%〉." }, // source id 95
  { id: "keyring", name: "Keyring", rarity: "epic", kind: "artifact", image: artifactImage("keyring.png"), stats: {}, specialEffect: "Get a chance to swap out an [artifact] from a normal Treasure Chest. (Available: 3 times)" }, // source id 96
  { id: "etherarrow", name: "Ether Arrow", rarity: "epic", kind: "artifact", image: artifactImage("etherarrow.png"), stats: {}, specialEffect: "Reduces Magic Bolt Cooldown by 20% Reduces Spirit Cooldown by 20%" }, // source id 97
  { id: "reaperscythe", name: "Reaper's Scythe", rarity: "legendary", kind: "artifact", image: artifactImage("reaperscythe.png"), stats: {}, specialEffect: "〈8%〉 chance to {instakill} an enemy when dealing Damage to it for the first time. Reduces the [Max HP] of all enemies by 〈13%〉." }, // source id 98
  { id: "blackcat", name: "Black Cat", rarity: "epic", kind: "artifact", image: artifactImage("blackcat.png"), stats: { cooldown: 9 }, tags: ["cooldown"] }, // source id 99
  { id: "watchereye", name: "Watcher's Eye", rarity: "epic", kind: "artifact", image: artifactImage("watchereye.png"), stats: { critMultiplier: 50 }, specialEffect: "Causes a giant [Explosion] upon obtaining a [Life Orb]." }, // source id 100
  { id: "ironmaiden", name: "Iron Maiden", rarity: "legendary", kind: "artifact", image: artifactImage("ironmaiden.png"), stats: {}, specialEffect: "〈15%〉 chance to cause an [Explosion] when killing an enemy. (Explosion Damage is 75% of the enemy's Max HP)" }, // source id 101
  { id: "hydra", name: "Hydra", rarity: "special", kind: "artifact", image: artifactImage("hydra.png"), stats: {}, specialEffect: "Each time damage is dealt to an enemy, its current HP is reduced by 〈1%〉. (Triggers up to 25 times per enemy)" }, // source id 102 — rarity corrected 2026-09-15, see top-of-file note
  { id: "dragonscale", name: "Dragonscale", rarity: "rare", kind: "artifact", image: artifactImage("dragonscale.png"), stats: { damageTaken: 30 } }, // source id 103
  { id: "manashield", name: "Mana Shield", rarity: "rare", kind: "artifact", image: artifactImage("manashield.png"), stats: {}, specialEffect: "Reduces [Damage Taken] by 〈50%〉 of the current mana percentage." }, // source id 104
  { id: "ballista", name: "Ballista", rarity: "legendary", kind: "artifact", image: artifactImage("ballista.png"), stats: { critMultiplier: 50 }, specialEffect: "Deals 〈50%〉 [Additional Damage] to enemies whose [HP] is 〈75%〉 or higher." }, // source id 105
  { id: "organicshield", name: "Organic Shield", rarity: "rare", kind: "artifact", image: artifactImage("organicshield.png"), stats: {}, specialEffect: "Obtaining a [Life Orb] increases [HP] by an amount equal to the Recovery bonus. @ The HP bonus cannot exceed [Max HP]." }, // source id 106
  { id: "storybook", name: "Storybook", rarity: "common", kind: "artifact", image: artifactImage("storybook.png"), stats: {}, specialEffect: "Reduces the character's [Size] by 〈25%〉." }, // source id 107
  { id: "aegis", name: "Aegis", rarity: "epic", kind: "artifact", image: artifactImage("aegis.png"), stats: { damageTaken: 10 }, specialEffect: "{Amplifies} [ATK] by 〈3%〉 for every [10%] of Damage Taken." }, // source id 108
  { id: "merlincape", name: "Merlin's Cape", rarity: "special", kind: "artifact", image: artifactImage("merlincape.png"), stats: {}, specialEffect: "{Amplifies} [ATK] by 〈25%〉 of the current mana percentage." }, // source id 109
  { id: "wraith", name: "Wraith", rarity: "rare", kind: "artifact", image: artifactImage("wraith.png"), stats: {}, specialEffect: "[Passes through] all enemies and obstacles." }, // source id 110
  { id: "executionerax", name: "Executioner's Ax", rarity: "legendary", kind: "artifact", image: artifactImage("executionerax.png"), stats: { critMultiplier: 100 } }, // source id 111
  { id: "aurora", name: "Aurora", rarity: "rare", kind: "artifact", image: artifactImage("aurora.png"), stats: { manaAcquisition: 15 } }, // source id 112
  { id: "energianuclear", name: "Core Energy", rarity: "epic", kind: "artifact", image: artifactImage("energianuclear.png"), stats: {}, specialEffect: "《Satellites》 [explode] when they deal Damage to enemies. Increases Satellite Number by 2" }, // source id 113
  { id: "magicscroll", name: "Magic Scroll", rarity: "common", kind: "artifact", image: artifactImage("magicscroll.png"), stats: { atk: 10, cooldown: 3 }, tags: ["cooldown"] }, // source id 114
  { id: "necronomicon", name: "Necronomicon", rarity: "special", kind: "artifact", image: artifactImage("necronomicon.png"), stats: { amplifyAtk: 50 }, tags: ["amplify"], specialEffect: "The character's [Max HP] cannot be more than 【50%】 of [Max HP]." }, // source id 115
  { id: "singularity", name: "Singularity", rarity: "special", kind: "artifact", image: artifactImage("singularity.png"), stats: {}, specialEffect: "All [Mana Orbs (small)] are converted into [(medium)]." }, // source id 116
  { id: "akashicrecord", name: "Akashic Record", rarity: "legendary", kind: "artifact", image: artifactImage("akashicrecord.png"), stats: {}, specialEffect: "Amplifies [ATK] by 〈1%〉 for every [2] current levels. Increases [Current Level] and [Max Level] by 〈5〉" }, // source id 117
  { id: "dna", name: "DNA", rarity: "legendary", kind: "artifact", image: artifactImage("dna.png"), stats: {}, specialEffect: "For each [Obelisk] obtained: {Amplify} [ATK] by 〈8%〉, [Max HP] by an additional 〈8%〉 (Efficiency decreases by 15% per application)" }, // source id 118
  { id: "otherworldlytentacle", name: "Otherworldly Tentacle", rarity: "epic", kind: "artifact", image: artifactImage("otherworldlytentacle.png"), stats: {}, specialEffect: "Increases [Damage] by 8% per 《Arcane Ray》 Reduces Arcane Ray Cooldown by 10%" }, // source id 119
  { id: "golemcore", name: "Golem Core", rarity: "rare", kind: "artifact", image: artifactImage("golemcore.png"), stats: { hp: 50 }, specialEffect: "The screen does not turn red even when the character is [near death]." }, // source id 120
  { id: "rainbow", name: "Rainbow", rarity: "common", kind: "artifact", image: artifactImage("rainbow.png"), stats: { critMultiplier: 30 } }, // source id 121
  { id: "cube", name: "Cube", rarity: "legendary", kind: "artifact", image: artifactImage("cube.png"), stats: { manaAcquisition: 25 }, specialEffect: "The [Level] and [Max Level] of all [Normal Passive Magic] increase by 〈1〉." }, // source id 122
  { id: "siegehammer", name: "Siege Hammer", rarity: "epic", kind: "artifact", image: artifactImage("siegehammer.png"), stats: { critMultiplier: 20 }, specialEffect: "Deals 〈20%〉 {Additional Damage} if an attack is not a Critical Strike." }, // source id 123
  { id: "cauldron", name: "Cauldron", rarity: "epic", kind: "artifact", image: artifactImage("cauldron.png"), stats: {}, specialEffect: "Increases [Damage] of the following Magic by 〈35%〉. Fireball, Meteor, Incineration, Lava Zone" }, // source id 124
  { id: "lightning", name: "Lightning", rarity: "epic", kind: "artifact", image: artifactImage("lightning.png"), stats: {}, specialEffect: "Increases [Damage] of the following Magic by 〈35%〉. Thunderstorm, Electric Shock, Electric Zone, Flash Shock" }, // source id 125
  { id: "weathercontroller", name: "Weather Controller", rarity: "epic", kind: "artifact", image: artifactImage("weathercontroller.png"), stats: {}, specialEffect: "Increases [Damage] of the following Magic by 〈35%〉. Cyclone, Blizzard, Tsunami, Frost Nova" }, // source id 126
  { id: "manascepter", name: "Mana Scepter", rarity: "epic", kind: "artifact", image: artifactImage("manascepter.png"), stats: {}, specialEffect: "Increases [Damage] of the following Magic by 〈35%〉. Energy Bolt, Arcane Ray, Spirit, Satellite" }, // source id 127
  { id: "magicbullet", name: "Magic Bullet", rarity: "rare", kind: "artifact", image: artifactImage("magicbullet.png"), stats: {}, specialEffect: "Increases Magic Bolt Damage by 30% Increases Magic Bolt Number by 1" }, // source id 128
  { id: "celestialcalendar", name: "Celestial Calendar", rarity: "rare", kind: "artifact", image: artifactImage("celestialcalendar.png"), stats: {}, specialEffect: "Every 〈3〉 casts of 《Meteor》 increases the [power] of the next Meteor by 〈x1.5〉." }, // source id 129
  { id: "battery", name: "Battery", rarity: "rare", kind: "artifact", image: artifactImage("battery.png"), stats: {}, specialEffect: "Increases Electric Zone Damage by 30% Reduces Electric Zone Damage Interval by 15%" }, // source id 130
  { id: "magitechmodule", name: "Magitech Module", rarity: "rare", kind: "artifact", image: artifactImage("magitechmodule.png"), stats: {}, specialEffect: "〈22%〉 chance for an 《Energy Bolt》 to [split] into 〈2〉." }, // source id 131
  { id: "torch", name: "Torch", rarity: "common", kind: "artifact", image: artifactImage("torch.png"), stats: {}, specialEffect: "Reduces Fireball Cooldown by 15% Reduces Incineration Cooldown by 15%" }, // source id 132
  { id: "lightningrod", name: "Lightning Rod", rarity: "common", kind: "artifact", image: artifactImage("lightningrod.png"), stats: {}, specialEffect: "Reduces Thunderstorm Cooldown by 15% Reduces Electric Shock Cooldown by 15%" }, // source id 133
  { id: "snowman", name: "Snowman", rarity: "common", kind: "artifact", image: artifactImage("snowman.png"), stats: {}, specialEffect: "Reduces Blizzard Cooldown by 15% Reduces Frost Nova Cooldown by 15%" }, // source id 134
  { id: "firefly", name: "Firefly", rarity: "common", kind: "artifact", image: artifactImage("firefly.png"), stats: {}, specialEffect: "Increases Spirit Number by 2" }, // source id 135
  { id: "glassorb", name: "Glass Orb", rarity: "common", kind: "artifact", image: artifactImage("glassorb.png"), stats: {}, specialEffect: "Increases Satellite Number by 2" }, // source id 136
  { id: "crystalprism", name: "Crystal Prism", rarity: "common", kind: "artifact", image: artifactImage("crystalprism.png"), stats: {}, specialEffect: "Increases Arcane Ray Number by 2" }, // source id 137
  { id: "phoenixbow", name: "Phoenix's Bow", rarity: "epic", kind: "artifact", image: artifactImage("phoenixbow.png"), stats: {}, specialEffect: "Deals 〈50%〉 [Additional Damage] to an enemy [directly] hit by a 《Fireball》. Increases Fireball Penetration by 1" }, // source id 138
  { id: "mjolnir", name: "Mjolnir", rarity: "epic", kind: "artifact", image: artifactImage("mjolnir.png"), stats: {}, specialEffect: "Increases Thunderstorm Number by 50%" }, // source id 139
  { id: "dimensionalgate", name: "Dimensional Gate", rarity: "epic", kind: "artifact", image: artifactImage("dimensionalgate.png"), stats: {}, specialEffect: "〈20%〉 chance to cast 《Meteor》 〈1〉 extra time when cast. Reduces Meteor Cooldown by 25%" }, // source id 140
  { id: "palmleaffan", name: "Palm Leaf Fan", rarity: "epic", kind: "artifact", image: artifactImage("palmleaffan.png"), stats: {}, specialEffect: "Every 〈5〉 casts of 《Cyclone》 increases the @ [Damage] and [Size] of the next Cyclone by 〈x2〉. Increases Cyclone Damage by 50%" }, // source id 141
  { id: "electriccable", name: "Electric Cable", rarity: "epic", kind: "artifact", image: artifactImage("electriccable.png"), stats: {}, specialEffect: "Increases Electric Shock Damage by 50% Increases Electric Shock Number by 2" }, // source id 142
  { id: "machinearm", name: "Machine Arm", rarity: "epic", kind: "artifact", image: artifactImage("machinearm.png"), stats: {}, specialEffect: "Increases Energy Bolt Damage by 35% Increases Energy Bolt Number by 35%" }, // source id 143
  { id: "dragonbreath", name: "Dragon's Breath", rarity: "epic", kind: "artifact", image: artifactImage("dragonbreath.png"), stats: {}, specialEffect: "Each time an enemy is damaged by 《Incineration》 @ it takes 〈1%〉 Additional Damage. Increases Incineration Damage by 50%" }, // source id 144
  { id: "snowflakecrown", name: "Snowflake Crown", rarity: "epic", kind: "artifact", image: artifactImage("snowflakecrown.png"), stats: {}, specialEffect: "Each 《Blizzard》 increases its [Damage] by 〈1%〉. Increases Blizzard Number by 30%" }, // source id 145
  { id: "wavecalmingflute", name: "Wave-calming Flute", rarity: "epic", kind: "artifact", image: artifactImage("wavecalmingflute.png"), stats: {}, specialEffect: "Each cast of 《Tsunami》 increases its [Damage] by 〈12%〉, @ and reduces its [cooldown] by 〈12%〉. This effect [resets] after stacking [4 times]." }, // source id 146
  { id: "circularsawblade", name: "Circular Sawblade", rarity: "epic", kind: "artifact", image: artifactImage("circularsawblade.png"), stats: {}, specialEffect: "Each hit with 《Satellite》 increases additional damage to the enemy by 〈0.5%〉 (Max Stack: 50%)" }, // source id 147
  { id: "sulfur", name: "Sulfur", rarity: "epic", kind: "artifact", image: artifactImage("sulfur.png"), stats: {}, specialEffect: "《Lava Zone》 increases its Size by 〈2%〉 every second. Increases Lava Zone Damage by 80%" }, // source id 148
  { id: "ancienttreestaff", name: "Ancient Tree Staff", rarity: "rare", kind: "artifact", image: artifactImage("ancienttreestaff.png"), stats: {}, specialEffect: "Reduces Magic Circle Cooldown by 25%" }, // source id 149
  { id: "gaebolg", name: "Gàe Bolg", rarity: "epic", kind: "artifact", image: artifactImage("gaebolg.png"), stats: {}, specialEffect: "Increases Flash Shock Damage by 100%" }, // source id 150
  { id: "candlestick", name: "Candlestick", rarity: "epic", kind: "artifact", image: artifactImage("candlestick.png"), stats: {}, specialEffect: "Increases Fireball Number by 1 Increases Meteor Number by 1" }, // source id 151
  { id: "clairvoyance", name: "Clairvoyance", rarity: "epic", kind: "artifact", image: artifactImage("clairvoyance.png"), stats: { itemPickupRange: 100 }, specialEffect: "Increases the character's [vision range] by 〈10%〉." }, // source id 152
  { id: "sacrosanct", name: "Sacrosanct", rarity: "legendary", kind: "artifact", image: artifactImage("sacrosanct.png"), stats: { damageTaken: 25 }, specialEffect: "If [HP] is above [75%], [ATK] is {Amplified} by 〈75%〉" }, // source id 153
  { id: "brand", name: "Brand", rarity: "special", kind: "artifact", image: artifactImage("brand.png"), stats: {}, specialEffect: "Deals 〈15%〉 [Additional Damage] to enemies that have survived for [5 seconds]." }, // source id 154
  { id: "geometry", name: "Geometry", rarity: "special", kind: "artifact", image: artifactImage("geometry.png"), stats: {}, specialEffect: "Always recovers 〈100%〉 mana when recovering mana. @ You lose 【1】 mana recovery chance." }, // source id 155
  { id: "harmony", name: "Harmony", rarity: "rare", kind: "artifact", image: artifactImage("harmony.png"), stats: { cooldown: 3, magicDuration: 12 }, tags: ["cooldown"] }, // source id 156
  { id: "dragonmagic", name: "Dragon's Magic", rarity: "legendary", kind: "artifact", image: artifactImage("dragonmagic.png"), stats: { amplifyAtk: 40, atk: 40 }, tags: ["amplify"] }, // source id 157
  { id: "joker", name: "Joker", rarity: "legendary", kind: "artifact", image: artifactImage("joker.png"), stats: {}, specialEffect: "[50%] chance to stack 〈1〉 additional multiplier upon landing a Critical Strike." }, // source id 158
  { id: "titanpower", name: "Titan's Power", rarity: "legendary", kind: "artifact", image: artifactImage("titanpower.png"), stats: {}, specialEffect: "Increases ATK x1.5" }, // source id 159
  { id: "manacircuit", name: "Mana Circuit", rarity: "epic", kind: "artifact", image: artifactImage("manacircuit.png"), stats: {}, specialEffect: "{Amplifies} [ATK] by 〈1%〉 whenever you obtain a [Mana Orb]. @ The stack resets every [5 seconds]." }, // source id 160
  { id: "mirror", name: "Mirror", rarity: "epic", kind: "artifact", image: artifactImage("mirror.png"), stats: {}, specialEffect: "Increases the [number] of the following Magic by 〈1〉. Energy Bolt, Arcane Ray, Spirit, Satellite" }, // source id 161
  { id: "toycastle", name: "Toy Castle", rarity: "special", kind: "artifact", image: artifactImage("toycastle.png"), stats: {}, specialEffect: "Reduces the [Max HP] of elite monsters by 〈15%〉. The [Size] of Elite Monsters is reduced by 〈15%〉" }, // source id 162
  { id: "gaia", name: "Gaia", rarity: "legendary", kind: "artifact", image: artifactImage("gaia.png"), stats: { hp: 50 }, specialEffect: "Increases [ATK] by 〈3%〉 for every [20] Max HP." }, // source id 163
  { id: "hunter", name: "Hunter", rarity: "special", kind: "artifact", image: artifactImage("hunter.png"), stats: {}, specialEffect: "{Amplifies} [ATK] by 〈1%〉 for every [100 enemies] defeated. @ The stack resets when Amplification reaches [25%]." }, // source id 164
  { id: "treasuremap", name: "Treasure Map", rarity: "special", kind: "artifact", image: artifactImage("treasuremap.png"), stats: { itemPickupRange: 30 }, specialEffect: "Creates 〈2〉 [Treasure Chests] at a random location." }, // source id 165
  { id: "cyborg", name: "Cyborg", rarity: "special", kind: "artifact", image: artifactImage("cyborg.png"), stats: { atk: 50 }, specialEffect: "It is not possible to recover HP with [Life Orbs]." }, // source id 166
  { id: "pyramid", name: "Pyramid", rarity: "epic", kind: "artifact", image: artifactImage("pyramid.png"), stats: {}, specialEffect: "[ATK] is {Amplified} by 〈3%〉 for each [Synergy] activated." }, // source id 167
  { id: "domainofpower", name: "Domain of Power", rarity: "special", kind: "artifact", image: artifactImage("domainofpower.png"), stats: {}, specialEffect: "Gain 〈1〉 more chance of [Magic Combination]. Increases [Max Level] by 〈1〉." }, // source id 168
  { id: "llamademana", name: "Mana Flame", rarity: "rare", kind: "artifact", image: artifactImage("llamademana.png"), stats: { magicDamage: 15 } }, // source id 169
  { id: "crow", name: "Crow", rarity: "common", kind: "artifact", image: artifactImage("crow.png"), stats: { critRate: 3, critMultiplier: 25 } }, // source id 170
  { id: "warflag", name: "War Flag", rarity: "epic", kind: "artifact", image: artifactImage("warflag.png"), stats: {}, specialEffect: "{Amplifies} [ATK] by 〈2%〉 for every second the character stays in the same place. (Max Stack: 20%)" }, // source id 171
  { id: "exorcism", name: "Exorcism", rarity: "epic", kind: "artifact", image: artifactImage("exorcism.png"), stats: {}, specialEffect: "Reduces the [Max HP] of all enemies by 〈3%〉. Increases Mana Acquisition from killing enemies by 20%" }, // source id 172
  { id: "spellcape", name: "Spell Cape", rarity: "rare", kind: "artifact", image: artifactImage("spellcape.png"), stats: { atk: 18 } }, // source id 173
  { id: "breeze", name: "Breeze", rarity: "rare", kind: "artifact", image: artifactImage("breeze.png"), stats: { evasion: 8, moveSpeed: 8 }, tags: ["moveSpeed", "evasion"] }, // source id 174
  { id: "sapphire", name: "Sapphire", rarity: "common", kind: "artifact", image: artifactImage("sapphire.png"), stats: { manaAcquisition: 12 } }, // source id 175
  { id: "holychest", name: "Holy Chest", rarity: "legendary", kind: "artifact", image: artifactImage("holychest.png"), stats: {}, specialEffect: "Reduces the [Max HP] of all enemies by 〈10%〉. Activates a random [Rune] effect. (Cooldown: 45s)" }, // source id 176
  { id: "crown", name: "Crown", rarity: "legendary", kind: "artifact", image: artifactImage("crown.png"), stats: {}, specialEffect: "{Amplifies} [ATK] by 〈1%〉 for each [Epic] artifact you own. {Amplifies} [ATK] by 〈5%〉 for each [Special] artifact you own." }, // source id 177
  { id: "bomb", name: "Bomb", rarity: "rare", kind: "artifact", image: artifactImage("bomb.png"), stats: { atk: 8, magicSize: 8 } }, // source id 178
  { id: "fairy", name: "Fairy", rarity: "special", kind: "artifact", image: artifactImage("fairy.png"), stats: {}, specialEffect: "The {Enchant} effect becomes 〈2X〉." }, // source id 179 — rarity corrected 2026-09-15, see top-of-file note
  { id: "radar", name: "Radar", rarity: "rare", kind: "artifact", image: artifactImage("radar.png"), stats: { critRate: 9 } }, // source id 180
  { id: "holygrail", name: "Holy Grail", rarity: "rare", kind: "artifact", image: artifactImage("holygrail.png"), stats: { hpRegen: 0.5 } }, // source id 181
  { id: "aimagic", name: "AI Magic", rarity: "special", kind: "artifact", image: artifactImage("aimagic.png"), stats: { cooldown: 5 }, tags: ["cooldown"], specialEffect: "Learns 〈4〉 random [Magics]." }, // source id 182
  { id: "harp", name: "Harp", rarity: "common", kind: "artifact", image: artifactImage("harp.png"), stats: { magicDuration: 12 } }, // source id 183
  { id: "magicgrimoire", name: "Magic Grimoire", rarity: "common", kind: "artifact", image: artifactImage("magicgrimoire.png"), stats: { cooldown: 5 }, tags: ["cooldown"] }, // source id 184
  { id: "ouroboros", name: "Ouroboros", rarity: "legendary", kind: "artifact", image: artifactImage("ouroboros.png"), stats: { cooldown: 15 }, tags: ["cooldown"] }, // source id 185
  { id: "dragontongue", name: "Dragontongue", rarity: "special", kind: "artifact", image: artifactImage("dragontongue.png"), stats: {}, specialEffect: "Increases the Damage of [Magic Combinations] by 〈40%〉." }, // source id 186
  { id: "imp", name: "Imp", rarity: "epic", kind: "artifact", image: artifactImage("imp.png"), stats: {}, specialEffect: "Max HP of Boss Wave Monsters is reduced by 10% Max HP of Normal Wave Monsters increases by 10%" }, // source id 187
  { id: "maskedball", name: "Masked Ball", rarity: "rare", kind: "artifact", image: artifactImage("maskedball.png"), stats: { critRate: 5, evasion: 5 }, tags: ["evasion"] }, // source id 188
  { id: "stainedglass", name: "Stained Glass", rarity: "rare", kind: "artifact", image: artifactImage("stainedglass.png"), stats: {}, specialEffect: "Increases the duration of [Rune] effects by 〈25%〉." }, // source id 189
  { id: "mimic", name: "Mimic", rarity: "rare", kind: "artifact", image: artifactImage("mimic.png"), stats: {}, specialEffect: "Causes an [Explosion] upon obtaining a [Treasure Chest], @ and creates 〈10〉 [random items] nearby." }, // source id 190
  { id: "halo", name: "Halo", rarity: "special", kind: "artifact", image: artifactImage("halo.png"), stats: { magicDamage: 30 } }, // source id 191
  { id: "basilisk", name: "Basilisk", rarity: "special", kind: "artifact", image: artifactImage("basilisk.png"), stats: {}, specialEffect: "Reduces the [Max HP] of all enemies by 〈10%〉." }, // source id 192
  { id: "alineacion", name: "Roster", rarity: "special", kind: "artifact", image: artifactImage("alineacion.png"), stats: {}, specialEffect: "After eliminating [100 enemies], any Damage dealt to the next 〈50〉 {instakills} them." }, // source id 193
  { id: "werewolf", name: "Werewolf", rarity: "special", kind: "artifact", image: artifactImage("werewolf.png"), stats: { critRate: 3 }, specialEffect: "Eliminating [2500] enemies activates the {Berserk Rune} effect." }, // source id 194
  { id: "abyss", name: "Abyss", rarity: "special", kind: "artifact", image: artifactImage("abyss.png"), stats: {}, specialEffect: "Converts half of Mana Acquisition Rate into [ATK] through [Conversion]" }, // source id 195
  { id: "eclipse", name: "Eclipse", rarity: "legendary", kind: "artifact", image: artifactImage("eclipse.png"), stats: {}, specialEffect: "Deals a maximum of 〈50%〉 of the target's lost HP as {Additional Damage}." }, // source id 196
  { id: "excalibur", name: "Excalibur", rarity: "legendary", kind: "artifact", image: artifactImage("excalibur.png"), stats: {}, specialEffect: "An [Aura] is generated around the character, dealing 〈25%〉 [Additional Damage] to enemies within its range." }, // source id 197
  { id: "goldenroulette", name: "Golden Roulette", rarity: "special", kind: "artifact", image: artifactImage("goldenroulette.png"), stats: {}, specialEffect: "Obtain 〈1〉 random [legendary artifact]." }, // source id 198
  { id: "jetengine", name: "Jet Engine", rarity: "special", kind: "artifact", image: artifactImage("jetengine.png"), stats: { moveSpeed: 5 }, tags: ["moveSpeed"], specialEffect: "While moving, [ATK] is {Amplified} by 〈20%〉." }, // source id 199
  { id: "wizardhat", name: "Wizard's Hat", rarity: "rare", kind: "artifact", image: artifactImage("wizardhat.png"), stats: {}, specialEffect: "For every [2%] of All Magic Cooldown Reduction, [ATK] increases by 〈1%〉" }, // source id 200
  { id: "longinusspear", name: "Longinus' Spear", rarity: "special", kind: "artifact", image: artifactImage("longinusspear.png"), stats: {}, specialEffect: "Strikes with a powerful lightning bolt (Cooldown: 9s)" }, // source id 201
  { id: "nexus", name: "Nexus", rarity: "legendary", kind: "artifact", image: artifactImage("nexus.png"), stats: {}, specialEffect: "Select an [Attack Magic] to increase its [Damage] by 〈240%〉" }, // source id 202
  { id: "dragonheart", name: "Dragon's Heart", rarity: "legendary", kind: "artifact", image: artifactImage("dragonheart.png"), stats: {}, specialEffect: "Amplifies ATK x1.3" }, // source id 203
  { id: "matriz", name: "Matrix", rarity: "special", kind: "artifact", image: artifactImage("matriz.png"), stats: {}, specialEffect: "Increases 〔All Magic Damage〕 by 〈20%〉 of the total [All Magic Size and Duration] + [Cooldown Reduction]" }, // source id 204
  { id: "robot", name: "Robot", rarity: "epic", kind: "artifact", image: artifactImage("robot.png"), stats: {}, specialEffect: "《Electric Zone》 deals 0.5% [Additional Damage] per character level" }, // source id 205
  { id: "mercurio", name: "Mercury", rarity: "epic", kind: "artifact", image: artifactImage("mercurio.png"), stats: {}, specialEffect: "Increases [Mana Orb] Acquisition by 〈20%〉." }, // source id 206
  { id: "fuentemagica", name: "Magic Fountain", rarity: "epic", kind: "artifact", image: artifactImage("fuentemagica.png"), stats: {}, specialEffect: "Amplifies [ATK] by 〈1%〉 for every [200] [Mana Orbs] you hold (Max Stack: 20%)" }, // source id 207
  { id: "quimera", name: "Chimera", rarity: "epic", kind: "artifact", image: artifactImage("quimera.png"), stats: {}, specialEffect: "Reduces Flash Shock Cooldown by 15% Reduces Lava Zone Cooldown by 15% Reduces Tsunami Cooldown by 15%" }, // source id 208
  { id: "elfrancotiradorlibre", name: "The Freeshooter", rarity: "epic", kind: "artifact", image: artifactImage("elfrancotiradorlibre.png"), stats: {}, specialEffect: "Increases Magic Bolt Damage by 100%" }, // source id 209
  { id: "shuriken", name: "Shuriken", rarity: "rare", kind: "artifact", image: artifactImage("shuriken.png"), stats: {}, specialEffect: "Increases Magic Bolt Critical Rate by 15% Increases Spirit Critical Rate by 15%" }, // source id 210
  { id: "condesa", name: "Countess", rarity: "legendary", kind: "artifact", image: artifactImage("condesa.png"), stats: { amplifyAtk: 30 }, tags: ["amplify"], specialEffect: "Triggers an [Explosion] upon defeating Elite Monsters (Explosion Damage is 30% of the enemy's Max HP)" }, // source id 211
  { id: "salamandra", name: "Salamander", rarity: "rare", kind: "artifact", image: artifactImage("salamandra.png"), stats: {}, specialEffect: "Increases Incineration Number by 5 Increases Lava Zone Number by 1" }, // source id 212
  { id: "creadoradeviudas", name: "Widowmaker", rarity: "legendary", kind: "artifact", image: artifactImage("creadoradeviudas.png"), stats: { critRate: 10 }, specialEffect: "Increases [Critical Multiplier] based on [Critical Rate]" }, // source id 213
  { id: "ramodeflores", name: "Bouquet", rarity: "special", kind: "artifact", image: artifactImage("ramodeflores.png"), stats: {}, specialEffect: "All products sold by the [Merchant] receive a 〈20%〉 {Discount}" }, // source id 214
  { id: "plasma", name: "Plasma", rarity: "special", kind: "artifact", image: artifactImage("plasma.png"), stats: { amplifyAtk: 40 }, tags: ["amplify"], specialEffect: "Reduces All Magic Size by 20%" }, // source id 215
  { id: "ocultismo", name: "Occult", rarity: "special", kind: "artifact", image: artifactImage("ocultismo.png"), stats: {}, specialEffect: "[Max HP] increases in proportion to the [Reduction of Enemies' Max HP]. Reduces the [Max HP] of all enemies by 〈5%〉." }, // source id 216 — rarity corrected 2026-09-15, see top-of-file note
  { id: "buho", name: "Owl", rarity: "rare", kind: "artifact", image: artifactImage("buho.png"), stats: { manaAcquisition: 10 }, specialEffect: "[Current Level] increases by 〈3〉" }, // source id 217
  { id: "moneda", name: "Coin", rarity: "epic", kind: "artifact", image: artifactImage("moneda.png"), stats: {}, specialEffect: "Obtain 〈□〉 《Mana Orb Resource》. Obtain 《Mana Orb Resource》" }, // source id 218
  { id: "unicornio", name: "Unicorn", rarity: "epic", kind: "artifact", image: artifactImage("unicornio.png"), stats: {}, specialEffect: "Offers a {Special Passive Option}" }, // source id 219
  { id: "skadi", name: "Skadi", rarity: "epic", kind: "artifact", image: artifactImage("skadi.png"), stats: {}, specialEffect: "Increases Blizzard Damage by 50% Increases Frost Nova Damage by 50%" }, // source id 220
  { id: "starlight", name: "Starlight", rarity: "epic", kind: "artifact", image: artifactImage("starlight.png"), stats: { amplifyAtk: 7, atk: 7, magicDamage: 7 }, tags: ["amplify"] }, // source id 221
  { id: "goblin", name: "Goblin", rarity: "legendary", kind: "artifact", image: artifactImage("goblin.png"), stats: {}, specialEffect: "Obtain □ Mana Orb Resource. Obtain a large amount of Mana Orb Resources." }, // source id 222
];
