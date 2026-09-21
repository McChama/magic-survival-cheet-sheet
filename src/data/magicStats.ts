/**
 * Which stat rows the real game shows for each active base magic in its Owned Magic detail
 * panel (one label/value row per stat, keyed by the magic's ability id 1-21). Each label is a row of the "마법 능력치" column of
 * `eng_Dictionary_Name.txt` (id 1 Damage, 2 Damage Interval, 6 Size, 5 Explosion Range, 7
 * Duration, 8 Number, 9 Cooldown, 10 Amplification Effect, 11 Rotation Speed).
 *
 * Each row also has a number format: Damage and Number are whole numbers
 * (e.g. "630", never a percentage), Explosion Range / Size are "x N" (the field
 * x 0.01), Cooldown/Duration are seconds with one decimal ("0.75 s").
 *
 * The level-1 numbers are in `MAGIC_BASE_STATS` below: each magic starts at a fixed
 * constant per stat at battle start. Magic Bolt is Damage 5, Size 100 (shown "x 1"), Number 1, Cooldown 0.75 —
 * all four match a real Owned Magic screenshot (x 1 / 1 / 0.75 s, and Damage 630 = 5 x ATK 100 x
 * Amplify 1.2 x Wizard's +5% Magic Bolt — `engine/magicDamage.ts` reproduces it exactly).
 */
export type MagicStatKind =
  | "damage"
  | "damageInterval"
  | "explosionRange"
  | "size"
  | "duration"
  | "number"
  | "cooldown"
  | "rotationSpeed"
  | "amplificationEffect";

/** The game's own English label for each stat (`amplificationEffect` fixes the dictionary's "Amplication" typo). */
export const MAGIC_STAT_LABEL: Record<MagicStatKind, string> = {
  damage: "Damage",
  damageInterval: "Damage Interval",
  explosionRange: "Explosion Range",
  size: "Size",
  duration: "Duration",
  number: "Number",
  cooldown: "Cooldown",
  rotationSpeed: "Rotation Speed",
  amplificationEffect: "Amplification Effect",
};

/** Stat rows per base magic id, in the order the game lists them. */
export const MAGIC_STATS: Record<string, MagicStatKind[]> = {
  magicBolt: ["damage", "explosionRange", "number", "cooldown"],
  fireball: ["damage", "explosionRange", "number", "cooldown"],
  spirit: ["damage", "size", "number", "cooldown"],
  satellite: ["damage", "rotationSpeed", "size", "number"],
  frostNova: ["damage", "explosionRange", "cooldown"],
  shield: ["cooldown"],
  thunderstorm: ["damage", "explosionRange", "number", "cooldown"],
  electricZone: ["damage", "damageInterval", "size"],
  tsunami: ["damage", "size", "number", "cooldown"],
  meteor: ["damage", "explosionRange", "number", "cooldown"],
  cloaking: ["duration", "cooldown"],
  cyclone: ["damage", "damageInterval", "size", "duration", "number", "cooldown"],
  electricShock: ["damage", "size", "number", "cooldown"],
  armageddon: ["cooldown"],
  incineration: ["damage", "size", "number", "cooldown"],
  energyBolt: ["damage", "size", "duration", "number", "cooldown"],
  blizzard: ["damage", "explosionRange", "number", "cooldown"],
  arcaneRay: ["damage", "size", "duration", "number", "cooldown"],
  magicCircle: ["amplificationEffect", "duration", "cooldown"],
  lavaZone: ["damage", "damageInterval", "size", "duration", "number", "cooldown"],
  flashShock: ["damage", "size", "number", "cooldown"],
};

export type MagicStatFormat = "damage" | "whole" | "multiplier" | "seconds" | "percent";

/** One stat's level-1 value, already scaled the way the game shows it (e.g. Size 100 x 0.01 = 1). */
export interface MagicStatBase {
  value: number;
  format: MagicStatFormat;
}

const seconds = (value: number): MagicStatBase => ({ value, format: "seconds" });
const whole = (value: number): MagicStatBase => ({ value, format: "whole" });
const mult = (value: number): MagicStatBase => ({ value, format: "multiplier" });
const damage = (value: number): MagicStatBase => ({ value, format: "damage" });

