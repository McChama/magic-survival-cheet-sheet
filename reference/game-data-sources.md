# Game data: sources, methodology, and known issues

How the data in `src/data/` was sourced, in priority order, and what's still
rough. Read this before "fixing" a number or name that looks wrong — check
whether it's a known, deliberate discrepancy first.

## Source priority

1. **Direct game extraction** — the game's own localization files
   (`spa_Dictionary_Class.txt`, `spa_Dictionary_Ability.txt`,
   `spa_Dictionary_MagicCom.txt`, all inside `data.unity3d`), pulled via
   reverse engineering of the IL2CPP binary and asset bundle. This is Spanish
   — every string sourced this way was translated to English before landing
   in `src/data/` (see CLAUDE.md's language rule). Files sourced this way:
   `classes.ts`, `artifacts.ts`, `passives.ts`, `fusions.ts`, `research.ts`.
   No raw dictionary/`data.unity3d` files are checked into this repo or
   present on this machine — if you need to re-extract or verify against
   them, ask the user where that dump lives.
2. **The wiki** — https://magic-survival-rpg.fandom.com — English,
   community-documented, used to (a) translate names/effects extracted in
   Spanish, and (b) cross-check names/recipes that came from an older,
   third-party-sourced dataset (`TomkoSK/magic-survival-builder`) before the
   direct-extraction data replaced most of it.
3. **`reference/*.csv`** — spreadsheet exports the user has provided
   directly. Currently just the "Classes" tab (see `README.md`).
4. Direct translation from Spanish with no external source, only when 1-3
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
target folder every run). The mapping conventions it relies on, confirmed by
eye against known items (e.g. `Ability51Portrait.png` is a literal blood bag
→ Blood Pack; `MagicCom1Portrait.png` is a lightning+meteor icon → Empyrean
Wrath; `AUnit3Motion1.png` has a cyan accent → Astronomer, the 3rd Subject):

- **Artifacts + Passives**: `Ability{sourceId}Portrait.png`, where
  `sourceId` is the number in that entry's trailing `// source id N` comment
  — both `artifacts.ts` and `passives.ts` share this numbering (the game
  treats them as one underlying "Ability" id space). 182/182 artifacts and
  34/34 passives matched on the first attempt — no gaps.
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

- Research nodes without a passive equivalent (13 of 22 — see the header
  comment in `research.ts`) — same 404-but-200 situation, same `onError`
  fallback pattern applied in `ResearchScreen.tsx`.
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

## Class bonuses + Subject details (extracted 2026-09-14, not wired into any screen)

`classes.ts` now exports two things beyond the plain `CLASSES`/`SUBJECTS` name
lists, both sourced from the wiki via the Browser tool (`navigate` +
`get_page_text` — `WebFetch`/`curl` are blocked on this wiki's article pages,
see above) on 2026-09-14. Neither is rendered anywhere yet — this was a
"locate and store the data" task, not a UI task:

- **`SUBJECT_DETAILS`** — filled in for all 25 Subjects, sourced from
  `/wiki/Subject`. `description` is "Starts with {Artifact}: {artifact's own
  effect text}"; `trait` is the permanent stat bonus granted just from buying
  the Subject (independent of whether it's the one selected for a run). This
  slots directly into `SubjectSelectScreen.tsx`'s existing
  `detail?.description` / `detail?.trait` rendering (that UI already existed,
  reading from what was an empty `SUBJECT_DETAILS` — it will start showing
  real text automatically now that the data exists, no component change
  needed).
- **`CLASS_BONUSES`** — filled in for all 24 Classes, sourced from
  `/wiki/Classes`. No component reads this yet (`ClassSelectScreen.tsx` has
  no equivalent detail panel today) — wiring it up is a separate follow-up.
  Each entry is `{ note, bonuses }`: `note` is the Lv1 tooltip text (usually
  "every N levels, damage +X%"), `bonuses` is the ordered bullet list from
  Lv1(or 2) through the permanent max-level bonus. Cross-referenced against
  the older `reference/Magic Survival Information Spreadsheet [0.935] -
  Classes.csv`, which covers the same 24 classes but uses different names for
  some of them (spreadsheet → current name): "Arcane Scholar" → Arcanist,
  "Mystic" → Occultist, "Moderator" → Arbiter, "Arc Mage" → Archmage,
  "Archeologist" (typo) → Archaeologist, "Dark Wizard" → Black Mage, "Battle
  Mage" → Battlemage. The wiki page already uses this project's exact
  `CLASSES` spelling, which is why it was used as the primary source instead
  of the CSV.
  - **Wiki transcription artifact, 3 classes**: Arcanist, Archaeologist, and
    Black Mage's wiki entries each open with a stray "Magic Bolt Lv +1"
    bullet that doesn't match that class's own granted ability (Intelligence,
    Explorer, and Arcane Effuse respectively) or the CSV's version of the
    same class — almost certainly copy-pasted from the Wizard row and never
    corrected on the wiki. Dropped from `CLASS_BONUSES` for these 3 entries
    rather than shipped verbatim; flagged inline in `classes.ts` too. If a
    future re-check of the wiki fixes this, remove the code comments and
    nothing else needs to change.

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
