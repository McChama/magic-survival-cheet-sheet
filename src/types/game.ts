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
  /**
   * The node's real in-game description, verbatim from the dictionary (keeps 〔〕〈〉《》[]{}『』
   * marker formatting — render through `<GameText>`). A run of one or more `□` characters
   * marks where the current level's numeric value is substituted in (see `describeResearchNode`
   * in `data/research.ts`) — e.g. "Increase ATK by □%" at level 3 (value 15) becomes
   * "Increase ATK by 15%". Regeneration's `□□□` is a 3-digit slot for its decimal values
   * (0.05/0.1/0.15/0.2) — kept as one placeholder run, not three independent digits.
   */
  descriptionTemplate: string;
  /** Hex color straight from the dictionary's `<color=#RRGGBB>` tag for this line. */
  descriptionColor: string;
  /**
   * A second per-level value series, for the one node (Vitality) whose real description
   * has two `□` placeholders for two independently-scaling effects. Index-aligned with
   * `valuesByLevel`. Absent for every other node (single `□` run, or none).
   */
  secondaryValuesByLevel?: number[];
}

export interface EquippedStack {
  itemId: string;
  count: number;
}

export interface RunMeta {
  characterClass: string | null;
  /**
   * Per-class progression level, **1-5** each (source:
   * https://magic-survival-rpg.fandom.com/wiki/Classes, confirmed 2026-09-15 — "Each class
   * requires 45 Research Material to unlock (3 for Lv2, 6 for Lv3, 12 for Lv4, 24 for
   * Lv5)... Once acquired, the Lv5 bonus is permanent"). Keyed by class name (see `CLASSES`
   * in `src/data/classes.ts`), same shape as `researchLevels` below — missing entry means
   * Level 1, the free baseline every class starts at (just "selected", zero of its 4 bonuses
   * active yet; `CLASS_BONUSES` only has 4 entries, its Lv2-Lv5 bonuses, precisely because
   * Lv1 grants nothing on its own). Use `getClassLevel(classLevels, className)` rather than
   * indexing this directly, so the Level-1 default is applied consistently.
   *
   * **Why per-class, not a single number**: this is meta-progression like `researchLevels`,
   * not per-run state — every class you've ever leveled keeps its level independently of
   * which `characterClass` is currently equipped for a run (`ClassSelectScreen.tsx` lets you
   * page through any class and adjust its own level without touching the others').
   *
   * **The stats-engine hook point this exists for**: a class's Lv2-Lv4 bonuses only apply
   * while that class is the equipped `characterClass` for the run, but its `levels[3]`
   * (Lv5) bonus is explicitly tagged "(All Classes)" in the game's own text — i.e. it's a
   * *permanent global* bonus that stacks in from every class you've leveled to 5, not just
   * the one you're currently playing. A future stats aggregator therefore needs two passes,
   * not one: (a) `CLASS_BONUSES[characterClass].levels[0 .. getClassLevel(classLevels,
   * characterClass) - 2]` for the equipped class's active-this-run bonuses, and (b)
   * `CLASS_BONUSES[c].levels[3]` for every class `c` in `CLASSES` where
   * `getClassLevel(classLevels, c) >= 5`, regardless of `characterClass`. No such aggregator
   * exists yet (stats are still manually mirrored from the player's own screen), but this
   * distinction is why `classLevels` must stay a per-class record and not collapse back to a
   * single number.
   */
  classLevels: Record<string, number>;
  /**
   * The selected Test Subject's name (see `SUBJECTS` in `src/data/classes.ts`). Always set —
   * never null — defaulting to `SUBJECTS[0]` ("Wizard") so a subject (and its `SubjectDetail`
   * trait/starting-artifact bonus, via `getSubjectDetail`) is always available for the stats
   * engine to fold in, without every consumer having to null-check it first.
   */
  subject: string;
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
