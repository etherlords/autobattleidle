---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-FC2B16
kind: guide
status: active
summary: >-
  Static release checklist and GitHub Pages verification for the V1 browser
  game.
tags:
  - operations
  - release
  - github-pages
---
# Release and Deployment Operations

## Release checklist

1. Run `pnpm check`; for a lab release also run `pnpm build:visual-lab` locally.
2. Complete independent review and QA with recorded Planner evidence.
3. Verify the production-only build starts locally and supports the release acceptance path.
4. Push the coherent code, Planner, and Vault checkpoint; Pages uses `pnpm build:visual-lab` to publish one artifact with the game at `/` and the debug lab at `/visual-lab.html`.
5. At the exact deployed SHA, verify `/` still owns gameplay and persistence, then verify `/visual-lab.html` loads independently and performs no persistence, leaderboard, or gameplay-state mutation.

## Rollback

A failed deployment is rolled back by restoring the last known-good published Git commit through the normal manager-owned Git workflow. Vault and Planner do not deploy or mutate Git themselves.

## Related

- [[design/Game Design Overview|Game Design Overview]]
