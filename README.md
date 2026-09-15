# Magic Survival Run Companion

A React + TypeScript companion app for tracking runs of the game **Magic
Survival**: pick a class/subject, build a loadout of magics, artifacts,
passives and fusions, log research, and track stats over the course of a run.

All in-app text — UI chrome and game data alike — is in English. See
[CLAUDE.md](CLAUDE.md) for the full language rule and translation workflow.

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) for dev server and build
- [Zustand](https://github.com/pmndrs/zustand) for state
- [Tailwind CSS](https://tailwindcss.com) for styling
- [i18next](https://www.i18next.com) / react-i18next for text (`src/i18n/`)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (defaults to `http://localhost:5173`).

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run Oxlint
- `npm run i18n:dump` — regenerate `src/i18n/locales/en/gameData.json` from `src/data/*.ts`
- `npm run i18n:check-sync` — fail if `gameData.json` is stale relative to `src/data/*.ts` (used in CI to catch new/changed translation entries that weren't dumped)
- `npm run i18n:check-hardcoded-text` — scan `src/components/**/*.tsx` for plain-text JSX/attributes that should be translation keys instead (used in CI to enforce the i18n convention)

## Project structure

- `src/data/` — game data (classes, magics, artifacts, passives, fusions,
  research, etc.)
- `src/components/` — screens and UI components
- `src/engine/` — scoring, diminishing returns, and other run-tracking logic
- `src/i18n/` — English translation strings (`translation.json` for UI
  chrome, `gameData.json` for game data)
- `src/store/` — Zustand store for run state
- `public/assets/` — game sprites/images used by the UI
- `reference/` — community-sourced notes referenced while building `src/data/`
  (see `reference/README.md`)

## Contributing data

When adding or updating game data, follow the language rule in
[CLAUDE.md](CLAUDE.md) — everything that lands in `src/data/` must be in
English.

## CI

Three GitHub Actions workflows run on pushes/PRs to `master`
(`.github/workflows/`):

- **`lint.yml`** — runs `npm run lint` (Oxlint) and `tsc -b` (type check) on
  every push/PR.
- **`i18n-new-entries.yml`** — runs only when `src/data/**` or `src/i18n/**`
  change. `src/i18n/locales/en/gameData.json` is a point-in-time dump of the
  translation keys built at runtime from `src/data/*.ts` (see
  `src/i18n/gameData.ts`); it isn't the source of truth, but it's the one
  artifact a reviewer can diff to see exactly which keys a PR adds, changes,
  or removes. This workflow fails the build if that dump is stale (i.e.
  `npm run i18n:dump` wasn't re-run and committed after a data change) and
  posts the pending diff to the job summary.
- **`translation-conventions.yml`** — runs `npm run i18n:check-hardcoded-text`
  on every push/PR. Parses `src/components/**/*.tsx` with the TypeScript
  compiler API and fails the build on plain-text JSX children or string-literal
  text attributes (`aria-label`, `alt`, `title`, `placeholder`, …) that aren't
  routed through `useTranslation()`/`t("...")` — i.e. new UI copy typed
  directly into a view instead of added as a key in
  `src/i18n/locales/en/*.json`.

## Disclaimer

This is an unofficial, non-commercial fan project made for the Magic
Survival community. It is not affiliated with, endorsed by, or sponsored by
the game's developers.

All game names, artwork, sprites, and other assets referenced or displayed
by this app belong to their original creators/publisher — full credit and
rights remain with them. This project does not claim ownership of any such
assets and exists solely to help fellow players track their runs. If you
enjoy Magic Survival, please support the official game and its creators.

If you are a rights holder and have concerns about this project, please
open an issue and it will be addressed promptly.
