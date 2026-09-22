import { PASSIVE_EFFECT_LINES } from "./passiveEffects";
import type { ColoredTextLine, EquippableItem, StatKey } from "../types/game";

/**
 * How the ten leveled ("base") passives grow, read from `eng_Dictionary_Ability.txt` (rows 30-39, type "패시브"): the max level column,
 * the level-1 lines, and the sixth line with its "특수값01" — what each further level adds to the stat the passive raises
 * (Vitality: Lv1 = +20% Max HP and +10% Life Orb recovery, +10% Max HP per level, max Lv5 = +60% — which is the value
 * `passives.ts` carries, so its `stats` are the **max-level** ones). The 24 special passives have a max level of 1
 * (no levels, shown with a star). Advanced Magic is Lv3-max in the data but has no per-level line.
 */
interface PassiveLevelInfo {
  max: number;
  /** The stat that grows with level and by how much per level after Lv1. */
  stat?: StatKey;
  perLevel?: number;
}

const PASSIVE_LEVELS: Record<string, PassiveLevelInfo> = {
  "magiaavanzada-passive": { max: 3 },
  "intelligence-passive": { max: 5, stat: "atk", perLevel: 3 },
  "fastcasting-passive": { max: 3, stat: "cooldown", perLevel: 1 },
  "vitality-passive": { max: 5, stat: "hp", perLevel: 10 },
  "haste-passive": { max: 2, stat: "moveSpeed", perLevel: 2 },
  "arcaneeffuse-passive": { max: 3, stat: "magicSize", perLevel: 2 },
  "concentration-passive": { max: 3, stat: "magicDuration", perLevel: 3 },
  "snipe-passive": { max: 3, stat: "critRate", perLevel: 1 },
  "explorer-passive": { max: 3, stat: "itemPickupRange", perLevel: 10 },
  "ruptura-passive": { max: 3, stat: "critMultiplier", perLevel: 5 },
};

/** A passive with levels like a magic's (the base ones); the special passives have none. */
export function isLeveledPassive(item: EquippableItem): boolean {
  return item.id in PASSIVE_LEVELS;
}

/** The passive's max level (1 for a special passive). */
export function getPassiveMaxLevel(itemId: string): number {
  return PASSIVE_LEVELS[itemId]?.max ?? 1;
}

/** The passive's stats at `level`: the max-level `stats` minus what the missing levels would have added. */
export function passiveStatsAtLevel(item: EquippableItem, level: number): Partial<Record<StatKey, number>> {
  const info = PASSIVE_LEVELS[item.id];
  if (!info?.stat || !info.perLevel) return item.stats;
  const value = item.stats[info.stat];
  if (value === undefined) return item.stats;
  const clamped = Math.max(1, Math.min(level, info.max));
  return { ...item.stats, [info.stat]: value - (info.max - clamped) * info.perLevel };
}

const NUMBER = /\d+(?:\.\d+)?/;
const template = (text: string) => text.replace(/\d+(?:\.\d+)?/g, "#");

/**
 * The lines the game shows for a passive at `level`: for a leveled passive its level-1 lines with the number of the one
 * that grows replaced by the level's value ("Increase Max HP by 40%" at Lv3), leaving out the last stored line, which is the
 * level-up one ("Increase Max HP by 10%"); a special passive shows all its lines.
 */
export function passiveLinesAtLevel(itemId: string, level: number): ColoredTextLine[] {
  const lines = PASSIVE_EFFECT_LINES[itemId] ?? [];
  const info = PASSIVE_LEVELS[itemId];
  if (!info?.perLevel || lines.length < 2) return lines;
  const levelUp = lines[lines.length - 1];
  const base = lines.slice(0, -1);
  return base.map((line) => {
    if (template(line.text) !== template(levelUp.text)) return line;
    const start = Number(line.text.match(NUMBER)?.[0]);
    const value = start + (Math.max(1, Math.min(level, info.max)) - 1) * info.perLevel!;
    return { ...line, text: line.text.replace(NUMBER, String(value)) };
  });
}
