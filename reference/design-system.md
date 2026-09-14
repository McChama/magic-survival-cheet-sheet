# Design system: colors, categories, UI conventions

Decisions made across design/dev sessions so they don't have to be
re-litigated (or re-invented slightly differently) next time. This is about
*visual/UX conventions*; for game-content accuracy see `game-data-sources.md`.

## Language

**Non-negotiable, see `../CLAUDE.md`**: every user-facing string — UI chrome
and game content — must be in English. Read that file before touching any
`src/data/*.ts` file or any component.

## Rarity colors (`EquippableItem.rarity`)

Already used as the "owned" ring color per item in `LoadoutSheet.tsx`
(`RARITY_RING`) — reuse these, don't invent new ones:

| Rarity | Color |
|---|---|
| Common | `rgb(121,119,120)` |
| Rare | `rgb(47,77,97)` |
| Epic | `rgb(82,40,90)` |
| Special | `rgb(107,25,34)` |
| Legendary | `rgb(161,163,51)` |

## Stat glyph colors (`STAT_GLYPH` in `src/data/statGlyphs.ts`)

Per-stat glyph + accent color, from the Claude Design canvas handoff. Reuse
these when a new UI element needs to visually associate with a stat/category
rather than inventing a new color:

| Stat | Glyph | Color |
|---|---|---|
| hp | ● | `#e2495c` |
| atk | ◆ | `#5fe3c4` |
| hpRegen | ✚ | `#63d16b` |
| amplifyAtk | ◈ | `#e88fc0` |
| lifeOrbRecovery | ✦ | `#e2495c` |
| magicDamage | ✧ | `#63d16b` |
| damageTaken | ▼ | `#6fb4ff` |
| magicSize | ✺ | `#f0975a` |
| evasion | ⟁ | `#9ecfe0` |
| magicDuration | ◎ | `#5fe3c4` |
| moveSpeed | ◍ | `#c9b6e8` |
| cooldown | ⧖ | `#e8e8e2` |
| critRate | ✧ | `#e88fc0` |
| critMultiplier | ✷ | `#f0975a` |
| manaAcquisition | ◉ | `#6fb4ff` |
| itemPickupRange | ✜ | `#efc84f` |

## Loadout "Add" flow category taxonomy

**Status: decided, not yet implemented** (as of 2026-09-13).

`LoadoutFab.tsx` → `LoadoutSheet.tsx` currently has 2 speed-dial buttons
(Artifact, Magic) and a free-text search box per sheet. Planned change:
drop the search box, replace with category chips/pills, and fold passives
into the "Magic" bucket (no separate "Passive" speed-dial button — see
`QuickAddKind` in `src/data/quickAddOptions.ts`, which already has a
`"passive"` variant that's simply unreachable from the FAB today).

**Artifact sheet chips** — by `rarity` (see table above), 1:1 with existing
data, zero new tagging needed:
Common · Rare · Epic · Special · Legendary

**Magic sheet chips** — mirrors the wiki's own `/wiki/Magic` page structure
(Offensive Magics / Utility Magics / Passive Magics / Special Passive
Magics) rather than inventing a new taxonomy:

| Chip | Maps to | Color |
|---|---|---|
| Offensive | base magics that deal damage (16 of 22 `BASE_MAGICS`) | `#5fe3c4` (reused from `atk`/`magicDamage` glyph) |
| Utility | Shield, Cloaking, Magic Circle, Armageddon (4 `BASE_MAGICS`) | `#6fb4ff` (reused from `damageTaken`/`manaAcquisition` glyph) |
| Passive | regular leveled passives = `passives.ts` entries with `rarity: "common"` | `rgb(121,119,120)` (rarity Common color) |
| Special | one-off special passives = `passives.ts` entries with `rarity: "special"` | `rgb(107,25,34)` (rarity Special color) |

Implementation note: Offensive/Utility needs one small piece of new data —
tagging which `BASE_MAGICS` entries are Utility (just 4: `shield`,
`cloaking`, `magicCircle`, `armageddon`) vs. Offensive (everything else).
`intelligence` is the one ambiguous case: the wiki files it under "Passive
Magics" (not Offensive/Utility) even though it's a `BASE_MAGICS` entry in
this app's data model — put it in the Passive chip to match the wiki, not
Offensive.

## Known functional gaps (deferred, not forgotten)

As of 2026-09-13, the mobile redesign (Home → Class/Subject/Research/
Dashboard screens) dropped two features the app used to have a screen for.
The user has explicitly deferred both — do not build them unprompted, but
don't "clean up" the now-unused code that supports them either:

- **Target Fusions planning** — picking up to 3 fusion goals at minute 0,
  with ingredient/talent guidance. `MAX_FUSION_TARGETS`, `toggleFusionTarget`,
  `FUSIONS`/`FUSION_BY_ID`, and the Deus Ex Machina prerequisite/cascade
  rules are all still live in `useRunStore.ts`/`src/data/fusions.ts` — just
  no screen calls them.
- **Active Recommender** — comparing 2-4 offered options and seeing a
  score/breakdown. `scoreOption`/`compareOptions` in `src/engine/scoring.ts`
  are fully implemented and unused by any component.
