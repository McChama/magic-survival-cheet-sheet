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

## Styling rule: prefer classes over inline `style`

**Prefer a Tailwind `className` over a `style={{...}}` object** for anything
that can be expressed statically — layout (`flex`, `grid`, `gap-*`),
spacing (`p-*`, `m-*`), typography (`text-*`, `font-*`), colors, borders,
and one-off sizes via arbitrary values (`w-[46px]`, `text-[1.7rem]`). This
project already ships a Tailwind theme (`tailwind.config.js`) with
project-specific tokens (`ink`, `rarity`, `gold`, `alert`, `font-magic`) —
reach for those before reaching for a hex code, and reach for an arbitrary
value (`bg-[#efc84f]`) before reaching for `style`.

`style` is still the right tool, and should stay inline, for values that are
genuinely dynamic at runtime and can't be written as a literal class string
(Tailwind's compiler only sees class names that appear verbatim in source):
- a background image built from a runtime asset URL (`backgroundImage:
  \`url(${uiImage(...)})\``)
- a color/size interpolated from a prop, store value, or `.map()` item
  (e.g. a stat's accent `color`, a rarity `ring` computed per-item)
- values driven by JS animation state (an interval-cycled frame, a
  transform driven by a boolean that isn't just two fixed Tailwind classes)

When a conditional only ever switches between two or three fixed
looks, write it as a `className` ternary (`className={isApplied ? "bg-
[#3a2420] text-[#f0603c]" : "bg-[#2d2d31] text-white"}`) rather than a
`style` ternary — every branch is still a static string Tailwind can see.

## Source of truth

See `reference/README.md` for the canonical spreadsheet(s) and how they relate
to the wiki fallback.
