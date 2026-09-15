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

## Screen layout structure

Every non-Home screen (`SubjectSelectScreen`, `ClassSelectScreen`,
`ResearchScreen`, `RunDashboardScreen`, and any new full-screen view) is built
from the same four stacked zones, using the shared components in
`src/components/shared/`:

| Zone | Component | Fixed size | Rule |
|---|---|---|---|
| Header | `ScreenHeader` | 36px (`h-9`) — exactly the action button's own height, no padding around it | Optional `leftSlot` (e.g. a point counter) + exactly one top-right action button, a fixed 36×36 icon button (`ScreenHeader` enforces this) regardless of what glyph/icon it shows — a deliberate choice to keep the header compact over a larger (WCAG-minimum) tap target. |
| Title | `ScreenTitle` | 48px (`h-12`) | One line, `1.75rem`, **regular weight — never bold**, centered. This is the screen's name; per-screen color/text-shadow overrides go through the `style` prop (see Subject Select's dark-on-light title), never a different font size or weight. |
| Content | plain `flex-1` | fills whatever's left | **No scroll except `RunDashboardScreen`** — every picker screen (Subject Select, Class Select, Research) is sized to always fit without scrolling: chunk the item list into rows, give the row container `flex-1 min-h-0 flex flex-col justify-evenly`, make each row `flex-1 min-h-0 flex justify-center items-center`, and size each item off its row's height (`h-full`/`h-[70%]` + `aspect-*` + `max-w-full`), not a fixed px size — see `SubjectSelectScreen`'s `SUBJECT_ROWS`/`SubjectSilhouette` or `ResearchScreen`'s `RESEARCH_ROWS` for the pattern. This means items shrink on short viewports instead of scrolling; that's the accepted tradeoff. Screen-specific sub-blocks (Research's pips/description, Class Select's level stepper) live here, between the standardized Title and the item grid. |
| Footer | `ScreenFooter` | 96px floor, grows with content | Always a normal flex sibling — **never `position: absolute`**. An absolutely-positioned footer overlaying scrollable content is exactly what caused a real scroll-clipping bug (Subject Select) and is still fine to *look* fine while quietly being one content-length change away from breaking again (this was still true of Class Select's gradient-overlay footer). |

This structure was reverse-engineered from an audit that found four screens
that had each hand-rolled their own header/title/footer padding and quietly
drifted apart — the close button alone ranged from 18px to 44px across
screens. Adding a fifth screen that skips these shared components (hand-rolls
its own `<div>` header instead of `<ScreenHeader>`) reintroduces exactly that
drift; use the shared components even when a one-off `<div>` would be fewer
keystrokes.

`HomeScreen` is the deliberate exception — it's a splash/menu screen, not a
picker, and keeps its own bespoke hero layout.

## Icon tinting: mask, don't frame

Selectable game-sprite icons (Class Select's classes, Research's nodes, and
any future picker grid of flat-color/silhouette sprites) render **full-bleed,
with no circular frame/border/background chip** — the sprite itself is the
whole visual, not an image sitting inside a decorated slot. State is conveyed
by recoloring the sprite via a CSS `mask-image` (`WebkitMaskImage`/
`maskImage`, `-size: contain`, `-repeat: no-repeat`, `-position: center`) on a
`span` with a `backgroundColor` driven by state, not by the sprite's own
(often arbitrary, e.g. flat green) native color and not by a `filter` hue-
rotate hack (imprecise, doesn't hit an exact hex). This is the `style` rule's
"color interpolated from state" exception, so it's inline — but the actual
tint **values** for a given state should still match the project's existing
tokens (e.g. `#efe18a` for "has progress"/gold, reused verbatim from Research
into Class Select) rather than each screen inventing its own.

Because `mask-image` never fires a load-error event the way `<img src>` does,
pair it with a hidden probe `<img>` (`className="hidden"`) whose `onError`
flips a `failed` state to swap in a text fallback (see `ResearchScreen`'s
`NodeIcon` — the visible masked `span` is a sibling of an invisible `<img>`
used purely for error detection).

## Selection feedback: zoom, plus a border for grid tiles

Any selectable item — a Subject, a Class, a Research node, an Artifact/Magic
tile in `LoadoutSheet` — scales up slightly when it's the selected one:
`scale-110` (vs. `scale-100` when not selected) with `transition-transform
duration-150`, on the item's own button/wrapper element (transforms don't
affect layout, so this never reflows the grid around it). This is the single
shared cue for "this is the one you're looking at" across every picker.

`LoadoutSheet`'s Artifact/Magic tiles carry a second, independent cue on top
of the zoom: a bright white border (`border-2 border-white`) when the tile is
the current `lastPicked`, distinct from the existing rarity/ownership ring
color (`RARITY_RING`/`RING_BY_KIND`) that border normally shows — the white
selection border always wins over the rarity color while an item is selected,
since "which one did I just tap" and "what rarity/ownership is this" are two
different questions the tile has to answer at once, unlike Subject/Class/
Research where there's only one selected thing on screen and its scale is
enough. This border rule is specific to `LoadoutSheet`'s dense grid; the other
pickers show only one full-size preview + name/description below the grid, so
the zoom alone is unambiguous there.

## Descriptive text sizing

Short flavor/description text (a research node's effect line, a class
level's bonus line, a subject's trait) that sits inside a container the
rest of the screen's layout depends on staying a fixed size — use
`text-descriptive` (`tailwind.config.js`: `0.75rem`/`1.15` line-height) and
give the container itself a fixed height (not one that grows with content),
with `line-clamp-2` as a safety net. The failure mode this avoids: a `flex-1`
content zone (the item grid) sitting below a `flex-none` description block
means every extra wrapped line in the description silently steals space from
the grid, so icons visibly shrink or grow depending on *which* node happens
to be selected — see `ResearchScreen`'s fixed `h-[4.75rem]` description zone
for the pattern. Screen titles and section headings are unaffected by this —
they keep `ScreenTitle`'s `1.75rem` — this rule is specifically for body-style
flavor text, not the four zones themselves.

## Source of truth

See `reference/README.md` for the canonical spreadsheet(s) and how they relate
to the wiki fallback.
