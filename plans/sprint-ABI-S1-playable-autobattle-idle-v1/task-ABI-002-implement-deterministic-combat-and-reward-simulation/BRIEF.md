---
plannerFormat: 1
id: ABI-002
artifact: brief
project: ABI
profile: high-assurance
revision: 7
status: Ready for Manager
sprintId: ABI-S1
dependencies:
  - ABI-001
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-002: Implement deterministic combat and reward simulation

## Goal

Implement deterministic combat and reward simulation

## Work item

- Type: task
- Priority: high
- Status: Ready for Manager

## Acceptance criteria

- [ ] Manual and scheduled automatic attacks share one deterministic command path
- [ ] Damage, critical hits, armor, death, reward, and encounter advancement follow the Vault rules
- [ ] A death grants its reward exactly once
- [ ] Pure unit tests cover state transitions and edge cases
- [ ] Planner lifecycle and task tool-use evidence are complete

## Dependencies

- ABI-001

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-584401

## Constraints

- Follow the resolved workflow contract and project instructions.
