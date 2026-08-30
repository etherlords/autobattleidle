---
plannerFormat: 1
id: ABI-031
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-023
  - ABI-026
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-031 implementation-guide

## Frozen scope

- Own motion continuity only in `riggedBody`; no family-specific hit timelines and no combat/domain changes.
- Own proportional decoration sizing through one helper derived from `EnemyVisualProfile.attachment`; retain existing semantic anchors and authored offsets.
- Touch only enemy visual source/tests plus this task packet, Vault evidence, and fresh task-owned QA artifacts. Preserve ABI-019, ABI-020, legacy QA output, and unrelated Planner operation files.

## Implementation sequence

1. Add a focused regression that samples idle -> first hit frame -> peak -> neutral and a hit -> overlapping critical sequence for every family.
2. Capture the current pose on command dispatch and decay its difference from the moving idle baseline while the existing command curve runs.
3. Add one clamped profile-fit helper and apply it to seeded decoration, grade, and modifier mesh scale without altering anchor ownership.
4. Add exhaustive finite-transform, proportional-size, clearance, determinism, reduced-motion, and disposal checks at the highest economical layer.
5. Run focused Vitest and `pnpm check`, then hand the bounded diff to independent review and browser QA.

## Verification matrix

- Unit: every family and boss has bounded consecutive pose deltas, exact first-frame continuity, neutral recovery, no drift, and continuous overlapping commands.
- Integration: Hydra/Colossus semantic children follow parent deformation; every seeded, grade, and modifier cue has finite transforms and bounded family-relative dimensions.
- Regression: reduced-motion behavior, deterministic rebuild, disposal, and supported historical-save load/reload stay green through `pnpm check`.
- Browser/deployed: desktop and 390px before/early/peak/recovery/neutral sequences, repeated hits, proportional cues, clean console/resource health, exact-SHA CI and Pages asset proof.
