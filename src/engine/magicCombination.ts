import { ANY_PASSIVE_ID, FUSIONS, fusionRefId } from "../data/fusions";
import { BASE_MAGIC_BY_ID } from "../data/magics";
import { withMagicTalent } from "../data/magicTalents";
import { getOwnedMagics } from "./ownedMagics";
import { getEquippedItems } from "./tierAdaptive";
import type { CurrentRunState, FusionDefinition } from "../types/game";

/** One thing a Magic Combination asks for, and whether the run has it. */
export interface FusionRequirement {
  /** A base magic id, an item id (a passive), `fusion:<id>` or `ANY_PASSIVE_ID` — as in `FusionDefinition.requiredMagicIds`. */
  id: string;
  /** The talent the ingredient magic must have, when the data names one. */
  talentName: string | null;
  /** Owned and, when a talent is named, that talent is the one the player recorded for it. */
  met: boolean;
}

/** Ingredients the data lists as a base magic that the game has as a passive (Intelligence — the "+" menu only offers the passive). */
const INGREDIENT_PASSIVE: Record<string, string> = { intelligence: "intelligence-passive" };

/**
 * What a combination needs, ingredient by ingredient: both ingredients owned (a base magic the class grants or the player
 * added; a passive when equipped), and each ingredient magic with the talent the combination needs (the one the player
 * recorded for it — `run.magicTalents`). An ingredient with no talent in the source data (Intelligence, a passive) only has
 * to be owned. Deus Ex Machina needs another combination already learned, which the app doesn't track: never met.
 */
export function getFusionRequirements(fusion: FusionDefinition, run: CurrentRunState): FusionRequirement[] {
  const ownedMagicIds = new Set(getOwnedMagics(run).map((m) => m.magicId));
  const equippedItemIds = new Set(getEquippedItems(run).map((i) => i.id));

  return fusion.requiredMagicIds.map((id, index) => {
    const ingredient = fusion.requiredTalents?.[index];
    const talentName = ingredient?.talentName ?? null;
    if (id === ANY_PASSIVE_ID || fusionRefId(id) !== null) return { id, talentName, met: false };
    const owned = (BASE_MAGIC_BY_ID[id] && ownedMagicIds.has(id)) || equippedItemIds.has(INGREDIENT_PASSIVE[id] ?? id);
    const talentOk = !talentName || !ingredient?.parentMagicId || (run.magicTalents[ingredient.parentMagicId] ?? []).includes(talentName);
    return { id, talentName, met: owned && talentOk };
  });
}

/**
 * The combinations whose requirements the run meets — the moment the game's own Magic Combination button turns red.
 * The game only offers one at character levels 25, 50 and 75; the level isn't part of "available" here, since what the
 * player needs to know is that the requirements are met.
 */
export function getAvailableFusions(run: CurrentRunState): FusionDefinition[] {
  return FUSIONS.filter((fusion) => getFusionRequirements(fusion, run).every((requirement) => requirement.met));
}

/** Every real Magic Combination that names `(magicId, talentName)` as one of its two ingredients — the "compatible
 *  Synergies" row of the Select Attribute screen. */
export function getFusionsForTalent(magicId: string, talentName: string): FusionDefinition[] {
  return FUSIONS.filter((fusion) => fusion.requiredTalents?.some((ing) => ing.parentMagicId === magicId && ing.talentName === talentName));
}

/** Whether recording `talentName` for `magicId` (on top of the run's other talents — the pick hasn't been committed
 *  yet) would complete `fusion`: every other requirement is already met, and this is the last missing piece. This is
 *  what lights a Select Attribute combo thumbnail's border white, the same "requirements met" signal
 *  `getAvailableFusions` uses, just evaluated against a simulated run instead of the real one. */
export function wouldCompleteFusion(fusion: FusionDefinition, run: CurrentRunState, magicId: string, level: number, talentName: string): boolean {
  const simulated: CurrentRunState = { ...run, magicTalents: withMagicTalent(run.magicTalents, magicId, level, talentName) };
  return getFusionRequirements(fusion, simulated).every((requirement) => requirement.met);
}
