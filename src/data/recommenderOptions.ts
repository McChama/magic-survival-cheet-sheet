import { ALL_ITEMS } from "../engine/tierAdaptive";
import { BASE_MAGICS, baseMagicSpriteUrl } from "./magics";
import type { RecommenderOption } from "../engine/scoring";

/** Every pickable choice the Active Recommender can compare: artifacts, passives, and base magics. */
export const ALL_RECOMMENDER_OPTIONS: RecommenderOption[] = [
  ...ALL_ITEMS.map((item) => ({ id: item.id, label: item.name, image: item.image, item })),
  ...BASE_MAGICS.map((magic) => ({ id: `magic:${magic.id}`, label: magic.name, image: baseMagicSpriteUrl(magic.id), magicId: magic.id })),
];

export const OPTION_BY_ID: Record<string, RecommenderOption> = Object.fromEntries(
  ALL_RECOMMENDER_OPTIONS.map((o) => [o.id, o])
);
