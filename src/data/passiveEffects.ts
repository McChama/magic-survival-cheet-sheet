import type { ColoredTextLine } from "../types/game";

/**
 * Every passive's real effect lines, with their real colors, from `eng_Dictionary_Ability.txt`
 * (English; the passive's row is found by the same `// source id N` as in `passives.ts`, and the
 * six "설명줄" text/color column pairs are the lines the game shows — "`" empty ones dropped).
 * e.g. Guardian Angel: "[Revive] 〈1〉 more time." then, in green, "Increase Max HP by 30%".
 * `passives.ts` only keeps one `specialEffect` string plus stat numbers, which loses lines like the
 * second one above. Text keeps the game's bracket markup for `GameText`. For a leveled passive
 * (Intelligence, Vitality, ...) the lines are the game's own: a first line, then the per-level one.
 */
// prettier-ignore
export const PASSIVE_EFFECT_LINES: Record<string, ColoredTextLine[]> = {
  "magiaavanzada-passive": [{"color":"#EBEBEB","text":"Increase [Combination Magic] Damage by 〈15%〉."}],
  "intelligence-passive": [{"color":"#64FF32","text":"Increase ATK by 10%"},{"color":"#64FF32","text":"Increase ATK by 3%"}],
  "fastcasting-passive": [{"color":"#64FF32","text":"Decrease All Magic Cooldown by 5%"},{"color":"#64FF32","text":"Decrease All Magic Cooldown by 1%"}],
  "vitality-passive": [{"color":"#64FF32","text":"Increase Max HP by 20%"},{"color":"#64FF32","text":"Increase Life Orb HP Recovery by 10%"},{"color":"#64FF32","text":"Increase Max HP by 10%"}],
  "haste-passive": [{"color":"#64FF32","text":"Increase Movement Speed by 10%"},{"color":"#64FF32","text":"Increase Movement Speed by 2%"}],
  "arcaneeffuse-passive": [{"color":"#64FF32","text":"Increase All Magic Size by 5%"},{"color":"#64FF32","text":"Increase All Magic Size by 2%"}],
  "concentration-passive": [{"color":"#64FF32","text":"Increase All Magic Duration by 10%"},{"color":"#64FF32","text":"Increase All Magic Duration by 3%"}],
  "snipe-passive": [{"color":"#64FF32","text":"Increase Critical Strike Rate by 5%"},{"color":"#64FF32","text":"Increase Critical Strike Rate by 1%"}],
  "explorer-passive": [{"color":"#64FF32","text":"Increase Item Pickup Range by 33%"},{"color":"#64FF32","text":"Increase Item Pickup Range by 10%"}],
  "ruptura-passive": [{"color":"#64FF32","text":"Increase Critical Strike Multiplier by 15%"},{"color":"#64FF32","text":"Increase Critical Strike Multiplier by 5%"}],
  "lordoffire": [{"color":"#EBEBEB","text":"Increase the [Damage] of the following Magic by 〈25%〉."},{"color":"#6EDCFF","text":"Fireball, Meteor, Incineration, Lava Zone"}],
  "stormyclouds": [{"color":"#EBEBEB","text":"Increase the [Damage] of the following Magic by 〈25%〉."},{"color":"#6EDCFF","text":"Thunderstorm, Electric Shock, Electric Zone, Flash Shock"}],
  "naturewrath": [{"color":"#EBEBEB","text":"Increase the [Damage] of the following Magic by 〈25%〉."},{"color":"#6EDCFF","text":"Cyclone, Blizzard, Tsunami, Frost Nova"}],
  "energyengineering": [{"color":"#EBEBEB","text":"Increase the [Damage] of the following Magic by 〈25%〉."},{"color":"#6EDCFF","text":"Energy Bolt, Arcane Ray, Spirit, Satellite"}],
  "arcana": [{"color":"#64FF32","text":"Increase ATK by 15%"}],
  "guardianangel": [{"color":"#EBEBEB","text":"[Revive] 〈1〉 more time."},{"color":"#64FF32","text":"Increase Max HP by 30%"}],
  "silentcasting": [{"color":"#64FF32","text":"Decrease All Magic Cooldown by 7%"}],
  "warmagic": [{"color":"#64FF32","text":"Increase ATK by 8%"},{"color":"#64FF32","text":"Increase All Magic Size by 8%"}],
  "timekeeper": [{"color":"#EBEBEB","text":"Increase the duration of [Rune] effects by 〈12%〉."},{"color":"#64FF32","text":"Increase All Magic Duration by 12%"}],
  "pioneer": [{"color":"#64FF32","text":"Increase Movement Speed by 3%"},{"color":"#64FF32","text":"Increase Item Pickup Range by 50%"}],
  "smite": [{"color":"#64FF32","text":"Increase Critical Strike Multiplier by 30%"}],
  "seal": [{"color":"#EBEBEB","text":"Decrease the [Movement Speed] of all enemies by 〈8%〉."}],
  "curse": [{"color":"#EBEBEB","text":"Decrease the [Max HP] of all enemies by 〈6%〉."}],
  "chakra": [{"color":"#6EDCFF","text":"Increase All Magic Damage by 20%"}],
  "manafactory": [{"color":"#EBEBEB","text":"[Mana Orbs] are created 〈20%〉 more frequently."}],
  "doctor": [{"color":"#EBEBEB","text":"Increase [Max Level] by 〈3〉."}],
  "bloodmagic": [{"color":"#FF76DE","text":"Amplify ATK by 10%"},{"color":"#FF6464","text":"Decrease HP Regen per sec. by 0.25%"}],
  "adrenaline": [{"color":"#64FF32","text":"Increase ATK, Critical Strike Rate, Movement Speed by 5%"}],
  "juggernaut": [{"color":"#64FF32","text":"Increase ATK by 10%"},{"color":"#64FF32","text":"Decrease Damage Taken by 15%"}],
  "priest": [{"color":"#EBEBEB","text":"Decrease the [Max HP] of all enemies by 〈3%〉."},{"color":"#64FF32","text":"Increase HP Regen per sec. by 0.3%"}],
  "eldritch": [{"color":"#EBEBEB","text":"Decrease the [Max HP] of Elite Monsters by 〈10%〉."}],
  "noblesse": [{"color":"#EBEBEB","text":"Create 〈1〉 [Treasure Chest] nearby."}],
  "maestrotaoista": [{"color":"#EBEBEB","text":"Increase all [Additional Passive] spell levels by 〈1〉"}],
  "florista": [{"color":"#EBEBEB","text":"All products sold by [Merchants] are 〈7%〉 {Discounted}"}],
};
