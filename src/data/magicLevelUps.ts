/**
 * What each level-up of a base magic grants, from the game's own `eng_Dictionary_Ability.txt` (the
 * "^"-separated `《…》` list of magic rows 1-21). Entry `i` is the bonus for reaching level `i + 2`
 * (Magic Bolt: Lv2 +1 Number, Lv3 +50% Damage, Lv4 none — a talent unlock — Lv5 +1 Number, Lv6 +50%
 * Damage). Verified for Magic Bolt Lv2 against a real screenshot (Number 2). "@" separates a level's
 * lines. Keyed by the magic's English name (`BASE_MAGICS[i].name`).
 */
// prettier-ignore
export const MAGIC_LEVEL_UPS: Record<string, string[]> = {
  "Magic Bolt": ["Increase the number of Magic Bolts by 1","Increase Magic Bolt Damage by 50%","","Increase the number of Magic Bolts by 1","Increase Magic Bolt Damage by 50%"],
  "Fireball": ["Increase the number of Fireballs by 1","Increase Fireball Damage by 50%","Increase Fireball Size by 20%","Increase the number of Fireballs by 1","Increase Fireball Damage by 50%"],
  "Spirit": ["Increase Spirit Damage by 20% @ Increase the number of Spirits by 1","Increase Spirit Damage by 20% @ Increase the number of Spirits by 1","Increase Spirit Damage by 20% @ Increase the number of Spirits by 1","Increase Spirit Damage by 20% @ Increase the number of Spirits by 1","Increase Spirit Damage by 20% @ Increase the number of Spirits by 1"],
  "Satellite": ["Increase Satellite Damage by 20% @ Increase the number of Satellites by 1","Increase Satellite Damage by 20% @ Increase the number of Satellites by 1","Increase Satellite Damage by 20% @ Increase the number of Satellites by 1","Increase Satellite Damage by 20% @ Increase the number of Satellites by 1","Increase Satellite Damage by 20% @ Increase the number of Satellites by 1"],
  "Frost Nova": ["Increase Frost Nova Size by 15%","Increase Frost Nova Damage by 50%","Decrease Frost Nova Cooldown by 15%","Increase Frost Nova Size by 20%","Increase Frost Nova Damage by 50%"],
  "Shield": ["Decrease Shield Cooldown by 10%","Decrease Shield Cooldown by 10%","Decrease Shield Cooldown by 10%"],
  "Thunderstorm": ["Increase Thunderstorm Damage by 20% @ Increase the number of Thunderstorms by 1","Increase Thunderstorm Damage by 20% @ Increase the number of Thunderstorms by 1","Increase Thunderstorm Damage by 20% @ Increase the number of Thunderstorms by 1","Increase Thunderstorm Damage by 20% @ Increase the number of Thunderstorms by 1","Increase Thunderstorm Damage by 20% @ Increase the number of Thunderstorms by 1"],
  "Electric Zone": ["Increase Electric Zone Size by 15%","Increase Electric Zone Damage by 50%","Increase Electric Zone Size by 15%","Increase Electric Zone Size by 20%","Increase Electric Zone Damage by 50%"],
  "Tsunami": ["Increase the number of Tsunamis by 3","Increase Tsunami Damage by 50%","Decrease Tsunami Cooldown by 15%","Increase the number of Tsunamis by 3","Increase Tsunami Damage by 50%"],
  "Meteor": ["Increase the number of Meteors by 1","Increase Meteor Damage by 50%","Increase Meteor Size by 20%","Increase the number of Meteors by 1","Increase Meteor Damage by 50%"],
  "Cloaking": ["Increase Cloaking Duration by 30%","Increase Cloaking Duration by 30%","Increase Cloaking Duration by 30%"],
  "Cyclone": ["Increase the number of Cyclones by 1","Increase Cyclone Damage by 50%","Increase Cyclone Duration by 30%","Increase the number of Cyclones by 1","Increase Cyclone Damage by 50%"],
  "Electric Shock": ["Increase Electric Shock Damage by 20% @ Increase the number of Electric Shocks by 1","Increase Electric Shock Damage by 20% @ Increase the number of Electric Shocks by 1","Increase Electric Shock Damage by 20% @ Increase the number of Electric Shocks by 1","Increase Electric Shock Damage by 20% @ Increase the number of Electric Shocks by 1","Increase Electric Shock Damage by 20% @ Increase the number of Electric Shocks by 1"],
  "Armageddon": ["Decrease Armageddon Cooldown by 10%","Decrease Armageddon Cooldown by 10%","Decrease Armageddon Cooldown by 10%"],
  "Incineration": ["Increase the number of Incinerations by 6","Increase Incineration Damage by 50%","Increase Incineration Size by 20%","Increase the number of Incinerations by 6","Increase Incineration Damage by 50%"],
  "Energy Bolt": ["Increase Energy Bolt Damage by 20% @ 2 Additional Energy Bolts","Increase Energy Bolt Damage by 20% @ 2 Additional Energy Bolts","Increase Energy Bolt Damage by 20% @ 2 Additional Energy Bolts","Increase Energy Bolt Damage by 20% @ 2 Additional Energy Bolts","Increase Energy Bolt Damage by 20% @ 2 Additional Energy Bolts"],
  "Blizzard": ["Increase the number of Blizzards by 8","Increase Blizzard Damage by 50%","Decrease Blizzard Cooldown by 15%","Increase the number of Blizzards by 8","Increase Blizzard Damage by 50%"],
  "Arcane Ray": ["Increase Arcane Ray Damage by 20% @ Increase the number of Arcane Rays by 1","Increase Arcane Ray Damage by 20% @ Increase the number of Arcane Rays by 1","Increase Arcane Ray Damage by 20% @ Increase the number of Arcane Rays by 1","Increase Arcane Ray Damage by 20% @ Increase the number of Arcane Rays by 1","Increase Arcane Ray Damage by 20% @ Increase the number of Arcane Rays by 1"],
  "Magic Circle": ["Increase Magic Circle Effect by 5% @ Increase Magic Circle Duration by 20%","Increase Magic Circle Effect by 5% @ Increase Magic Circle Duration by 20%","Increase Magic Circle Effect by 5% @ Increase Magic Circle Duration by 20%"],
  "Lava Zone": ["Increase the number of Lava Zones by 1","Increase Lava Zone Damage by 50%","Increase Lava Zone Size by 20%","Increase the number of Lava Zones by 1","Increase Lava Zone Damage by 50%"],
  "Flash Shock": ["Increase Flash Shock Size by 15%","Increase Flash Shock Damage by 50%","Increase Flash Shock Size by 15%","Decrease Flash Shock Cooldown by 20%","Increase Flash Shock Damage by 50%"],
};
