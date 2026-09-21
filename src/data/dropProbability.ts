import type { DropContext, DropContextDefinition, DropException } from "../types/game";

/**
 * Drop-probability model for 5 of the game's item sources, modeled from in-game
 * observation plus a community research thread (Discord, users
 * `urik0548` and `__hubert`, 2026-07-22 to 2026-07-24 — cross-validated against 300 real
 * games of save-file-mined data), this project's own single-run empirical check
 * (`run_for_discord.json`, 438 items, 100% rarity-matched), and direct corrections from
 * the user (who plays the game) — the Obelisk/Broken Obelisk mechanic and their real
 * slot counts (2026-09-16) came from the user directly, not from the
 * Discord thread.
 *
 * **This is a documented approximation, not a simulation.** The real game pre-rolls a
 * 1000-entry weighted sequence per run with a genuine anti-duplicate depletion mechanic
 * (an item already drawn gets progressively less likely to be drawn again). Modeling
 * that exactly would require simulating the full sequence per run seed, which this
 * project doesn't have access to. Instead: every item starts with a confirmed baseline
 * of 5 copies in its rarity's pool (confirmed in-game), and `DROP_EXCEPTIONS`
 * below captures every *named* item this project has found evidence of a different
 * baseline for. An item with no exception entry is assumed to sit at the plain 5-copy
 * baseline for its rarity — accurate for most items, but not verified individually for
 * every one of the ~180 artifacts/passives in the game.
 *
 * **Future work, not attempted here** (see the same section of game-data-sources.md):
 * kill chests, far chests, and early-elite-enemy-drop chests are real, confirmed item
 * sources (seen in the community's `artifacts_seen.png` chart) with no probability data
 * extracted at all; `brokenObelisk`'s tier breakdown is a known gap too (see its own
 * entry below); chest *frequency* / timing (how often a chest occurs,
 * which follows a kills-based diminishing-returns curve, modified by the Loot research
 * node and the Archaeologist subject) isn't modeled — this file only answers "given a
 * chest of this type happens, what's the breakdown," not "how often does it happen";
 * cross-item exception renormalization (this file's per-item estimates don't account for
 * how every *other* item's own exceptions shift the shared pool); and the separate
 * in-battle magic/passive level-up offer system (a different mechanism from chest/
 * merchant/Obelisk/relic drops, uniform-within-pool with no weighted-tier roll at all —
 * see the same reference doc — not covered by this file).
 */

export const DROP_CONTEXTS: DropContextDefinition[] = [
  {
    id: "normalChest",
    slotsPerEvent: 3,
    tierOdds: { common: 0.409, rare: 0.417, epic: 0.142, special: 0.0315 },
  },
  {
    id: "merchant",
    slotsPerEvent: 8,
    tierOdds: { common: 0.211, rare: 0.239, epic: 0.394, special: 0.155 },
  },
  {
    id: "obelisk",
    // The in-game Obelisk mechanic (see DNA's own effect text: "For each [Obelisk]
    // obtained..." — real in-game bracketed term). Confirmed directly by the user (who
    // plays the game) to offer 3 legendary items to choose from.
    slotsPerEvent: 3,
    tierOdds: { legendary: 1 },
  },
  {
    id: "brokenObelisk",
    // Also confirmed directly by the user: once an Obelisk stops offering legendaries
    // (presumably after the player has enough legendary artifacts already — matches
    // __hubert's own unconfirmed recollection in the Discord thread, "the game does not
    // show obelisks when you have more than about 14-16 legendary artifacts"), it
    // becomes a Broken Obelisk offering 4 non-legendary items instead. The exact tier
    // breakdown for those 4 items hasn't been researched — deliberately left empty
    // rather than guessed; see this file's top comment.
    slotsPerEvent: 4,
    tierOdds: {},
  },
  {
    id: "relicChest",
    // Community trace: Random.Range(2,8) picks a count (2-7), then 5 random specials
    // pulled from the pool — no single confirmed "items per relic chest" number.
    slotsPerEvent: null,
    tierOdds: { special: 1 },
  },
];

export const DROP_CONTEXT_BY_ID: Record<DropContext, DropContextDefinition> = Object.fromEntries(
  DROP_CONTEXTS.map((c) => [c.id, c])
) as Record<DropContext, DropContextDefinition>;

