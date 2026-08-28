---
plannerFormat: 1
id: ABI-016
artifact: brief
project: ABI
profile: high-assurance
revision: 2
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

# ABI-016: Add constrained arena camera orbit for boss encounters

## Goal

Add constrained arena camera orbit for boss encounters

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] Current user-authored boss cadence and all combat/reward formulas remain unchanged; cadence, reward, health, critical, and armor-penetration tuning belong to ABI-020.
- [ ] Boss encounters retain their existing deterministic identity/body/cues while the battlefield camera orbits only around the arena center azimuth: field of view, target, elevation, and radius remain fixed; zoom and pan stay disabled.
- [ ] Desktop pointer drag and narrow/touch drag rotate smoothly; ArrowLeft/ArrowRight while the battlefield is focused provide a keyboard equivalent, while Enter/Space and stationary pointer activation still issue exactly one manual attack.
- [ ] An orbit drag never leaks a manual attack, modal/HUD controls never rotate the camera, resize preserves the orbit angle, and every camera-control listener/resource is removed exactly once on battlefield disposal.
- [ ] Existing saves load with no schema change and camera state remains session-only presentation state; no camera property enters CombatState or persistence.
- [ ] Focused unit/integration tests prove camera-angle constraints, attack-versus-drag arbitration, resize and disposal; independent browser QA covers boss and ordinary encounters at desktop and 390px, clean console, bounded listeners/resources, pnpm check, and deployed Pages proof.

## Dependencies

- ABI-015

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260828-ECBD82

## Constraints

- Follow the resolved workflow contract and project instructions.
