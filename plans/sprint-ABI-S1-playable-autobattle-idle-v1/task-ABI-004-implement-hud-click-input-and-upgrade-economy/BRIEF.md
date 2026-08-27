---
plannerFormat: 1
id: ABI-004
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-004: Implement HUD, click input, and upgrade economy

## Goal

Implement HUD, click input, and upgrade economy

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] HUD shows health, encounter grade, modifier, currency, rewards, and attack feedback
- [ ] Pointer and keyboard activation execute exactly one manual attack per activation
- [ ] All five upgrade paths enforce costs, prerequisites, caps, and disabled reasons
- [ ] Auto-attack slow never reduces manual click attacks
- [ ] Desktop and narrow layouts remain usable and accessible

## Dependencies

- ABI-002

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A798F2
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
