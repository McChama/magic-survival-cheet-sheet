/**
 * Base magic categories, per the official wiki's own grouping
 * (magic-survival-rpg.fandom.com/wiki/Magic — "Offensive Magics" / "Utility Magics"
 * sections). `intelligence` is technically a Passive Magic on the wiki (it's also one
 * of our Research nodes), but it's carried in BASE_MAGICS for fusion-pairing purposes,
 * so it's bucketed here under Utility rather than invented a third one-item category.
 */
export type MagicCategory = "offensive" | "utility";

export const MAGIC_CATEGORY: Record<string, MagicCategory> = {
  thunderstorm: "offensive",
  meteor: "offensive",
  spirit: "offensive",
  electricShock: "offensive",
  energyBolt: "offensive",
  arcaneRay: "offensive",
  blizzard: "offensive",
  fireball: "offensive",
  flashShock: "offensive",
  magicBolt: "offensive",
  satellite: "offensive",
  cyclone: "offensive",
  incineration: "offensive",
  lavaZone: "offensive",
  electricZone: "offensive",
  tsunami: "offensive",
  frostNova: "offensive",
  shield: "utility",
  armageddon: "utility",
  intelligence: "utility",
  magicCircle: "utility",
  cloaking: "utility",
};

export const MAGIC_CATEGORY_LABEL: Record<MagicCategory, string> = {
  offensive: "Active",
  utility: "Utility",
};

/** The four kinds of magic the "+" menu tells apart: the two base-magic categories, the regular passives and the special passives. */
export type MagicKind = MagicCategory | "passive" | "special";

/** The kind of a pickable option: a base magic by its category, a passive by its rarity (common = regular, special = special). */
export function magicKindOf(option: { magicId?: string; item?: { kind: string; rarity: string } }): MagicKind | null {
  if (option.magicId) return MAGIC_CATEGORY[option.magicId] ?? null;
  if (option.item?.kind !== "passive") return null;
  return option.item.rarity === "special" ? "special" : "passive";
}
