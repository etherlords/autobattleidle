---
plannerFormat: 1
id: ABI-048
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: In Progress
sprintId: ABI-S1
dependencies:
  - ABI-029
  - ABI-037
  - ABI-045
  - ABI-046
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-048: Reconcile deterministic visual composition controls and extend player evolution milestones

## Goal

Reconcile deterministic visual composition controls and extend player evolution milestones

## Work item

- Type: task
- Priority: high
- Status: In Progress

## Acceptance criteria

- [ ] Define one compiler-checked enemy visual composition receipt for family, body variant, affinity, grade, modifier, and boss geometry profile; production and Visual Lab consume the same registries and no layer is selected by hidden render-time randomness.
- [ ] Make every shipped affinity explicitly selectable in Visual Lab, with its name, palette, cue, reward factor, deterministic seed/input, and resulting production identity visible in the case URL and receipt.
- [ ] Make boss geometry explicitly inspectable in Visual Lab for legacy/no overlay, Crystal Crown, Elemental Spines, and Orbital Runes on Hydra and Colossus; invalid combinations are disabled or explained instead of silently falling back to an unrelated beetle/default case.
- [ ] Repair ABI-029 composition debt so geometry profile is deterministic, legacy geometry remains genuinely selectable, ordinary enemies never receive boss-only attachments, and approved Crown, Spines, and Runes retain clearance, outward placement, local-axis motion, reduced-motion, and exact-disposal behavior.
- [ ] Reconcile the newer affinity/geometry layer with the existing family, variant, grade, modifier, seeded-decoration, socket, animation, and disposal system without duplicating factories, visual definitions, palette/cue contracts, or unused wrapper abstractions.
- [ ] Extend the existing finite player evolution selector with visible deterministic milestones every 100 levels below 1000, every 1000 levels from 1000 to below 10000, every 2000 levels from 10000 to below 50000, and every 5000 levels from 50000 to below 100000; level 100000 is the final clamped visual state.
- [ ] Reuse the existing authored player forms and bounded detail palette rather than creating one mesh factory per milestone; each adjacent milestone is visibly distinct while live detail, object, geometry, material, draw-call, and QA-case counts remain explicitly bounded.
- [ ] Expose exact player level and every cadence boundary in Visual Lab and prove production/lab identity parity, stable attack and aura sockets, high-APS presentation, hit/attack animation, reduced motion, desktop/narrow framing, replacement, and exact disposal.
- [ ] Keep persistence as no schema change: supported V1-V4 saves load at representative boundary levels, derive the same enemy and player visual identities, save, and reload without progress loss or new visual fields.
- [ ] Restore the independent ABI-020 measured-baseline regression alongside a focused bounded ABI-029 affinity receipt, and keep Golden Bug reward/palette, combat balance, progression, leaderboard, worker, and input contracts unchanged.
- [ ] Update Vault additively without deleting unrelated accepted family or animation guidance, and finish with synchronized BRIEF, REVIEW, QA, VERIFICATION, checked acceptance mapping, pnpm check, independent review, deployed desktop/narrow Visual Lab and production QA, exact-SHA CI/Pages proof, and Manager closure.

## Dependencies

- ABI-029
- ABI-037
- ABI-045
- ABI-046

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-D1B235

## Constraints

- Follow the resolved workflow contract and project instructions.
