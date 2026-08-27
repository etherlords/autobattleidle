---
plannerFormat: 1
id: ABI-007
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-007: Complete release QA, GitHub Pages proof, and project timeline

## Goal

Complete release QA, GitHub Pages proof, and project timeline

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] pnpm check passes from a clean dependency state
- [ ] A real browser run proves combat, upgrades, grades, bosses, persistence, reset, and responsive layout
- [ ] The GitHub Pages build is deployed and playable without blocking console errors
- [ ] The game remains stable during a bounded long-run scenario and continues past multiple bosses
- [ ] Planner evidence produces a user-facing visualization of project progress and gate outcomes

## Dependencies

- ABI-006

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
