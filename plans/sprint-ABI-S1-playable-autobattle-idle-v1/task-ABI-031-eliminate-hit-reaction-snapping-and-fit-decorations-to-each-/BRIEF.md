---
plannerFormat: 1
id: ABI-031
artifact: brief
project: ABI
profile: high-assurance
revision: 81
status: Ready for Manager
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

# ABI-031: Eliminate hit-reaction snapping and fit decorations to each enemy body

## Goal

Eliminate hit-reaction snapping and fit decorations to each enemy body

## Work item

- Type: bug
- Priority: critical
- Status: Ready for Manager

## Acceptance criteria

- [ ] Every shipped ordinary family and boss starts hit and critical reactions from its current rendered pose and returns continuously to the same neutral pose; no single frame introduces a visible position, rotation, or scale jump.
- [ ] Frame-sampled tests cover neutral, early, peak, recovery, and next-neutral states for every family at normal and reduced motion, with bounded consecutive transform deltas and no accumulated drift across repeated or overlapping hit commands.
- [ ] Hydra heads, Colossus body parts, grade cues, seeded decorations, and modifier cues remain attached to their semantic pose, head, top, front, flank, or orbit anchors throughout hit, critical, idle, and death deformation.
- [ ] Every decoration and modifier cue is visually fitted to the actual family and anchor size using one body-owned semantic layout path; cues are neither hidden inside the body nor disproportionately large or detached.
- [ ] Veteran, elite, boss, armor, vitality, time-warp, hardened, critical-guard, manual-guard, wealth, and seeded decoration silhouettes are mutually distinguishable and readable without relying only on color; headwear is centered and symmetric, rings and vitality cues do not occlude faces, and shields orbit around the body with faces directed outward.
- [ ] Hit reactions use perceptible smooth ease-in and ease-out timing on ordinary enemies and bosses; family parts follow the reaction and the final frame returns to idle without a snap.
- [ ] Hit, critical, and basic attack effects appear at a readable combat socket outside the body, remain visible in sampled effect frames, and do not present as an unexplained cube or ground primitive.
- [ ] Decoration-fit tests enforce family-specific bounded size ratios, semantic anchor identity, surface clearance, outward orientation, symmetry, finite transforms, determinism, reduced-motion behavior, and disposal without render-time randomness or a parallel layout owner.
- [ ] A representative desktop and 390px browser matrix captures before, early, peak, recovery, and neutral frames for all families and bosses and visually confirms continuous motion, recognizable cue semantics, and proportional decoration fit.
- [ ] Focused regressions and pnpm check pass; fresh independent review, fresh independent browser QA, and explicit user demo approval pass before Manager closure, exact-SHA CI, Pages deployment, and public deployed verification.

## Dependencies

- ABI-023
- ABI-026

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
