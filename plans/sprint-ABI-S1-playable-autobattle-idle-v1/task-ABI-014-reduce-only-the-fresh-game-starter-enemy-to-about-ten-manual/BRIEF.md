---
plannerFormat: 1
id: ABI-014
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-013
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-014: Reduce only the fresh-game starter enemy to about ten manual attacks

## Goal

Reduce only the fresh-game starter enemy to about ten manual attacks

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] On a fresh game with baseline damage and no upgrades, the encounter-1 starter enemy is defeated by 8-12 accepted manual attacks.
- [ ] The starter adjustment is scoped only to the first enemy of a fresh run; encounter 2 and later enemies, armored elites, bosses, and shared endless-growth curves keep their existing formulas and balance.
- [ ] Runtime and deterministic simulator use the same centralized starter-health rule, preserve minimum damage and finite numeric safety, and focused tests prove the exact baseline hit count plus unchanged later-enemy samples.
- [ ] Persistence impact is classified explicitly; existing historical/current saves are never reset or rewritten merely to apply the starter balance change, and reload behavior is covered by regression evidence.
- [ ] The canonical Vault balance article documents the starter exception, its 8-12-click target, rationale, and boundary from the endless progression curve.
- [ ] pnpm check, independent review, real-browser fresh-start/reload QA, CI/Pages, and deployed proof pass without unrelated HUD or later-task implementation.

## Dependencies

- ABI-013

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A798F2
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-E27CD3

## Constraints

- Follow the resolved workflow contract and project instructions.
