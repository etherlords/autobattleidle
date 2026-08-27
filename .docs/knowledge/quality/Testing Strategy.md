---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-D1B235
kind: guide
status: active
summary: 'Focused deterministic, integration, and browser acceptance proof for V1.'
tags:
  - testing
  - quality
  - vitest
---
# Testing Strategy

## Layers

- Unit tests cover domain transitions, formulas, purchases, rewards, encounter progression, and save validation/migration.
- Focused integration tests cover app orchestration, persistence triggers, and UI-to-command routing.
- Browser QA covers click and keyboard input, accessible controls, responsive layout, reload recovery, malformed-save recovery, endless progression, and the deployed Pages build.

## Gates

Each behavior change adds the smallest focused test that would fail if it regressed. `pnpm check` runs lint, format check, Vitest, and production build. Independent review and QA remain separate lifecycle gates; their evidence belongs in Planner artifacts.

## Related

- [[operations/Release and Deployment Operations|Release and Deployment Operations]]
