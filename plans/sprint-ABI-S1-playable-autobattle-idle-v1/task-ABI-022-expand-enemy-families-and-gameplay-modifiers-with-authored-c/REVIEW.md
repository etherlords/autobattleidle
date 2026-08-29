---
plannerFormat: 1
id: ABI-022
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-022 review

## Verdict

APPROVE — fresh independent re-review, 2026-08-29. No unresolved P0-P2.

## Findings

- P2 `src/game/enemy-visual/decorators/modifier-cue-decorator.ts`: armor plates multiply signed lateral attachment anchors by `0.7`, moving beetle/brute shields inside their body volumes. Use authored surface positions directly with intentional depth and add all-profile rendered bounds proof.
- P2 `src/game/enemy-visual/decorators/seeded-decoration-decorator.ts` plus mantis profile: scar uses global `z=0.7` while the mantis thorax radius is `0.38`, leaving a detached gap in side view. Supply a family/profile surface anchor or bounded decoration depth and prove that cell.
- P2 `src/game/enemy-visual.test.ts`: the 8 x 3 matrix asserts spec data but does not render all 24 cells or assert every new modifier cue/attachment. Add the rendered matrix and finite attachment/resource bounds; browser QA remains required for readability.

Fresh Reviewer checks: focused modifier/visual/persistence slice passed 4 files/29 tests; `git diff --check acd2578` passed. Full `pnpm check` was not repeated because the accepted self-check was unchanged.

## Re-review

- All three prior P2s are closed: shields use signed surface anchors plus explicit depth; mantis scar uses profile surface `z=0.38`; rendered tests cover 8 families x 3 profiles, new cue positions, bounded meshes, and disposal.
- Fresh re-review: `src/game/enemy-visual.test.ts` 13 tests passed and `git diff --check acd2578` passed. The Reviewer rescanned the full ABI-022 diff and found no repair regression.
