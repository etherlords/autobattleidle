---
plannerFormat: 1
id: ABI-031
artifact: review
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

# ABI-031 review

## Verdict

CHANGES_REQUIRED — the shared interpolation builds and the focused/full suites pass, but two explicit acceptance requirements are not implemented or proven.

## Findings

- **P1 — Enemy reactions ignore reduced-motion preference.** `BattlefieldLifecycle` reads the preference but only passes it into transient battlefield effects; the enemy always calls `tick()` with no motion mode, and the rig always applies idle lift plus hit/critical/death scale/rotation. This violates the required normal-and-reduced-motion reaction behavior and has no regression coverage. Thread the existing reduced-motion state through the enemy-view animation owner and make the non-motion cue explicit; add frame samples for all shipped families in that mode.
  - Evidence: `src/game/battlefield/lifecycle.ts:91-93,111-120`; `src/game/units/enemy/view.ts:35-42`; `src/game/enemy-visual/bodies.ts:105-128`; `src/game/enemy-visual.test.ts:425-450`.
- **P1 — Cue-fit tests do not verify the rendered fit contract.** The new helper scales descendant meshes centrally, but the only added assertions merely check the helper's clamped return range. The suite contains no rendered mesh scale-ratio, family-relative bounds, clearance, finite-transform, orientation, or disposal assertion for grade, seeded, and modifier cues. Thus removing the three `fitCue(...)` calls would still leave the claimed ABI-031 fit regressions green. Add exhaustive scene-level assertions for every family/profile and every cue class, including anchor-relative clearance and actual mesh scale.
  - Evidence: `src/game/units/enemy/builder.ts:22-46`; `src/game/enemy-visual.test.ts:155-177`; `src/game/enemy-visual.test.ts:210-245`.

## Checks

- `pnpm vitest run src/game/enemy-visual.test.ts` — PASS, 20 tests.
- `pnpm check` — PASS: ESLint, Prettier, 17 Vitest files / 103 tests, TypeScript, and Vite production build.
- `git diff --check` — PASS.

## Fresh second re-review — 2026-08-30

### Verdict

CHANGES_REQUIRED — the second repair makes the all-family body-reaction samples and cue catalog broader, and the fresh focused/full gates pass, but the new evidence still does not meet the required family-specific cue-fit and complete attachment-lifecycle contracts.

### Findings

- **P1 — The claimed exhaustive cue-fit matrix does not prove family/profile fit or surface clearance.** `findCueInput` stops at the first reachable input for each cue, so each fixture in the matrix is asserted for one selected body/profile rather than every family/profile. The size check therefore cannot establish the required *family-specific* bounded ratios. Its clearance condition is only the distance between cue and body bounding-box centers; it neither compares cue surfaces nor rejects a cue embedded inside the body, so an overlapping cue can satisfy the condition. The permissive head-anchor fallback also accepts an `enemy-body-*` ancestor in place of the required head anchor. Enumerate each rendered cue across every reachable family/profile and assert the exact declared anchor plus a cue-specific surface-clearance/bounded-overlap invariant.
  - Evidence: `src/game/enemy-visual.test.ts:120-139,147-157,172-206,684-784`; required fit contract: `plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-031-eliminate-hit-reaction-snapping-and-fit-decorations-to-each-/BRIEF.md:37-39`.
- **P1 — Attachment coverage remains static for the cue matrix, not throughout the required command lifecycle.** `assertCueFixture` builds, measures, and disposes each selected cue without ticking or dispatching any command. The all-family lifecycle test samples only the pose and never observes cue transforms, while the only live cue assertion is one Hydra crown during `critical` plus an unrelated Colossus death-pose bound. A regression that detaches a different grade/seeded/modifier cue during hit, idle, or death would still pass. Sample the declared cue anchors and cue world transforms through idle, hit, critical, and death for the applicable all-family/cue matrix.
  - Evidence: `src/game/enemy-visual.test.ts:172-213,602-636,809-832`; required attachment contract: `plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-031-eliminate-hit-reaction-snapping-and-fit-decorations-to-each-/BRIEF.md:37`.

### Fresh checks

- `pnpm vitest run src/game/enemy-visual.test.ts` — PASS, 22 tests.
- `pnpm check` — PASS: ESLint, Prettier, 17 Vitest files / 105 tests, TypeScript, and Vite production build.
- `git diff --check` — PASS.

## Fresh re-review — 2026-08-30

### Verdict

CHANGES_REQUIRED — native reduced-motion suppression is repaired, but the remaining test coverage still falls short of the required all-cue and all-family continuity contracts.

### Findings

