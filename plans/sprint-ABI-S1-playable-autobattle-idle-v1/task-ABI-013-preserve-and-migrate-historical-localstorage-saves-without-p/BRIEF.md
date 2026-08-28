---
plannerFormat: 1
id: ABI-013
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-005
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-013: Preserve and migrate historical localStorage saves without progress loss

## Goal

Preserve and migrate historical localStorage saves without progress loss

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] The historical schema-version-1 payload from repository history loads in the current schema-version-2 runtime without resetting valid progress.
- [ ] The V1-to-V2 migration preserves coins, encounter and enemy state, automatic unlock, damage, critical, double-reward, and automatic-speed progress, and initializes armor penetration to the documented safe default.
- [ ] Save loading parses unknown data once, validates the source-version shape, applies deterministic one-version-at-a-time migration, validates the current shape, and reconstructs derived values through domain formulas.
- [ ] The original localStorage payload is not overwritten until migration and current-schema validation succeed; a failed write does not destroy the prior payload or the valid in-memory session.
- [ ] Golden V1 and V2 fixtures prove load, semantic equality, migration, save, and second reload; malformed and unsupported-future payloads still recover safely without crashing.
- [ ] A reusable release guard requires every future task to classify persistence impact as no schema change, compatible extension, or schema migration and to provide the corresponding historical-save regression evidence.
- [ ] Real-browser QA seeds an actual V1 localStorage payload in the deployed application, proves preserved progress plus safe new defaults, reloads again, and confirms a stable V2 payload.
- [ ] Persistence Contract and UI/Persistence/QA workflow documentation match the implemented migration and no unrelated gameplay, HUD, or ABI-007+ implementation is included.

## Dependencies

- ABI-005
- ABI-006

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-E27CD3
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
