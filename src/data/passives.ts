import { passiveImage } from "../config/assets";
import type { EquippableItem } from "../types/game";

/**
 * Real passive magics, extracted directly from the game's own localization data
 * (spa_Dictionary_Ability.txt, types "패시브" and "특수패시브") — all 34 (10 base
 * leveled passives you pick during a run + 24 unique "special" ones), not the
 * previous 19-item subset sourced from TomkoSK/magic-survival-builder.
 *
 * Base leveled passives keep the app's existing "-passive" id suffix convention
 * and are shown at max level, same as before. Stats/specialEffect extraction uses
 * the same method as artifacts.ts — see that file's header comment.
 */
export const PASSIVES: EquippableItem[] = [
  { id: "magiaavanzada-passive", name: "Advanced Magic", rarity: "common", kind: "passive", image: passiveImage("magiaavanzada-passive.png"), stats: {}, specialEffect: "Increases the Damage of [Magic Combinations] by 〈15%〉." }, // source id 30
  { id: "intelligence-passive", name: "Intelligence", rarity: "common", kind: "passive", image: passiveImage("intelligence.png"), stats: { atk: 22 } }, // source id 31
  { id: "fastcasting-passive", name: "Fast Casting", rarity: "common", kind: "passive", image: passiveImage("fastcasting.png"), stats: { cooldown: 7 }, tags: ["cooldown"] }, // source id 32
  { id: "vitality-passive", name: "Vitality", rarity: "common", kind: "passive", image: passiveImage("vitality.png"), stats: { hp: 60, lifeOrbRecovery: 10 } }, // source id 33
  { id: "haste-passive", name: "Haste", rarity: "common", kind: "passive", image: passiveImage("haste.png"), stats: { moveSpeed: 12 }, tags: ["moveSpeed"] }, // source id 34
  { id: "arcaneeffuse-passive", name: "Arcane Effuse", rarity: "common", kind: "passive", image: passiveImage("arcaneeffuse.png"), stats: { magicSize: 9 } }, // source id 35
  { id: "concentration-passive", name: "Concentration", rarity: "common", kind: "passive", image: passiveImage("concentration.png"), stats: { magicDuration: 16 } }, // source id 36
  { id: "snipe-passive", name: "Snipe", rarity: "common", kind: "passive", image: passiveImage("snipe.png"), stats: { critRate: 7 } }, // source id 37
  { id: "explorer-passive", name: "Explorer", rarity: "common", kind: "passive", image: passiveImage("explorer.png"), stats: { itemPickupRange: 53 } }, // source id 38
  { id: "ruptura-passive", name: "Rupture", rarity: "common", kind: "passive", image: passiveImage("ruptura-passive.png"), stats: { critMultiplier: 25 } }, // source id 39
  { id: "lordoffire", name: "Lord of Fire", rarity: "special", kind: "passive", image: passiveImage("lordoffire.png"), stats: {}, specialEffect: "Increases the [Damage] of the following Magic by 〈25%〉. Fireball, Meteor, Incineration, Lava Zone" }, // source id 301
  { id: "stormyclouds", name: "Stormy Clouds", rarity: "special", kind: "passive", image: passiveImage("stormyclouds.png"), stats: {}, specialEffect: "Increases the [Damage] of the following Magic by 〈25%〉. Thunderstorm, Electric Shock, Electric Zone, Flash Shock" }, // source id 302
  { id: "naturewrath", name: "Nature's Wrath", rarity: "special", kind: "passive", image: passiveImage("naturewrath.png"), stats: {}, specialEffect: "Increases the [Damage] of the following Magic by 〈25%〉. Cyclone, Blizzard, Tsunami, Frost Nova" }, // source id 303
  { id: "energyengineering", name: "Energy Engineering", rarity: "special", kind: "passive", image: passiveImage("energyengineering.png"), stats: {}, specialEffect: "Increases the [Damage] of the following Magic by 〈25%〉. Energy Bolt, Arcane Ray, Spirit, Satellite" }, // source id 304
  { id: "arcana", name: "Arcana", rarity: "special", kind: "passive", image: passiveImage("arcana.png"), stats: { atk: 15 } }, // source id 305
  { id: "guardianangel", name: "Guardian Angel", rarity: "special", kind: "passive", image: passiveImage("guardianangel.png"), stats: { hp: 30 }, specialEffect: "[Revive] 〈1〉 more time." }, // source id 306
  { id: "silentcasting", name: "Silent Casting", rarity: "special", kind: "passive", image: passiveImage("silentcasting.png"), stats: { cooldown: 7 }, tags: ["cooldown"] }, // source id 307
  { id: "warmagic", name: "War Magic", rarity: "special", kind: "passive", image: passiveImage("warmagic.png"), stats: { atk: 8, magicSize: 8 } }, // source id 308
  { id: "timekeeper", name: "Timekeeper", rarity: "special", kind: "passive", image: passiveImage("timekeeper.png"), stats: { magicDuration: 12 }, specialEffect: "Increases the duration of [Rune] effects by 〈12%〉." }, // source id 309
  { id: "pioneer", name: "Pioneer", rarity: "special", kind: "passive", image: passiveImage("pioneer.png"), stats: { moveSpeed: 3, itemPickupRange: 50 }, tags: ["moveSpeed"] }, // source id 310
  { id: "smite", name: "Smite", rarity: "special", kind: "passive", image: passiveImage("smite.png"), stats: { critMultiplier: 30 } }, // source id 311
  { id: "seal", name: "Seal", rarity: "special", kind: "passive", image: passiveImage("seal.png"), stats: {}, specialEffect: "Decreases the [Move Speed] of all enemies by 〈8%〉." }, // source id 312
  { id: "curse", name: "Curse", rarity: "special", kind: "passive", image: passiveImage("curse.png"), stats: {}, specialEffect: "Decreases the [Max HP] of all enemies by 〈6%〉." }, // source id 313
  { id: "chakra", name: "Chakra", rarity: "special", kind: "passive", image: passiveImage("chakra.png"), stats: { magicDamage: 20 } }, // source id 314
  { id: "manafactory", name: "Mana Factory", rarity: "special", kind: "passive", image: passiveImage("manafactory.png"), stats: {}, specialEffect: "[Mana Orbs] are created 〈20%〉 more frequently." }, // source id 315
  { id: "doctor", name: "Doctor", rarity: "special", kind: "passive", image: passiveImage("doctor.png"), stats: {}, specialEffect: "Increases the [Max Level] by 〈3〉." }, // source id 316
  { id: "bloodmagic", name: "Blood Magic", rarity: "special", kind: "passive", image: passiveImage("bloodmagic.png"), stats: { amplifyAtk: 10 }, tags: ["amplify"], specialEffect: "Decreases HP Regen per sec. by 0.25%" }, // source id 317
  { id: "adrenaline", name: "Adrenaline", rarity: "special", kind: "passive", image: passiveImage("adrenaline.png"), stats: {}, specialEffect: "Increases ATK, Critical Strike Rate, and Movement Speed by 5%" }, // source id 318
  { id: "juggernaut", name: "Juggernaut", rarity: "special", kind: "passive", image: passiveImage("juggernaut.png"), stats: { atk: 10, damageTaken: 15 } }, // source id 319
  { id: "priest", name: "Priest", rarity: "special", kind: "passive", image: passiveImage("priest.png"), stats: { hpRegen: 0.3 }, specialEffect: "Decreases the [Max HP] of all enemies by 〈3%〉." }, // source id 320
  { id: "eldritch", name: "Eldritch", rarity: "special", kind: "passive", image: passiveImage("eldritch.png"), stats: {}, specialEffect: "Decreases the [Max HP] of Elite Monsters by 〈10%〉." }, // source id 321
  { id: "noblesse", name: "Noblesse", rarity: "special", kind: "passive", image: passiveImage("noblesse.png"), stats: {}, specialEffect: "Creates 〈1〉 [Treasure Chest] nearby." }, // source id 322
  { id: "maestrotaoista", name: "Taoist", rarity: "special", kind: "passive", image: passiveImage("maestrotaoista.png"), stats: {}, specialEffect: "Increases the level of all [Additional Passive] spells by 〈1〉" }, // source id 323
  { id: "florista", name: "Florist", rarity: "special", kind: "passive", image: passiveImage("florista.png"), stats: {}, specialEffect: "All items sold by the [Merchant] receive a 〈7%〉 {Discount}" }, // source id 324
];
