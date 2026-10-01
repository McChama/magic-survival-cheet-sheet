import { passiveImage } from "../config/assets";
import type { ColoredTextLine } from "../types/game";

/**
 * "Enchant" — a level-up offer of its own kind (`eng_Dictionary_Ability.txt` row 329, type "인챈트": neither a magic
 * nor a passive). Taking it opens the game's "Choose the Magic to strengthen" screen, where one **attack** magic —
 * owned or not, all 17 are listed — gets a fixed pair of bonuses: +50% Damage and a second line that depends on the
 * magic. Its "최대레벨" column says 3, read here as "it can be taken three times" (not confirmed in game).
 *
 * The run records it as the list of magics it was spent on (`run.enchantedMagicIds`), not as an owned item: an
 * Enchant is nothing without the magic it went to.
 */
export const ENCHANT = {
  id: "enchant",
  name: "Enchant",
  image: passiveImage("enchant.png"),
  /** The row's own line in Select Magic. */
  description: { color: "#EBEBEB", text: "Select one [Attack Spell] to {Enhance}" } satisfies ColoredTextLine,
  maxCount: 3,
};

/** The pale blue the game writes a magic's Enchant lines in (sampled off the real screen; the dictionary has no color for them). */
export const ENCHANT_LINE_COLOR = "#B0C8F0";

/**
 * What an Enchant gives each attack magic — the fifth description line of the magic's own dictionary row ("@" =
 * a line break), in the order the game's grid shows them (rows of 4, 4, 4, 3, 2: the dictionary's own order). The
 * four utility magics (Shield, Cloaking, Armageddon, Magic Circle) have no such line and aren't offered.
 */
// prettier-ignore
export const ENCHANT_EFFECTS: Record<string, string> = {
  magicBolt: "Increase Magic Bolt Damage by 50% @ Decrease Magic Bolt Cooldown by 5%",
  fireball: "Increase Fireball Damage by 50% @ Increase Fireball Size by 10%",
  spirit: "Increase Spirit Damage by 50% @ Decrease Spirit Cooldown by 5%",
  satellite: "Increase Satellite Damage by 50% @ Increase Satellite Rotation Speed by 25%",
  frostNova: "Increase Frost Nova Damage by 50% @ Increase Frost Nova Size by 10%",
  thunderstorm: "Increase Thunderstorm Damage by 50% @ Decrease Thunderstorm Cooldown by 5%",
  electricZone: "Increase Electric Zone Damage by 50% @ Increase Electric Zone Size by 10%",
  tsunami: "Increase Tsunami Damage by 50% @ Decrease Tsunami Cooldown by 5%",
  meteor: "Increase Meteor Damage by 50% @ Decrease Meteor Cooldown by 5%",
  cyclone: "Increase Cyclone Damage by 50% @ Increase Cyclone Duration by 15%",
  electricShock: "Increase Electric Shock Damage by 50% @ Decrease Electric Shock Cooldown by 5%",
  incineration: "Increase Incineration Damage by 50% @ Decrease Incineration Cooldown by 5%",
  energyBolt: "Increase Energy Bolt Damage by 50% @ Increase Energy Bolt Size by 10%",
  blizzard: "Increase Blizzard Damage by 50% @ Decrease Blizzard Cooldown by 5%",
  arcaneRay: "Increase Arcane Ray Damage by 50% @ Decrease Arcane Ray Cooldown by 5%",
  lavaZone: "Increase Lava Zone Damage by 50% @ Decrease Lava Zone Cooldown by 5%",
  flashShock: "Increase Flash Shock Damage by 50% @ Decrease Flash Shock Cooldown by 5%",
};

/** The magics an Enchant can go to, in the grid's order. */
export const ENCHANTABLE_MAGIC_IDS = Object.keys(ENCHANT_EFFECTS);

/** The grid's rows, as the game lays them out. */
export const ENCHANT_GRID_ROWS = [4, 4, 4, 3, 2];
