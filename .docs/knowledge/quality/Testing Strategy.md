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
- The developer-only visual lab reuses production enemy factories for deterministic URL-addressable all-angle, animation, socket, bounds, resource, reduced-motion, and disposal checks. The normal `pnpm build` excludes its entry point; `pnpm build:visual-lab` explicitly creates the multi-entry Pages artifact with the game at `/` and the lab at `/visual-lab.html`.
- Browser QA covers click and keyboard input, accessible controls, responsive layout, reload recovery, malformed-save recovery, endless progression, and both deployed Pages routes when the lab ships.

## Gates

Each behavior change adds the smallest focused test that would fail if it regressed. `pnpm check` runs lint, format check, Vitest, and production build. Independent review and QA remain separate lifecycle gates; their evidence belongs in Planner artifacts.

## Related

- [[operations/Release and Deployment Operations|Release and Deployment Operations]]

## Planned pre-commit quality proof

ABI-021 will make the existing `pnpm check` contract a tracked native pre-commit gate without adding a hook dependency. A red isolated smoke must block commit; a green smoke must permit it; neither proof creates a real commit or publication. The hook does not rewrite staged files and prints explicit repair guidance.

CI remains authoritative independent proof at the published SHA, and Reviewer/Manager sign-off must cite fresh output. `--no-verify` is treated as a local bypass, never as permission to merge or publish without green CI.
