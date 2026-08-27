---
plannerFormat: 1
id: ABI-006
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-003
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-006: Tune boss cadence and prove endless progression

## Goal

Tune boss cadence and prove endless progression

## Work item

- Type: task
- Priority: normal
- Status: Ready

## Acceptance criteria

- [ ] A deterministic simulator reports time, purchases, attacks, and currency for several bosses
- [ ] The first unattended boss target is approximately ten minutes with later targets increasing
- [ ] The player cannot buy every upgrade before the first boss under the reference strategy
- [ ] Progression formulas continue beyond handcrafted content without numeric instability
- [ ] Balance constants and measured evidence are documented and tested

## Dependencies

- ABI-003
- ABI-004
- ABI-005

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A798F2

## Constraints

- Follow the resolved workflow contract and project instructions.