export const DROP_EXCEPTIONS: DropException[] = [
  {
    itemId: "philosopherstone",
    contexts: ["normalChest"],
    copiesRemoved: 2,
    note: "Removed 2x from the normal-chest special pool.",
  },
  {
    itemId: "philosopherstone",
    contexts: ["relicChest"],
    note: "Also reduced in relic chests (confirmed qualitatively, exact copy count not confirmed).",
  },
  {
    itemId: "spacetimecircuit",
    contexts: ["normalChest"],
    excluded: true,
    note: "Excluded from the normal-chest pool on the Terra Hard map — really a guarantee, not a random exclusion: Terra Hard grants this as a fixed starting artifact instead of offering it randomly.",
  },
  {
    itemId: "clairvoyance",
    contexts: ["normalChest"],
    excluded: true,
    note: "Excluded from the normal-chest pool on the Terra Hard map — really a guarantee, not a random exclusion: Terra Hard grants this as a fixed starting artifact instead of offering it randomly.",
  },
  {
    itemId: "singularity",
    contexts: ["normalChest", "merchant"],
    copiesRemoved: 1,
    note: "Removed 1x from both the normal-chest and merchant special pools.",
  },
  {
    itemId: "toycastle",
    contexts: ["normalChest"],
    copiesRemoved: 1,
    note: "Reduced (sources vary between 1x and 2x removed) from the normal-chest special pool.",
  },
  {
    itemId: "domainofpower",
    contexts: ["normalChest", "relicChest"],
    excluded: true,
    note: "Fully excluded from the base pool in both contexts — the game re-adds it separately and skips offering it once the player already has it or is at max level, same as any owned/maxed item.",
  },
  {
    itemId: "alineacion",
    contexts: ["normalChest"],
    copiesRemoved: 3,
    note: "Removed 3-4x from the normal-chest special pool — empirically confirmed as the single rarest special artifact.",
  },
  {
    itemId: "alineacion",
    contexts: ["relicChest"],
    note: "Also reduced in relic chests (confirmed qualitatively, exact copy count not confirmed).",
  },
  {
    itemId: "ramodeflores",
    contexts: ["normalChest"],
    copiesRemoved: 2,
    note: "Removed 2x from the normal-chest special pool.",
  },
  {
    itemId: "buho",
    contexts: ["merchant"],
    excluded: true,
    note: "Found fully removed (8x, exceeding the 5-copy baseline) in a merchant-specific pool-adjustment block; the reason wasn't resolved by the source research.",
  },
  {
    itemId: "moneda",
    contexts: ["normalChest", "merchant"],
    copiesRemoved: 1,
    note: "Consistently observed at roughly 7/8 of the baseline epic probability; reason wasn't resolved by the source research.",
  },
  {
    itemId: "tarotcard",
    contexts: ["merchant"],
    excluded: true,
    note: "Found fully removed (8x, exceeding the 5-copy baseline) in a merchant-specific pool-adjustment block; the reason wasn't resolved by the source research.",
  },
  {
    itemId: "aimagic",
    contexts: ["merchant"],
    excluded: true,
    note: "Found fully removed (8x, exceeding the 5-copy baseline) in a merchant-specific pool-adjustment block; the reason wasn't resolved by the source research.",
  },
  {
    itemId: "goldenroulette",
    contexts: ["merchant"],
    excluded: true,
    note: "Found fully removed (8x, exceeding the 5-copy baseline) in a merchant-specific pool-adjustment block; the reason wasn't resolved by the source research.",
  },
  {
    itemId: "unicornio",
    contexts: ["merchant"],
    excluded: true,
    note: "Found fully removed (8x, exceeding the 5-copy baseline) in a merchant-specific pool-adjustment block; the reason wasn't resolved by the source research.",
  },
];

export const DROP_EXCEPTIONS_BY_ITEM_ID: Record<string, DropException[]> = DROP_EXCEPTIONS.reduce(
  (acc, exception) => {
    (acc[exception.itemId] ??= []).push(exception);
    return acc;
  },
  {} as Record<string, DropException[]>
);