- **P1 — Cue-fit proof remains representative, not exhaustive.** The new rendered test checks three seeded decorations, the three grade cues, and only vitality, armor, and hardened modifiers. It omits the `time-ring`, wealth, prism, and directional-barrier modifiers, plus at least satellite and scar seeded cues. Its generic nearest-`enemy-*` ancestor check accepts the wrong semantic anchor, and it has no clearance, expected-orientation, or cue-specific disposal assertion. This does not meet the required every-cue, semantic-anchor, clearance/orientation, and disposal proof.
  - Evidence: `src/game/enemy-visual.test.ts:501-538`; required cue catalog in `src/game/enemy-visual/spec.ts:18-28`; cue implementations in `src/game/enemy-visual/decorators/*.ts`.
- **P1 — Motion regressions are still not exhaustive for the stated frame lifecycle.** The all-family test covers only the first hit-position and first overlapping-critical-scale sample. Recovery and next-neutral samples remain Hydra-only, and no all-family test bounds consecutive deltas or exercises repeated/overlapping spawn/death paths. Therefore a family-specific recovery/drift regression could still pass the suite.
  - Evidence: `src/game/enemy-visual.test.ts:425-450,541-560`; ABI-031 BRIEF acceptance criteria 35-36.

### Closed prior finding

- Native reduced motion is now captured by each rig at construction; its tick path consumes command frames without applying idle, residual, scale, rotation, or position transforms. The new native-preference test covers all eight families and command lifecycle identity.
  - Evidence: `src/game/enemy-visual/bodies.ts:60-62,164-181`; `src/game/enemy-visual.test.ts:453-499`.

### Fresh checks

- `pnpm vitest run src/game/enemy-visual.test.ts` — PASS, 22 tests.
- `pnpm check` — PASS: ESLint, Prettier, 17 Vitest files / 105 tests, TypeScript, and Vite production build.
- `git diff --check` — PASS.

## Fresh third re-review — 2026-08-30

### Verdict

CHANGES_REQUIRED — the repaired matrix now exhaustively expands reachable family/profile combinations, uses exact anchors, and has live attachment/disposal coverage. However, it still misses a real orbit-phase containment defect.

### Findings

- **P1 — Orbiting decoration cues still pass through and become fully hidden inside their body.** `orbitals` updates only its X coordinate with `cos(phase)`, so at `phase = π/2` its center is on the body centerline. For the Wisp, that places the scaled torus (outer radius `0.34 + 0.04`) at X=0, Y=`attachment[1] + 0.08`, Z=0, wholly inside the 0.8-radius root-body Box3. The fixture's containment assertion evaluates only the initial cue bounds; its live samples subsequently reach later orbit phases but check only finite positions and motion, not containment/gap. Thus the visible cue can be fully hidden during ordinary idle motion despite all current tests passing. Sample complete orbit extrema (or otherwise prove the entire orbit envelope) against the body/anchor bounds and correct the orbit path or clearance if it intersects.
  - Evidence: `src/game/enemy-visual/decorators/seeded-decoration-decorator.ts:60-76`; `src/game/enemy-visual/config.ts:56,79`; `src/game/enemy-visual.test.ts:317-328,259-280`; required non-hidden, surface-clearance contract: `plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-031-eliminate-hit-reaction-snapping-and-fit-decorations-to-each-/BRIEF.md:38-39`.

### Fresh checks

- `pnpm vitest run src/game/enemy-visual.test.ts` — PASS, 22 tests.
- `pnpm check` — PASS: ESLint, Prettier, 17 Vitest files / 105 tests, TypeScript, and Vite production build.
- `git diff --check` — PASS.

## Fresh fourth re-review — 2026-08-30

### Verdict

CHANGES_REQUIRED — the 210-tick extrema loop covers the ordinary reachable matrix and the shared side-axis correction prevents the previously found containment. Its claimed exhaustive profile coverage nevertheless omits the shipped Golden Bug profile.

### Findings

- **P1 — The extrema matrix excludes the Golden Bug’s distinct visual profile.** `findCueInputs` enumerates only ordinary `{ grade, level, modifier }` inputs; it never includes `goldenBug: true`. Yet `enemyVisualSpec` gives that shipped composition its own metallic profile and attaches both a crown and wealth/seeded orbitals. As a result, the new 210-tick containment/gap coverage does not exercise that actual profile, despite the asserted every-reachable-family/profile contract. Add the Golden Bug input to the applicable crown, wealth-orbital, and seeded-orbital fixture matrices (or make the enumerator include all supported input variants).
  - Evidence: `src/game/enemy-visual.test.ts:141-165,289-309`; `src/game/enemy-visual/spec.ts:246-265`; Golden Bug lifecycle contract: `.docs/knowledge/design/Enemy Tiers and Boss Cadence.md:73-75`.

### Fresh checks

- `pnpm vitest run src/game/enemy-visual.test.ts` — PASS, 22 tests.
- `pnpm check` — PASS: ESLint, Prettier, 17 Vitest files / 105 tests, TypeScript, and Vite production build.
- `git diff --check` — PASS.
