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
`ResearchScreen`, `RunDashboardScreen`, `OwnedMagicScreen`/`OwnedArtifactScreen`
(both in `OwnedGridScreen.tsx`), `SynergyScreen`, and any new full-screen view)
is built from the same four stacked zones, using the shared components in
`src/components/shared/`:

| Zone | Component | Fixed size | Rule |
|---|---|---|---|
| Header | `ScreenHeader` | 36px (`h-9`) — exactly the action button's own height, no padding around it | Optional `leftSlot` (e.g. a point counter) + exactly one top-right action button, a fixed 36×36 icon button (`ScreenHeader` enforces this) regardless of what glyph/icon it shows — a deliberate choice to keep the header compact over a larger (WCAG-minimum) tap target. |
| Title | `ScreenTitle` | 48px (`h-12`) | One line, `1.75rem`, **regular weight — never bold**, centered. This is the screen's name; its color is a named `tone` (`default`, `gold`, or `dark` — Subject Select's dark-on-light title with its soft shadow), never a per-screen `style`, font size or weight. |
| Content | plain `flex-1` | fills whatever's left | **Scroll is allowed only on the long lists** — `OwnedMagicScreen`, `OwnedArtifactScreen`, `SynergyScreen`, `MagicCombinationScreen`'s grid and the "+" menu's Select Magic / Select Artifact sheets (plain `overflow-y-auto`, since their item counts are genuinely unbounded/large: all 63 fusions, the whole catalog, or however many magics/artifacts a long run has picked up). **No modal ever scrolls**: a modal's content is laid out to fit its card (`DetailModal` clips instead of scrolling, 72dvh tall; check a new modal's content at ~820px height). The Recommender's grid and results *page* instead (`PagedGrid`/`PagedList`/`Pager`: they measure the room with `useElementSize` and show as many whole rows as fit). Every *picker* screen (Subject Select, Class Select, Research, and `RunDashboardScreen` itself since its Loadout section was replaced by nav buttons — see below) is sized to always fit without scrolling instead: chunk the item list into rows, give the row container `flex-1 min-h-0 flex flex-col justify-evenly`, make each row `flex-1 min-h-0 flex justify-center items-center`, and size each item off its row's height (`h-full`/`h-[70%]` + `aspect-*` + `max-w-full`), not a fixed px size — see `SubjectSelectScreen`'s `SUBJECT_ROWS`/`SubjectSilhouette` or `ResearchScreen`'s `RESEARCH_ROWS` for the pattern. This means items shrink on short viewports instead of scrolling; that's the accepted tradeoff. Screen-specific sub-blocks (Research's pips/description, Class Select's level stepper) live here, between the standardized Title and the item grid. |
| Footer | `ScreenFooter` | 96px floor, grows with content | Always a normal flex sibling — **never `position: absolute`**. An absolutely-positioned footer overlaying scrollable content is exactly what caused a real scroll-clipping bug (Subject Select) and is still fine to *look* fine while quietly being one content-length change away from breaking again (this was still true of Class Select's gradient-overlay footer). |

`RunDashboardScreen` no longer has its own "Loadout" section — instead a row
of 4 nav icons at the bottom (`Owned Magic`/`Owned Artifact`/`Synergy`/`Magic Combination`,
via the shared `NavIconButton` — see below) links out to the scrollable screens above plus the
`Magic Combination` screen, and the `LoadoutFab` add-flow sits on its own row under them (a red
circle whose glyph is the game's X sprite turned 45° so it reads "+", and back to an X while its menu is open;
its popup opens *upward* via `bottom-full`, and its dismiss backdrop is `fixed inset-0`, not `absolute`,
precisely because it's no longer sitting in its own full-screen wrapper). Every chip in the nav row shows its
icon in the same 24px glyph box; the Magic Combination button is the game's own heptagram, plain white (masked —
see `NavIconButton`'s `tint` below) while no combination is available and its own red once one is.
Home has only two icon buttons now (Research, Subject) — the Drop Probability and Recommender buttons are gone
(`DropProbabilityScreen` is still in the app, just without an entry point until it gets a new home; the Recommender
is reached from the Dashboard's "+" menu as "Compare Offer"). A small circular button next to "Current Level" starts
the real level-up event: it opens Select Magic (the same sheet the "+" menu's "Magic" item opens — `RunDashboardScreen`
owns the one `LoadoutSheet` instance both trigger, not `LoadoutFab`, which is now purely presentational) in level-up
mode (`isLevelUp`), but **does not** raise `run.currentLevel` by itself — it's select-then-commit, see "Leveling"
below for where the increment actually happens. Its glyph is the game's own X sprite (`UI_Exit`) turned 45° to read
"+" — the same technique `LoadoutFab`'s own "+" glyph uses, not the star sprite (`UI_Star01`, since removed) or the
move-arrow triangle a first pass reused for it before that. Idle, it throbs like a heartbeat: a CSS `scale` pulse
paired with its tint sweeping from resting gold to the same max-level green a magic's pips turn at max level
(`LevelMarks.tsx`'s `#3fdc5a`) and back (`animate-pulse-green`, `index.css` — `motion-safe:` so it's skipped under
reduced motion, same as the Magic Circle bubble's tap effects).

**`MagicCombinationScreen`** (`components/screens/`) is the game's own "Magic Combination" screen (the 63 fusions in
`data/fusions.ts`). Opened from the Dashboard while some combination's requirements are met (`getAvailableFusions` in
`engine/magicCombination.ts`: both ingredient magics owned — class-granted or added — and each with the talent the
combination needs, as recorded on the "+" magic rows; Deus Ex Machina, which needs another combination learned,
never counts) it opens on that combination's detail — art (`magicImages/large/`, a 340px copy), name, gray
"<Magic> Unusable" subtitle, the game's colored effect lines and the requirements (green once met) — with the
game's left/right arrows to page through when several are available; its X goes back to the **grid** of every
combination (3 columns of tall 205:377 cards on the same `GridPanel` as the owned grids, art at 78% of the card's
width; a white border marks the available ones, a dark-gray one the rest; tap a card for its detail, the "Return"
button leaves). Opened with none available it starts on the grid. **Leaving a detail restores the grid's scroll
position** instead of resetting it to the top — the grid unmounts while a detail is open (its own full-screen view,
not an overlay), so the scroll container's own state can't survive that on its own; `MagicCombinationScreen` saves it
in a ref on the way into a detail and `GridPanel`'s new `scrollRef` prop re-applies it once the grid remounts
(`useLayoutEffect`, before paint). Names, effect lines and colors come from
`eng_Dictionary_MagicCom.txt` (`data/magicCombinations.ts`, generated); "Unusable" is derived as the second
ingredient (the dictionary has no field for it) — confirmed by the one real screenshot (Age of the Sun: "Satellite
Unusable"), and matches every combination whose data has 2 real ingredients, but the user flagged real in-game
exceptions this heuristic doesn't know about yet (Bishop's own special attribute, and Overmind → Deus Ex Machina,
which is already excluded since it isn't a talent-pair combination at all) — treat `unusable` as a good default, not
a verified fact, until each of the 63 is checked against a real screenshot. **A magic can record one talent per
talent-level group it has** (`run.magicTalents[magicId]: string[]`, `store/useRunStore.ts`'s `setMagicTalent(magicId,
level, talentName)` replacing only the group at `level`) — every magic has one group except Magic Bolt, which picks
independently at level 4 and again at level 7, and a combination can need either pick (the level-4 one unlocks some
Combinations on its own, not only the level-7 one) — both are checked (`.includes`), not just the most recent pick.

## Navigation persists across reloads

`App.tsx`'s top-level `screen` state (`Screen` — which of Home/Subject/Class/Dashboard/Research/Owned Magic/etc. is
showing) lives in `store/useNavigationStore.ts`, a small zustand `persist` store (`localStorage` key
`magic-survival-navigation`) alongside `useRunStore`'s own persisted run — not a plain `useState` — so reloading the
page resumes on whatever screen the player was looking at instead of always bouncing back to Home. Only the
top-level screen persists this way; a screen's own in-progress UI state (an open `LoadoutSheet`, a selected filter
chip, scroll position) stays local `useState` as before and resets on reload, same as it always has.

## Leveling: gated by Current Level, only through Select Magic, select-then-commit

A magic or passive can never be leveled past `run.currentLevel` — the *only* thing that raises `run.currentLevel` is
picking a row in Select Magic while it was opened from the Dashboard's level-up star (`isLevelUp`), so a level can
only ever be spent there. This is **select-then-commit**, not "press the button, then the level is already spent":
pressing the star only opens Select Magic in level-up mode — `run.currentLevel` itself doesn't move until a row is
actually tapped (Obtain / +1 Level / a talent pick's Learn). Refresh the page after pressing the star but before
picking anything and `run.currentLevel` is exactly what it was before — there's nothing to lose, because nothing
committed yet. `hooks/useLevelUpActions.ts`'s `useLevelUpActions(isLevelUp)` is where this lives: every action it
returns (acquiring a class-granted magic the first time its level changes, setting the level, recording a talent)
also bumps `run.currentLevel` by exactly one, but *only* when `isLevelUp` is true — the same hook, called with
`isLevelUp={false}`, backs the "+" menu's plain catalog and never touches `run.currentLevel`. While Select Magic is
in level-up mode, a row's own cap check (`engine/magicLeveling.ts`'s `getMagicLevelPick`/`getPassiveLevelPick`:
`targetLevel = min(realMax, effectiveCurrentLevel)`) is against `run.currentLevel + 1`, not the stored value — the
pending level-up is still "spendable" while the screen is open, so a magic that needs exactly the level this pick
would grant isn't wrongly shown as blocked. Opening Select Magic from the "+" menu instead uses the plain
`run.currentLevel` as the cap (no pending +1), and can still show an owned-but-not-yet-leveled row past it — the row
goes inert (its description swapped for a real hint, "Reach Current Level N to level this up.") instead of
disappearing, so the reason is visible, not just absent.

**`AttributeSelect`** (`components/shared/`) is the game's own "Select Attribute" screen (real strings, from
`eng_Dictionary_Name.txt`: "Select Attribute"; "Attributes make magic even stronger. @ Select an attribute.";
"You can obtain an attribute." — sampled 2026-09-24 against a real level-up screenshot for this state's colors: a
teal border + level number + description, all the one color, `LEVEL_PICK_TALENT_COLOR` in `config/frameColors.ts`).
Opened from a Select Magic row whose next level is one of the magic's talent-level groups, it shows the group's real
3 talents as the magic's own icon (`baseMagicSpriteUrl`) tinted by `TALENT_TYPE_COLOR` — full color, not dimmed,
unlike Owned Magic's small talent-icon row — arranged in the real screen's triangle (one centered, two below); tapping
one turns it white and reveals its name, real colored description lines, and the Magic Combinations that need this
exact (magic, talent) pair as an ingredient (`engine/magicCombination.ts`'s `getFusionsForTalent`), each a small
thumbnail using the same white/dark-gray border as `MagicCombinationScreen`'s own grid (`COMBINATION_FRAME_READY`/
`_IDLE`, moved to `config/frameColors.ts` so both screens share it) — white when picking this talent would complete
it right now (`wouldCompleteFusion`, a `getFusionRequirements` call against a simulated run with the talent already
recorded). Learn is disabled until a talent is picked; it commits the level + talent together (and, in level-up mode,
`run.currentLevel` too — see "Leveling" above) and closes the whole sheet, same as any other Select Magic pick. Its
header X goes back to the Select Magic list without committing anything — since nothing has committed yet at that
point (select-then-commit), backing out here loses nothing; the pending level-up is still there to spend on a
different row.

**The "+" menu** (`LoadoutFab` → `LoadoutSheet`, a full-screen sheet titled "Select Magic" / "Select Artifact", chips centered, scrolling, and the floating Magic Circle bubble hidden while it is open — `useUiStore`) is a **catalog of what the
run doesn't have yet** — whatever is obtained leaves it (an owned magic, a passive, a class special, an artifact, the Subject's
starting artifact). **Magic** has four chips, no "All", opening on **Active** (the wiki's "Offensive"): Active white, Utility blue,
Passive green, Special red (`MAGIC_KIND_COLOR` in `config/frameColors.ts`, for the chips *and* the rows' borders). Each entry is the game's own
"Select Magic" row (`MagicPickList`): a wide black card with the rough `StripFrame` border (`size="row"`), **tappable anywhere
— there's no separate button inside it**, so the icon, name and description all trigger the same action; every row is the same
fixed height regardless of how long its description is (`h-[6rem]`, description clamped to 2 lines — this is what keeps rows
uniform, not a change to text line-height or the gap *between* rows). The description text specifically (not the title, and
not the row-to-row gap, both of which stay the app's normal, roomier spacing) uses a tight line-height (`leading-tight`) so
its two lines read as one compact block under the title instead of spreading out,
icon vertically centered in it. It shows a level marker in the corner (a star for a not-yet-owned special, otherwise
**"Lv N" for the level this tap would bring it to** — 1 for a fresh pickup, the owned level + 1 otherwise — colored by what the
tap does: plain for a fresh pickup, gold for a normal level-up, teal once it unlocks a talent). **The list is everything not yet
at its real max level, owned or not** — the catalog used to drop an owned magic/passive entirely; now a not-yet-owned one is
obtained (level 1, description = its real one-line blurb) on tap, an owned not-maxed one levels up by one (description = that
level's real "+N%" preview line, `data/magicLevelUps.ts`) on tap, or, once the next level is a talent pick, opens Select
Attribute instead (description replaced with "You can obtain an attribute.", see "Leveling" above) — only a magic/passive
already at its real max level drops out entirely, and one blocked by the Current Level cap is inert (its description swapped
for the blocked hint) rather than removed. Intelligence is not listed as a magic: it is the
Intelligence passive (fusions that ask for it accept the passive, `INGREDIENT_PASSIVE`). **Artifact** lists the artifacts on the
same `GridPanel` and 6-per-row rough-bordered cards as Owned Artifact (border by rarity, white + zoom for a picked one), filtered
by rarity chips with no "All" (it opens on Normal), to pick the ones the game just offered (up to 3, like a chest); the third
opens the Treasure Chest window (`ArtifactOfferModal`, the game's screen): the offered artifacts as Owned Artifact cards
(the selected one white), its name, rarity, real description, the Synergies it belongs to with their progress rings
(`ItemSynergies`) and the Obtain button that adds it — and takes it out of the pool (the Recommender's artifact list too) **without leaving the sheet**: the modal closes and Select Artifact stays open for the next offer.

**Passives have levels like the magics** (`data/passiveLevels.ts`, from `eng_Dictionary_Ability.txt`): the ten base passives level up to
Intelligence 5 (+10% ATK, +3% per level), Fast Casting 3 (-5% cooldown, +1%), Vitality 5 (+20% Max HP and +10% Life Orb, +10% Max HP per level),
Haste 2 (+10%, +2%), Arcane Effuse 3 (+5%, +2%), Concentration 3 (+10%, +3%), Snipe 3 (+5%, +1%), Explorer 3 (+33%, +10%), Rupture 3 (+15%, +5%)
and Advanced Magic 3 (no per-level line); the 24 special passives have no levels (a star). The level is the recorded one in `run.magicLevels`
(`engine/ownedPassives.ts`; 1 until changed), `passives.ts`'s `stats` are the **max-level** values, and `getRunStats` counts a passive at its
level (`passiveStatsAtLevel`: Vitality Lv1 = +20% HP -> 240). Not modelled: Doctor ("Increase Max Level by 3" is the
**player's** character-level cap, not a magic's own — the dashboard has no player-max-level stat to raise) and Taoist
("+1 level to all Additional Passives" applies once the player reaches level 100, or the run's own effective level
cap if something has raised it — a mechanic this app doesn't model at all yet).

**`OwnedMagicScreen` lists everything the run has** (`engine/ownedMagics.ts`, `getOwnedMagics`): the class icon,
then one tile per base magic — first the ones the **Class** grants (at their class-derived level), then the ones
added with the "+" button (`run.acquiredMagicIds`), at the level the player recorded in that sheet
(`run.magicLevels`; a magic that is both takes the recorded level, since the game's own level already includes the
class's +1) — then one tile per passive added with "+" (green frame and green pips, max = `getPassiveMaxLevel`) — then one tile per named special
ability (Guardian Angel, Doctor, ... the class unlocks, plus the ones added with "+", each in its own real colors —
not masked white, unlike a magic/passive icon). **A level is view-only here** — a hint ("Level it up from Select Magic...")
stands in where the old "‹ Lv N ›" stepper was, once there's still a level left to reach; leveling only ever happens through
Select Magic now (see "Leveling" above) — but a "Remove" for what the player added still lives here, and
a magic's modal still lights the talent the player recorded (`run.magicTalents`: full opacity in its category color; the others
stay at 25%) and still has a "Choose"/"Clear" button on a talent's panel once the magic has reached the level it unlocks at (a
manual override independent of how that level was reached). See `getClassMagicProgression` in `data/classes.ts`
for the derivation (real `CLASS_BONUSES` text only, no invented per-magic max
level). The class tile opens `ClassBonusDetail` (shared with
`ClassSelectScreen`'s inline block); a magic tile opens its *own* real detail
instead, laid out like the game's: the unframed white icon, name, level pips,
its real one-line description (`MAGIC_DESCRIPTION`, from
`eng_Dictionary_Ability.txt`), a two-column stat/value table (values in gold),
and, pinned to the bottom, one row of small talent icons (all talent levels
together, a wider gap between levels; no text). Each icon is tinted by its
talent's category color (`TALENT_TYPE_COLOR`, the 9 colors read out of the
in-game talent-type colors) at the game's 25% opacity; tapping one turns
it plain white and opens a description panel over the modal with the talent's
name, "Attribute Unlock Level", and its real colored description lines
(`data/magicTalents.ts` — e.g. Magic Bolt: Magic Arrow/Fireworks/Fission at
level 4, Chain Casting/Fire at Will/Doppelganger at level 7). The panel has no
close button: a tap anywhere outside it closes only the panel (`DetailModal`'s
`onBackdropClick`; the open talent's state lives in `OwnedMagicScreen`). No
uppercase section labels anywhere in the modal. **The table's rows are the
magic's real stat list** (`data/magicStats.ts`, from the game's
ability detail panel: Magic Bolt shows Damage/Explosion Range/Number/
Cooldown; others show 1-6 of those plus Size, Duration, Damage Interval,
Rotation Speed, Amplification Effect; Damage and Number are whole numbers,
never percentages). **Values are the game's level-1 constants** (`MAGIC_BASE_STATS`, decoded from
the starting values; Lava Zone's Damage Interval and Energy Bolt's Duration
couldn't be decoded, so they read "—"). **Damage** = constant x ATK x (1 + Amplify
ATK%) x (100 + All Magic Damage% + the magic's permanent bonuses) / 100
(`engine/magicDamage.ts`), verified against a real screenshot (Magic Bolt 630 =
5 x 100 x 1.2 x 1.05). Permanent bonuses are the traits of unlocked Subjects
(`run.meta.unlockedSubjects`, toggled by the Unlocked/Locked button in Subject
Select's footer — every Subject starts **locked except Wizard, which is always
unlocked and can't be locked**; a locked Subject's description/trait render gray,
an unlocked one in color; see `isSubjectUnlocked`) and the class's Lv5 bonus. It reads
"—" until an ATK is entered. **Level-ups, class and artifacts also count**
(`engine/magicEffects.ts`): the magic's own level-up lines (`data/magicLevelUps.ts`, from
the game dictionary — entry i is level i+2; Magic Bolt Lv2 = +1 Number), the equipped
class's gated lines up to its level, and the effect text of equipped artifacts plus
the Subject in use's starting artifact (the game equips it at start). Damage adds all "+N%" together; Number adds. **The dashboard's global stats feed each magic's rows too**
(`applyMagicEffects`, formulas read from the game's starting values): Size and Explosion Range =
base x (100 + All Magic Size + the magic's own Size bonus)/100; Duration likewise with All Magic Duration;
Cooldown = base x (1 - All Magic Cooldown) x the magic's own reductions — **cooldown reductions multiply, they
don't add** (the dashboard's All Magic Cooldown is itself `100 - product x 100`, see `computeStartingStats`).
Checked against real screens: Magic Bolt (Damage, Number, Cooldown, Size with Research Size/Duration/Cooldown) and
Cyclone (Druid Lv3: Damage 500, Interval 0.3 s, Size x1.1, Duration 2.4 s, Number 2, Cooldown 2.5 s — all match).
Satellite (Lv1/Lv2/Lv3 = 540/630/720; Astronomer Lv3 = Satellite Lv2: Damage 630, Rotation x1.5, Size x1.1, Number 2; and Lv1 in a Wizard run: 540, x1, x1.1, 1).
Magic Circle Lv1 (Amplification 25%, Duration 6 s = 5 x 1.2, Cooldown 18 s = 20 x 0.88) and Lv2 (30%, 7 s, 18 s) and Lv3 (35%, 8 s, 18 s) — level-ups start at Lv2 there; Effect adds points, Duration adds to the global %; the 5-level magics repeat their last list entry (Lv5 = 45%, 10 s, predicted). The **Magic Circle toggle** (`run.magicCircleActive`) is a floating bubble (`components/layout/MagicCircleBubble.tsx`, rendered by `App` over the run screens (Dashboard, Owned Magic, Owned Artifact, Synergy — not Magic Combination) only when the run has the magic — from the class or added with its level): its own icon, white when OFF and yellow with its Amplify ATK % when ON. Tap to switch (the icon pops and a ring spreads out and fades — `bubble-pop`/`bubble-ripple` in `index.css`, skipped for reduced motion); drag it anywhere and it snaps to the nearest **left or right** edge of the app frame on release (keeping the height it was dropped at) (resting place kept in localStorage). While ON its Effect is added to Amplify ATK (`engine/magicCircle.ts`), so every magic's Damage shows the buffed value. While active its Effect acts as a temporary Amplify ATK (Spirit Lv4: 1,170 -> 1,521 at 30%, 1,580 at 35%).
Spirit Lv1-Lv4 (Damage 780/910/1040/1170, Number 1-4; its Cooldown 0.66/0.67/0.67/0.68 s follows `spiritBaseCooldown`, fitted to the first three and confirmed by the fourth). One screen showed Spirit Lv4 at 1,521 (= 1,170 x 1.3) and the next one 1,170 again: a temporary buff, not modelled.
The class tooltip that grows with the character level (Wizard: Magic Bolt Damage +3% per 5 levels; Scholar/Arcanist: All Magic Damage +1% per level) **multiplies** the Damage
(`characterLevelDamageMultiplier`, from the dashboard's Current level): Wizard at level 5 = 1,025 x 1.03 = 1,056. The factor is built in 32-bit floats like the game's (Wizard at level 10: 1,086, not 1,087).
Summon-type magics (Spirit, Satellite) apply their repeated level-up effect from level 1 (`LEVEL_EFFECTS_FROM_LEVEL_ONE`); the rest start at level 2.
Still unchecked: two global cooldown sources at once (multiply vs add), Spirit at Lv5+, and the other 17 magics. Verified: Wizard/Wizard Lv3, ATK 100, Amplify 0 -> Magic Bolt Lv2
Damage 1025 = 5 x 100 x (100+5+100 The Freeshooter)%, Number 2, Cooldown 0.6 s. Still
not modelled: chosen talents, completed Mastery Synergies, the Research "Growth" bonus (every 20 levels).
A class special-ability
tile (Guardian Angel, Doctor, ...) opens the same layout (`DetailHero`): the
unframed white icon, name, a **star where a magic shows its level pips**, then
**every effect line the game shows for it in its real color**
(`PASSIVE_EFFECT_LINES` in `data/passiveEffects.ts`, all 34 passives from
`eng_Dictionary_Ability.txt` — Guardian Angel has two: the revive line and a
green "Increase Max HP by 30%"; `passives.ts` alone only keeps one string).
Every modal is the shared `DetailModal`: square corners, the same rough
`StripFrame` border as the cards drawn in the modal's own background color.
The magic-style modals (magic, special) lay themselves out from the top
(`align="top"`); the short self-contained ones (class, artifact, synergy) stay
vertically centered in the card (`align="center"`, the default).

Every card in this view is measured off a real in-game screenshot, not this
project's generic square `GridTile` look: 108x205px portrait cards
(`aspect-[108/205]`), 6 per row, on a rough-edged dark-gray panel
(`ArtifactBackGroundA.png`, 10% side margins), all sharing one black
background — **only the border color varies** (white for the class, blue for
active magics, red for specials). Borders are the real `AreaProgressBarA`
(top/bottom) and `AreaProgressBarB` (left/right, rotated) strip sprites, tinted
via mask-image. Inner offsets (icon, pips) are percentages of the card via
container-query units (`cqw`/`cqh`). Icons are **masked to flat white**
(same technique as "Icon tinting" below); the class icon is always plain white
here regardless of class level, and vertically centered since it has no level
row. Level shows as one pip per level the magic *really* has
(`getMagicMaxLevel`: 7 for most, 5 for Shield/Cloaking/Armageddon/Magic
Circle/Intelligence — the game's own max-level column, not a guess): yellow
dots (filled = reached, hollow = not), all turning green at max level. A
special ability shows a star the same size as one pip in that row. A passive's pips are all green.

`OwnedArtifactScreen` follows the same visual rules as Owned Magic: 108x205 portrait cards, 6 per row, the
artifact's full image centered inside (`object-contain`, never cropped by the frame), one black background with only
the rough `StripFrame` border varying (by rarity), and a modal with an **unframed** image, no uppercase labels and
the same text sizes as a magic's modal. 
`OwnedArtifactScreen`'s detail modal shows an artifact's image, its rarity
(colored by `RARITY_TEXT` — the bright text color, not the dark frame color of `RARITY_RING`), its real description
(`describeItem`), its "Boost signals" — the base magics its effect text names (`namedMagicIdsInText`), one per line with its icon, green for the ones the run has (when it names none, just the line "No magic boosted.") — and, under
them, the round badge of every Synergy the artifact is a requirement of, each with its progress ring (`ItemSynergies`),
plus prev/next arrows to page through every other equipped artifact without closing the
modal — reuse this shape (image + rarity + description + real synergies) for
any future single-item detail view rather than inventing a new layout.

**`SynergyScreen` renders the real, extracted in-game "Synergy" mechanic**
(`data/synergies.ts`, from `eng_Dictionary_Synergy.txt`): 63 named combos, each
requiring 3-5 specific artifacts/passives equipped **at once** to count as
complete, with real effect text. This is a genuinely different mechanic from
**both** of the other two "synergy-shaped" things in this app — don't conflate
them:
- `data/fusions.ts` — base-magic + base-magic Fusion recipes, tracked via
  `run.fusionTargets`. Unrelated axis (magics, not artifacts).
- `engine/synergy.ts`'s `detectSynergies` — the tiered "boost signal" heuristic
  (fusion-ingredient relevance, class/subject signature magic match, shared-
  with-another-equipped-item, already-acquired magic) used by
  `RecommenderScreen` to rank offers and by `OwnedArtifactScreen`'s detail
  modal. This one used to render on `SynergyScreen` too, before the real
  in-game Synergy data was found — it's still real and still useful, just
  renamed in every user-facing string to "boost signal" (`translation.json`'s
  `boostSignal.*` keys, `config/tierColors.ts`'s `BOOST_SIGNAL_TIER_COLOR`) so
  it stops colliding in terminology with the actual Synergy screen.

`SynergyScreen`'s completion ring is `uiImages/synergyRings/SynergyNum{n}.png`
/`SynergyNumS{n}.png` (n = 3, 4, or 5) — pixel analysis confirmed
`SynergyNum{n}` is a segmented ring with exactly **n gaps**, i.e. the ring
shape is **how many items this Synergy requires**, not a per-owned-item
progress indicator. Both variants are white-on-transparent masks (tinted via
the same mask-image technique as `MaskedMagicIcon`), `NumS` being a thinner-
stroke "complete" variant — this app shows **progress on the ring itself**: while incomplete, `Num{n}` has one segment per required item
(the gaps sit at multiples of 360/n from the top, clockwise) and each segment is gold if that item is owned, dim if
not — painted with a `conic-gradient` through `MaskedSprite`'s `fill` prop (`SynergyScreen`'s `segmentFill`); with
nothing owned the whole ring is dim, and once every item is owned it switches to the thin `NumS{n}` in gold
(`config/tierColors.ts`'s `SYNERGY_RING_DIM`/`SYNERGY_RING_COMPLETE`, a design decision since the raw assets carry
no color themselves). Segment i is the Synergy's i-th required item (`getOwnedFlags`).

`OwnedArtifactScreen` and `SynergyScreen` both use `DetailModal` (a centered
card over a `fixed inset-0` backdrop) for their tap-to-inspect view, not
`ScreenFooter` — a footer preview works when there's one screen-wide subject
(Subject Select, Research), but a dense 5-column grid of many independently-
describable items needs its own focused view per tap instead.

### Other shared UI primitives (`src/components/shared/`)

- **`FilterChip`** — the pill in every row of filters/tabs (rarity, drop context, Recommender mode, talent, category):
  outlined and dim when inactive, filled with its `color` when active (that color is the one inline value).
- **`PipDot`** — one level dot (Class Select's stepper, Class detail, Research nodes); size and fill are classes.

- **`RemoveButton`** — the small orange text "Remove" at the bottom of every modal that can drop what the player added (magic, passive, special, artifact).
- **`AttributeSelect`** / **`hooks/useLevelUpActions`** — the Select Attribute screen and the store-call bundle both it and `MagicPickList`'s row tap commit through; see "Leveling" above.
- **`Pager`** / **`PagedGrid`** / **`PagedList`** (with `hooks/useElementSize`) — the paging the Recommender uses instead of scrolling, see the Content zone above.
- **`GridCard`** — `GridTile` (a 108:205 portrait card with the rough border), `CardArt`, `GridIcon` and `MaskedMagicIcon`,
  the pieces of every card in the owned grids, the combination grid and the Treasure Chest window; `LevelMarks` has the level
  `Pip` and the special's `StarIcon`.
- **`SynergyBadge`** / **`ItemSynergies`** — a Synergy's round portrait with its segmented progress ring (`CompletionRing`),
  and the row of them for the Synergies an item belongs to (Owned Artifact's modal, the Treasure Chest window).
- **`StripFrame`** — the rough border, in three thicknesses (`card`, `row`, `modal`). Its side strips use `AreaProgressBarB_V` (the
  game's side strip already turned 90°), so it needs no size container and frames any box, even one whose height follows its content.
  The strips are drawn at 0.6-0.9x of the sprite's own thickness and pulled out by the sprite's transparent margin: squashed harder
  (the old 2px/3px strips) the stroke thinned to a dashed hairline that read as a cut border.
- **`NavIconButton`** — the one size (50×50 footprint) for every bottom-row
  icon button (Home's row, the Dashboard's nav row). An optional `background`
  prop adds a colored circular chip (shrinking the icon inside it to a 24px glyph box) for
  contexts that want one; omit it for a bare icon-only button like Home's. An optional `tint`
  recolors the icon flat via CSS mask instead of showing its own baked-in colors — for a sprite that needs
  one state tinted and another left as its native color, like the Magic Combination chip: plain white (masked;
  the sprite's own colors are an olive/gray, not white) while no combination's requirements are met, its own
  red once one is (`UI_MagicCom_GlyphB`, left untinted).
  Reach for this instead of a new one-off `<button><img/></button>` — that's
  exactly the per-screen sizing drift the rest of this section exists to stop.
- **`DetailModal`** — the centered detail card described above.
- **`ClassBonusDetail`** — a class's real tooltip + 4 gated bonus lines,
  shared by `ClassSelectScreen` (`showHeader={false}`, next to its own
  interactive level stepper) and `OwnedMagicScreen`'s modal (default
  `showHeader`, the full self-contained icon+name+pips+bonuses card).

This structure was reverse-engineered from an audit that found four screens
that had each hand-rolled their own header/title/footer padding and quietly
drifted apart — the close button alone ranged from 18px to 44px across
screens. Adding a fifth screen that skips these shared components (hand-rolls
its own `<div>` header instead of `<ScreenHeader>`) reintroduces exactly that
drift; use the shared components even when a one-off `<div>` would be fewer
keystrokes.

`HomeScreen` is the deliberate exception — it's a splash/menu screen, not a
picker, and keeps its own bespoke hero layout.

## Dashboard stats are computed, then adjusted

The dashboard no longer starts empty. `engine/runStats.ts` derives the run's starting stats
(`computeStartingStats`) from the real sources: **Research** bought, the equipped **Class**'s
Lv2-Lv4 lines up to its level, the stats of the special abilities it grants (Bishop's Guardian Angel = +30% Max HP)
and Bishop's Amplify ATK (+10% per active Shield, 2 Shields at the start, +1 from its Lv4 line), the **All Classes** bonuses (the Lv5 line of every class at level
5, and the trait of every unlocked Subject — Wizard always is), and the
**owned artifacts/passives** (their curated `stats`: the Subject's starting artifact, which also counts as owned everywhere,
`getEquippedItems`, and can't be removed). Stats start from the game's own pause-screen bases
(`STAT_BASE`): ATK 100, HP 200, Critical Strike Rate 3%, Crit. Multiplier 200%, Movement Speed 100,
Life Orb 30 = 15% of max HP; ATK/HP are *scaled* by "Increase X by N%"
lines (100 x (1 + N%); HP confirmed in game — Vitality Lv6 = 340; ATK not yet), Life Orb = max HP x 0.15 x (1 + its bonus)
(Vitality Lv6 -> 69, confirmed), the other based stats add points, and every unlisted stat is a
bonus starting at 0. The dashboard row prints like the game (`STAT_DISPLAY`: "+N%" bonuses, "N%" rates,
plain numbers, HP as "N/N") and colors it white at its non-zero base, green above it, gray at zero. What the player types on the dashboard is stored as
`run.statAdjustments` (typed value minus computed value), and every reader takes
`getRunStats(run)` = computed + adjustments — never read `statAdjustments` directly. Not
modelled yet: item effects that aren't a plain stat number, and effects that scale with the run (Aegis's Amplify per
Damage Taken, Pyramid's per Synergy, "per character level" lines). Verified against a real full-stat screenshot (Bishop Lv3, Wizard subject, Archaeologist unlocked, Vitality 3): all 17 stats match.

Subject Select renders a locked Subject faded and gray (`grayscale opacity-40`) so locked and
unlocked read apart at a glance; Class Select tints the *picked* class plain white and the
others by their own level, in soft pastel tones — literal `bg-*` classes in
`config/classLevelColors.ts` (level 3 = #C8E8FF and the picked class = #F0F0D8 were sampled from a real
screenshot; levels 2/4/5 are derived pastels, still unmeasured), never the saturated bonus-text colors.

## Formula regression check

`npm run check:formulas` (`scripts/check-formulas.mjs`) replays every number a real game screen showed — the dashboard's
starting stats, Vitality/Explorer/Mana Refining, Magic Bolt, Cyclone, Satellite, Spirit, Magic Circle and its buff. Run it
after touching `src/engine/` or the stat/research data, and add a case whenever the player confirms a new value. It
fails (exit 1) if the app stops matching the game.

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

Don't hand-write that mask `style` object per screen: use the shared
**`MaskedSprite`** (`components/shared/`) — the static mask properties live in
the `.masked-sprite` / `.masked-sprite-stretch` classes (`index.css`), and only
the sprite URL and tint (the genuinely dynamic values) go through the
`--mask-src`/`--tint` custom properties. A *static* tint skips `tint` and takes
a `bg-*` class instead. The rough card border (`StripFrame`) and the grid's
gray panel (`GridPanel`) are shared components built on it too, and
`ScreenTitle` takes a named `tone` ("gold") rather than a `style` color.

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

`LoadoutSheet`'s Artifact tiles carry a second, independent cue on top
of the zoom: a bright white border (`border-2 border-white`) when the tile is
one of the artifacts picked for the offer, distinct from the existing rarity/ownership ring
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
