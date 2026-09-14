# Reference (source of truth)

Centralized project knowledge — game data accuracy, design decisions, and
open items — so any agent/session (not just this one) starts from the same
ground truth instead of re-discovering or re-deciding things. Read the
relevant file here before making a judgment call this project has already
made once.

- **`game-data-sources.md`** — where the game data in `src/data/` came from
  (extraction methodology, priority order, wiki pages used), known
  discrepancies that are deliberate (not bugs to "fix"), missing sprites,
  and structural notes on `fusions.ts`'s sentinel conventions. Read this
  before changing any name, number, or id in `src/data/`.
- **`design-system.md`** — color tokens (rarity colors, stat glyph colors),
  the Loadout "Add" flow's category taxonomy, and known functional gaps
  that are deferred (not forgotten, don't unprompted-build or delete their
  supporting code).
- **`Magic Survival Information Spreadsheet [0.935] - Classes.csv`** — the
  "Classes" tab of a community spreadsheet the user provided directly.
  Covers character classes/subjects only, not artifact/magic/fusion names.
  If more tabs (Artifacts, Magic, Passives, Fusions, Research) get
  exported, add them here following the same naming pattern.

For anything not covered by a file here, the fallback source of truth is
the official wiki: https://magic-survival-rpg.fandom.com — see
`game-data-sources.md` for which pages and how to fetch them.

**Also see `../CLAUDE.md`** at the repo root — the language rule (English
everywhere, non-negotiable) and a pointer back here. CLAUDE.md is what
auto-loads for Claude Code specifically; this folder is meant to be
useful to any agent or human regardless of which tool reads it.

## Keeping this current

When a session discovers a new data-accuracy fact, makes a design decision,
or finds a discrepancy worth flagging — add it here rather than letting it
live only in that session's chat history. Prefer editing the relevant
existing file over creating a new one; only add a new file for a genuinely
new topic area (e.g. a future "release-process.md" or "testing.md").
