---
plannerFormat: 1
id: ABI-035
artifact: brief
project: ABI
profile: high-assurance
revision: 7
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-020
  - ABI-023
  - ABI-031
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-035: Preserve attack source and scale readable hit animation timing with effective APS

## Goal

Preserve attack source and scale readable hit animation timing with effective APS

## Work item

- Type: task
- Priority: high
- Status: In QA

## Acceptance criteria

- [ ] The immutable presentation cue contract preserves manual versus automatic attack source from BattleController through presenter, snapshot, battlefield effect creation, and test seams without exposing domain mutation to Three.js.
- [ ] Manual attacks use one deliberately fast readable hit duration. Automatic hit duration derives from effective APS and the accepted high-APS visible cadence, is clamped to documented readability bounds, and never restarts or stacks an unbounded number of effects.
- [ ] At low APS the full authored wind-up, slash trajectory, impact, critical, armor/deflect, and retirement phases remain visible. At high APS combat truth keeps every packet while presentation coalesces to the ABI-020 visual tick cap and does not mislabel aggregated automatic packets as manual input.
- [ ] Critical remains visually distinct from ordinary hit, armor/deflect remains distinct from flesh/shell impact, and all trajectories use the accepted fixed endpoints/orientation rather than broad random rotation.
- [ ] Lethal sequencing remains hit -> bounded pause -> death -> replacement; source/timing changes do not reintroduce snapping, detach decorations, move the camera, duplicate rewards, or alter combat event order.
- [ ] Reduced-motion uses the same semantic cue sequence with shorter/non-displacing transforms. Visibility changes, resize, enemy replacement, reset, reload, and disposal retire active effects exactly once.
- [ ] No save-schema change is introduced. Source and timing are transient presentation data and valid historical saves load, render, save, and reload unchanged.
- [ ] Focused tests prove manual/automatic source transport, low/mid/high APS duration bounds, packet aggregation, critical/armor identity, lethal order, reduced motion, replacement, and disposal. Browser QA records state -> action/time -> visible result at low and 10-plus APS on desktop and narrow layouts.
- [ ] Independent review, independent QA, pnpm check, exact-SHA CI/Pages, and deployed behavior proof pass before Manager closure.

## Dependencies

- ABI-018
- ABI-020
- ABI-023
- ABI-031

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
