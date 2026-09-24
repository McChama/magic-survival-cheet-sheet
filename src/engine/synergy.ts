import { BASE_MAGICS, BASE_MAGIC_BY_ID } from "../data/magics";
import { FUSION_BY_ID } from "../data/fusions";
import { getSubjectDetail } from "../data/classes";
import { getEquippedItems } from "./tierAdaptive";
import type { RecommenderOption } from "./scoring";
import type { CurrentRunState } from "../types/game";

/**
 * Real-data synergy detection — replaces the invented `STAT_WEIGHT`-driven score
 * (`src/engine/scoring.ts`) as the *primary* ranking signal for the Recommender. Every
 * signal here cites a real, structured source (FUSIONS, CLASS_BONUSES, SUBJECT_DETAILS,
 * or an item's own extracted `specialEffect` text) — never a fabricated number. An item
 * with no real signal returns `[]`, which the UI must show honestly as "no confirmed
 * synergy," not hide or paper over with a guessed one. See
 * `research/game-data-sources.md` and this session's plan for the full derivation.
 */

export type SynergyTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface SynergySignal {
  tier: SynergyTier;
  label: string;
}

export interface SynergyResult {
  optionId: string;
  signals: SynergySignal[];
  bestTier: SynergyTier | null;
}

/**
 * Every class's real signature base magic, read once from `CLASS_BONUSES`'s own Lv2
 * bonus text (`classes.ts`) — hardcoded rather than live-parsed because that text isn't
 * regular enough to auto-derive safely. Bishop needs human judgment: its real Lv2 text
 * is "Guardian Angel Lv +1," not a `BASE_MAGICS` name directly — its own tooltip
 * ("Magic Bolt [&] Shield Lv +1") confirms "Guardian Angel" is that class's own display
 * name for its Shield bonus. Scholar/Archaeologist/Black Mage are *correctly* absent:
 * their tooltips mention "Magic Bolt" as leftover flavor text (confirmed in classes.ts's
 * own doc comment), but their real Lv2 bonus names a passive (Doctor/Explorer/Arcane
 * Effuse), not a base magic — no honest mapping exists, so they get no tier-3 signal
 * rather than a guessed one.
 */
export const CLASS_SIGNATURE_MAGIC_ID: Partial<Record<string, string>> = {
  Wizard: "magicBolt",
  Astronomer: "satellite",
  Cryomancer: "frostNova",
  Shaman: "thunderstorm",
  Warlock: "meteor",
  Arcanist: "intelligence",
  Summoner: "spirit",
  Bishop: "shield",
  Occultist: "arcaneRay",
  Druid: "cyclone",
  Pyromancer: "fireball",
  Sorcerer: "electricShock",
  Alchemist: "energyBolt",
  Witch: "lavaZone",
  Electromancer: "electricZone",
  Arbiter: "tsunami",
  Archmage: "magicCircle",
  Magician: "magicBolt",
  Mage: "blizzard",
  Battlemage: "flashShock",
  Warlord: "incineration",
};

const MAGIC_NAME_TO_ID: Record<string, string> = Object.fromEntries(BASE_MAGICS.map((m) => [m.name, m.id]));

/** Longest names first, so e.g. a hypothetical shorter name can't shadow a longer one that contains it. */
const MAGIC_NAMES_BY_LENGTH_DESC = [...BASE_MAGICS].sort((a, b) => b.name.length - a.name.length);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Every `BASE_MAGICS` name found as a whole word in `text`, id form. Real ~29.5%-of-
 * artifacts coverage (see game-data-sources.md) — most items return `[]`, which is
 * expected and must be handled honestly, not padded with a guess.
 */
export function namedMagicIdsInText(text?: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const magic of MAGIC_NAMES_BY_LENGTH_DESC) {
    if (new RegExp(`\\b${escapeRegExp(magic.name)}\\b`).test(text)) found.push(magic.id);
  }
  return found;
}

