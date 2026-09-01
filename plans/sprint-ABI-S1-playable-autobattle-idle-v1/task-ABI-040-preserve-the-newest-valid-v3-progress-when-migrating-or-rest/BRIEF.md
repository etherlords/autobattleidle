---
plannerFormat: 1
id: ABI-040
artifact: brief
project: ABI
profile: high-assurance
revision: 6
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-013
  - ABI-020
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-040: Preserve the newest valid V3 progress when migrating or restoring V4

## Goal

Preserve the newest valid V3 progress when migrating or restoring V4

## Work item

- Type: bug
- Priority: critical
- Status: Done

## Acceptance criteria

- [ ] The authentic user V3 save at encounter 2170 migrates to V4 without losing encounter, coins, player levels, unlocked automatic attack, or Golden Bug state; any derived enemy normalization preserves the same encounter and bounded remaining-health proportion.
- [ ] Startup uses a valid V4 when present; otherwise it selects the newest valid historical source in strict V3, V2, unversioned legacy, V1 order and never falls through to an older lower-progress source merely because balance formulas changed.
- [ ] Explicit Restore selects and validates the newest valid historical source even when a current V4 exists, publishes it atomically, and leaves every historical source byte-for-byte unchanged.
- [ ] V3 recognition accepts authentic saves produced before the player-relative health balance release while retaining corruption checks for player-derived fields, encounter identity, grade, modifier, armor, reward, health bounds, and active Golden Bug semantics.
- [ ] Focused persistence tests reproduce the exact 2170-to-30 regression, multi-slot precedence, valid-current startup, explicit Restore, failed-write retry, malformed-source rejection, and V1-V4 load-save-reload continuity.
- [ ] Independent review and isolated exact-SHA deployed QA prove V3 encounter 2170 -> V4 encounter 2170, reload continuity, no silent reset, and clean console/network behavior before ABI-028 verification may be restored.

## Dependencies

- ABI-013
- ABI-020

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A798F2

## Constraints

- Follow the resolved workflow contract and project instructions.
