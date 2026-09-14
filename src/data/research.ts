import { passiveImage, researchImage } from "../config/assets";
import type { ResearchDefinition } from "../types/game";

/**
 * Real global research tree, extracted directly from the game's own localization data
 * (spa_Dictionary_Ability.txt inside data.unity3d, type "연구") — not from
 * TomkoSK/magic-survival-builder's builder.js. That source's values turned out to be
 * frequently wrong: 11 of the 20 entries it had were guessed with a non-flat step
 * pattern (e.g. vitality as +20 then +10/+10/+10/+10) where the real data is a flat
 * per-level increment (+10 every level) — only the 6 entries that happened to already
 * be flat matched. maxLevel was also short by one level on several (intelligence,
 * fastcasting, snipe, analysis, awakening all cap one level higher than the old data).
 * Two entries the old data didn't have at all: "haggle" (Regateo — merchant discount)
 * and "startingFunds" (Apoyo — flat mana-orb currency granted at run start; distinct
 * from "support"/Ayuda, which boosts in-run mana orb spawn rate, not starting funds).
 *
 * `statKey` is null for research lines that don't map to a single pause-menu stat (loot
 * rate, recycle, magic choice odds, merchant discount, starting currency, etc.) — those
 * are still tracked for the research-point budget but don't feed the pause-menu mirror.
 *
 * Two value-sign notes from the source data, normalized here to match what the in-game
 * tooltip actually says (positive = better), not the raw internal storage:
 *  - loot (Botín): stored as a negative "spawn interval reduction" per level; shown here
 *    as the positive "% more often" the tooltip describes.
 *  - haggle (Regateo): same — stored as a negative internal value, shown as the positive
 *    discount percentage.
 *
 * Sprites: the APK sprite dump (scripts/organize-assets.mjs) has no per-node research
 * icons — but 8 research nodes are the same stat the player can also level as an in-run
 * passive (Intelligence, Vitality, Fast Casting, Snipe, Explorer, Arcane Effuse,
 * Concentration, Haste), which does have a real icon (see passives.ts's "-passive"
 * entries) — reused here via `passiveImage()` since it's genuinely the same in-game icon,
 * not a stand-in. The other 13 nodes (manaRefining, resistance, agility, regeneration,
 * recycle, analysis, blessing, awakening, growth, support, luck, loot, haggle,
 * startingFunds) still call `researchImage()` pointing at a folder that doesn't exist yet
 * — `image` 404s for these until a real research-tree sprite sheet is found in a future
 * extraction pass. ResearchScreen.tsx has an onError fallback to a "?" placeholder for
 * exactly this case (image field always truthy, so the img tag always renders — the
 * fallback has to be a load-error handler, not a truthiness check).
 */
export const RESEARCH: ResearchDefinition[] = [
  { id: "intelligence", name: "Intelligence", image: passiveImage("intelligence-passive.png"), maxLevel: 6, valuesByLevel: [0, 5, 10, 15, 20, 25, 30], statKey: "atk" },
  { id: "vitality", name: "Vitality", image: passiveImage("vitality-passive.png"), maxLevel: 6, valuesByLevel: [0, 10, 20, 30, 40, 50, 60], statKey: "hp" },
  { id: "manarefining", name: "Mana Refining", image: researchImage("manarefining.png"), maxLevel: 6, valuesByLevel: [0, 3, 6, 9, 12, 15, 18], statKey: "manaAcquisition" },
  { id: "fastcasting", name: "Fast Casting", image: passiveImage("fastcasting-passive.png"), maxLevel: 6, valuesByLevel: [0, 2, 4, 6, 8, 10, 12], statKey: "cooldown" },
  { id: "snipe", name: "Snipe", image: passiveImage("snipe-passive.png"), maxLevel: 6, valuesByLevel: [0, 1, 2, 3, 4, 5, 6], statKey: "critRate" },
  { id: "resistance", name: "Resistance", image: researchImage("resistance.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "damageTaken" },
  { id: "agility", name: "Agility", image: researchImage("agility.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "evasion" },
  { id: "haste", name: "Haste", image: passiveImage("haste-passive.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "moveSpeed" },
  { id: "regeneration", name: "Regeneration", image: researchImage("regeneration.png"), maxLevel: 4, valuesByLevel: [0, 0.05, 0.1, 0.15, 0.2], statKey: "hpRegen" },
  { id: "explorer", name: "Explorer", image: passiveImage("explorer-passive.png"), maxLevel: 4, valuesByLevel: [0, 10, 20, 30, 40], statKey: "itemPickupRange" },
  { id: "arcaneeffuse", name: "Arcane Effuse", image: passiveImage("arcaneeffuse-passive.png"), maxLevel: 4, valuesByLevel: [0, 3, 6, 9, 12], statKey: "magicSize" },
  { id: "concentration", name: "Concentration", image: passiveImage("concentration-passive.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "magicDuration" },
  { id: "recycle", name: "Recycle", image: researchImage("recycle.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: null },
  { id: "analysis", name: "Analysis", image: researchImage("analysis.png"), maxLevel: 5, valuesByLevel: [0, 5, 10, 15, 20, 25], statKey: null },
  { id: "blessing", name: "Blessing", image: researchImage("blessing.png"), maxLevel: 3, valuesByLevel: [0, 10, 20, 30], statKey: null },
  { id: "awakening", name: "Awakening", image: researchImage("awakening.png"), maxLevel: 5, valuesByLevel: [0, 5, 10, 15, 20, 25], statKey: null },
  { id: "growth", name: "Growth", image: researchImage("growth.png"), maxLevel: 4, valuesByLevel: [0, 1, 2, 3, 4], statKey: null },
  { id: "support", name: "Support", image: researchImage("support.png"), maxLevel: 6, valuesByLevel: [0, 10, 20, 30, 40, 50, 60], statKey: null },
  { id: "luck", name: "Luck", image: researchImage("luck.png"), maxLevel: 5, valuesByLevel: [0, 5, 10, 15, 20, 25], statKey: null },
  { id: "loot", name: "Loot", image: researchImage("loot.png"), maxLevel: 6, valuesByLevel: [0, 3, 6, 9, 12, 15, 18], statKey: null },
  { id: "haggle", name: "Haggle", image: researchImage("haggle.png"), maxLevel: 5, valuesByLevel: [0, 1, 2, 3, 4, 5], statKey: null },
  { id: "startingFunds", name: "Starting Funds", image: researchImage("startingfunds.png"), maxLevel: 6, valuesByLevel: [0, 50, 100, 150, 200, 250, 300], statKey: null },
];

export const RESEARCH_BY_ID: Record<string, ResearchDefinition> = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));