/**
 * The subject's signature magic, derived live (not hardcoded) from `SUBJECT_DETAILS`'s
 * own trait text — safe to live-parse because that text is regular: 17 of 25 subjects
 * match `"Increase {Magic} Damage by N% (All Classes)"` exactly; the other 8 (Arcanist,
 * Bishop, Scholar, Archmage, Archaeologist, Magician, Black Mage, Jack o' Lantern) name a
 * plain stat instead and correctly resolve to `null` rather than a guessed magic.
 */
export function subjectSignatureMagicId(subject: string): string | null {
  const trait = getSubjectDetail(subject)?.trait;
  if (!trait) return null;
  const match = trait.match(/^Increase (.+) Damage by \d+% \(All Classes\)$/);
  return match ? (MAGIC_NAME_TO_ID[match[1]] ?? null) : null;
}

/**
 * Real, tiered synergy signals for one offered option — strongest (tier 1) to weakest
 * (tier 6). See this module's header comment. Returns `[]` when nothing real applies.
 */
export function detectSynergies(option: RecommenderOption, run: CurrentRunState): SynergySignal[] {
  const signals: SynergySignal[] = [];

  // Tiers 1-2: the option itself is a magic that's a required ingredient of an active
  // fusion target, optionally with an exact real-talent match.
  if (option.magicId) {
    for (const fusionId of run.fusionTargets) {
      const fusion = FUSION_BY_ID[fusionId];
      if (!fusion) continue;
      const ingredientIndex = fusion.requiredMagicIds.findIndex((id) => id === option.magicId);
      if (ingredientIndex === -1) continue;
      const requiredTalent = fusion.requiredTalents?.[ingredientIndex]?.talentName ?? null;
      const recordedTalents = run.magicTalents[option.magicId] ?? [];
      if (requiredTalent && recordedTalents.includes(requiredTalent)) {
        signals.push({ tier: 1, label: `Exact talent match for the "${fusion.name}" fusion (${requiredTalent})` });
      } else {
        signals.push({ tier: 2, label: `Ingredient for the "${fusion.name}" fusion` });
      }
    }
  }

  // Tiers 3-6: the option's real specialEffect text names a base magic, checked against
  // increasingly weaker (but still real) points of reference.
  const effectMagicIds = option.item ? namedMagicIdsInText(option.item.specialEffect) : [];
  if (effectMagicIds.length > 0) {
    const classMagic = run.meta.characterClass ? CLASS_SIGNATURE_MAGIC_ID[run.meta.characterClass] : undefined;
    if (classMagic && effectMagicIds.includes(classMagic)) {
      signals.push({
        tier: 3,
        label: `Boosts ${run.meta.characterClass}'s signature magic (${BASE_MAGIC_BY_ID[classMagic]?.name ?? classMagic})`,
      });
    }

    const subjectMagic = subjectSignatureMagicId(run.meta.subject);
    if (subjectMagic && effectMagicIds.includes(subjectMagic)) {
      signals.push({
        tier: 4,
        label: `Boosts your Subject's signature magic (${BASE_MAGIC_BY_ID[subjectMagic]?.name ?? subjectMagic})`,
      });
    }

    const equipped = getEquippedItems(run).filter((i) => i.id !== option.item!.id);
    for (const equippedItem of equipped) {
      const sharedId = namedMagicIdsInText(equippedItem.specialEffect).find((id) => effectMagicIds.includes(id));
      if (sharedId) {
        signals.push({
          tier: 5,
          label: `Also boosts ${BASE_MAGIC_BY_ID[sharedId]?.name ?? sharedId}, like your equipped ${equippedItem.name}`,
        });
        break;
      }
    }

    const acquiredMatch = effectMagicIds.find((id) => run.acquiredMagicIds.includes(id));
    if (acquiredMatch) {
      signals.push({
        tier: 6,
        label: `Boosts ${BASE_MAGIC_BY_ID[acquiredMatch]?.name ?? acquiredMatch}, which you already have`,
      });
    }
  }

  return signals.sort((a, b) => a.tier - b.tier);
}

/** Runs `detectSynergies` over every offered option. */
export function compareSynergies(options: RecommenderOption[], run: CurrentRunState): SynergyResult[] {
  return options.map((option) => {
    const signals = detectSynergies(option, run);
    return { optionId: option.id, signals, bestTier: signals.length > 0 ? signals[0].tier : null };
  });
}
