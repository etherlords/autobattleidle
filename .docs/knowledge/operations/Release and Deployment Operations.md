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

1. Run `pnpm check`.
2. Complete independent review and QA with recorded Planner evidence.
3. Verify a clean production build starts locally and supports the release acceptance path.
4. Push the coherent code, Planner, and Vault checkpoint; confirm the Pages workflow succeeds.
5. Open the deployed Pages URL and prove loading, input, reload persistence, malformed-save recovery, and continued progression.

## Rollback

A failed deployment is rolled back by restoring the last known-good published Git commit through the normal manager-owned Git workflow. Vault and Planner do not deploy or mutate Git themselves.

## Related

- [[design/Game Design Overview|Game Design Overview]]
