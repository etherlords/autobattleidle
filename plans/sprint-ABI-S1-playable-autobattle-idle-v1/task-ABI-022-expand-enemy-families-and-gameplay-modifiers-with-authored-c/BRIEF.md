---
plannerFormat: 1
id: ABI-022
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-022: Expand enemy families and gameplay modifiers with authored component visuals

## Goal

Expand enemy families and gameplay modifiers with authored component visuals

## Work item

- Type: task
- Priority: normal
- Status: Blocked

## Acceptance criteria

- [ ] A design preflight inventories the current five body families, grade/modifier mechanics, component factory/builder/decorator contracts, save impact, and balance interactions, then selects at least three additional visually distinct enemy families and at least three mechanically distinct modifiers; rejected ideas and reasons are recorded.
- [ ] Every accepted family has an intentional silhouette, named component layout, palette, attachment points, and animation/cue specification before implementation; random primitive placement without an authored visual contract is rejected.
- [ ] New families register through the exhaustive enemy body factory and existing builder/decorator pipeline without adding family-selection if/switch ladders or changing unrelated family implementations.
- [ ] Each accepted modifier has separate model rules, controller event implications, view decorator/cue/animation, deterministic inputs, UI text, and save-validation behavior; variants that require unsupported player-health or hidden random state are excluded or explicitly designed first.
- [ ] Combat model data remains immutable and serializable; special logic stays in pure domain strategies/controller commands, while Three.js meshes/animation/disposal stay in lifecycle-owning view components. No global event bus or one-class-per-data-row hierarchy is added.
- [ ] Existing saves and enemies load without progress loss; new active modifier values round-trip deterministically, malformed or mismatched derived values reject safely, and any necessary schema decision is explicit rather than implicit enum drift.
- [ ] Focused tests prove registry exhaustiveness, deterministic spawn/roll behavior, every modifier interaction, factory extension, builder/decorator attachment, animation/disposal, save round-trip, and unchanged old-family behavior.
- [ ] Independent visual QA captures every new family and modifier on desktop and 390px, verifies no clipping/intersection/detached parts and readable silhouettes/cues/animation, while headless telemetry feeds ABI-020 before final balance is accepted.
- [ ] Independent review has no unresolved P0-P2, pnpm check and long-run resource bounds pass, Vault design articles are updated, and exact-SHA CI/Pages/deployed proof completes before Manager closure.

## Dependencies

- ABI-015
- ABI-023

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260828-ECBD82
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-584401

## Constraints

- Follow the resolved workflow contract and project instructions.
