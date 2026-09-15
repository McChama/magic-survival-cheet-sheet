# Game data: sources, methodology, and known issues

How the data in `src/data/` was sourced, in priority order, and what's still
rough. Read this before "fixing" a number or name that looks wrong — check
whether it's a known, deliberate discrepancy first.

## Game version being analyzed

**Magic Survival v0.993** (`version_code` 604, `version_name` "0.993"),
package `com.vkslrzm.Zombie`, downloaded from APKPure — confirmed via the
`.xapk`'s own `manifest.json` (`Desktop/magic survival/Magic+Survival_0.993_
APKPure.xapk`). This is the single source every extracted asset and data
file in this project traces back to (sprites, audio, `eng_Dictionary_*.txt`/
`spa_Dictionary_*.txt`, the IL2Cpp dump) — everything under `raw-assets/`,
`Desktop/RE_Tools/`, and `Desktop/magic survival/` on this machine is v0.993.
If the game updates and a future session pulls a newer APK, every "confirmed
via direct extraction" claim in this file should be treated as **v0.993-era**
until re-verified — balance numbers, new classes/artifacts, or renamed nodes
could all change between versions, and nothing here auto-detects that drift.

## Source priority

**Rule of thumb, reaffirmed 2026-09-14**: always prefer extracting directly
from the game's own files over the wiki or any third-party/community
resource (spreadsheet, builder site, etc.) when a direct-extraction path
exists. The wiki is a fallback for translation and for whatever hasn't been
extracted yet — not a first choice. This project used to keep a community
CSV spreadsheet (`Magic Survival Information Spreadsheet [0.935] -
Classes.csv`) as a fallback source for Class/Subject data; the user deleted
it once direct extraction covered the same ground more accurately (see
"Class bonuses + Subject details" below for a concrete case where the wiki
was flat-out wrong and the real game dictionary caught it).

1. **Direct game extraction** — the game's own localization files, all
   inside `data.unity3d` (the APK's Unity asset bundle). Two generations of
   this exist:
   - Spanish-language dictionaries (`spa_Dictionary_Class.txt`,
     `spa_Dictionary_Ability.txt`, `spa_Dictionary_MagicCom.txt`), pulled via
     reverse engineering of the IL2CPP binary and asset bundle — every string
     sourced this way was translated to English before landing in
     `src/data/` (see CLAUDE.md's language rule). Used for the original
     `classes.ts`, `artifacts.ts`, `passives.ts`, `fusions.ts`,
     `research.ts` rewrite.
   - **English-language dictionaries** (`eng_Dictionary_*.txt` — `Class`,
     `Ability`, `Name`, `Explain`, `Synergy`, `MagicCom`, plus
     `Dictionary_AllStat.txt`/`Dictionary_UnitStat.txt` for numeric
     level/enemy-stat tables), found already extracted on this machine at
     `Desktop/RE_Tools/text_assets/` — these need no translation at all and
     are the single best source when they cover what you need (see "Class
     bonuses + Subject details" below for how this looks in practice: it's
     one CSV-ish table per axis, with a real parser needed since fields
     contain commas inside quotes).
   - No raw dictionary/`data.unity3d` files are checked into **this repo** —
     they live on the user's machine under `Desktop/RE_Tools/` (parsed
     dictionaries) and `Desktop/magic survival/…/data.unity3d` (the raw
     asset bundle, also what `raw-assets/Sprites/` and
     `raw-assets/Audio/` were extracted from via AssetStudioModCLI — see
     below). If a fresh session doesn't have these paths in context, ask the
     user rather than assuming nothing is available and falling back to the
     wiki.
2. **The wiki** — https://magic-survival-rpg.fandom.com — English,
   community-documented. Useful for (a) translating names/effects extracted
   in Spanish when no `eng_Dictionary_*` equivalent exists, (b) cross-checking
   names/recipes that came from an older, third-party-sourced dataset
   (`TomkoSK/magic-survival-builder`) before direct-extraction data replaced
   most of it, and (c) anything not covered by an extracted dictionary at
   all (e.g. `/wiki/Magic_Combination`'s fusion talent names, until/unless a
   `Dictionary_Synergy`-equivalent for those gets parsed). **Known to
   sometimes just be wrong** — don't treat it as authoritative when a direct
   extraction disagrees with it.
3. Direct translation from Spanish with no external source, only when 1-2
   don't cover an entry — flagged per-item in code comments where this
   happened (e.g. artifacts/passives the wiki doesn't list).

### Useful wiki pages (fetch `?action=raw` on any of these if the rendered
page hides content behind collapsible "Read More" sections — that returns
the full wikitext table markup instead)

- `/wiki/Classes` — the 24 Classes, English names, per-class bonus.
- `/wiki/Subject` — the 25 Subjects (same 24 archetypes + "Jack o' Lantern"),
  starting artifact + passive bonus each.
- `/wiki/Magic` — base magics grouped as Offensive / Utility / Passive /
  Growth Passive / Special Passive — this is the grouping
  `src/data/quickAddOptions.ts`'s planned category chips are meant to mirror.
- `/wiki/Magic_Combination` (redirects from `/wiki/Magic_Fusion`) — all 60
  "normal" fusions with English talent names and effect text, grouped by
  base magic.
- `/wiki/Artifact` — ~175 artifacts across 5 rarity tables.
- Individual pages exist per magic/fusion/artifact (e.g. `/wiki/Shield`,
  `/wiki/Empyrean_Wrath`) — title-case the English name, spaces to
  underscores.

Note: `WebFetch` gets blocked (HTTP 402) on this wiki — use the Browser tool
(`navigate` + `get_page_text` / `read_page`) instead, which works fine.

## Known discrepancies — do not "fix" these without re-checking the source

- **Binary-extracted numbers vs. the current wiki**: several fusions have
  damage/cooldown/size numbers that disagree with what the wiki currently
  shows (e.g. `warClimate` Meteor Damage x6 in our data vs. the wiki's x4;
  `hellfire` Size −100% vs. the wiki's +100%; `destroyer` Cooldown 5s vs. the
  wiki's 7s; `exidium`/`greatFlood` cooldown 50% vs. the wiki's 25%/2X). The
  binary extraction is from a more recent game version than the community
  wiki text in these cases — **the binary-extracted number wins**; only the
  prose around it was translated, numbers were left as extracted.
- **`necronomicon`** (`src/data/artifacts.ts`) — its source Spanish text
  repeats "PS máx." twice in a way that reads like an extraction bug (real
  mechanic is likely "current HP capped at 50% of max HP", not what the
  literal text says). Translated literally rather than silently
  "corrected" — needs a human look at the original source data, not a
  guessed fix.
- **`meisnerEffect`** (`src/data/fusions.ts`) — the fusion `id` keeps this
  spelling (must match the sprite filename `meisnerEffect.png`), but the
  displayed name is corrected to "Meissner Effect" via `NAME_OVERRIDES` in
  the same file — don't rename the `id`.

## Sprites: real APK extraction (superseded the wiki-sourced set)

**Which one do I import in code — `public/` or `raw-assets/`? Always
`public/assets/...`, via a helper from `src/config/assets.ts`
(`artifactImage()`, `uiImage()`, etc.).** `raw-assets/` is source material
only — unorganized, cryptically-named (`Ability209Portrait.png`, not
`freeshooter.png`), gitignored, and not guaranteed to even be present on
disk (see "Danger" below). No component should ever reference a
`raw-assets/` path. If the asset you need isn't under `public/assets/` yet,
it needs organizing first (see `scripts/organize-assets.mjs` below) — the
organized copy in `public/` is what you then import, not the raw source you
organized it from.

As of 2026-09-14 the user provided a real sprite dump extracted from the game
APK itself (not the wiki) — a much better source than hand-fetching individual
wiki file pages. It lives at `raw-assets/Sprites/` and `raw-assets/Texturas_Crudas/`
(the latter is the same set at higher resolution/uncompressed; `Sprites/` is
what's actually used — both are **outside** `public/` on purpose, since
everything under `public/` ships as-is in the built site and the dump is
~300MB of mostly-unused animation frames/effects/UI chrome).

`scripts/organize-assets.mjs` maps the dump onto the id-based folders
`src/config/assets.ts` expects. Re-run it (`node scripts/organize-assets.mjs`
from the repo root) any time `artifacts.ts`/`passives.ts`/`fusions.ts`/
`classes.ts` gain new entries — it's idempotent (wipes and rebuilds each
target folder every run) **as long as `raw-assets/Sprites/` actually has the
full dump**.

**Danger**: `raw-assets/` is gitignored (see its `.gitignore` entry, "Raw
extraction source material"), so it is **not guaranteed to be present** on
this machine's working copy at any given time — it was in fact fully deleted
once (2026-09-14) and had to be restored from `Desktop/MagicSurvival_Assets/`
(`Sprites/` + `Texturas_Crudas/`, same content the original dump had, just a
different folder — copy both back into `raw-assets/` if it's ever missing
again) plus `raw-assets/Audio/Sound_UI{1-7}.wav` restored from the
already-organized copies at `public/assets/audio/ui/` (no need to re-export
those from `data.unity3d` — they already exist post-organization). **Check
`raw-assets/Sprites/` actually has the full dump (thousands of files, not
just one or two) before running `organize-assets.mjs` at all** — it
unconditionally wipes every target folder under `public/assets/` before
recopying, so running it against a `raw-assets/Sprites/` that's missing most
files (e.g. only has one or two icons someone just dropped in for a single
new asset) will silently delete everything else that's currently organized
and already committed to the repo, with no way to recover it locally short
of a fresh APK/AssetStudio extraction or `git checkout` on files that happen
to still be tracked. When you only need to add one or two specific files (as
opposed to a full re-sync after new `src/data/` entries), it's safer to copy
them straight into the right `public/assets/...` subfolder by hand —
matching exactly what the script would produce — and add the filename to the
script's relevant list for documentation/future-reproducibility, without
actually executing the script.

**Required follow-up every time `organize-assets.mjs` actually runs**
(learned the hard way restoring from the 2026-09-14 deletion — skipping
either step reintroduces a real regression, not just a cosmetic diff):

1. **Run `node scripts/optimize-images.mjs` immediately after.**
   `organize-assets.mjs` copies straight from the raw dump at full
   extraction resolution (some 500px+); `optimize-images.mjs` is what
   actually downscales `magicImages/artifactImages/passiveImages/
   classImages/baseMagicImages` to the ~90px-or-less the app ever renders
   them at (see that script's own header comment) and is what's actually
   committed. Forgetting this step reverts every one of those ~300 files
   from a few-KB optimized PNG back to its original, silently bloating
   `public/assets/` by ~30x (confirmed: 306 files, ~28MB of bloat, on the
   2026-09-14 restore) until someone notices and re-runs it.
2. **`git checkout -- public/assets/subjectAnim/archaeologist/7.png`
   afterward, every time.** `organize-assets.mjs`'s subject-animation-frame
   loop always overwrites this file with the raw dump's original frame 7 —
   it has no way to know that frame was manually replaced (see the
   `optimize-images.mjs` header comment: "subjectAnim/archaeologist has a
   manually-replaced frame — never regenerate that directory", and the
   `SubjectSelectScreen.tsx` idle-animation history above). This isn't a
   one-time fix; it will keep happening on every future `organize-assets.mjs`
   run until the script itself is taught to skip that one file.
3. Only after both of those, check `git status` — a clean diff (nothing but
   the actually-new/changed entries you meant to add) confirms the restore
   didn't regress anything else.

The mapping conventions it relies on, confirmed by
eye against known items (e.g. `Ability51Portrait.png` is a literal blood bag
→ Blood Pack; `MagicCom1Portrait.png` is a lightning+meteor icon → Empyrean
Wrath; `AUnit3Motion1.png` has a cyan accent → Astronomer, the 3rd Subject):

- **Artifacts + Passives + Research**: `Ability{sourceId}Portrait.png`, where
  `sourceId` is the number in that entry's trailing `// source id N` comment
  — `artifacts.ts`, `passives.ts`, and `research.ts` all share this
  numbering (the game treats them as one underlying "Ability" id space, with
  research nodes occupying ids 261-282 — see "Research node icons" below for
  how that range was found and why it wasn't obvious). 182/182 artifacts,
  34/34 passives, and 22/22 research nodes matched — no gaps in any of them.
- **Fusions**: `MagicCom{position}Portrait.png`, where `position` is
  1-indexed position in `fusions.ts`'s `RAW` array (confirmed: `RAW`'s order
  *is* the real source id order — the header comment's own claim that
  Glacium/Soul Blade/Discharge are ids 61/62/63 matches their being the last
  3 entries in `RAW`). 63/63 matched, closing the exidium/deusExMachina/
  glacium/soulBlade/discharge gaps that the wiki-sourced set never had.
  `SPRITE_EXT_OVERRIDES`/`.webp` workarounds in `magics.ts` are gone — every
  fusion is a real `.png` now.
