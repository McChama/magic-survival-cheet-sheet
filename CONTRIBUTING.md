# Contributing

## Branches

- **`master`** — main development branch. All changes land here via pull
  request (direct pushes are blocked, including for admins).
- **`production`** — deploying to this branch triggers the live deploy to
  GitHub Pages (see `.github/workflows/deploy.yml`). Same rule: no direct
  pushes, everything goes through a pull request.

## Who can merge into `production`

**Only the repo owner (@McChama) merges into `production`.** This is the
release branch — merging it is what puts a new version of the app in front
of real users, so it should always be a deliberate, manual action by the
owner, never an automated or third-party merge.

GitHub's per-branch push/merge restrictions by user or team only exist on
organization-owned repositories, not personal-account repos like this one
— so this isn't (currently) enforced by GitHub itself, only by convention:

- Other contributors (including an AI assistant with write access to this
  repo) should open pull requests into `production`, but never merge them.
- If this repo ever moves to a GitHub organization, revisit this and set
  an actual branch protection restriction limiting who can push/merge to
  `production`.
