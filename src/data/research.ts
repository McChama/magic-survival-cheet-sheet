import { researchImage } from "../config/assets";
import type { ResearchDefinition } from "../types/game";

/**
 * Real global research tree, extracted directly from the game's own localization data
 * (spa_Dictionary_Ability.txt inside data.unity3d, type "연구") — not from
 * TomkoSK/magic-survival-builder's builder.js. That source's values turned out to be
 * frequently wrong (**superseded — see the correction below; the builder's non-flat pattern was right for 7 nodes**): 11 of the 20 entries it had were guessed with a non-flat step
 * pattern (e.g. vitality as +20 then +10/+10/+10/+10) where the real data is a flat
 * per-level increment (+10 every level) — only the 6 entries that happened to already
 * be flat matched. maxLevel was also short by one level on several (intelligence,
 * fastcasting, snipe, analysis, awakening all cap one level higher than the old data).
 * **Per-level values (corrected 2026-09-21)**: each dictionary row has two numbers — the first level's value
 * (`효과ID_01값`, the effect-value column) and the step added per further level (`특수값01`) — so the value at
 * level n is `first + step x (n - 1)`, not `step x n`. Explorer is 20/30/40/50 (not 10..40), Mana Refining
 * 5/8/11/14/17/20 (not 3..18); Vitality 20..70 HP and 10..35 Life Orb, Recycle 10..25, Growth 2..5, Luck 10..30, Loot
 * 5..20. Explorer and Mana Refining were confirmed against the real game. The other 15 nodes have first == step, so were right.
 *
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
 * Sprites: **resolved 2026-09-16.** A same-name grep of `raw-assets/Sprites/` had earlier
 * found no dedicated research-tree icon sheet — true, but the wrong search: research nodes
 * turn out to follow the exact same `Ability{sourceId}Portrait.png` id convention as
 * artifacts/passives (see `artifacts.ts`'s header comment), just in their own id range
 * (261-282, immediately after `eng_Dictionary_Ability.txt`'s own row ids for this node type —
 * the same file `descriptionTemplate` below comes from). All 22 exist and were verified by
 * eye on a dark background before wiring in (not just "file exists") — the vast majority are
 * exact, unambiguous thematic matches (Snipe→crosshair, Resistance→shield,
 * Regeneration→medical cross, Recycle→the literal recycling symbol, Explorer→magnifying
 * glass, Concentration→concentric rings, Analysis→scrolls, Awakening→starburst,
 * Growth→a growing tree, Luck→dice, Bargain→a balance scale), which is what makes the id
 * convention trustworthy here rather than a coincidence. Every `// source id N` below maps
 * to `public/assets/researchImages/{id}.png` via `scripts/organize-assets.mjs`, same as
 * artifacts/passives. This replaced two earlier, weaker fallbacks (worth knowing about if a
 * future pass needs the same trick for something else): reusing a passive's icon for the 8
 * nodes sharing that passive's name (still fine, but now redundant — the node has its own
 * real sprite), and reusing a pause-menu `StatGridRow` stat icon for 4 more nodes that had a
 * `StatKey` but no passive (a real asset, but from a different screen — always a guess about
 * whether the game itself reuses it there, now moot).
 *
 * `descriptionTemplate`/`descriptionColor` were added 2026-09-15, sourced directly from
 * `eng_Dictionary_Ability.txt` (type "연구", ids 261-282 — the same file/methodology as
 * `classes.ts`'s `CLASS_BONUSES`, see `reference/game-data-sources.md`). Before this,
 * `ResearchScreen.tsx` displayed a synthetic, app-generated sentence ("Increase {stat} by
 * {step}%") instead of the game's own text — close for the flat-stat nodes but wrong for
 * anything with a more specific real sentence (e.g. Recycle's real text is "Retrieve 〈□%〉
 * more Mana when retrieving Mana.", not a generic "Increase Mana Retrieval" line), and
 * silently missing for the 9 nodes with `statKey: null` (no sentence was ever generated for
 * those since `describeNode()` had nothing to build one from). Use
 * `describeResearchNode(node, level)` (below) to substitute the `□`-run with the real
 * current-level value instead of the old `describeNode()` in `ResearchScreen.tsx`.
 *
 * This pass also corrected one name: the dictionary calls this node **Bargain**, not
 * "Haggle" — `id: "haggle"` is unchanged (matches the sprite/save-data convention of never
 * renaming a stable id), only `name` was fixed.
 */