- **Fusion Ultimates**: `Ultimate{position}Portrait.png`, same position
  convention, exists only for the 28 fusions that actually have an
  `ultimate` (confirmed by an exact 28/28 match against
  `RAW.filter(r => r.ultimateName)`) — copied to
  `public/assets/magicUltimateImages/{appId}.png` but **not wired into any
  component yet** (no UI shows a fusion's Ultimate icon today).
- **Classes**: `Class{position}Portrait.png`, 1-indexed position in
  `CLASSES` (`classes.ts`) → `public/assets/classImages/{slug}.png`, wired
  into `ClassSelectScreen.tsx`. 24/24 matched.
- **Subjects (static)**: no `SubjectNPortrait` naming exists — the real
  source is `AUnit{position}Motion1.png` (frame 1 of that Subject's in-run
  character sprite sheet), 1-indexed position in `SUBJECTS` (`classes.ts`) →
  `public/assets/subjectImages/{slug}.png`. 25/25 matched.
- **Subjects (animated)** — tried and reverted: every Subject has 21 motion
  frames (`AUnit{position}Motion{1..21}.png`), copied to
  `public/assets/subjectAnim/{slug}/{frame}.png` (still there, just unused).
  Cycling through them looked like sway at first glance, but each frame is
  individually cropped tight to its own non-transparent pixels with no shared
  pivot/offset — the character visibly jumps in size/position frame to frame.
  `SubjectSelectScreen.tsx` now shows a single static portrait
  (`subjectImage()`, frame 1) instead. Don't re-enable the animation without
  fixing the pivot problem first (e.g. re-cropping every frame to a shared
  canvas size/anchor before shipping it as a loop).
- **Base magics** (`BASE_MAGICS` in `magics.ts`, the "Offensive"/"Utility"/
  "Passive" chips' Offensive+Utility rows) — no id convention exists for
  these; matched entirely by eye, one at a time, against the wiki's own icon
  per magic (fetched from the wiki's static CDN, e.g.
  `static.wikia.nocookie.net/.../Magic_Survival_Magic-Fireball.png` — this
  CDN, unlike the wiki's article pages, is not blocked by `curl`/`WebFetch`).
  The real icons turned out to be `Ability0Portrait.png` through
  `Ability21Portrait.png` (22 ids, a separate low-numbered range from
  artifacts/passives' `Ability{sourceId}` which starts at 30+) →
  `public/assets/baseMagicImages/{magicId}.png`, wired via
  `baseMagicSpriteUrl()` in `magics.ts`. 19 of 22 are a confident match; 3
  (`meteor`, `arcaneRay`, `intelligence`) are a best-effort guess with no
  strong visual signal — see the doc comment on `baseMagicSpriteUrl` for
  which candidate was picked and why, and verify these 3 in-game if it
  matters. `RunDashboardScreen.tsx`'s Loadout previously used
  `magicSpriteUrl()` (the *fusion* sprite folder) for acquired base magics by
  mistake — fixed to `baseMagicSpriteUrl()`.
- **Slugging**: both Classes and Subjects slug their name the same way
  (`name.toLowerCase().replace(/[^a-z0-9]+/g, "")`, e.g. "Black Mage" →
  "blackmage") — duplicated in `organize-assets.mjs` and in
  `ClassSelectScreen.tsx`/`SubjectSelectScreen.tsx`; keep all three in sync
  if the slugging rule ever changes.
- **Generic UI chrome** (`public/assets/uiImages/`) — dividers, icons, title-
  screen art, and unit shadow/background sprites the user identified by exact
  filename in the raw dump (no id convention like the sections above, so
  these are a hardcoded list in `organize-assets.mjs`, not auto-discovered):
  - `uiImages/icons/` — `UI_Icon002/003/007-011` (007-011 each have a
    `_Gold` variant too) plus `UI_Exit`/`UI_Exit_Black`.
  - `uiImages/dividers/` — `UI_Line01`.
  - `uiImages/title/` — `TitleImgFront1/2/3`, `TitleText`.
  - `uiImages/unit/` — `UnitSkinBackGround`, `UnitAllyShadow01`,
    `UnitEnemyShadow01`.
  - `uiImages/statusIcons/{statKey}.png` — the 17 `StatusIcon_*` files,
    **renamed to match `StatKey` exactly** (e.g. `StatusIcon_HitDmg` →
    `damageTaken.png`, `StatusIcon_HpMax` → `hp.png`) since there's a
    confirmed, confident 1:1 mapping against all 17 `StatKey` entries in
    `types/game.ts`. **Wired in** as of 2026-09-14: `STAT_GLYPH` in
    `statGlyphs.ts` now carries an `icon: uiImage(\`statusIcons/${key}.png\`)`
    per stat, rendered in `StatGridRow.tsx` with the original unicode glyph
    kept as an `onError` fallback (not dead code — a real fallback path).
  - Referenced via the generic `uiImage(relativePath)` helper in
    `config/assets.ts` (e.g. `uiImage("icons/UI_Icon002.png")`) — unlike the
    other asset kinds, this one isn't id-keyed to a `src/data/` list, so a
    single flat helper covers all 5 subfolders instead of one helper per
    folder.

### Still no sprite

- (Nothing in `research.ts` anymore — see below. This used to list 10-13
  research nodes as unsolvable; they weren't, the search just used the
  wrong convention.)
- A handful of artifacts/passives whose `id` didn't have a resolvable
  `// source id N` at all (rare — the vast majority matched); check
  `scripts/organize-assets.mjs`'s console output ("Missing artifact
  sprites:"/"Missing passive sprites:") next time it's run for the current
  list, since new entries could change it.

### Rarity data bug (fixed 2026-09-14)

The binary-extraction rewrite of `artifacts.ts` had **Special and Legendary
rarities swapped for most (not all) items** — e.g. Gaia/Joker/Titan's
Power/Akashic Records were stored as `special` when the wiki (and the game)
has them as `legendary`, while Philosopher's Stone/Necronomicon/Amplifier
were stored as `legendary` when they're `special`. A handful of Epic items
were also wrong (Storybook belongs in Common, Wraith and Wizard's Hat in
Rare, Brand in Special). Fixed by cross-referencing every artifact's name
against the wiki's 5 rarity tables (`scripts/check-rarity.mjs` +
`scripts/wiki-rarity.json`, kept for reference/re-verification) — 63 of 182
entries had their `rarity` corrected. 9 artifacts aren't on the wiki at all
(`fairy`, `imp`, `occultism`, `owl`, `coin`, `unicorn`, `skadi`, `starlight`,
`goblin` — presumably newer than the wiki's current version) and were left
at their extracted rarity, unverified. **If you add more artifacts from a
future extraction, re-run `check-rarity.mjs` rather than trusting the raw
extracted rarity value blindly** — whatever caused this swap could still be
present in unextracted data.

**Caveat, confirmed 2026-09-14**: the wiki itself is not fully authoritative
either — `cube` (source id 122) was confirmed by the user to be `legendary`
in the actual current game, but the wiki's Special Artifacts table lists it,
so `check-rarity.mjs`'s fix left it wrong (fixed by hand afterward, see the
`cube` line in `artifacts.ts`). Treat `wiki-rarity.json` as a strong prior,
not ground truth — if the user flags another item as wrong, trust them over
the wiki and fix it directly rather than re-running the script blindly. A
better long-term source would be the game's own current in-app Book/Artifact
screen (a set of screenshots) or a more actively-maintained wiki (the
Korean-language `en.namu.wiki` "매직서바이벌" page hasn't been checked yet —
worth trying if more mismatches turn up).

## Class bonuses + Subject details (extracted 2026-09-14)

`classes.ts` exports two things beyond the plain `CLASSES`/`SUBJECTS` name
lists: `SUBJECT_DETAILS` and `CLASS_BONUSES`. Both are wired into their
screens now: `SUBJECT_DETAILS` renders in `SubjectSelectScreen.tsx` (that UI
slot existed empty before this data landed), and `CLASS_BONUSES` renders in
`ClassSelectScreen.tsx`'s 1-4 level picker via `getAllClassLevelBonuses` —
pick a Class, tap level 1-4, see that level's bonuses accumulate. The app
models exactly **4 levels per class** — confirmed both by the dictionary
(exactly 4 populated bonus lines + 4 matching numeric effect-id pairs per
class row, no 5th) and by the level picker UI already built around
`CLASS_LEVELS = [1, 2, 3, 4]`.

### Second pass, 2026-09-15: the tooltip line was extracted but never rendered, and colors were guessed

The user compared the app against a real in-game screenshot (Wizard) and
found two problems, both now fixed:

1. **The Lv1 `tooltip` line (dictionary column L1) was extracted into
   `CLASS_BONUSES` from day one but no component ever read it** —
   `ClassSelectScreen.tsx` only ever rendered `levels` (L2-L5). The real
   Class select screen shows this line *above* the 4-level list (e.g.
   Wizard: "Magic Bolt Lv +1 / Every time the character gains 5 levels,
   Magic Bolt Damage 3% is added"). Now rendered via `getClassTooltip()`.
2. **Per-line colors were a guessed shared pattern**
   (`DEFAULT_LEVEL_CLASSNAMES`: celeste/white/celeste/blue for every class,
   with a couple of classes hand-overridden) instead of each line's *real*
   color. Re-parsing `eng_Dictionary_Class.txt`'s `<color=#RRGGBB>` tags
   (one per description line, previously discarded — only the text was kept)
   showed the guessed pattern is wrong in ways that aren't just cosmetic:
   Arcanist's Lv3 line is genuinely green (`#64FF32`) and Lv4 is pink
   (`#FF76DE`), not the "standard" blue every other class's Lv2-3 use. There
   is no shared pattern — `ClassBonusLine` now carries its own real `color`
   per line (`{ text, color }`, both for `tooltip` and each of `levels`),
   and `DEFAULT_LEVEL_CLASSNAMES`/`levelClassNames` are gone.

**Bracket-level inline colors**: the tooltip line itself further colors
individual bracketed spans *within* the line (e.g. in "〔Magic Bolt Lv
+1〕 @ Every time the character gains [5] levels, Magic Bolt Damage 〈3%〉
is 『added』" — 〔〕 renders cyan, `[5]` pale yellow, 〈3%〉 green, `『added』`
pink), which the dictionary's single per-line color code can't express (it's
applied by the game's rich-text renderer per bracket type, not stored as
inline color tags in this dictionary). The user's worked Wizard example
confirmed 4 of the 7 bracket types used across `CLASS_BONUSES`/`research.ts`
text; the other 3 (`{}`, `【】`, `《》`) have no confirmed color and are
rendered in the line's own base color rather than guessed. This is
implemented in `src/components/shared/GameText.tsx` — **don't hand-color a
new bracket type there without a real screenshot to check against**, per
that file's own header comment. This same component now also renders
`research.ts`'s node descriptions (see below), and is the right place to
reach for if any other screen ever needs to show real dictionary text with
its markup.

**`research.ts`/`ResearchScreen.tsx` had a related, actually bigger problem**:
the displayed sentence wasn't a slightly-off version of the real text, it was
**entirely app-generated** — `describeNode()` built a synthetic "Increase
{stat} by {step}%" sentence from `STAT_DEFINITIONS`, and simply showed
"No pause-menu stat" for any of the 9 nodes with `statKey: null` (Recycle,
Analysis, Blessing, Awakening, Growth, Support ×2, Luck, Loot, Bargain,
Starting Funds — real sentences exist for every one of these, just not a
`StatKey` this app separately tracks). Fixed by extracting the real
per-node template + color from `eng_Dictionary_Ability.txt` (type "연구",
ids 261-282 — 22 rows, exact 1:1 match with `RESEARCH`'s 22 entries) into
new `descriptionTemplate`/`descriptionColor` fields, with a `□`-run in the
template marking where `describeResearchNode(node, level)` substitutes the
real current-level value (see that function's doc comment — Vitality is the
one node with two `□` runs for two independently-scaling effects, handled
via a new `secondaryValuesByLevel` field). This pass also renamed one node:
the dictionary calls it **Bargain**, not "Haggle" (`id: "haggle"` kept
stable, only `name` changed — same non-renaming-ids convention used
elsewhere, e.g. `meisnerEffect`).

**How you actually reach those 4 levels, per the game's own UI strings**
(`eng_Dictionary_Name.txt`'s "상점"/Shop column, rows 9/11/17/18): you buy
"Research Material" in the Shop (singly or ×10, for Gold/Gems — a *different*
currency from this app's own `research.ts` "Research Points" system, despite
the similar name) and each purchase triggers a **random draw across all your
not-yet-maxed classes** — "Research Material Draws will randomly select
Classes from the remaining stacks. Each draw will remove the corresponding
amount of stacks." So you don't choose which class levels up on a given
purchase; leveling one specific class to Lv4 is a matter of probability, not
a direct per-class purchase button. The wiki's cost breakdown (3/6/12/24
Research Material "stacks" per level, 45 total per class, 1080 for all 24)
lines up with this "stacks" language but hasn't been independently confirmed
from a direct source — the exact stack-count-per-level constants live in
compiled game code (not a text dictionary or any asset we've dumped), so
confirming the literal numbers would need decompiling the leveling method's
body in Ghidra, not just reading dictionaries. Treat 3/6/12/24 as
wiki-sourced and plausible, not confirmed the way the bonus text itself is.

**First pass (superseded same day)** used the wiki
(`/wiki/Classes`, `/wiki/Subject`, fetched via the Browser tool since
`WebFetch`/`curl` are blocked on this wiki's article pages) and produced
full-sentence descriptions. The user pointed out the real in-game text is
much shorter (e.g. just an artifact name, not a paraphrased sentence) — that
sent this back to the actual game data instead of the wiki.

**Current source**: `eng_Dictionary_Class.txt` inside `data.unity3d`,
extracted at `Desktop/RE_Tools/text_assets/eng_Dictionary_Class.txt` (not
checked into this repo, same machine-local raw dump referenced elsewhere in
this file). One CSV-ish table holds **both** axes: ids 1-24 are Classes
(학파/"school"), ids 41-65 are Subjects (실험체/"Experimental Subject") — same
file, same column layout, matching this project's existing "Class and
Subject share one source dictionary" note at the top of `classes.ts`. Parsed
with a proper CSV parser (a one-off scratch script, not checked in — the
Korean header row's commas-inside-quotes broke a naive `split(",")`), since
hand-transcribing 24+25 rows off raw terminal output risks the exact kind of
paraphrasing error this replaced.

- **`SUBJECT_DETAILS`** — `description` is column L1 for every Subject except
  Wizard (bare Artifact name, e.g. "Core Energy", "Moon Crystal" — matches
  `artifacts.ts` name exactly, cross-checked via each row's numeric
  "특수값01"/special-value-01 field against that file's `// source id N`
  comments, 24/24 exact matches); `trait` is column L2, the game's own
  one-line permanent bonus text verbatim (e.g. "Increase Satellite Damage by
  5% (All Classes)"), not a shortened paraphrase. This **corrected two wrong
  artifact names** the wiki's Subject page had: Scholar actually grants
  **Starlight** (source id 221), not "Philosopher's Stone"; Archaeologist
  actually grants **Pyramid** (source id 167), not "Mimic" — both
  "Philosopher's Stone" and "Mimic" are real, different artifacts already in
  `artifacts.ts`, just not the ones these two Subjects give. Also fixed:
  "Otherworldly Tentacles" (plural, matches `artifacts.ts`) vs. the
  dictionary's singular typo; curly vs. straight apostrophes normalized to
  match `artifacts.ts`'s existing spelling for the same artifacts.
  - **Wizard is the one unconfirmed entry**: its dictionary row has only 1
    description line (the trait bonus) and a special-value-01 of `0` — no
    numeric artifact reference at all, unlike all 24 other Subject rows.
    `description: "Freeshooter"` is kept on the strength of the wiki + the
    real "Freeshooter" artifact existing in `artifacts.ts` (source id 209,
    thematically consistent with Wizard's Magic Bolt theme), but it's the one
    name in this table not confirmed by the row's own data the way the other
    24 were.
  - This slots directly into `SubjectSelectScreen.tsx`'s pre-existing
    `detail?.description` / `detail?.trait` rendering — no component change
    needed, it just started showing real (and now shorter, in-game-accurate)
    text.
- **`CLASS_BONUSES`** — `tooltip` is column L1 (the Lv1 flavor/scaling line,
  keeping the game's own 〔〕〈〉『』{}[]【】@ marker formatting verbatim, same
  convention `artifacts.ts`/`passives.ts` already use per CLAUDE.md's
  language rule — `@` marks an in-game line break within one field);
  `levels` is columns L2-L5, the actual Lv1-Lv4 bonuses, L4 always ending in
  "(All Classes)". This replaced the wiki-sourced first pass with the same
  actual dictionary text, and disproved something the first pass had flagged
  as a likely wiki error: Arcanist, Archaeologist, and Black Mage's `tooltip`
  really does say "Magic Bolt Lv +1" in the dictionary even though their own
  `levels[0]` grants something else (Intelligence/Explorer/Arcane Effuse
  respectively) — it's real in-game text, not a wiki transcription artifact,
  most likely unedited leftover design-doc flavor text. Lesson for future
  sessions: when the wiki and the real extracted dictionary would ever
  disagree, prefer the dictionary — it's already source-priority #1 above,
  but this was a case of not going back to check it before assuming the wiki
  was simply wrong.
  - Also cross-referenced, before it was removed from the repo, against the
    community spreadsheet that used to live at `reference/Magic Survival
    Information Spreadsheet [0.935] - Classes.csv` (deleted 2026-09-14 — see
    `README.md`), which covered the same 24 classes but used different names
    for some of them (spreadsheet → current name, kept here in case a name
    mismatch like this ever needs explaining again): "Arcane Scholar" →
    Arcanist, "Mystic" → Occultist, "Moderator" → Arbiter, "Arc Mage" →
    Archmage, "Archeologist" (typo) → Archaeologist, "Dark Wizard" → Black
    Mage, "Battle Mage" → Battlemage.

### Class level progression: how many levels, and what unlocks at Level 1? (resolved 2026-09-15)

The user noticed `ClassSelectScreen.tsx` showed 3 colored/"unlocked-looking" lines at
Class Level 1 for Wizard and asked whether there are really more than 4 levels.
Three rounds of investigation, the last one conclusive:

1. **Ruled out a 5th level.** Re-derived the raw numeric "효과ID + value" effect
   pairs per class row in `eng_Dictionary_Class.txt` (not just the text) —
   for every class, exactly 4 distinct mechanical bonuses exist (a class's
   own magic/ability +1, then 3 more), never 5, regardless of how many `@`
   lines its `tooltip` has (a verbose tooltip like Bishop's just means Lv1
   bundles multiple *simultaneous* effects into one description, not that
   there's an extra tier). Cross-checked against the actual compiled game's
   UI field names (`A_MainMenuInformation` in the IL2Cpp dump:
   `Text_ClassEffectA` — one field, the tooltip — plus `Text_ClassEffectB01`
   through `Text_ClassEffectB04` — exactly 4 fields for the 4 bonuses).
   **4 real bonus slots is solid, confirmed two independent ways.**
2. **Could not confirm how many of the 4 are active at the lowest level.**
   Tried decompiling the actual threshold logic (`Create_Class_Inf`, RVA
   0x8DF8B8 in `libil2cpp.so`) in the Ghidra project at
   `Desktop/RE_Tools/ghidra_project/` via `analyzeHeadless` with a one-off
   Java `GhidraScript` (not checked in — used `DecompInterface` to decompile
   by address). Hit two walls: (a) the existing analysis has function
   boundaries wrong at that address — Ghidra merged ~40KB of
   `A_MainMenuInformation`'s methods into one giant function, so decompiling
   "at" the target RVA actually produced unrelated code (looked like an
   area/research progress-bar loop, not class bonuses); (b) forcibly creating
   a function there and decompiling it anyway produced real ARM code but
   with zero symbol/type recovery (raw `*(int*)(iVar3 + 0x5c)` pointer
   arithmetic) — this project never had Il2CppDumper's `script.json` type
   database loaded into Ghidra, which is what normally turns that into
   readable field names. Fixing either of these (correct function splitting,
   full IL2Cpp type import) is a real re-setup task, not a quick follow-up.

3. **Resolved via the wiki's own explanatory text** (not just its bullet
   lists, which is all earlier passes had used) —
   https://magic-survival-rpg.fandom.com/wiki/Classes's intro paragraph:
   "Each class requires 45 Research Material to unlock (**3 for Lv2, 6 for
   Lv3, 12 for Lv4, 24 for Lv5**)... Once acquired, the **Lv5** bonus is
   permanent, regardless of the current class." This settles both open
   questions at once: there are **5 selectable Class Levels (1-5)**, not 4;
   Level 1 is the free baseline every class starts at (0 gold/material cost,
   "you begin the game with all 24 classes unlocked") with **none** of the 4
   extracted bonuses active yet; and Levels 2-5 are the 4 paid tiers,
   matching `CLASS_BONUSES[class].levels[0..3]` 1:1 (`levels[3]`, the
   permanent "(All Classes)" one, is confirmed as the Lv5 bonus the wiki
   describes). The earlier "bonus 1 is free" reading (from the user's
   recollection, previous revision of this section) was superseded by this —
   Level 1 genuinely grants nothing.

**Current implementation**: `RunMeta.classLevels` (`types/game.ts`) is a
`Record<string, number>` keyed by class name, each value 1-5 — **per-class**,
not one run-wide number, since a class's Lv5 bonus is explicitly "(All
Classes)" and needs to keep contributing even while a different class is
equipped (see that field's doc comment for the two-pass stats-engine
implication this has). `getClassLevel(classLevels, className)` reads one
class's level with the Level-1 default applied. `ClassSelectScreen.tsx`'s
`CLASS_LEVEL_COUNT = 5`; for whichever class is currently being viewed, a
`levels[i]` bonus is unlocked once that class's own level `>= i + 2`, i.e.
`locked = i >= level - 1`. `getClassLevelBonus`/`getAllClassLevelBonuses`
(`classes.ts`) still index `levels` 1-4 internally (called `bonusTier` in the
signature, explicitly documented as *not* the same range as a class's own
1-5 level) — only `getClassLevel` and `ClassSelectScreen` know about the 1-5
Class Level range and the `-1` offset between the two. (This was originally
implemented, 2026-09-15, as a single `characterClassLevel: number` shared by
whichever class happened to be selected — replaced the same day once it was
pointed out that switching classes shouldn't reset or share another class's
progress, and that Lv5's global "(All Classes)" bonus means every class's
level matters simultaneously, not just the currently-equipped one's.) The
earlier Ghidra decompile attempt (RVA 0x8DF8B8,
`Create_Class_Inf`) never got a readable answer — hit merged function
boundaries and no IL2Cpp type recovery in that Ghidra project — but turned
out to be unnecessary once the wiki's own prose (as opposed to just its
per-class bullet tables) was actually read carefully; the RE path documented
above is kept here as a note on that project's Ghidra setup limitations,
should a future session need real decompiled output for something else.

## Research node icons: found 2026-09-16, closing a gap declared unsolvable twice

`research.ts` used to say, twice (once 2026-09-15 when `descriptionTemplate`/
`descriptionColor` were added, once again after a follow-up pass reused
passive/stat icons for 12 of the 22 nodes), that no research-tree icon sheet
exists in the dump — both times based on a **name search**: grepping
`raw-assets/Sprites/` for "recycle", "luck", "blessing", etc. and finding
nothing but generic screen chrome (`ResearchUI.png`,
`UI_PortraitResearch.png`). That search was reasonable but wrong to stop at —
it never tried the **numeric id convention** every other id-driven asset
category in this project already uses (`Ability{sourceId}Portrait.png`, see
the Artifacts/Passives bullet above), because research nodes don't get a
`// source id N` comment the way artifacts/passives do, so nothing prompted
checking it. The user pushed back ("hay que hacer una exploración más a
fondo") rather than accepting the gap as final, which is what led to
actually trying it.

`eng_Dictionary_Ability.txt`'s "연구" (research) rows are ids **261-282** —
immediately following the base magics (0-21) and interleaved among
artifacts/passives (30+) in the same master "Ability" table, per this
project's existing understanding of that dictionary (see
`descriptionTemplate`'s sourcing note above and `classes.ts`'s methodology).
Checking `Ability261Portrait.png` through `Ability282Portrait.png` in
`raw-assets/Sprites/` found **all 22, real content, none placeholder-sized**.
Before wiring them in, every one was rendered on a dark background (same
technique as the base-magic/UI-chrome visual verification elsewhere in this
file) and eyeballed against its node name — the overwhelming majority are
unambiguous, exact thematic matches (Snipe→crosshair, Resistance→shield,
Regeneration→medical cross, Recycle→the literal recycling symbol,
Explorer→magnifying glass, Concentration→concentric rings, Analysis→scrolls,
Awakening→a starburst explosion, Growth→a growing tree, Luck→dice,
Bargain→a balance scale), which is what makes trusting the id range safe
rather than a coincidental "22 images happen to exist" fluke.

Wired in exactly like artifacts/passives: `// source id N` comments added to
every `RESEARCH` entry in `research.ts`, `scripts/organize-assets.mjs`
extended with a "Research" section reusing `extractIdSourcePairs` (matches
the existing pattern exactly, not a new mechanism), `researchImages` added
to `optimize-images.mjs`'s `TARGETS`. Replaced both earlier fallbacks (passive
icon reuse for 8 nodes, pause-menu stat icon reuse for 4 more) — the node's
own real icon supersedes both now, though neither fallback was *wrong*,
just superseded by something more accurate.

**Caught along the way**: `research.ts` had `researchImage("startingfunds.png")`
(lowercase `f`) while `organize-assets.mjs` generates the file from the id
`"startingFunds"` verbatim (capital `F`) — a pre-existing typo that never
surfaced before because the whole folder 404'd regardless. Fixed to match.

**Lesson for future "no sprite exists" claims in this project**: a name-based
grep failing is not proof nothing exists — check whether the category has (or
could plausibly share) a numeric id space in the dictionary first, the way
artifacts/passives/base-magics/fusions/classes/subjects all already do,
before concluding a sprite sheet doesn't exist. `research.ts` is the second
category (after base magics) where the real id range wasn't obvious from the
dictionary's own column layout and had to be inferred from adjacency/context.

## Button-click sound effect (extracted 2026-09-14, not wired into any button)

The user asked for the real in-game button-click sound. Extraction path (all
tools already present on this machine under `Desktop/`, not part of this
repo):

1. `Desktop/RE_Tools` — an existing IL2Cpp reverse-engineering setup for this
   game (Il2CppDumper output, Ghidra project, decompiled snippets). Its
   `Il2CppDumper/output/dump.cs` (full class/method signature dump) has a
   generic `ButtonClickEffect(Transform Transform_Button)` method present on
   several unrelated classes (`A_MainMenuInformation`, `C_Battle_AllyUnit`,
   `C_Battle_Manager`, `C_Battle_Option`) — confirming one shared, app-wide
   click-sound coroutine rather than a per-button clip. Method bodies are
   stripped (IL2Cpp), but `Il2CppDumper/output/stringliteral.json` has the
   resource path prefix it loads from: `"SoundData/Sound_UI"` (alongside
   `SoundData/Sound_BGM`, `Sound_Blood`, `Sound_BulletFire`, `Sound_BulletHit`,
   `Sound_Death`, `Sound_Etc`, `Sound_Explosion` for other SFX categories).
2. `Desktop/AssetStudio` (AssetStudioModCLI) exported all `AudioClip` assets
   from `data.unity3d` (the APK's Unity asset bundle, same one the sprite dump
   in `raw-assets/` came from) as `.wav`. There are exactly **7** variants
   under that `SoundData/Sound_UI` prefix (`Sound_UI1.wav` … `Sound_UI7.wav`,
   1-4s each, 44.1kHz) — strongly suggesting the game picks one at random per
   click rather than always playing the same clip, which is why there isn't
   one single "the" click sound to ship.
3. All 7 are checked in: raw export at `raw-assets/Audio/Sound_UI{1-7}.wav`
   (mirrors the `raw-assets/Sprites/` convention — outside `public/`), copied
   by `scripts/organize-assets.mjs` into `public/assets/audio/ui/` (this is a
   small, curated set — ~1.4MB total — so unlike the sprite dump it's fine to
   ship as-is). `uiClickSound(variant)` in `src/config/assets.ts` is the path
   helper, mirroring `uiImage()`. Not used anywhere yet — wiring a random
   variant into button `onClick` handlers is a separate follow-up.

## Structural notes worth knowing before touching `src/data/fusions.ts`

- `requiredMagicIds: [string, string]` is overloaded with two sentinel
  conventions beyond plain base-magic ids — see `fusionRef()` / `fusionRefId()`
  / `ANY_PASSIVE_ID` in `fusions.ts`:
  - `fusionRef("overmind")` → "this fusion requires the Overmind fusion to
    already be a target" (used by `deusExMachina`, a 3rd-tier
    fusion-of-a-fusion the community wiki doesn't model at all).
  - `ANY_PASSIVE_ID` → "any passive spell", used when a fusion's second
    requirement is a category rather than one specific pickup.
  - Two fusions (`photonExplosion`, `teleport`) have a *passive's* id
    (`arcaneeffuse-passive`, `concentration-passive`) as their second
    "magic" ingredient, not a base-magic id — the original third-party data
    had these wrong (paired with the wrong base magic entirely).
- 14 pairs of base magics are each shared by 2-3 *different* real fusions
  (e.g. thunderstorm+meteor is both Empyrean Wrath and Astrape) — they
  differ only by which of the base magic's ~3 talent branches you picked at
  level-up. `requiredTalents` on `FusionDefinition` carries this; it's
  descriptive only (shown as guidance), not enforced — the app doesn't track
  which talent branch the player actually picked.
- The `id`/sprite path for every fusion the app already had is unchanged
  from before the binary-extraction rewrite (still the original English
  camelCase id) specifically so `public/assets/magicImages/*.png` keeps
  resolving without touching that folder.
