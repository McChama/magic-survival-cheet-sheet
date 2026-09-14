# Magic Survival Run Companion

## Language rule (non-negotiable)

**Every user-facing string in this app must be in English** — UI chrome (headers,
buttons, labels, toasts, aria-labels) *and* game content (class/subject names,
artifact/passive names and effect text, magic and fusion names, talent and
ultimate names). No exceptions, no partial passes.

This has regressed twice: once when the game-data layer (classes/artifacts/
passives/fusions) was rewritten from data extracted out of the game's Spanish
localization files (`spa_Dictionary_*.txt`), and it silently reintroduced
Spanish text app-wide even though the UI chrome was already in English.

**When adding or regenerating game data** (classes, artifacts, passives,
magics, fusions, talents, ultimates, research nodes): if the extraction source
is Spanish (or any non-English language), translate every name and
description to English before it lands in `src/data/`. Prefer, in order:
1. An English source extracted the same way as the Spanish one, if one exists.
2. https://magic-survival-rpg.fandom.com (community-documented, in English) —
   cross-check names against it the way `src/data/fusions.ts` already does.
3. A direct translation from the Spanish source, keeping numbers, `%`, and the
   game's own bracket/marker formatting (`【】〈〉《》[]`) exactly as extracted —
   only the prose translates.

Never commit a data file with mixed-language content. If a translation can't
be sourced/verified yet, leave the field `undefined`/`null` rather than
shipping the untranslated string — an English UI with a gap reads better than
Spanish inside is otherwise-English screens, and is far easier to spot in
review than a lone leftover sentence hiding in the middle of a long file.

## Source of truth

See `reference/README.md` for the canonical spreadsheet(s) and how they relate
to the wiki fallback.
