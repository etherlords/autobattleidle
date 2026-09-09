---
plannerFormat: 1
id: ABI-055
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: In Progress
sprintId: ABI-S1
dependencies: []
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-055: Add read-only Goals and Boss Roadmap HUD summary

## Goal

Add read-only Goals and Boss Roadmap HUD summary

## Work item

- Type: task
- Priority: normal
- Status: In Progress
- Parent: None

## Acceptance criteria

- [ ] [unit] Boss cadence boundaries expose current encounter/grade, next boss ordinal/family/encounter, encounters remaining, and supported claimless milestones without DOM formulas.
- [ ] [integration] Existing snapshot/presenter/HUD architecture renders a read-only Goals/Boss Roadmap summary from domain-derived data and does not reuse audio trackStatus.
- [ ] [integration] Historical V4 saves load and reload with unchanged progression semantics; no save schema/version change is introduced.
- [ ] [deployed] Desktop and narrow browser smoke checks show the summary legibly without disrupting existing HUD/combat behavior.

## Dependencies

- None

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
