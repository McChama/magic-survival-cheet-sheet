// Core domain types for the Magic Survival Run Companion.

export type Rarity = "common" | "rare" | "epic" | "legendary" | "special";

export type StatCategory = "combat" | "survival";

/**
 * Canonical stat keys, in the exact order the in-game pause menu shows them
 * (verified against TomkoSK/magic-survival-builder's index.html stat list).
 */
export type StatKey =
  | "atk"
  | "amplifyAtk"
  | "critRate"
  | "critMultiplier"
  | "magicDamage"
  | "magicSize"
  | "magicDuration"
  | "cooldown"
  | "hp"
  | "hpRegen"
  | "lifeOrbRecovery"
  | "damageTaken"
  | "evasion"
  | "moveSpeed"
  | "manaAcquisition"
  | "itemPickupRange"
  | "enemyMaxHp";

export interface StatDefinition {
  key: StatKey;
  label: string;
  category: StatCategory;
  unit: "%" | "flat";
  /** Percent value at which diminishing returns become noticeable (orange warning). */
  softCap?: number;
  /** Percent value at which the stat is effectively wasted past this point (hard warning). */
  hardCap?: number;
  hasDiminishingReturns: boolean;
}

export interface EquippableItem {
  id: string;
  name: string;
  rarity: Rarity;
  /** Relative path inside the source repo's asset folders, e.g. "artifactImages/gaia.png" */
  image: string;
  kind: "artifact" | "magic" | "passive";
  /** Flat/percent stat grants this item provides, keyed by our canonical StatKey. */
  stats: Partial<Record<StatKey, number>>;
  /** Free-form gameplay tags used by the scoring engine (e.g. "amplify", "moveSpeed", "cooldownConverter"). */
  tags?: string[];
  /** Human-readable note about a non-numeric special effect (kept short, tooltip-style). */
  specialEffect?: string;
}

export interface BaseMagic {
  id: string;
  name: string;
  image?: string;
}

/**
 * One of the two ingredients a fusion requires. In the real game this is never just
 * "own this base magic" — it's a specific talent branch of that magic (one of the
 * ~3 the base magic's own level-up screen offers). `parentMagicId` is null only for
 * the sentinel "any passive" ingredient some fusions use instead of a talent.
 */
export interface FusionIngredient {
  /** The base magic this talent belongs to, or null for a passive-only ingredient. */
  parentMagicId: string | null;
  /** Real in-game talent name, e.g. "Lightning Burst" (translated to English per CLAUDE.md — see src/data/fusions.ts). Null for the passive sentinel. */
  talentName: string | null;
}

/** A fusion's "Ultimate" evolution — a further, named upgrade some (not all) fusions have. */
export interface UltimateDefinition {
  name: string;
  /** Unlock condition as shown in-game; currently just the raw number from the source data (meaning not yet decoded — likely a level or stack count). */
  condition: string;
  description: string;
}

export interface FusionDefinition {
  id: string;
  name: string;
  image?: string;
  /** The two base magic ids required to trigger this fusion (kept for backward compat with existing ownership checks in the scoring/target engines). */
  requiredMagicIds: [string, string];
  /**
   * The precise talent-level requirement behind each of requiredMagicIds, extracted
   * from the game's own data. Not yet enforced anywhere (the app doesn't track which
   * talent branch the player picked per magic) — shown as guidance so the player knows
   * which of the 3 level-up options to pick, not just which base magic to acquire.
   */
  requiredTalents?: [FusionIngredient, FusionIngredient];
  /** This fusion's real effect description, distinct from its base magics' own descriptions. */
  effectDescription?: string;
  /** The fusion's further "Ultimate" evolution, when the source data has one (28 of 63 do). */
  ultimate?: UltimateDefinition;
}

export interface ResearchDefinition {
  id: string;
  name: string;
  image: string;
  maxLevel: number;
  /** Stat value at each level, index 0 = level 0 (unresearched). */
  valuesByLevel: number[];
  statKey: StatKey | null;
}

export interface EquippedStack {
  itemId: string;
  count: number;
}

export interface RunMeta {
  characterClass: string | null;
  subject: string | null;
  researchPoints: number;
  startedAt: number | null;
}

/** The live, player-editable mirror of the in-game pause-menu stat screen. */
export type StatBlock = Record<StatKey, number>;

export interface CurrentRunState {
  meta: RunMeta;
  /** Up to 3 fusion targets chosen at minute 0. */
  fusionTargets: string[];
  /** Stats as manually mirrored/adjusted by the player from their screen. */
  stats: StatBlock;
  /** Equipped artifacts and magics/passives, used by the tier-adaptive engine. */
  equipped: EquippedStack[];
  /** Base magics already picked up this run (for fusion dependency tracking). */
  acquiredMagicIds: string[];
  elapsedMinutes: number;
  currentLevel: number;
  enemiesKilled: number;
  /** Current level per research node id (see src/data/research.ts), 0 if not yet researched. */
  researchLevels: Record<string, number>;
}

export interface ScoreBreakdownLine {
  label: string;
  delta: number;
}

export interface ScoreResult {
  itemId: string;
  score: number; // 1-10
  percent: number; // 0-100, same info as score for compatibility badges
  breakdown: ScoreBreakdownLine[];
  isBest: boolean;
}