/**
 * Level-1 base values per magic and stat, decoded from the constant block described above. A stat
 * missing here is one the game shows but whose value wasn't decodable with confidence (Lava Zone's
 * Damage Interval is a string literal the literal table can't pin down; Energy Bolt's Duration is
 * scaled by an unexplained 0.03), so the UI reads "—" for it. Spirit's and Satellite's Number are
 * not fields (their Number counts up from 0, +1 per level — see `LEVEL_EFFECTS_FROM_LEVEL_ONE`).
 */
export const MAGIC_BASE_STATS: Record<string, Partial<Record<MagicStatKind, MagicStatBase>>> = {
  magicBolt: { damage: damage(5), explosionRange: mult(1), number: whole(1), cooldown: seconds(0.75) },
  fireball: { damage: damage(7), explosionRange: mult(1), number: whole(1), cooldown: seconds(1.5) },
  // Spirit's Cooldown moves with its Number, see `spiritBaseCooldown` in engine/magicEffects.ts (0.9 s is the constant).
  spirit: { damage: damage(6.5), size: mult(1), number: whole(0), cooldown: seconds(0.9) },
  satellite: { damage: damage(4.5), rotationSpeed: mult(1), size: mult(1), number: whole(0) },
  frostNova: { damage: damage(12), explosionRange: mult(1), cooldown: seconds(5.5) },
  shield: { cooldown: seconds(33) },
  thunderstorm: { damage: damage(15), explosionRange: mult(1), number: whole(1), cooldown: seconds(2) },
  electricZone: { damage: damage(1.25), damageInterval: seconds(0.25), size: mult(1) },
  tsunami: { damage: damage(7), size: mult(1), number: whole(8), cooldown: seconds(8.5) },
  meteor: { damage: damage(15), explosionRange: mult(1), number: whole(1), cooldown: seconds(4.5) },
  cloaking: { duration: seconds(2), cooldown: seconds(45) },
  cyclone: { damage: damage(5), damageInterval: seconds(0.3), size: mult(1), duration: seconds(2), number: whole(1), cooldown: seconds(3.5) },
  electricShock: { damage: damage(5), size: mult(1), number: whole(2), cooldown: seconds(2) },
  armageddon: { cooldown: seconds(100) },
  incineration: { damage: damage(5), size: mult(1), number: whole(15), cooldown: seconds(4) },
  energyBolt: { damage: damage(7.5), size: mult(1), number: whole(5), cooldown: seconds(3.3) },
  blizzard: { damage: damage(7), explosionRange: mult(1), number: whole(20), cooldown: seconds(6) },
  arcaneRay: { damage: damage(9), size: mult(0.25), duration: seconds(0.8), number: whole(1), cooldown: seconds(3.5) },
  magicCircle: { amplificationEffect: { value: 25, format: "percent" }, duration: seconds(5), cooldown: seconds(20) },
  lavaZone: { damage: damage(10), size: mult(1), duration: seconds(6), number: whole(1), cooldown: seconds(5) },
  flashShock: { damage: damage(18), size: mult(1), number: whole(1), cooldown: seconds(10) },
};

/** Up to 2 significant digits, no trailing zeros — the game's "G2" number format (x1.12 shows "x 1.1", 0.528 s shows "0.53 s"). */
const g2 = (n: number): string => String(Number(n.toPrecision(2)));

/**
 * The text the game shows for one stat, or `null` when it can't be known here. Damage is the
 * constant times `damageMultiplier` (see `engine/magicDamage.ts`: ATK, Amplify ATK, All Magic
 * Damage and the magic's permanent bonuses); it is `null` until an ATK has been entered.
 */
export function formatMagicStat(base: MagicStatBase | undefined, damageMultiplier: number | null): string | null {
  if (!base) return null;
  switch (base.format) {
    case "damage":
      return damageMultiplier === null ? null : Math.round(base.value * damageMultiplier).toLocaleString("en-US");
    case "whole":
      return String(base.value);
    case "multiplier":
      return `x ${g2(base.value)}`;
    case "seconds":
      return `${g2(base.value)} s`;
    case "percent":
      return `${g2(base.value)}%`;
  }
}