export const RESEARCH: ResearchDefinition[] = [
  { id: "intelligence", name: "Intelligence", image: researchImage("intelligence.png"), maxLevel: 6, valuesByLevel: [0, 5, 10, 15, 20, 25, 30], statKey: "atk", descriptionTemplate: "Increase ATK by □%", descriptionColor: "#E1FFAF" }, // source id 261
  {
    id: "vitality", // source id 262
    name: "Vitality", image: researchImage("vitality.png"), maxLevel: 6, valuesByLevel: [0, 20, 30, 40, 50, 60, 70], statKey: "hp",
    // Real dictionary text is 2 lines — HP (tracked above) and a second, separate
    // "Life Orb HP Recovery" scaling (+5%/level, not tracked as its own StatKey anywhere
    // else in this app) folded into the template via `secondaryValuesByLevel` below.
    descriptionTemplate: "Increase Max HP by □% @ Increase Life Orb HP Recovery by □%", descriptionColor: "#E1FFAF",
    secondaryValuesByLevel: [0, 10, 15, 20, 25, 30, 35],
  },
  { id: "manarefining", name: "Mana Refining", image: researchImage("manarefining.png"), maxLevel: 6, valuesByLevel: [0, 5, 8, 11, 14, 17, 20], statKey: "manaAcquisition", descriptionTemplate: "Increase Mana Acquisition by □%", descriptionColor: "#E1FFAF" }, // source id 263
  { id: "fastcasting", name: "Fast Casting", image: researchImage("fastcasting.png"), maxLevel: 6, valuesByLevel: [0, 2, 4, 6, 8, 10, 12], statKey: "cooldown", descriptionTemplate: "Decrease All Magic Cooldown by □%", descriptionColor: "#E1FFAF" }, // source id 264
  { id: "snipe", name: "Snipe", image: researchImage("snipe.png"), maxLevel: 6, valuesByLevel: [0, 1, 2, 3, 4, 5, 6], statKey: "critRate", descriptionTemplate: "Increase Critical Strike Rate by □%", descriptionColor: "#E1FFAF" }, // source id 265
  { id: "resistance", name: "Resistance", image: researchImage("resistance.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "damageTaken", descriptionTemplate: "Decrease Damage Taken by □%", descriptionColor: "#E1FFAF" }, // source id 266
  { id: "agility", name: "Agility", image: researchImage("agility.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "evasion", descriptionTemplate: "Increase Evasion by □%", descriptionColor: "#E1FFAF" }, // source id 267
  { id: "haste", name: "Haste", image: researchImage("haste.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "moveSpeed", descriptionTemplate: "Increase Movement Speed by □%", descriptionColor: "#E1FFAF" }, // source id 268
  { id: "regeneration", name: "Regeneration", image: researchImage("regeneration.png"), maxLevel: 4, valuesByLevel: [0, 0.05, 0.1, 0.15, 0.2], statKey: "hpRegen", descriptionTemplate: "Increase HP Regen per sec. by □%", descriptionColor: "#E1FFAF" }, // source id 269
  { id: "explorer", name: "Explorer", image: researchImage("explorer.png"), maxLevel: 4, valuesByLevel: [0, 20, 30, 40, 50], statKey: "itemPickupRange", descriptionTemplate: "Increase Item Pickup Range by □%", descriptionColor: "#E1FFAF" }, // source id 270
  { id: "arcaneeffuse", name: "Arcane Effuse", image: researchImage("arcaneeffuse.png"), maxLevel: 4, valuesByLevel: [0, 3, 6, 9, 12], statKey: "magicSize", descriptionTemplate: "Increase All Magic Size by □%", descriptionColor: "#E1FFAF" }, // source id 271
  { id: "concentration", name: "Concentration", image: researchImage("concentration.png"), maxLevel: 4, valuesByLevel: [0, 5, 10, 15, 20], statKey: "magicDuration", descriptionTemplate: "Increase All Magic Duration by □%", descriptionColor: "#E1FFAF" }, // source id 272
  { id: "recycle", name: "Recycle", image: researchImage("recycle.png"), maxLevel: 4, valuesByLevel: [0, 10, 15, 20, 25], statKey: null, descriptionTemplate: "Retrieve 〈□%〉 more Mana when retrieving Mana.", descriptionColor: "#E1FFAF" }, // source id 273
  { id: "analysis", name: "Analysis", image: researchImage("analysis.png"), maxLevel: 5, valuesByLevel: [0, 5, 10, 15, 20, 25], statKey: null, descriptionTemplate: "〈□%〉 increased chance to have [4] Magic choices.", descriptionColor: "#EBEBEB" }, // source id 274
  { id: "blessing", name: "Blessing", image: researchImage("blessing.png"), maxLevel: 3, valuesByLevel: [0, 10, 20, 30], statKey: null, descriptionTemplate: "Increase the duration of [Rune] effects by 〈□%〉.", descriptionColor: "#E1FFAF" }, // source id 275
  { id: "awakening", name: "Awakening", image: researchImage("awakening.png"), maxLevel: 5, valuesByLevel: [0, 5, 10, 15, 20, 25], statKey: null, descriptionTemplate: "[Leveling up] causes an [Explosion] around the character and restores 〈□%〉 [HP].", descriptionColor: "#EBEBEB" }, // source id 276
  { id: "growth", name: "Growth", image: researchImage("growth.png"), maxLevel: 4, valuesByLevel: [0, 2, 3, 4, 5], statKey: null, descriptionTemplate: "Every [20] levels increase [ATK] and [Max HP] by 〈□%〉.", descriptionColor: "#EBEBEB" }, // source id 277
  { id: "support", name: "Support", image: researchImage("support.png"), maxLevel: 6, valuesByLevel: [0, 10, 20, 30, 40, 50, 60], statKey: null, descriptionTemplate: "Increase the amount of [Mana Orbs] created around the character when the game starts by 〈□%〉.", descriptionColor: "#EBEBEB" }, // source id 278
  { id: "luck", name: "Luck", image: researchImage("luck.png"), maxLevel: 5, valuesByLevel: [0, 10, 15, 20, 25, 30], statKey: null, descriptionTemplate: "Field items are created 〈□%〉 more often.", descriptionColor: "#EBEBEB" }, // source id 279
  { id: "loot", name: "Loot", image: researchImage("loot.png"), maxLevel: 6, valuesByLevel: [0, 5, 8, 11, 14, 17, 20], statKey: null, descriptionTemplate: "[Treasure Chests] are created 〈□%〉 more frequently.", descriptionColor: "#EBEBEB" }, // source id 280
  { id: "haggle", name: "Bargain", image: researchImage("haggle.png"), maxLevel: 5, valuesByLevel: [0, 1, 2, 3, 4, 5], statKey: null, descriptionTemplate: "All products sold by [Merchants] are 〈□%〉 {Discounted}", descriptionColor: "#EBEBEB" }, // source id 281
  { id: "startingFunds", name: "Starting Funds", image: researchImage("startingFunds.png"), maxLevel: 6, valuesByLevel: [0, 50, 100, 150, 200, 250, 300], statKey: null, descriptionTemplate: "Gain 〈□〉 《Mana Orb Currency》 at the start of the game.", descriptionColor: "#EBEBEB" }, // source id 282
];

export const RESEARCH_BY_ID: Record<string, ResearchDefinition> = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));

/**
 * Sum of every node's `maxLevel` — the research points needed to fully max the entire
 * tree. There's no in-app way to earn/purchase points beyond this (see `ResearchScreen`),
 * so a fresh run starts with exactly this many available rather than 0 plus a cheat button.
 */
export const TOTAL_RESEARCH_POINTS: number = RESEARCH.reduce((sum, node) => sum + node.maxLevel, 0);

/**
 * Substitutes `descriptionTemplate`'s `□`-run(s) with the node's real value(s) at `level`
 * (0 = unresearched, shows the level-0/zero value like the rest of the app does elsewhere).
 * Vitality is the one node with two `□` runs (see `secondaryValuesByLevel` above); every
 * other node has exactly one. Returns `{ text, color }` — render through `<GameText>`.
 */
export function describeResearchNode(node: ResearchDefinition, level: number): { text: string; color: string } {
  const clamped = Math.max(0, Math.min(node.maxLevel, level));
  const values = [node.valuesByLevel[clamped], ...(node.secondaryValuesByLevel ? [node.secondaryValuesByLevel[clamped]] : [])];
  let i = 0;
  const text = node.descriptionTemplate.replace(/□+/g, () => String(values[i++]));
  return { text, color: node.descriptionColor };
}
