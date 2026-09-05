---
plannerFormat: 1
id: ABI-039
artifact: brief
project: ABI
profile: high-assurance
revision: 17
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-020
  - ABI-026
  - ABI-029
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-039: Add deterministic progression-aware boss cadence and varied boss encounters

## Goal

Add deterministic progression-aware boss cadence and varied boss encounters

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] A measured design replaces a visibly repetitive fixed boss pattern with deterministic progression-aware boss scheduling while preserving reproducibility, bounded computation, endless progression, and the accepted ABI-020 elapsed-time/Golden Bug envelopes.
- [ ] Boss timing uses centralized cadence bands with explicit minimum and maximum gaps plus deterministic seeded variation. It never uses render-time randomness, wall-clock randomness, or a schedule that changes after reload.
- [ ] Boss identity draws from multiple approved family, geometry-profile, and affinity combinations with anti-repeat rules; consecutive Cinder Hydra repetition is an explicit failing fixture, while Golden Bugs remain a separate timed encounter type.
- [ ] Difficulty, health, armor, reward, and affinity modifiers remain centralized and measured. Cadence variation cannot hide an unexplained progression wall, trivial boss streak, reward drought, or reward exploit.
- [ ] The simulator reports per-stage boss gaps, family/affinity distribution, repeat streaks, hit and TTK p50/p90/max, time contribution, rewards, Golden Bug interaction, and deterministic equality across exact and event-jump modes.
- [ ] A bounded look-ahead or stateless seeded schedule is preferred; no unbounded history, new backend, or duplicated encounter owner is introduced. If anti-repeat state must persist, the same task includes an explicit save version, migration, current/old fixtures, and rollback.
- [ ] Presentation reuses existing boss camera, rigs, effects, visual lab, and family/affinity factories. Boss replacement resets camera and resources exactly once and never changes ordinary enemy selection.
- [ ] Focused tests cover cadence boundaries, seed/reload equality, anti-repeat rules, distribution, boss/Golden separation, exact/fast-forward equivalence, safe-number limits, persistence classification, and long-run boundedness. Browser QA proves varied boss encounters and camera resets on desktop and narrow layouts.
- [ ] Independent review, independent QA, pnpm check, exact-SHA CI/Pages, deployed multi-boss proof, Vault update, and Manager closure pass.

## Dependencies

- ABI-006
- ABI-020
- ABI-026
- ABI-029

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-A798F2

## Constraints

- Follow the resolved workflow contract and project instructions.
