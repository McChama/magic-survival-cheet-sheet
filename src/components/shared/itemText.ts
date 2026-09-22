import { STAT_DEFINITIONS } from "../../data/statDefinitions";
import type { EquippableItem, StatKey } from "../../types/game";

/** The `loadoutSheet.categories.*` key that names each rarity ("Normal" for common). */
export const RARITY_LABEL_KEY: Record<EquippableItem["rarity"], string> = {
  common: "normal",
  rare: "rare",
  epic: "epic",
  special: "special",
  legendary: "legendary",
};

/** An item's effect as one text: its real special effect when it has one, else its stat numbers ("+10% Amplify ATK, ..."). */
export function describeItem(item: EquippableItem, t: (key: string) => string, gt: (key: string, fallback: string) => string): string {
  if (item.specialEffect) return gt(`item.${item.id}.specialEffect`, item.specialEffect);
  const parts = (Object.entries(item.stats) as [StatKey, number][])
    .filter(([, value]) => value)
    .map(([key, value]) => `${value > 0 ? "+" : ""}${value}${STAT_DEFINITIONS[key].unit === "%" ? "%" : ""} ${gt(`stat.${key}.label`, STAT_DEFINITIONS[key].label)}`);
  return parts.join(", ") || t("loadoutSheet.noAdditionalEffect");
}
